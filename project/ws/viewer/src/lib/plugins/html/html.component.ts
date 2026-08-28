import { Component, ElementRef, Input, OnChanges, OnInit, ViewChild, OnDestroy } from '@angular/core'
import { MatSnackBar } from '@angular/material/snack-bar'
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'
import { Router, ActivatedRoute } from '@angular/router'
import { NsContent } from '@sunbird-cb/collection'
import { ConfigurationsService, EventService, LoggerService, TFetchStatus } from '@sunbird-cb/utils-v2'
import { MobileAppsService } from '../../../../../../../src/app/services/mobile-apps.service'
import { SCORMAdapterService, scormLMSStatus, isScormCmiKey, isCompleteStatusValue } from './SCORMAdapter/scormAdapter'
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

  // Interaction tracking. The learner's state itself is never read out of localStorage -
  // it is read from the CMI store the package writes through the SCORM API. These only
  // decide *when* to push a progress update.
  private mutationObserver: MutationObserver | null = null
  private progressUpdateTimer: any = null
  private mediaAttachInterval: any = null
  private lastSlideSignature: string | null = null

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
  // Completion is written once per content. The status cannot go higher and the percentage
  // is already 100, so every later commit and every later interaction would PATCH the same
  // record again - which is what a package committing per slide used to do.
  private completionReported = false
  // Per content, like completionReported: the package's data is logged once, not on every
  // interaction - the reading it guards is recomputed every couple of seconds.
  private packageDataLogged = false
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
    // SCORM 1.2 content discovers window.API; SCORM 2004 content discovers
    // window.API_1484_11. Publishing both lets either version bind without the platform
    // needing to know which one a given package was authored against.
    (window as any).API = this.scormAdapterService
    ;(window as any).API_1484_11 = this.scormAdapterService.scorm2004Api
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
        this.timer = timer(1000, 1000)
        // subscribing to a observable returns a subscription object
        this.sub = this.timer.subscribe((t: any) => this.tickerFunc(t))

        // A commit is the package asking for its state to be saved, and it is the only
        // signal that arrives at the moment the state actually changed - the interaction
        // debounce is a guess. The adapter no longer writes on commit, so this is what
        // turns a package's "I have finished" into a progress update.
        this.commitSub = this.scormAdapterService.progressCommitted$.subscribe(() => {
          const reported = this.handleCompletion()
          if (this.isMobileApp && !reported) {
            // Still hand the running state over; the app saves and restores it itself.
            this.emitScormEventToMobile()
          }
        })

        if (this.isMobileApp) {
          // The app owns in-progress state on this route: it receives SCORM_EVENT and
          // both saves and restores it itself, so the viewer does not read progress back.
          // With no progress read there is nothing for the iframe gate to wait on, so
          // release it now - otherwise scormInitialized$ never fires and the player stays
          // blank until the restore timeout. Completion is the exception: see
          // handleCompletion.
          console.log('[SCORM] mobile app route - skipping progress read, the app owns progress')
          // ngOnDestroy does not run when the webview or tab is torn down, which on this
          // route is the normal way a session ends - so emit on pagehide as well.
          this.pageHideHandler = () => {
            if (!this.handleCompletion()) {
              this.emitScormEventToMobile()
            }
          }
          window.addEventListener('pagehide', this.pageHideHandler)
          this.settleRestore()
          return
        }

        this.beginRestore()
        this.scormInitSub = this.scormAdapterService.scormInitialized$.subscribe(value => {
          this.playScormContentFlag = value
          // Restore is done (or known to have found nothing) - only now may the iframe load.
          this.settleRestore()
        })
        this.scormAdapterService.loadDataV2()
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
      if (!this.handleCompletion()) {
        this.emitScormEventToMobile()
      }
    } else {
      this.raiseRealTimeProgress()
    }
    // Root-provided service: leave the suppression flag off so a later non-mobile viewer
    // is not silently prevented from saving progress.
    this.scormAdapterService.suppressProgressApi = false
    this.clearScormStore('viewer teardown')
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

  /**
   * Drop this content's CMI store.
   *
   * The store is a cache of the record the server holds, not a second source of truth:
   * loadDataV2 reads that record back and writes it into localStorage before the iframe is
   * allowed to load. A copy left behind at the end of a session can therefore only ever be
   * stale, and it is what a package would boot against if it read localStorage before the
   * restore landed.
   *
   * Deliberately not done on the mobile route. Nothing reads progress back there - the app
   * owns it - which makes the store the only copy of cmi.core.lesson_status, and a package
   * only writes 'completed' at the moment the learner reaches the end. Wiping it would
   * lose that for good, which is the same reason LMSFinish leaves it alone.
   */
  private clearScormStore(reason: string) {
    if (this.isMobileApp) {
      console.log('[SCORM] keeping the CMI store on the mobile route -',
                  'it holds the only copy of the status:', reason)
      return
    }
    this.store.clearAll()
    console.log('[SCORM] cleared the CMI store -', reason)
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

  private fireRealTimeProgress(htmlContent: any, forceApiUpdate = false) {
    if (htmlContent) {
      this.realTimeProgressRequest.content_type = htmlContent.contentType
      this.realTimeProgressRequest.primaryCategory = htmlContent.primaryCategory

      // const collectionId = this.activatedRoute.snapshot.queryParams.collectionId ?
      //   this.activatedRoute.snapshot.queryParams.collectionId : ''

      // const batchId = this.activatedRoute.snapshot.queryParams.batchId ?
      //   this.activatedRoute.snapshot.queryParams.batchId : ''
      const completionData = this.calculateCompletionStatus(htmlContent)
      if (completionData && completionData.status === 2) {
        // Completion is written once per content. Nothing about it can change afterwards -
        // the status cannot go higher and the percentage is already 100 - so every later
        // commit and every later interaction would just PATCH the same record again.
        if (this.completionReported) {
          return
        }
        this.completionReported = true
      }

      // Always include ALL available data in progressDetails
      const progressData = this.buildProgressDetails(completionData)
      console.log('[SCORM] fireRealTimeProgress - progressData:', JSON.stringify(progressData).substring(0, 500))

      const req = {
        ...this.realTimeProgressRequest,
        status: (completionData && completionData.status) || 0,
        completionPercentage: (completionData && completionData.completionPercentage) || 0,
        progressDetails: progressData,
      }

      this.scormAdapterService.addDataV3(req, htmlContent.identifier, forceApiUpdate).subscribe((_res: any) => {
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
        // Let the next trigger try again rather than swallowing the completion.
        this.completionReported = false
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
   * scormData so a consumer can tell them apart from the player's own bookkeeping,
   * instead of finding cmi.* entries mixed in flat alongside spentTime.
   */
  private buildProgressDetails(completionData: any): any {
    const storeData: any = this.store.getAll() || {}
    const progressData: any = {}
    const scormCmi: any = {}
    for (const key of Object.keys(storeData)) {
      // The error log is the player's own diagnostics, never uploaded.
      if (key === 'errors') {
        continue
      }
      if (isScormCmiKey(key)) {
        scormCmi[key] = storeData[key]
      } else {
        progressData[key] = storeData[key]
      }
    }
    progressData.spentTime = (completionData && completionData.spentTime) || 0
    // These come out of the store, where they are whatever the last restore put there, so
    // they have to be overwritten with the reading being sent - a payload carrying
    // completionPercentage 1 inside a request whose top level says 4 is just confusing.
    progressData.completionStatus = (completionData && completionData.status) || 0
    progressData.completionPercentage = (completionData && completionData.completionPercentage) || 0
    if (Object.keys(scormCmi).length > 0) {
      progressData.scormData = scormCmi
    }
    return progressData
  }

  calculateCompletionStatus(htmlContent: any) {
    const data = this.store.getAll()
    let spentTimen = 0
    let percentage = 0
    // What has already been recorded for this content, restored by loadDataV2. Every
    // in-progress reading below is floored at it, because the CMI store starts a session
    // empty: the first interaction fires the debounced update before the package has
    // written anything back, and without the floor that PATCHed 0 over a percentage the
    // learner had already earned.
    const savedPercentage = this.getSavedPercentage(data)
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
        // A record already marked complete but carrying no percentage is still 100 -
        // sending 0 alongside status 2 is the one combination that cannot be true.
        completionPercentage: savedPercentage || 100,
        status: data && data['completionStatus'],
        spentTime: data && data['spentTime'],
        // tslint:disable-next-line: whitespace
      }
    }
    // if (data) {
    spentTimen = this.ticks + (data && data['spentTime'] || 0)
    // cmi.progress_measure (SCORM 2004, 0..1) is the package's own account of how far the
    // learner has got.
    const measure = this.getScormProgressMeasure()

    if (this.isTrackableContent(htmlContent)) {
      // A package reporting progress_measure 1.0 has finished, whether or not it got round
      // to writing a completion status as well. Rounded before the comparison, exactly as
      // this branch has always done it - anything from 0.995 up reads as 100 and completes.
      const measured = measure !== null ? Math.round(measure * 100) : null
      if (measured !== null && measured >= 100) {
        return {
          completionPercentage: 100,
          status: 2,
          spentTime: spentTimen,
        }
      }
      // progress_measure is a SCORM 2004 element, so no 1.2 package has one, and plenty of
      // 2004 packages never write it either - hence the other readings behind this call,
      // all of them the package's own account of itself. A package that has written a
      // measure of 0 counts as having said nothing yet.
      const reported = (measured !== null && measured > 0)
        ? measured
        : this.getReportedScormProgress()
      if (reported === null) {
        // The package has not reported anything yet, which is not the same as it reporting
        // zero - and with the store cleared at teardown, every session starts out in this
        // state. Keep the record as it stands rather than writing a 0 over a percentage
        // the learner has already earned.
        console.log('[SCORM] the package has reported no progress yet - leaving the',
                    'recorded percentage at', savedPercentage)
        this.logPackageData()
        return {
          completionPercentage: savedPercentage,
          status: 1,
          spentTime: spentTimen,
        }
      }
      // Exactly what the package reports, and nothing else. Trackable content means the
      // package is the authority on how far the learner has got, so this is neither
      // floored at what the server already holds nor capped below 100: if the package
      // says less than the record does, the record is what is out of date.
      return {
        completionPercentage: reported,
        status: reported >= 100 ? 2 : 1,
        spentTime: spentTimen,
      }
    }

    // Untracked content: the mechanism that was always here. progress_measure still wins
    // when a package volunteers it, because the elapsed-time ratio is only a proxy - it
    // reports 33% for someone who finished a 30 minute module in 10.
    if (measure !== null) {
      percentage = Math.round(measure * 100)
    } else if (htmlContent && spentTimen) {
      // ~~ will remove decimal after division
      // tslint:disable-next-line
      percentage = ~~((spentTimen / htmlContent.duration) * 100)
    }
    // }
    // The only change to this path: progress cannot go backwards. Nothing else about it
    // moves - the reading and the threshold it is compared against are what they were, so
    // untracked content completes exactly when it used to.
    percentage = Math.max(percentage, savedPercentage)

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

  /**
   * Whether the content record says the package reports its own progress.
   *
   * When the flag is absent - which is every content published before it existed - the old
   * elapsed-time mechanism is left exactly as it was. Accepts the string form too, because
   * sibling flags on this record (isIframeSupported) come back as strings.
   */
  private isTrackableContent(htmlContent: any): boolean {
    const flag = htmlContent && htmlContent.isTrackable
    return flag === true || (typeof flag === 'string' && flag.toLowerCase() === 'true')
  }

  /**
   * The percentage already recorded for this content, or 0 when there is none.
   *
   * loadDataV2 writes the server's completionPercentage into the CMI store on restore, so
   * this is the learner's earned progress as the session begins - the floor no later
   * reading may fall below.
   */
  private getSavedPercentage(data: any): number {
    const saved = Number(data && data['completionPercentage'])
    if (isNaN(saved) || saved <= 0) {
      return 0
    }
    return Math.min(Math.round(saved), 100)
  }

  /**
   * How far through the learner is, as 0..100, according to what the package itself wrote
   * into the CMI store - or null when it wrote nothing that says.
   *
   * cmi.progress_measure is handled by the caller, because it is the one element that may
   * also declare the content finished. What is left are indirect readings, so they are
   * capped below 100: they exist to lift a stalled 0 to something truthful, never to stand
   * in for the package declaring completion.
   */
  private getReportedScormProgress(): number | null {
    const suspended = this.getSuspendDataProgress()
    if (suspended !== null) {
      console.log('[SCORM] partial progress from cmi.suspend_data:', suspended)
      return suspended
    }
    const objectives = this.getObjectivesProgress()
    if (objectives !== null) {
      console.log('[SCORM] partial progress from cmi.objectives:', objectives)
      return objectives
    }
    return null
  }

  /**
   * The percentage an Articulate Rise package records inside cmi.suspend_data.
   *
   * Rise stores its state as {"v":2,"d":[...],"cpv":"..."} where d is the LZW-compressed
   * JSON of the learner's progress, and that JSON carries a course-level figure outright:
   *
   *   {"progress":{"lessons":{"1":{"c":1,"p":100},"3":{"p":50}}, "p":50}}
   *
   * progress.p is the number Rise itself shows as "N% COMPLETE", so reporting it is what
   * makes the platform agree with what the learner is looking at.
   *
   * Deliberately NOT averaged from the per-lesson p values. Only lessons the learner has
   * reached are recorded, so that average divides by the wrong total - on the course above
   * it reads (100 + 100 + 50) / 3 = 83 against a true 50. Rise counts the lessons that are
   * not there yet; nothing derivable from this object can.
   *
   * Every step is guarded: a package whose suspend_data is any other shape (Storyline's is
   * not JSON at all) falls through to the next signal rather than throwing.
   */
  private getSuspendDataProgress(): number | null {
    const data: any = this.store.getAll() || {}
    const raw = data['cmi.suspend_data']
    if (typeof raw !== 'string' || !raw) {
      return null
    }
    let envelope: any
    try {
      envelope = JSON.parse(raw)
      // tslint:disable-next-line: align
    } catch (_e) {
      return null
    }
    if (!envelope || !Array.isArray(envelope.d)) {
      return null
    }
    const decoded = this.lzwDecode(envelope.d)
    if (!decoded) {
      return null
    }
    let state: any
    try {
      state = JSON.parse(decoded)
      // tslint:disable-next-line: align
    } catch (_e) {
      console.warn('[SCORM] cmi.suspend_data decompressed to something that is not JSON')
      return null
    }
    const overall = Number(state && state.progress && state.progress.p)
    // Absent until at least one lesson completes, and absent is not the same as zero: a
    // learner most of the way through the first lesson of six has a real reading, it is
    // just not one this object can give. Fall through and let the next signal answer.
    if (isNaN(overall) || overall <= 0 || overall > 100) {
      return null
    }
    return Math.round(overall)
  }

  /**
   * LZW decompression, for the code array Rise packs its state into.
   *
   * The dictionary starts as the 256 single characters and grows by one entry per code, so
   * a value of 256 or more is a back-reference to a string built earlier in the stream.
   * Returns null on a malformed stream rather than throwing - a code past the end of the
   * dictionary means this is not the format we think it is.
   */
  private lzwDecode(codes: number[]): string | null {
    if (!codes.length) {
      return null
    }
    const dictionary: string[] = []
    for (let i = 0; i < 256; i += 1) {
      dictionary.push(String.fromCharCode(i))
    }
    let previous = dictionary[codes[0]]
    if (previous === undefined) {
      return null
    }
    const out: string[] = [previous]
    for (let i = 1; i < codes.length; i += 1) {
      const code = codes[i]
      let entry: string
      if (code < dictionary.length) {
        entry = dictionary[code]
      } else if (code === dictionary.length) {
        // The one legal forward reference: the entry being defined by this very code.
        entry = previous + previous.charAt(0)
      } else {
        return null
      }
      out.push(entry)
      dictionary.push(previous + entry.charAt(0))
      previous = entry
    }
    return out.join('')
  }

  /**
   * Completed objectives over total, as 0..100.
   *
   * Both versions expose objectives as an array (cmi.objectives.N.*, with a _count), and a
   * package that tracks a slide, scene or section per objective is describing exactly how
   * far the learner has got. The per-entry status element differs by version - 1.2 has
   * .status, 2004 has .completion_status and .success_status - so all three are read.
   */
  private getObjectivesProgress(): number | null {
    const data: any = this.store.getAll() || {}
    const indexes: string[] = []
    for (const key of Object.keys(data)) {
      const match = key.match(/^cmi\.objectives\.(\d+)\./)
      if (match && indexes.indexOf(match[1]) === -1) {
        indexes.push(match[1])
      }
    }
    if (!indexes.length) {
      return null
    }
    // _count is the package's own account of the array length; one that wrote entries
    // without it is still counted by what it did write.
    const declared = this.numericCmi(data, 'cmi.objectives._count')
    const total = Math.max(declared === null ? 0 : declared, indexes.length)
    if (total <= 0) {
      return null
    }
    let completed = 0
    for (const index of indexes) {
      const status = data[`cmi.objectives.${index}.completion_status`]
        || data[`cmi.objectives.${index}.status`]
        || data[`cmi.objectives.${index}.success_status`]
      if (isCompleteStatusValue(status)) {
        completed += 1
      }
    }
    if (!completed) {
      // Objectives declared but none reached yet says nothing more than an empty store
      // does - let the next signal answer instead of pinning the reading to 0.
      return null
    }
    return Math.round((completed / total) * 100)
  }

  /**
   * Everything the package has written, logged once per content.
   *
   * Reached only when no signal in the CMI store says how far the learner has got, which
   * is where a slide-based reading would have to come from instead. For a SCORM 1.2
   * package that is cmi.core.lesson_location (the bookmark) and cmi.suspend_data, which
   * is where an authoring tool records which slides have been seen - so this is the data
   * such a reading has to be derived from. Logged whole rather than truncated:
   * suspend_data is long and the interesting part is not at the front.
   */
  private logPackageData() {
    if (this.packageDataLogged) {
      return
    }
    this.packageDataLogged = true
    const storeData: any = this.store.getAll() || {}
    const cmi: any = {}
    for (const key of Object.keys(storeData)) {
      if (key.startsWith('cmi.')) {
        cmi[key] = storeData[key]
      }
    }
    console.log('[SCORM] the package reported no progress of its own. Everything it did write:',
                JSON.stringify(cmi))
  }

  /** First of `keys` the package has actually written a number to, else null. */
  private numericCmi(data: any, ...keys: string[]): number | null {
    for (const key of keys) {
      const raw = data[key]
      if (raw === undefined || raw === null || raw === '') {
        continue
      }
      const value = Number(raw)
      if (!isNaN(value)) {
        return value
      }
    }
    return null
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
        // Tear the old iframe down now. The next URL is only applied once that content's
        // restore has settled, and until then the old package would keep running and
        // writing CMI data over the next content's.
        this.iframeUrl = null
        this.iframeUrlForIdentifier = null
        // if (!this.store.getItem('Initialized')) {
        //   this.fireRealTimeProgress(this.oldData)
        // }
        // call fireRealTimeProgress func for LMS data and non-LMS data also
        if (this.trackScormProgress) {
          // The content being left is oldData - htmlContent is already the next one.
          if (this.isMobileApp) {
            if (!this.handleCompletion(this.oldData)) {
              this.emitScormEventToMobile(this.oldData)
            }
          } else {
            this.fireRealTimeProgress(this.oldData)
          }
        }
        // Still keyed to oldData - contentId is not moved on until further down - so this
        // drops the store of the content being left, not the one being opened.
        this.clearScormStore(`switching away from ${this.oldData.identifier}`)
        // The latch is per content, and the next one starts incomplete.
        this.completionReported = false
        this.packageDataLogged = false
        if (this.mutationObserver) {
          this.mutationObserver.disconnect()
          this.mutationObserver = null
        }
        if (this.mediaAttachInterval) {
          clearInterval(this.mediaAttachInterval)
          this.mediaAttachInterval = null
        }
        this.lastSlideSignature = null

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

  /**
   * cmi.progress_measure as a 0..1 number, or null when the package has not reported it.
   * SCORM 2004 only - 1.2 has no equivalent element, which is why cmi.suspend_data and
   * cmi.objectives are read behind it.
   */
  private getScormProgressMeasure(): number | null {
    const storeData: any = this.store.getAll() || {}
    const raw = storeData['cmi.progress_measure']
    if (raw === undefined || raw === null || raw === '') {
      return null
    }
    const measure = Number(raw)
    if (isNaN(measure) || measure < 0 || measure > 1) {
      return null
    }
    return measure
  }

  /**
   * The package's own verdict on completion, or null if it has not given one.
   *
   * The authoritative signal is cmi.core.lesson_status. Articulate's SetReachedEnd() calls
   * SetCompleted(), which writes 'completed' through LMSSetValue into the CMI store - so
   * the store is where completion has to be read from. Note LMSFinish and cmi.core.exit
   * are NOT completion signals: a learner exiting half way through also finishes the
   * session, with exit='suspend'.
   */
  private getScormCompletionStatus(): number | null {
    // Delegate to the adapter so "what counts as complete" has one definition, shared with
    // the status the progress request itself reports. A package that never calls the SCORM
    // API reports nothing here, and for trackable content that is reported as-is.
    const storeData: any = this.store.getAll() || {}
    return this.scormAdapterService.getStatus(storeData) === 2 ? 2 : null
  }

  // The SCORM package finds the LMS by walking window.parent looking for window.API, which
  // is blocked when the iframe is cross-origin - that is what produces Articulate's
  // "unable to find the LMS API for ..." warnings and an empty CMI store on upload.
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

  // --- Reload SCORM content ---

  reloadScormContent() {
    if (!this.htmlContent) { return }
    console.log('[SCORM] USER_RELOAD - reloading content')
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

      // ── Click events → trigger progress update ──
      iframeDoc.addEventListener('click', (_e: any) => {
        this.debouncedProgressUpdate()
        // tslint:disable-next-line: align
      }, true)

      // ── Keyboard navigation (arrows, enter, space, tab, escape) ──
      iframeDoc.addEventListener('keydown', (e: KeyboardEvent) => {
        if (['ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Tab', 'Escape'].includes(e.key)) {
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
                this.debouncedProgressUpdate()
              })
            })
          })
        } catch (_e) { /* ignore */ }
      }
      attachMediaListeners()
      // Re-scan every 2s for dynamically added media elements
      this.mediaAttachInterval = setInterval(attachMediaListeners, 2000)

      // ── Hash navigation within iframe ──
      iframeWin.addEventListener('hashchange', () => {
        console.log('[SCORM] HASH_CHANGE in iframe')
        this.debouncedProgressUpdate()
      })

      // ── Popstate navigation within iframe ──
      iframeWin.addEventListener('popstate', () => {
        console.log('[SCORM] POPSTATE in iframe')
        this.debouncedProgressUpdate()
      })

      // ── Before unload ──
      iframeWin.addEventListener('beforeunload', () => {
        console.log('[SCORM] CONTENT_BEFORE_UNLOAD')
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
      if (!this.trackScormProgress || !this.htmlContent) {
        return
      }
      if (!this.isMobileApp) {
        this.fireRealTimeProgress(this.htmlContent)
        return
      }
      // Mobile does not push partial progress from here. SCORM_EVENT is a hand-off, and
      // emitting on every interaction fires it during load (the MutationObserver sees the
      // package render) - the app only wants the running state at the points it is already
      // given it. Completion is different: it is pushed the moment it happens rather than
      // waiting for the learner to close the content.
      this.handleCompletion()
      // tslint:disable-next-line: align
    }, 2000)
  }

  /**
   * Completion, pushed the moment the package declares it rather than when the learner
   * happens to close the content.
   *
   * On the mobile route both halves run: the app is handed a completion-flagged
   * SCORM_EVENT, and the viewer writes the update itself with forceApiUpdate. The app
   * normally owns progress there, but a completion that exists only as a hand-off is lost
   * if the app misses it or the webview is killed first, so this one write does not
   * depend on that.
   *
   * The triggers (every commit, the interaction debounce, pagehide, teardown, content
   * switch) overlap by design; completionReported makes only the first one write.
   *
   * @returns whether it reported, so a caller that was going to hand over the running
   * state can skip doing so and the app is not sent the same thing twice.
   */
  private handleCompletion(content: any = this.htmlContent): boolean {
    if (this.completionReported || !content) {
      return false
    }
    const completion = this.calculateCompletionStatus(content)
    if (!completion || completion.status !== 2) {
      return false
    }
    console.log('[SCORM] completion detected for', content.identifier,
                '- writing the progress update')
    if (this.isMobileApp) {
      this.emitScormEventToMobile(content, completion)
    }
    // Sets completionReported, so later triggers stop here instead of re-sending.
    this.fireRealTimeProgress(content, true)
    return true
  }

  /**
   * Hands the SCORM data model to the app, which owns the running state on the mobile
   * route. scormData is the data model itself; status and completionPercentage are the
   * player's reading of it, so the app does not have to re-derive completion to know a
   * content is finished.
   *
   * Raised on every commit, on exit and on content switch - and immediately on completion,
   * via handleCompletion.
   */
  private emitScormEventToMobile(content: any = this.htmlContent, completion?: any) {
    if (!content) { return }
    const storeData: any = this.store.getAll() || {}
    const scormData: any = {}
    for (const key of Object.keys(storeData)) {
      if (isScormCmiKey(key)) {
        scormData[key] = storeData[key]
      }
    }
    const completionData = completion || this.calculateCompletionStatus(content)
    const payload: any = {
      type: 'SCORM_EVENT',
      contentId: content.identifier,
      scormData,
      status: (completionData && completionData.status) || 0,
      completionPercentage: (completionData && completionData.completionPercentage) || 0,
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
