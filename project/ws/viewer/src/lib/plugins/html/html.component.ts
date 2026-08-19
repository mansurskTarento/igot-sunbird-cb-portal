import { Component, ElementRef, Input, OnChanges, OnInit, ViewChild, OnDestroy } from '@angular/core'
import { MatSnackBar } from '@angular/material/snack-bar'
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'
import { Router, ActivatedRoute } from '@angular/router'
import { NsContent } from '@sunbird-cb/collection'
import { ConfigurationsService, EventService, LoggerService, TFetchStatus } from '@sunbird-cb/utils-v2'
import { MobileAppsService } from '../../../../../../../src/app/services/mobile-apps.service'
import { SCORMAdapterService, scormLMSStatus } from './SCORMAdapter/scormAdapter'
/* tslint:disable */
import _ from 'lodash'
import { environment } from 'src/environments/environment'
import { Subscription, timer } from 'rxjs'
import { Storage } from './SCORMAdapter/storage'
import { AppTocService } from '@sunbird-cb/toc'
/* tslint:enable */
import { WidgetContentService } from '@sunbird-cb/toc'

@Component({
    selector: 'viewer-plugin-html',
    templateUrl: './html.component.html',
    styleUrls: ['./html.component.scss'],
    standalone: false
})
export class HtmlComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('mobileOpenInNewTab', { read: ElementRef }) mobileOpenInNewTab !: ElementRef<HTMLAnchorElement>
  @Input() htmlContent: NsContent.IContent | null = null
  @Input() isMobileApp = false
  iframeUrl: SafeResourceUrl | null = null
  iframeName = `piframe_${Date.now()}`
  showIframeSupportWarning = false
  showIsLoadingMessage = false
  showUnBlockMessage = false
  pageFetchStatus: TFetchStatus | 'artifactUrlMissing' = 'fetching'
  isUserInIntranet = false
  intranetUrlPatterns: string[] | undefined = []
  isIntranetUrl = false
  collectionId = ''
  forPreview = window.location.href.includes('/public/') || window.location.href.includes('&preview=true')
  progress = 100
  progressThreshold = 70
  public scormLMSStatus = scormLMSStatus
  playScormContentFlag = scormLMSStatus.LMSWating
  realTimeProgressRequest = {
    content_type: 'Resource',
    primaryCategory: NsContent.EPrimaryCategory.RESOURCE,
    current: ['0'],
    max_size: 0,
    mime_type: NsContent.EMimeTypes.ZIP,
    user_id_type: 'uuid',
  }
  oldData: any = undefined

  // localStorage polling for SCORM data capture
  private localStorageSnapshot: Record<string, string> = {}
  private scormData: Record<string, string> = {}
  private pollingInterval: any = null
  private mutationObserver: MutationObserver | null = null
  private progressUpdateTimer: any = null
  private mediaAttachInterval: any = null
  private lastSlideSignature: string | null = null
  private storageEventHandler: ((e: StorageEvent) => void) | null = null

  // The iframe must not be created until loadDataV2 has settled, otherwise the SCORM
  // package boots and reads localStorage before the saved keys have been written back
  // and always starts from the beginning. restoreSettled gates that; iframeUrlPending
  // records that ngOnChanges computed a URL which is waiting for the gate to open.
  private restoreSettled = false
  private iframeUrlPending = false
  private restoreTimeoutTimer: any = null
  private readonly restoreTimeoutMs = 10000

  ticks = 0
  private timer!: any
  // Subscription object
  private sub!: Subscription
  private scormInitSub: Subscription | null = null
  tocConfigSubscription: Subscription | null = null
  tocConfig!: any

  constructor(
    private domSanitizer: DomSanitizer,
    public mobAppSvc: MobileAppsService,
    private scormAdapterService: SCORMAdapterService,
    private router: Router,
    private configSvc: ConfigurationsService,
    private snackBar: MatSnackBar,
    private events: EventService,
    private activatedRoute: ActivatedRoute,
    private store: Storage,
    private loggerSvc: LoggerService,
    private widgetContentSvc: WidgetContentService,
    private tocSvc: AppTocService,
  ) {
    (window as any).API = this.scormAdapterService
    // if (window.addEventListener) {
    window.addEventListener('message', this.receiveMessage.bind(this))
    // }
    // else {
    //   (<any>window).attachEvent('onmessage', this.receiveMessage.bind(this))
    // }
    // window.addEventListener('message', function (event) {
    //   /* tslint:disable-next-line */
    //   console.log('message', event)
    // })
    // window.addEventListener('onmessage', function (event) {
    //   /* tslint:disable-next-line */
    //   console.log('onmessage===>', event)
    // })
  }

  ngOnInit() {
    this.tocConfigSubscription = this.widgetContentSvc.tocConfigData.subscribe((data: any) => {
      this.tocConfig = data
    })
    if (this.htmlContent && this.htmlContent.identifier) {
      this.scormAdapterService.contentId = this.htmlContent.identifier
      if (!this.forPreview) {
        // Take snapshot BEFORE iframe loads to capture clean baseline
        this.localStorageSnapshot = this.takeLocalStorageSnapshot()
        this.startLocalStoragePolling()
        this.startCrossTabStorageListener()
        console.log('[SCORM] Initial localStorage snapshot taken, keys:', Object.keys(this.localStorageSnapshot).length)

        this.beginRestore()
        this.scormAdapterService.loadDataV2()
        this.timer = timer(1000, 1000)
        // subscribing to a observable returns a subscription object
        this.sub = this.timer.subscribe((t: any) => this.tickerFunc(t))
        this.scormInitSub = this.scormAdapterService.scormInitialized$.subscribe(value => {
          this.playScormContentFlag = value
          // When loadDataV2 restores data, merge into scormData tracking
          if (this.scormAdapterService.scormLocalStorageData
            && Object.keys(this.scormAdapterService.scormLocalStorageData).length > 0) {
            const restoredKeys = this.scormAdapterService.scormLocalStorageData
            for (const key of Object.keys(restoredKeys)) {
              this.scormData[key] = restoredKeys[key]
            }
            // Refresh snapshot so restored keys become baseline
            this.localStorageSnapshot = this.takeLocalStorageSnapshot()
            console.log('[SCORM] Merged restored scormData keys:', Object.keys(restoredKeys))
            // Auto-resume: data is already restored to localStorage, SCORM content will pick it up on load
            if (value === scormLMSStatus.LMSPositive) {
              console.log('[SCORM] AUTO_RESUME - saved progress restored, content will resume on load')
            }
          }
          // Restore is done (or known to have found nothing) - only now may the iframe load.
          this.settleRestore()
        })
        return
      }
    }
    // Preview mode and content without an identifier never read progress from the
    // server, so there is nothing to wait for - let the iframe load straight away.
    this.settleRestore()
  }

  // --- Iframe restore gate ---

  private beginRestore() {
    this.restoreSettled = false
    if (this.restoreTimeoutTimer) {
      clearTimeout(this.restoreTimeoutTimer)
    }
    // Safety net: a request that never completes must not leave the player blank.
    this.restoreTimeoutTimer = setTimeout(() => {
      if (!this.restoreSettled) {
        console.warn('[SCORM] Restore did not settle within', this.restoreTimeoutMs,
                     'ms - loading content without resume data')
        this.settleRestore()
      }
      // tslint:disable-next-line: align
    }, this.restoreTimeoutMs)
  }

  private settleRestore() {
    this.restoreSettled = true
    if (this.restoreTimeoutTimer) {
      clearTimeout(this.restoreTimeoutTimer)
      this.restoreTimeoutTimer = null
    }
    if (this.iframeUrlPending) {
      this.applyIframeUrl()
    }
  }

  tickerFunc(tick: any) {
    this.ticks = tick
  }

  ngOnDestroy() {
    window.removeEventListener('message', this.receiveMessage)
    window.removeEventListener('onmessage', this.receiveMessage)
    // Final SCORM data capture before destroying
    this.diffStorage()
    this.stopLocalStoragePolling()
    this.stopCrossTabStorageListener()
    if (this.mutationObserver) {
      this.mutationObserver.disconnect()
      this.mutationObserver = null
    }
    if (this.mediaAttachInterval) {
      clearInterval(this.mediaAttachInterval)
      this.mediaAttachInterval = null
    }
    if (this.progressUpdateTimer) {
      clearTimeout(this.progressUpdateTimer)
      this.progressUpdateTimer = null
    }
    if (this.restoreTimeoutTimer) {
      clearTimeout(this.restoreTimeoutTimer)
      this.restoreTimeoutTimer = null
    }
    // console.log('this.ticks: ', this.ticks)
    if (this.isMobileApp) {
      this.emitScormEventToMobile()
    } else {
      this.raiseRealTimeProgress()
    }
    // Clean up flat localStorage keys written by SCORM content
    // tslint:disable-next-line: max-line-length
    const keysToClean = new Set([...Object.keys(this.scormData), ...Object.keys(this.scormAdapterService.scormLocalStorageData)])
    keysToClean.forEach(key => localStorage.removeItem(key))
    // Reset the tracking maps too. scormAdapterService is providedIn: 'root', so leaving
    // these populated lets this content's keys be merged into the next one that is opened.
    this.scormData = {}
    this.scormAdapterService.scormLocalStorageData = {}
    // this.store.clearAll()
    if (this.scormInitSub) {
      this.scormInitSub.unsubscribe()
      this.scormInitSub = null
    }
    if (this.tocConfigSubscription) {
      this.tocConfigSubscription.unsubscribe()
    }
    this.iframeUrl = ''
  }

  private raiseRealTimeProgress() {
    this.realTimeProgressRequest = {
      ...this.realTimeProgressRequest,
      current: ['1'],
      max_size: 1,
    }
    // this.fireRealTimeProgress()

    // call for both LMS and duration calculation content
    if (!this.forPreview) {
      this.fireRealTimeProgress(this.htmlContent)
    }

    // if (!this.store.getItem('Initialized')) {
    //   this.fireRealTimeProgress(this.htmlContent)
    //   // this.store.clearAll()
    // }
    if (this.sub) {
      this.sub.unsubscribe()
    }
  }

  private fireRealTimeProgress(htmlContent: any) {
    if (htmlContent) {
      this.realTimeProgressRequest.content_type = htmlContent.contentType
      this.realTimeProgressRequest.primaryCategory = htmlContent.primaryCategory

      // const collectionId = this.activatedRoute.snapshot.queryParams.collectionId ?
      //   this.activatedRoute.snapshot.queryParams.collectionId : ''

      // const batchId = this.activatedRoute.snapshot.queryParams.batchId ?
      //   this.activatedRoute.snapshot.queryParams.batchId : ''
      const completionData = this.calculateCompletionStatus(htmlContent)

      // Always include ALL available data in progressDetails
      const storeData = this.store.getAll() || {}
      const progressData: any = {
        ...storeData,
        spentTime: (completionData && completionData.spentTime) || 0,
      }
      // Include polled localStorage data (SCORM content's own writes)
      if (Object.keys(this.scormData).length > 0) {
        progressData.scormData = { ...this.scormData }
      }
      console.log('[SCORM] fireRealTimeProgress - scormData keys:', Object.keys(this.scormData))
      console.log('[SCORM] fireRealTimeProgress - progressData:', JSON.stringify(progressData).substring(0, 500))

      const req = {
        ...this.realTimeProgressRequest,
        status: (completionData && completionData.status) || 0,
        completionPercentage: (completionData && completionData.completionPercentage) || 0,
        progressDetails: progressData,
      }

      this.scormAdapterService.addDataV3(req, htmlContent.identifier).subscribe((_res: any) => {
        this.loggerSvc.log('Progress updated successfully')
        // for updating the progress hashmap, for instant progress to be shown
        if (this.tocSvc.hashmap && this.tocSvc.hashmap[htmlContent.identifier]) {
          // tslint:disable-next-line: max-length
          if (this.tocSvc.hashmap[htmlContent.identifier]
            && (!this.tocSvc.hashmap[htmlContent.identifier]['completionStatus']
              || this.tocSvc.hashmap[htmlContent.identifier]['completionStatus'] < 2)) {
            this.tocSvc.hashmap[htmlContent.identifier]['completionPercentage'] = req.completionPercentage
            this.tocSvc.hashmap[htmlContent.identifier]['completionStatus'] = req.status
            this.tocSvc.hashmap[htmlContent.identifier]['status'] = req.status
            this.tocSvc.hashmap = { ...this.tocSvc.hashmap }
            // Emit hashmap update so viewer-top-bar and viewer-toc components re-render progress
            this.tocSvc.hashmapUpdated.next({ timestamp: Date.now(), hashmap: this.tocSvc.hashmap })
            console.log('[SCORM] hashmap updated and emitted for', htmlContent.identifier,
                        'status:', req.status, 'completion:', req.completionPercentage)
          }
        }
        // this.store.clearAll()
        return
        // tslint:disable-next-line: align
      }, (err: any) => {
        this.loggerSvc.error('Error calling progress update for scorm content', err)
        // this.store.clearAll()
        return
      }
      )
    }
    // return
  }

  calculateCompletionStatus(htmlContent: any) {
    const data = this.store.getAll()
    let spentTimen = 0
    let percentage = 0
    // Check SCORM content's own completion status from localStorage data
    const scormStatus = this.getScormCompletionStatus()
    if (scormStatus === 2) {
      spentTimen = this.ticks + (data && data['spentTime'] || 0)
      return {
        completionPercentage: 100,
        status: 2,
        spentTime: spentTimen,
      }
    }
    if ((data && data['completionStatus'] === 2)) {
      return {
        completionPercentage: data && data['completionPercentage'],
        status: data && data['completionStatus'],
        spentTime: data && data['spentTime'],
        // tslint:disable-next-line: whitespace
      }
    }
    // if (data) {
    spentTimen = this.ticks + (data && data['spentTime'] || 0)
    if (htmlContent && spentTimen) {
      // ~~ will remove decimal after division
      // tslint:disable-next-line
      percentage = ~~((spentTimen / htmlContent.duration) * 100)
    }
    // }

    if (percentage >= this.getThreshold()) {
      return {
        completionPercentage: 100,
        status: 2,
        spentTime: spentTimen,
      }
      // tslint:disable-next-line
    } else {
      return {
        completionPercentage: percentage,
        status: 1,
        spentTime: spentTimen,
      }
      // }
    }
  }

  getThreshold() {
    if (this.tocConfig) {
      this.progressThreshold = this.tocConfig.ScormProgressThreshold
    }
    return this.progressThreshold
  }
  ngOnChanges() {
    this.isIntranetUrl = false
    this.progress = 100
    this.pageFetchStatus = 'fetching'
    this.showIframeSupportWarning = false
    this.intranetUrlPatterns = this.configSvc.instanceConfig
      ? this.configSvc.instanceConfig.intranetIframeUrls
      : []
    // For successive scorm resources, when switched to next content -  start

    if (!this.oldData) {
      this.oldData = this.htmlContent
    } else {
      if (this.htmlContent && (this.oldData.identifier !== this.htmlContent.identifier)) {
        // Capture what the content wrote since the last poll BEFORE building the upload.
        // The final bookmark/suspend write happens as Next is clicked, so diffing after
        // fireRealTimeProgress would drop exactly the position the user left off at.
        this.diffStorage()
        // Tear the old iframe down now. The next URL is only applied once that content's
        // restore has settled, and until then the old package would keep running and
        // writing localStorage over the new content's baseline snapshot.
        this.iframeUrl = null
        // if (!this.store.getItem('Initialized')) {
        //   this.fireRealTimeProgress(this.oldData)
        // }
        // call fireRealTimeProgress func for LMS data and non-LMS data also
        if (!this.forPreview) {
          if (this.isMobileApp) {
            this.emitScormEventToMobile()
          } else {
            this.fireRealTimeProgress(this.oldData)
          }
        }
        // Stop polling and clean up old content's SCORM localStorage keys
        this.stopLocalStoragePolling()
        this.stopCrossTabStorageListener()
        if (this.mutationObserver) {
          this.mutationObserver.disconnect()
          this.mutationObserver = null
        }
        if (this.mediaAttachInterval) {
          clearInterval(this.mediaAttachInterval)
          this.mediaAttachInterval = null
        }
        this.lastSlideSignature = null
        // tslint:disable-next-line: max-line-length
        const keysToClean = new Set([...Object.keys(this.scormData), ...Object.keys(this.scormAdapterService.scormLocalStorageData)])
        keysToClean.forEach(key => localStorage.removeItem(key))
        this.scormData = {}
        this.scormAdapterService.scormLocalStorageData = {}

        if (this.sub) {
          this.sub.unsubscribe()
        }

        this.ticks = 0
        this.timer = timer(1000, 1000)
        // subscribing to a observable returns a subscription object
        this.sub = this.timer.subscribe((t: any) => this.tickerFunc(t))
        this.oldData = this.htmlContent
        this.scormAdapterService.contentId = this.htmlContent.identifier
        if (!this.forPreview) {
          // Take fresh snapshot before new content loads
          this.localStorageSnapshot = this.takeLocalStorageSnapshot()
          this.startLocalStoragePolling()
          this.startCrossTabStorageListener()
          this.beginRestore()
          this.scormAdapterService.loadDataV2()
        }
      }
    }
    // For successive scorm resources, when switched to next content - end

    let iframeSupport: boolean | string | null =
      this.htmlContent && this.htmlContent.isIframeSupported
    if (this.htmlContent && this.htmlContent.artifactUrl) {
      if (this.htmlContent.artifactUrl.startsWith('http://')) {
        this.htmlContent.isIframeSupported = 'No'
      }
      if (typeof iframeSupport !== 'boolean') {
        iframeSupport = this.htmlContent.isIframeSupported
        if (iframeSupport === 'no') {
          this.showIframeSupportWarning = true
          setTimeout(
            () => {
              this.openInNewTab()
            },
            3000,
          )
          setInterval(
            () => {
              this.progress -= 1
            },
            30,
          )
        } else if (iframeSupport === 'maybe') {
          this.showIframeSupportWarning = true
        } else {
          this.showIframeSupportWarning = false
        }
      }
      if (this.intranetUrlPatterns && this.intranetUrlPatterns.length) {
        this.intranetUrlPatterns.forEach(iup => {
          if (this.htmlContent && this.htmlContent.artifactUrl) {
            if (this.htmlContent.artifactUrl.startsWith(iup)) {
              this.isIntranetUrl = true
            }
          }
        })
      }
      // if (this.htmlContent.isInIntranet || this.isIntranetUrl) {
      //   this.checkIfIntranet().subscribe(
      //     data => {
      //       //console.log(data)
      //       this.isUserInIntranet = data ? true : false
      //       //console.log(this.isUserInIntranet)
      //     },
      //     () => {
      //       this.isUserInIntranet = false
      //       //console.log(this.isUserInIntranet)
      //     },
      //   )
      // }
      this.showIsLoadingMessage = true
      // if (this.htmlContent.isIframeSupported !== 'No') {
      //   setTimeout(
      //     () => {
      //       if (this.pageFetchStatus === 'fetching') {
      //         this.showIsLoadingMessage = true
      //       }
      //     },
      //     3000,
      //   )
      // }
      // this.scormAdapterService.downladFile(this.htmlContent.artifactUrl).subscribe(data => {
      //   const blob = new Blob([data], {
      //     type: 'application/zip',
      //   })
      //   const a = document.createElement('a')
      //   const objectUrl = URL.createObjectURL(blob)
      //   a.href = objectUrl
      //   a.download = 'sunbird.zip'
      //   a.click()
      //   URL.revokeObjectURL(objectUrl)
      // })
      // Do not build the iframe URL yet. The SCORM package reads its resume keys from
      // localStorage while it boots, so the iframe may only be created once loadDataV2
      // has written them back. settleRestore() calls applyIframeUrl() when that happens.
      this.iframeUrlPending = true
      if (this.restoreSettled) {
        this.applyIframeUrl()
      }
      // testing purpose only
      // setTimeout(
      //   () => {
      //     const ifram = document.getElementsByClassName('html-iframe')[0]
      //     if (ifram && this.htmlContent) {
      //       _.set(ifram, 'src',
      //         `${this.htmlContent.artifactUrl}?timestamp='${new Date().getTime()}`)
      //     }
      //   },
      //   1000,
      // )
    } else if (this.htmlContent && this.htmlContent.artifactUrl === '') {
      this.iframeUrl = null
      this.pageFetchStatus = 'artifactUrlMissing'
    } else {
      this.iframeUrl = null
      this.pageFetchStatus = 'error'
    }
  }

  // Lifted verbatim out of ngOnChanges so the URL can be assigned after the restore
  // settles instead of during change detection. The block below keeps its original
  // nesting on purpose, to stay diffable against the pre-fix version.
  private applyIframeUrl() {
    this.iframeUrlPending = false
    if (!this.htmlContent || !this.htmlContent.artifactUrl) {
      return
    }
    {
      if (this.htmlContent &&
        this.htmlContent.mimeType !== 'text/x-url' &&
        this.htmlContent.mimeType !== 'video/x-youtube') {
        // if (this.htmlContent.status === 'Live') {
        //   this.iframeUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(
        //     // `https://igot.blob.core.windows.net/content/content/html/${this.htmlContent.identifier}-latest/index.html`
        // tslint:disable-next-line: max-line-length
        //     `${environment.azureHost}/${environment.azureBucket}/content/html/${this.htmlContent.identifier}-latest/index.html?timestamp='${new Date().getTime()}`
        //   )
        // } else {
        //   this.iframeUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(
        //     // `https://igot.blob.core.windows.net/content/content/html/${this.htmlContent.identifier}-snapshot/index.html`
        // tslint:disable-next-line: max-line-length
        //     `${environment.azureHost}/${environment.azureBucket}/content/html/${this.htmlContent.identifier}-snapshot/index.html?timestamp='${new Date().getTime()}`
        //   )
        // }
        if (this.htmlContent && this.htmlContent.streamingUrl) {
          if (this.htmlContent.streamingUrl.includes(environment.azureHost)) {
            this.iframeUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(
              this.ensureSameOriginUrl(this.htmlContent.streamingUrl)
            )
          } else {
            if (this.htmlContent.streamingUrl && this.htmlContent.initFile) {
              // tslint:disable-next-line:max-line-length
              const streamUrl = `${this.generateUrl(this.htmlContent.streamingUrl)}/${this.htmlContent.initFile}?timestamp='${new Date().getTime()}`
              this.iframeUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(
                this.ensureSameOriginUrl(streamUrl)
              )
            } else {
              if (environment.production) {
                this.iframeUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(
                  // tslint:disable-next-line: max-line-length
                  // `${environment.azureHost}/${environment.azureBucket}/content/html/${this.htmlContent.identifier}-snapshot/index.html?timestamp='${new Date().getTime()}`
                  // tslint:disable-next-line: max-line-length
                  `${environment.azureHost}/${environment.azureBucket}/content/html/${this.htmlContent.identifier}-snapshot/index.html?timestamp='${new Date().getTime()}`
                )
              } else {
                this.iframeUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(
                  // tslint:disable-next-line: max-line-length
                  this.ensureSameOriginUrl(`${environment.azureHost}/${environment.azureBucket}/content/html/${this.htmlContent.identifier}-snapshot/index.html?timestamp='${new Date().getTime()}`)
                )
              }
            }
          }
        } else {
          if (this.htmlContent.initFile) {
            // tslint:disable-next-line: max-line-length
            const initUrl = `${environment.azureHost}/${environment.azureBucket}/content/html/${this.htmlContent.identifier}-snapshot/${this.htmlContent.initFile}?timestamp='${new Date().getTime()}`
            this.iframeUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(
              this.ensureSameOriginUrl(initUrl)
            )
          } else {
            // tslint:disable-next-line: max-line-length
            const fallbackUrl = `${environment.azureHost}/${environment.azureBucket}/content/html/${this.htmlContent.identifier}-snapshot/index.html?timestamp='${new Date().getTime()}`
            this.iframeUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(
              this.ensureSameOriginUrl(fallbackUrl)
            )
          }
        }
      } else {
        setTimeout(
          () => {
            if (this.htmlContent && this.htmlContent.artifactUrl) {
              this.iframeUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(this.htmlContent.artifactUrl)
            }
          },
          1000,
        )
        // this.iframeUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(this.htmlContent.artifactUrl)
      }
    }
  }

  backToDetailsPage() {
    this.router.navigate(
      [`/app/toc/${this.htmlContent ? this.htmlContent.identifier : ''}/overview`],
      { queryParams: { primaryCategory: this.htmlContent ? this.htmlContent.primaryCategory : '' } })
  }
  receiveMessage(msg: any) {
    // /* tslint:disable-next-line */
    // console.log("msg=>", msg)
    if (msg.data) {
      this.raiseTelemetry(msg.data)
    } else {
      this.raiseTelemetry({
        event: msg.message,
        id: msg.id,
      })
    }
  }
  openInNewTab() {
    if (this.htmlContent) {
      if (this.mobAppSvc && this.mobAppSvc.isMobile) {
        // window.open(this.htmlContent.artifactUrl)
        setTimeout(
          () => {
            this.mobileOpenInNewTab.nativeElement.click()
          },
          0,
        )
      } else {
        const width = window.outerWidth
        const height = window.outerHeight
        const isWindowOpen = window.open(
          this.htmlContent.artifactUrl,
          '_blank',
          `toolbar=yes,
             scrollbars=yes,
             resizable=yes,
             menubar=no,
             location=no,
             addressbar=no,
             top=${(15 * height) / 100},
             left=${(2 * width) / 100},
             width=${(65 * width) / 100},
             height=${(70 * height) / 100}`,
        )
        if (isWindowOpen === null) {
          const msg = 'The pop up window has been blocked by your browser, please unblock to continue.'
          this.snackBar.open(msg, 'X')
        }
      }
    }
  }
  dismiss() {
    this.showIframeSupportWarning = false
    this.isIntranetUrl = false
  }

  onIframeLoadOrError(evt: 'load' | 'error', iframe?: HTMLIFrameElement, event?: any) {
    if (evt === 'error') {
      this.pageFetchStatus = evt
    }
    if (evt === 'load' && iframe && iframe.contentWindow) {
      if (event && iframe.onload) {
        iframe.onload(event)
      }
      iframe.onload = (data => {
        if (data.target) {
          this.pageFetchStatus = 'done'
          this.showIsLoadingMessage = false
          if (!this.store.getItem('Initialized') && this.playScormContentFlag === scormLMSStatus.LMSWating) {
            this.playScormContentFlag = scormLMSStatus.LMSNegative
          }
          // Inject event trackers after SCORM content boots up
          setTimeout(() => {
            this.injectEventTrackers(iframe)
          },         1500)
        }
      })
    }
  }

  raiseTelemetry(data1: any) {
    // if (this.forPreview) { return }
    if (!this.forPreview) {
      let data: any
      if (this.htmlContent) {
        if (typeof data1 === 'string' || data1 instanceof String) {
          data = JSON.parse(data1.toString())
        } else {
          data = { ...data1 }
        }
        /* tslint:disable-next-line */
        if (this.activatedRoute.snapshot.queryParams.collectionId) {
          this.collectionId = this.activatedRoute.snapshot.queryParams.collectionId
        }
        this.events.raiseInteractTelemetry(
          {
            type: data.event || data.type || 'type',
            subType: 'scorm',
            id: this.htmlContent.identifier,
          },
          {
            ...data,
            // contentId: this.htmlContent.identifier,
            // contentType: this.htmlContent.primaryCategory,
            id: this.htmlContent.identifier,
            type: this.htmlContent.primaryCategory,
            context: this.htmlContent.context,
            rollup: {
              l1: this.collectionId || '',
            },
            ver: `${this.htmlContent.version}${''}`,
          },
          {
            pageIdExt: `${_.camelCase(this.htmlContent.primaryCategory)}`,
            module: _.camelCase(this.htmlContent.primaryCategory),
          })
      }
    }
  }

  // --- localStorage polling for SCORM data capture ---

  private takeLocalStorageSnapshot(): Record<string, string> {
    const snap: Record<string, string> = {}
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key)
        if (value !== null) {
          snap[key] = value
        }
      }
    }
    return snap
  }

  private startLocalStoragePolling() {
    if (this.pollingInterval) { return }
    this.pollingInterval = setInterval(() => this.diffStorage(), 500)
  }

  private stopLocalStoragePolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
  }

  private diffStorage() {
    const current = this.takeLocalStorageSnapshot()
    const storageKey = this.scormAdapterService.contentId
    let hasChanges = false

    for (const key of Object.keys(current)) {
      // Skip our own Storage service key (it stores CMI data separately)
      if (key === storageKey) { continue }

      const isNew = !(key in this.localStorageSnapshot)
      // Only track changes on keys already attributed to the SCORM content. A pre-existing
      // app key (auth token, telemetry buffer, feature flags) that merely changes during
      // playback must not be captured - it would be uploaded and then deleted from
      // localStorage by the cleanup in ngOnDestroy / ngOnChanges.
      const isChanged = !isNew && (key in this.scormData) && current[key] !== this.localStorageSnapshot[key]

      if (isNew || isChanged) {
        this.scormData[key] = current[key]
        hasChanges = true
        console.log('[SCORM] diffStorage detected:', isNew ? 'NEW' : 'CHANGED', 'key:', key,
                    'value length:', current[key] ? current[key].length : 0,
                    'value:', current[key])
      }
    }

    // Detect removed keys
    for (const key of Object.keys(this.localStorageSnapshot)) {
      if (!(key in current) && key in this.scormData) {
        delete this.scormData[key]
        hasChanges = true
        console.log('[SCORM] diffStorage detected: REMOVED key:', key)
      }
    }

    this.localStorageSnapshot = current

    // Log storage size on every poll
    const sizeKB = (this.getStorageSize() / 1024).toFixed(1)
    if (hasChanges) {
      console.log('[SCORM] Storage size:', sizeKB, 'KB, scormData keys:', Object.keys(this.scormData).length)
    }
    return hasChanges
  }

  private getScormCompletionStatus(): number | null {
    for (const [key, value] of Object.entries(this.scormData)) {
      const lowerKey = key.toLowerCase()
      if (lowerKey.includes('lesson_status') || lowerKey.includes('completion_status')) {
        if (value === 'completed' || value === 'passed') {
          return 2
        }
      }
    }
    return null
  }

  private ensureSameOriginUrl(url: string): string {
    // In dev mode, route through Angular proxy (/abcd/) for same-origin access
    // This is required for: localStorage sharing, event injection, SCORM API (window.parent.API)
    // In production, the server (nginx) handles same-origin routing
    if (!environment.production) {
      try {
        if (url.startsWith('http://') || url.startsWith('https://')) {
          // Full URL → extract path and route through /abcd/ proxy
          const parsed = new URL(url)
          const proxyUrl = `/abcd${parsed.pathname}${parsed.search}`
          console.log('[SCORM] ensureSameOriginUrl: proxying', url.substring(0, 100), '→', proxyUrl.substring(0, 100))
          return proxyUrl
        } else if (url.startsWith('/')) {
          // Relative URL (e.g. /assets/public/content/...) → prefix with /abcd
          const proxyUrl = `/abcd${url}`
          console.log('[SCORM] ensureSameOriginUrl: proxying relative', url.substring(0, 100), '→', proxyUrl.substring(0, 100))
          return proxyUrl
        }
      } catch (_e) {
        console.warn('[SCORM] ensureSameOriginUrl: URL parse error, returning as-is')
      }
    }
    return url
  }

  // --- Storage size tracking ---

  private getStorageSize(): number {
    let total = 0
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i)
        if (key) {
          const val = localStorage.getItem(key)
          total += key.length + (val ? val.length : 0)
        }
      }
    } catch (_e) { /* ignore */ }
    return total
  }

  // --- Reload SCORM content ---

  reloadScormContent() {
    if (!this.htmlContent) { return }
    console.log('[SCORM] USER_RELOAD - reloading content')
    // Capture current state before reload
    this.diffStorage()
    // Disconnect observers
    if (this.mutationObserver) {
      this.mutationObserver.disconnect()
      this.mutationObserver = null
    }
    if (this.mediaAttachInterval) {
      clearInterval(this.mediaAttachInterval)
      this.mediaAttachInterval = null
    }
    this.lastSlideSignature = null
    // Re-trigger ngOnChanges by resetting and re-setting the URL
    this.pageFetchStatus = 'fetching'
    this.iframeUrl = null
    // Small delay then re-assign to force iframe reload
    setTimeout(() => {
      if (this.htmlContent) {
        this.ngOnChanges()
      }
      // tslint:disable-next-line: align
    }, 100)
  }

  // --- Cross-tab localStorage listener ---

  private startCrossTabStorageListener() {
    this.stopCrossTabStorageListener()
    this.storageEventHandler = (e: StorageEvent) => {
      console.log('[SCORM] Cross-tab storage event:', e.key,
                  e.oldValue === null ? 'ADDED' : (e.newValue === null ? 'REMOVED' : 'CHANGED'))
      // Refresh snapshot and capture changes
      this.localStorageSnapshot = this.takeLocalStorageSnapshot()
      if (e.key && e.newValue !== null) {
        const storageKey = this.scormAdapterService.contentId
        if (e.key !== storageKey) {
          this.scormData[e.key] = e.newValue
        }
      } else if (e.key && e.newValue === null && e.key in this.scormData) {
        delete this.scormData[e.key]
      }
      this.debouncedProgressUpdate()
    }
    window.addEventListener('storage', this.storageEventHandler)
  }

  private stopCrossTabStorageListener() {
    if (this.storageEventHandler) {
      window.removeEventListener('storage', this.storageEventHandler)
      this.storageEventHandler = null
    }
  }

  // --- Slide signature & title detection (from reference HTML) ---

  private getSlideSignature(doc: Document): string | null {
    try {
      const activeSlide = doc.querySelector('[data-slide-id]') ||
        doc.querySelector('.slide-layer.active') ||
        doc.querySelector('.slide-container .slide') ||
        doc.querySelector('.primary-slide')
      if (activeSlide) {
        return activeSlide.getAttribute('data-slide-id') ||
          activeSlide.getAttribute('data-ref') ||
          activeSlide.id ||
          activeSlide.className
      }
      const slideWrap = doc.querySelector('#slide-window, #preso, [role="main"]')
      if (slideWrap) {
        return slideWrap.getAttribute('aria-label') || String(slideWrap.innerHTML.length)
      }
    } catch (_e) { /* ignore */ }
    return null
  }

  private getSlideTitle(doc: Document): string {
    try {
      const titleEl = doc.querySelector('[data-acc-text]') ||
        doc.querySelector('.slide-title') ||
        doc.querySelector('[aria-label]')
      if (titleEl) {
        return titleEl.getAttribute('data-acc-text') ||
          titleEl.getAttribute('aria-label') ||
          (titleEl.textContent || '').trim().substring(0, 100)
      }
    } catch (_e) { /* ignore */ }
    return ''
  }

  // --- Iframe Event Injection (from reference HTML) ---

  private injectEventTrackers(iframe: HTMLIFrameElement) {
    try {
      const iframeDoc = iframe.contentDocument
      const iframeWin = iframe.contentWindow
      if (!iframeDoc || !iframeWin) {
        this.loggerSvc.log('Cannot access iframe document (cross-origin?)')
        console.warn('[SCORM] Cannot access iframe document (cross-origin?)')
        return
      }

      // ── Click events → capture state + trigger progress update ──
      iframeDoc.addEventListener('click', (_e: any) => {
        this.diffStorage()
        this.debouncedProgressUpdate()
        // tslint:disable-next-line: align
      }, true)

      // ── Keyboard navigation (arrows, enter, space, tab, escape) ──
      iframeDoc.addEventListener('keydown', (e: KeyboardEvent) => {
        if (['ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Tab', 'Escape'].includes(e.key)) {
          this.diffStorage()
          this.debouncedProgressUpdate()
        }
        // tslint:disable-next-line: align
      }, true)

      // ── MutationObserver for slide/DOM changes with signature detection ──
      const slideContainer = iframeDoc.getElementById('preso') || iframeDoc.body
      if (slideContainer && !this.mutationObserver) {
        this.lastSlideSignature = this.getSlideSignature(iframeDoc)
        this.mutationObserver = new MutationObserver(() => {
          const newSig = this.getSlideSignature(iframeDoc)
          if (newSig && newSig !== this.lastSlideSignature) {
            this.lastSlideSignature = newSig
            const title = this.getSlideTitle(iframeDoc)
            console.log('[SCORM] SLIDE_CHANGED:', newSig, 'title:', title)
          }
          this.diffStorage()
          this.debouncedProgressUpdate()
        })
        this.mutationObserver.observe(slideContainer, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['class', 'data-slide-id', 'aria-label'],
        })
      }

      // ── Media events (audio/video play/pause/ended/seeked) ──
      const attachMediaListeners = () => {
        try {
          const mediaElements = iframeDoc.querySelectorAll('audio, video')
          mediaElements.forEach((media: Element) => {
            const mediaEl = media as HTMLMediaElement
            if ((mediaEl as any).scormTracked) { return }
            ;(mediaEl as any).scormTracked = true
            const events = ['play', 'pause', 'ended', 'seeked']
            events.forEach(evt => {
              mediaEl.addEventListener(evt, () => {
                console.log('[SCORM] MEDIA:', mediaEl.tagName, evt.toUpperCase(),
                            'time:', Math.round(mediaEl.currentTime * 10) / 10,
                            'duration:', Math.round((mediaEl.duration || 0) * 10) / 10)
                this.diffStorage()
                this.debouncedProgressUpdate()
              })
            })
          })
        } catch (_e) { /* ignore */ }
      }
      attachMediaListeners()
      // Re-scan every 2s for dynamically added media elements
      this.mediaAttachInterval = setInterval(attachMediaListeners, 2000)

      // ── Intercept iframe localStorage.setItem for immediate capture ──
      try {
        const origSetItem = (iframeWin as any).Storage.prototype.setItem
        const self = this
        ;(iframeWin as any).Storage.prototype.setItem = function (this: any, key: string, value: string) {
          origSetItem.call(this, key, value)
          self.diffStorage()
          self.debouncedProgressUpdate()
        }
      } catch (_e) {
        console.warn('[SCORM] Could not proxy iframe localStorage.setItem')
      }

      // ── Intercept iframe localStorage.removeItem ──
      try {
        const origRemoveItem = (iframeWin as any).Storage.prototype.removeItem
        const self = this
        ;(iframeWin as any).Storage.prototype.removeItem = function (this: any, key: string) {
          origRemoveItem.call(this, key)
          self.diffStorage()
          self.debouncedProgressUpdate()
        }
      } catch (_e) {
        console.warn('[SCORM] Could not proxy iframe localStorage.removeItem')
      }

      // ── Hash navigation within iframe ──
      iframeWin.addEventListener('hashchange', () => {
        console.log('[SCORM] HASH_CHANGE in iframe')
        this.diffStorage()
        this.debouncedProgressUpdate()
      })

      // ── Popstate navigation within iframe ──
      iframeWin.addEventListener('popstate', () => {
        console.log('[SCORM] POPSTATE in iframe')
        this.diffStorage()
        this.debouncedProgressUpdate()
      })

      // ── Before unload — final sync ──
      iframeWin.addEventListener('beforeunload', () => {
        console.log('[SCORM] CONTENT_BEFORE_UNLOAD')
        this.diffStorage()
      })

      // ── Unload ──
      iframeWin.addEventListener('unload', () => {
        console.log('[SCORM] CONTENT_UNLOAD')
      })

      // ── Focus / Blur ──
      iframeWin.addEventListener('focus', () => {
        console.log('[SCORM] IFRAME_FOCUS')
      })

      iframeWin.addEventListener('blur', () => {
        console.log('[SCORM] IFRAME_BLUR')
      })

      // ── Error tracking ──
      iframeWin.addEventListener('error', (e: any) => {
        console.warn('[SCORM] IFRAME_ERROR:', e.message || 'Unknown error',
                     'file:', e.filename || '', 'line:', e.lineno || '')
      })

      this.loggerSvc.log('SCORM event trackers injected into iframe')
      console.log('[SCORM] Event trackers successfully injected into iframe')
    } catch (e) {
      this.loggerSvc.log('Could not inject event trackers (likely cross-origin iframe)')
      console.warn('[SCORM] Could not inject event trackers - iframe is cross-origin.', e)
    }
  }

  private debouncedProgressUpdate() {
    if (this.progressUpdateTimer) {
      clearTimeout(this.progressUpdateTimer)
    }
    this.progressUpdateTimer = setTimeout(() => {
      if (!this.forPreview && this.htmlContent) {
        if (this.isMobileApp) {
          this.emitScormEventToMobile()
        } else {
          this.fireRealTimeProgress(this.htmlContent)
        }
      }
      // tslint:disable-next-line: align
    }, 2000)
  }

  private emitScormEventToMobile() {
    if (!this.htmlContent) { return }
    const storeData = this.store.getAll() || {}
    const completionData = this.calculateCompletionStatus(this.htmlContent)
    const payload: any = {
      type: 'SCORM_EVENT',
      contentId: this.htmlContent.identifier,
      primaryCategory: this.htmlContent.primaryCategory,
      mimeType: this.htmlContent.mimeType,
      status: (completionData && completionData.status) || 0,
      completionPercentage: (completionData && completionData.completionPercentage) || 0,
      spentTime: (completionData && completionData.spentTime) || 0,
      progressDetails: {
        ...storeData,
        spentTime: (completionData && completionData.spentTime) || 0,
      },
    }
    if (Object.keys(this.scormData).length > 0) {
      payload.progressDetails.scormData = { ...this.scormData }
    }
    console.log('[SCORM] Emitting event to mobile:', JSON.stringify(payload).substring(0, 500))
    // Emit via Flutter JavaScript channel if available
    try {
      if ((window as any).ScormEventChannel && (window as any).ScormEventChannel.postMessage) {
        (window as any).ScormEventChannel.postMessage(JSON.stringify(payload))
      } else if ((window as any).flutter_inappwebview && (window as any).flutter_inappwebview.callHandler) {
        (window as any).flutter_inappwebview.callHandler('ScormEventHandler', JSON.stringify(payload))
      } else {
        // Fallback: use window.postMessage so Flutter webview can intercept
        window.parent.postMessage(payload, '*')
      }
    } catch (e) {
      console.warn('[SCORM] Failed to emit event to mobile:', e)
    }
  }

  generateUrl(oldUrl: string) {
    const chunk = oldUrl.split('/')
    const newChunk = environment.azureHost.split('/')
    const newLink = []
    for (let i = 0; i < chunk.length; i += 1) {
      if (i === 2) {
        newLink.push(newChunk[i])
      } else if (i === 3) {
        newLink.push(environment.azureBucket)
      } else {
        newLink.push(chunk[i])
      }
    }
    const newUrl = newLink.join('/')
    return newUrl
  }

}
