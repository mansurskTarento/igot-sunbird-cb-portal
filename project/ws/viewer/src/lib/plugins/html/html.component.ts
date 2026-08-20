import { Component, ElementRef, Input, OnChanges, OnInit, ViewChild, OnDestroy } from '@angular/core'
import { MatSnackBar } from '@angular/material/snack-bar'
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'
import { Router, ActivatedRoute } from '@angular/router'
import { NsContent } from '@sunbird-cb/collection'
import { ConfigurationsService, EventService, LoggerService, TFetchStatus } from '@sunbird-cb/utils-v2'
import { MobileAppsService } from '../../../../../../../src/app/services/mobile-apps.service'
import { SCORMAdapterService, scormLMSStatus, isScormCmiKey } from './SCORMAdapter/scormAdapter'
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
  // Must match the route key in proxy/localhost.proxy.json (dev server only).
  private readonly scormProxyPrefix = '/scorm-content'
  // packageRoot -> launch file from imsmanifest.xml ('' when the manifest could not be
  // read, so a failed lookup is not retried on every ngOnChanges for the same content).
  private launchFileCache: Record<string, string> = {}
  // Identifier the current iframeUrl was built for. ngOnChanges fires for any input
  // change, and rebuilding the URL appends a fresh ?timestamp, which reloads the iframe
  // and restarts the SCORM session from the top - so only build it once per content.
  private iframeUrlForIdentifier: string | null = null

  /**
   * Whether SCORM state should be captured at all.
   *
   * The mobile app launches the viewer as .../viewer/mobile/html/...&preview=true, so
   * forPreview is true there even though it is not an authoring preview - progress still
   * has to be captured, it is just handed to the app via SCORM_EVENT instead of being
   * PATCHed to the progress API. Deliberately narrower than flipping forPreview itself,
   * which would also switch telemetry back on for the mobile app.
   */
  private get trackScormProgress(): boolean {
    return !this.forPreview || this.isMobileApp
  }

  ticks = 0
  private timer!: any
  // Subscription object
  private sub!: Subscription
  private scormInitSub: Subscription | null = null
  private commitSub: Subscription | null = null
  private pageHideHandler: (() => void) | null = null
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
      // The app receives SCORM_EVENT and performs the progress update itself.
      this.scormAdapterService.suppressProgressApi = this.isMobileApp
      if (this.trackScormProgress) {
        // Take snapshot BEFORE iframe loads to capture clean baseline
        this.localStorageSnapshot = this.takeLocalStorageSnapshot()
        this.startLocalStoragePolling()
        this.startCrossTabStorageListener()
        console.log('[SCORM] Initial localStorage snapshot taken, keys:', Object.keys(this.localStorageSnapshot).length)

        this.timer = timer(1000, 1000)
        // subscribing to a observable returns a subscription object
        this.sub = this.timer.subscribe((t: any) => this.tickerFunc(t))

        if (this.isMobileApp) {
          // The app owns progress on this route: it receives SCORM_EVENT and both saves
          // and restores state itself, so the viewer neither writes nor reads it. With no
          // progress read there is nothing for the iframe gate to wait on, so release it
          // now - otherwise scormInitialized$ never fires and the player stays blank
          // until the restore timeout.
          console.log('[SCORM] mobile app route - skipping progress read, the app owns progress')
          // The package drives the cadence: every LMSCommit (and LMSFinish, which commits
          // first) hands the current state to the app.
          this.commitSub = this.scormAdapterService.progressCommitted$.subscribe(() => {
            this.emitScormEventToMobile()
          })
          // ngOnDestroy does not run when the webview or tab is torn down, which on this
          // route is the normal way a session ends - so emit on pagehide as well.
          this.pageHideHandler = () => {
            this.diffStorage()
            this.emitScormEventToMobile()
          }
          window.addEventListener('pagehide', this.pageHideHandler)
          this.settleRestore()
          return
        }

        this.beginRestore()
        this.scormAdapterService.loadDataV2()
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
    // Root-provided service: leave the suppression flag off so a later non-mobile viewer
    // is not silently prevented from saving progress.
    this.scormAdapterService.suppressProgressApi = false
    // this.store.clearAll()
    if (this.scormInitSub) {
      this.scormInitSub.unsubscribe()
      this.scormInitSub = null
    }
    if (this.commitSub) {
      this.commitSub.unsubscribe()
      this.commitSub = null
    }
    if (this.pageHideHandler) {
      window.removeEventListener('pagehide', this.pageHideHandler)
      this.pageHideHandler = null
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
      const progressData = this.buildProgressDetails(completionData)
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

  /**
   * Builds the progressdetails payload. SCORM data model entries are nested under
   * scormData and keys a package wrote into localStorage itself under scormLocalStorage,
   * so a consumer can tell those apart from the player's own bookkeeping instead of
   * finding cmi.* entries mixed in flat alongside spentTime.
   */
  private buildProgressDetails(completionData: any): any {
    const storeData: any = this.store.getAll() || {}
    const progressData: any = {}
    const scormCmi: any = {}
    for (const key of Object.keys(storeData)) {
      if (isScormCmiKey(key)) {
        scormCmi[key] = storeData[key]
      } else {
        progressData[key] = storeData[key]
      }
    }
    progressData.spentTime = (completionData && completionData.spentTime) || 0
    if (Object.keys(scormCmi).length > 0) {
      progressData.scormData = scormCmi
    }
    if (Object.keys(this.scormData).length > 0) {
      progressData.scormLocalStorage = { ...this.scormData }
    }
    return progressData
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
        this.iframeUrlForIdentifier = null
        // if (!this.store.getItem('Initialized')) {
        //   this.fireRealTimeProgress(this.oldData)
        // }
        // call fireRealTimeProgress func for LMS data and non-LMS data also
        if (this.trackScormProgress) {
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
        this.scormAdapterService.suppressProgressApi = this.isMobileApp
        if (this.trackScormProgress) {
          // Take fresh snapshot before new content loads
          this.localStorageSnapshot = this.takeLocalStorageSnapshot()
          this.startLocalStoragePolling()
          this.startCrossTabStorageListener()
          if (this.isMobileApp) {
            // No progress read on this route, so nothing gates the next iframe.
            this.settleRestore()
          } else {
            this.beginRestore()
            this.scormAdapterService.loadDataV2()
          }
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
      this.iframeUrlForIdentifier = null
      this.pageFetchStatus = 'artifactUrlMissing'
    } else {
      this.iframeUrl = null
      this.iframeUrlForIdentifier = null
      this.pageFetchStatus = 'error'
    }
  }

  // Resolves the package root + entry file for the content, then assigns iframeUrl.
  //
  // The entry file matters: a SCORM package declares its launch file in imsmanifest.xml,
  // and for Articulate that is scormdriver/indexAPI.html - the file which loads
  // scormdriver.js, walks window.parent to find window.API and only then hosts
  // scormcontent/index.html. Pointing the iframe straight at scormcontent/index.html
  // (which is what initFile often carries) loads the content with no LMS wiring at all,
  // and the package logs "unable to find the LMS API for ..." for every driver call while
  // no CMI data is ever written. So the manifest wins over initFile when it can be read.
  private applyIframeUrl() {
    this.iframeUrlPending = false
    if (!this.htmlContent || !this.htmlContent.artifactUrl) {
      return
    }
    if (this.iframeUrl && this.iframeUrlForIdentifier === this.htmlContent.identifier) {
      // Already playing this content. Re-assigning the src would reload the package and
      // throw away the learner's in-session position, so leave it alone.
      return
    }
    this.iframeUrlForIdentifier = this.htmlContent.identifier

    if (this.htmlContent.mimeType === 'text/x-url' || this.htmlContent.mimeType === 'video/x-youtube') {
      const artifactUrl = this.htmlContent.artifactUrl
      setTimeout(
        () => {
          if (this.htmlContent && artifactUrl) {
            this.iframeUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(artifactUrl)
          }
        },
        1000,
      )
      return
    }

    // tslint:disable-next-line: max-line-length
    const azureRoot = `${environment.azureHost}/${environment.azureBucket}/content/html/${this.htmlContent.identifier}-snapshot`
    let packageRoot: string
    let entryFile: string | null

    if (this.htmlContent.streamingUrl) {
      if (this.htmlContent.streamingUrl.includes(environment.azureHost)) {
        packageRoot = this.packageRootFromUrl(this.htmlContent.streamingUrl)
        entryFile = this.htmlContent.initFile || null
      } else if (this.htmlContent.initFile) {
        packageRoot = this.packageRootFromUrl(this.generateUrl(this.htmlContent.streamingUrl))
        entryFile = this.htmlContent.initFile
      } else {
        packageRoot = azureRoot
        entryFile = null
      }
    } else {
      packageRoot = azureRoot
      entryFile = this.htmlContent.initFile || null
    }

    this.assignScormIframeUrl(packageRoot, entryFile)
  }

  // streamingUrl is sometimes a directory and sometimes a full file URL. The manifest and
  // the launch file are both resolved relative to the package root, so strip a trailing
  // filename before using it as one.
  private packageRootFromUrl(url: string): string {
    const clean = url.split('?')[0].replace(/\/+$/, '')
    const lastSegment = clean.substring(clean.lastIndexOf('/') + 1)
    return lastSegment.includes('.') ? clean.substring(0, clean.lastIndexOf('/')) : clean
  }

  /**
   * Asks imsmanifest.xml for the launch file, then points the iframe at it. Resolution is
   * best effort - on any failure we fall back to initFile and then to index.html, i.e. the
   * behaviour that was there before.
   */
  private assignScormIframeUrl(packageRoot: string, entryFile: string | null) {
    const sameOriginRoot = this.ensureSameOriginUrl(packageRoot)
    const commit = (entry: string | null) => {
      const resolved = entry || entryFile || 'index.html'
      const url = `${sameOriginRoot}/${resolved}?timestamp=${new Date().getTime()}`
      console.log('[SCORM] launch file:', resolved, entry ? '(from imsmanifest.xml)' : '(fallback)')
      this.iframeUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(url)
    }

    const cached = this.launchFileCache[sameOriginRoot]
    if (cached !== undefined) {
      commit(cached)
      return
    }

    this.resolveScormLaunchFile(sameOriginRoot).then(href => {
      this.launchFileCache[sameOriginRoot] = href || ''
      commit(href)
      // tslint:disable-next-line: align
    }).catch(() => commit(null))
  }

  private resolveScormLaunchFile(sameOriginRoot: string): Promise<string | null> {
    return fetch(`${sameOriginRoot}/imsmanifest.xml`, { cache: 'no-cache' })
      .then(res => {
        if (!res.ok) {
          console.warn('[SCORM] imsmanifest.xml returned', res.status, '- falling back to initFile')
          return null
        }
        return res.text().then(text => this.parseLaunchFile(text))
      })
      .catch(e => {
        console.warn('[SCORM] could not read imsmanifest.xml - falling back to initFile', e)
        return null
      })
  }

  private parseLaunchFile(manifestXml: string): string | null {
    const xml = new DOMParser().parseFromString(manifestXml, 'application/xml')
    if (xml.getElementsByTagName('parsererror').length) {
      console.warn('[SCORM] imsmanifest.xml is not well formed - falling back to initFile')
      return null
    }
    const resources = Array.from(xml.getElementsByTagName('resource'))
      .filter(r => r.getAttribute('href'))
    if (!resources.length) {
      return null
    }
    // Prefer the SCO: that is the resource wired up to the LMS. Assets and plain
    // webcontent resources are not launchable.
    const sco = resources.find(r => this.readScormType(r) === 'sco')
    return (sco || resources[0]).getAttribute('href')
  }

  private readScormType(resource: Element): string {
    const attrs = resource.attributes
    for (let i = 0; i < attrs.length; i += 1) {
      const attr = attrs.item(i)
      // The attribute is namespaced (adlcp:scormtype in 1.2, adlcp:scormType in 2004),
      // and how the prefix survives parsing varies, so match on the local name.
      if (attr && attr.name.toLowerCase().endsWith('scormtype')) {
        return (attr.value || '').toLowerCase()
      }
    }
    return ''
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
          const raw = data1.toString()
          try {
            data = JSON.parse(raw)
          } catch (_e) {
            // SCORM packages postMessage bare event names ('coursePrev', 'courseNext', ...)
            // rather than JSON. Treat the string as the event instead of throwing out of
            // the window 'message' handler.
            data = { event: raw }
          }
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

  // The SCORM package finds the LMS by walking window.parent looking for window.API, and
  // writes its bookmark/suspend keys into its own origin's localStorage. Both are blocked
  // when the iframe is cross-origin, which is what produces Articulate's
  // "unable to find the LMS API for ..." warnings and an empty scormData on upload.
  //
  // In a deployment this is already fine: azureHost and the portal share a host, so the
  // content is same-origin. It only breaks in local dev, where the app runs on
  // localhost:4200 while the content still comes from the remote portal host. There we
  // route the request through the dev-server proxy (see the "/scorm-content" entry in
  // proxy/localhost.proxy.json) so the package is served from this origin instead.
  // True only under `ng serve`. Deliberately based on the host rather than
  // environment.production, which is compiled false by the dev/np/preprod/benchmark
  // build configurations and so cannot distinguish local from deployed.
  private isLocalDevServer(): boolean {
    const host = window.location.hostname
    return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]'
  }

  private ensureSameOriginUrl(url: string): string {
    try {
      const parsed = new URL(url, window.location.origin)
      if (parsed.origin === window.location.origin) {
        return url
      }
      if (!this.isLocalDevServer()) {
        // Never rewrite a deployed URL - /scorm-content only exists in the ng serve proxy
        // config. Note this cannot key off environment.production: the dev, np, preprod
        // and benchmark build configurations all compile production: false, so testing
        // that flag would rewrite URLs on four of the five deployable builds and 404.
        console.warn('[SCORM] Content is cross-origin at', parsed.origin, 'vs page', window.location.origin,
                     '- the SCORM API and localStorage will not be reachable')
        return url
      }
      const proxyUrl = `${this.scormProxyPrefix}${parsed.pathname}${parsed.search}`
      console.log('[SCORM] ensureSameOriginUrl: proxying', parsed.origin, '→', proxyUrl.substring(0, 120))
      return proxyUrl
    } catch (_e) {
      console.warn('[SCORM] ensureSameOriginUrl: could not parse', url)
      return url
    }
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
    // A reload is the one case where rebuilding the URL for the same content is wanted.
    this.iframeUrlForIdentifier = null
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
      // Mobile deliberately does NOT emit here. SCORM_EVENT is a hand-off, and emitting
      // on every interaction fires it during load (the MutationObserver sees the package
      // render) - the app only wants it once the content is finished with, so it is raised
      // from ngOnDestroy and on content switch instead. Capture still happens via
      // diffStorage on each interaction, so the final emit carries everything.
      if (this.trackScormProgress && this.htmlContent && !this.isMobileApp) {
        this.fireRealTimeProgress(this.htmlContent)
      }
      // tslint:disable-next-line: align
    }, 2000)
  }

  /**
   * Hands the SCORM data model to the app, which owns progress on the mobile route and
   * derives status/completion itself. Only contentId and scormData are sent - the
   * player's own bookkeeping is deliberately left out.
   *
   * Raised on exit and on content switch, never during playback: emitting on every
   * interaction fired it while the package was still rendering.
   */
  private emitScormEventToMobile() {
    if (!this.htmlContent) { return }
    const storeData: any = this.store.getAll() || {}
    const scormData: any = {}
    for (const key of Object.keys(storeData)) {
      if (isScormCmiKey(key)) {
        scormData[key] = storeData[key]
      }
    }
    const payload: any = {
      type: 'SCORM_EVENT',
      contentId: this.htmlContent.identifier,
      scormData,
    }
    if (!Object.keys(scormData).length) {
      console.warn('[SCORM] Emitting event to mobile with empty scormData - the package',
                   'wrote no cmi.* data, check it reached window.parent.API')
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
