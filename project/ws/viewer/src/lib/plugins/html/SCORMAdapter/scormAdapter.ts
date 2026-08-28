/* tslint:disable */
import { Injectable } from '@angular/core'
import { Storage, IScromData } from './storage'
import { scorm12Errors, scorm2004Errors, IErrorCodeMap } from './errors'
import _ from 'lodash'
import { HttpBackend, HttpClient } from '@angular/common/http'
import { ActivatedRoute } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { NsContent } from '@sunbird-cb/collection'
import dayjs from 'dayjs'
import { ViewerUtilService } from '@sunbird-cb/toc'
import { EMPTY, Subject, Subscription } from 'rxjs'
const API_END_POINTS = {
  SCROM_ADD_UPDTE: '/apis/protected/v8/scrom/add',
  SCROM_FETCH: '/apis/protected/v8/scrom/get',
  SCROM_UPDTE_PROGRESS: `/apis/proxies/v8/content-progres`,
  SCROM_FETCH_PROGRESS: `/apis/proxies/v8/read/content-progres`,
}

export enum scormLMSStatus {
  LMSNegative = 'LMSNegative',
  LMSPositive = 'LMSPositive',
  LMSWating = 'LMSWating',
}

/**
 * progressdetails carries two unrelated things, so they are kept in separate buckets:
 *
 *   progressdetails: {
 *     spentTime, completionStatus, completionPercentage,   // the player's own bookkeeping
 *     scormData: { 'cmi.*', Initialized, errors }          // SCORM data model
 *   }
 *
 * The SCORM data model is the only learner state the player records. It deliberately does
 * not capture a package's own localStorage keys: the content iframe is same-origin with
 * the portal, so there is no way to tell a package's key from any other script's, and a
 * scormLocalStorage bucket written by an older build ended up carrying third-party player
 * state. Such records are still read - and ignored - for backward compatibility.
 *
 * Older records also wrote the cmi.* entries flat onto progressdetails and used scormData
 * for the package's localStorage keys, so the read path classifies by key name to accept
 * both. SCORM 1.2 defines every data model element as 'cmi.'-prefixed, which makes that
 * classification reliable rather than a guess.
 */
export function isScormCmiKey(key: string): boolean {
  // 'cmi.' prefixes the data model in both SCORM 1.2 and SCORM 2004, so this needs no
  // per-version handling.
  return key.startsWith('cmi.') || key === 'Initialized' || key === 'errors'
}

/**
 * Elements a package may report completion through. Which one it uses depends on the
 * SCORM version it was authored against, so completion must never be read from a single
 * hardcoded key:
 *
 *   SCORM 1.2   cmi.core.lesson_status  passed | completed | failed | incomplete |
 *                                       browsed | not attempted
 *   SCORM 2004  cmi.completion_status   completed | incomplete | not attempted | unknown
 *               cmi.success_status      passed | failed | unknown
 *
 * Packages that never call the SCORM API report through their own localStorage keys
 * instead; those are matched by substring where the flat keys are scanned.
 */
/** SCORM requires the API to answer with these strings, not booleans. */
export const SCORM_TRUE = 'true'
export const SCORM_FALSE = 'false'

export const SCORM_COMPLETION_ELEMENTS = [
  'cmi.core.lesson_status',
  'cmi.completion_status',
  'cmi.success_status',
]

/** Values that mean "the learner is done", across both versions. */
export function isCompleteStatusValue(value: any): boolean {
  return typeof value === 'string'
    && ['completed', 'passed'].indexOf(value.trim().toLowerCase()) > -1
}
@Injectable({
  providedIn: 'root',
})
export class SCORMAdapterService {
  id = ''
  public scormInitialized = new Subject<scormLMSStatus>()
  scormInitialized$ = this.scormInitialized.asObservable()
  // In-flight progress read. Kept so a switch to the next content can cancel the
  // previous request - otherwise a late response writes the old content's keys
  // into localStorage after the new content has already been set up.
  private loadDataSub: Subscription | null = null
  // Set when the host reports progress itself (the mobile app receives SCORM_EVENT and
  // does its own update). LMSCommit is driven by the SCORM package rather than by the
  // component, so the guard has to live here and not at the component's call sites.
  suppressProgressApi = false
  // Fires when the package asked for its state to be persisted while suppressProgressApi
  // is set, so the component can hand the data to the host instead of PATCHing it.
  private progressCommitted = new Subject<void>()
  progressCommitted$ = this.progressCommitted.asObservable()


  constructor(
    private store: Storage,
    private http: HttpClient,
    handler: HttpBackend,
    private activatedRoute: ActivatedRoute,
    private configSvc: ConfigurationsService,
    private viewerSvc: ViewerUtilService
  ) {
    this.http = new HttpClient(handler)
  }

  set contentId(id: string) {
    this.store.key = id
    this.id = id
    // A new content is a new SCORM session.
    this.scorm2004Terminated = false
  }

  get contentId() {
    return this.id
  }

  LMSInitialize() {
    this.store.contentKey = this.contentId

    // this.loadDataAsync().subscribe((response) => {
    //   const data = response.result.data
    //   const loadDatas: IScromData = {
    //     "cmi.core.exit": data["cmi.core.exit"],
    //     "cmi.core.lesson_status": data["cmi.core.lesson_status"],
    //     "cmi.core.session_time": data["cmi.core.session_time"],
    //     "cmi.suspend_data": data["cmi.suspend_data"],
    //     Initialized: true,
    //   }
    //   this.store.setAll(loadDatas)
    // }, (error) => {
    //   if (error) {
    //     this._setError(101)
    //   }
    // })
    this.store.setItem('Initialized', true)
    this.updateScormInitialized(scormLMSStatus.LMSPositive)
    return true
  }

  LMSFinish() {
    if (!this._isInitialized()) {
      this._setError(301)
      return false
    }
    let _return = this.LMSCommit()
    this.store.setItem('Initialized', false)
    if (this.suppressProgressApi) {
      // Nothing reads progress back on this route, so the CMI store is the only copy of
      // cmi.core.lesson_status. Wiping it makes the next session read "" for the status,
      // which the SCORM driver treats as not-attempted - and since it only writes
      // 'completed' at the moment the learner reaches the end (SetReachedEnd), a resumed
      // session never re-declares it and completion is lost for good.
      console.log('[SCORM] LMSFinish - keeping the CMI store, it holds the only copy of the status')
      return _return
    }
    this.store.clearAll()
    return _return
  }

  LMSGetValue(element: any) {
    if (!this._isInitialized()) {
      this._setError(301)
      return false
    }
    let value = this.store.getItem(element)
    if (!value) {
      this._setError(201)
      return ""
    }
    return value
  }

  LMSSetValue(element: any, value: any) {
    if (!this._isInitialized()) {
      this._setError(301)
      return false
    }
    this.store.setItem(element, value)
    return this.store.getItem(element)
  }

  LMSCommit() {
    return this.persistProgress()
  }

  /**
   * Shared by LMSCommit (1.2) and Commit (2004) - a commit means the same thing in both.
   *
   * A commit is the package explicitly asking for its state to be persisted, which makes
   * it the right moment to tell the host - unlike a load-time or per-interaction signal.
   * It fires at every commit, not only at completion: a host that saves state itself needs
   * the incremental cmi.suspend_data writes too, or there is nothing to resume from.
   *
   * The write itself is deliberately NOT done here. The component owns it, because it is
   * the only place that knows completionPercentage and spentTime. Writing from here as
   * well PATCHed a second, thinner record over the component's - status 2 with no
   * completionPercentage, on the legacy flat shape - once per commit, and a package like
   * Articulate commits per slide.
   */
  private persistProgress(): boolean {
    if (!this.store.getAll()) {
      return false
    }
    this.progressCommitted.next()
    return true
  }

  LMSGetLastError() {
    const newErrors = JSON.parse(this.store.getItem('errors') || '[]')
    if (newErrors && newErrors.length > 0) {
      return newErrors.pop()
    }
    return ""
  }

  LMSGetErrorString(errorCode: number) {
    return this.lookupError(scorm12Errors, errorCode, 'errorString')
  }

  LMSGetDiagnostic(errorCode: number) {
    return this.lookupError(scorm12Errors, errorCode, 'diagnostic')
  }

  private lookupError(table: IErrorCodeMap, errorCode: number, field: 'errorString' | 'diagnostic') {
    const entry = table[Number(errorCode)]
    return entry ? entry[field] : ""
  }

  _isInitialized() {
    let initialized = this.store.getItem('Initialized')
    return initialized
  }

  _setError(errorCode: number) {
    let errors = this.store.getItem('errors')
    if (!errors) errors = '[]'
    let newErrors: any
    try {
      newErrors = JSON.parse(errors)
    } catch (e) {
      newErrors = []
    }
    if (!Array.isArray(newErrors)) {
      newErrors = []
    }
    newErrors.push(errorCode)
    // Store newErrors, not the string it was parsed from - writing `errors` back is what
    // silently discarded every raised code and left GetLastError always answering "".
    this.store.setItem('errors', JSON.stringify(newErrors))
  }
  loadDataAsync() {
    return this.http.get<any>(API_END_POINTS.SCROM_FETCH + '/' + this.contentId)
  }

  downladFile(url: any) {
    return this.http.get(url, { responseType: 'blob' })
  }

  loadDataV2() {
    let userId
    if (this.configSvc.userProfile) {
      userId = this.configSvc.userProfile.userId || ''
    }
    const requestCourse = this.viewerSvc.getBatchIdAndCourseId(this.activatedRoute.snapshot.queryParams.collectionId,
      this.activatedRoute.snapshot.queryParams.batchId, this.contentId)
    const ML = this.viewerSvc.getResourceContentLanguage(this.contentId)
    const req: NsContent.IContinueLearningDataReq = {
      request: {
        userId,
        batchId: (requestCourse && requestCourse.batchId) ? requestCourse.batchId : '',
        courseId: (requestCourse && requestCourse.courseId) ? requestCourse.courseId : '',
        contentIds: [],
        language: ML,
        fields: ['progressdetails'],
      },
    }
    // Cancel any progress read still in flight for the previous content.
    if (this.loadDataSub) {
      this.loadDataSub.unsubscribe()
      this.loadDataSub = null
    }
    const requestedContentId = this.contentId
    this.loadDataSub = this.http.post<NsContent.IContinueLearningData>(
      `${API_END_POINTS.SCROM_FETCH_PROGRESS}/${req.request.courseId}`, req
    ).subscribe(
      data => {
        // A response that arrived after the viewer moved on must not touch localStorage.
        if (requestedContentId !== this.contentId) {
          console.log('[SCORM] loadDataV2 - stale response for', requestedContentId, 'ignored')
          return
        }
        if (data && data.result && data.result.contentList.length) {
          let found = false
          for (const content of data.result.contentList) {
            if (content.contentId === this.contentId && !content.progressdetails) {
              // A record with no progressdetails still carries what the server knows about
              // completion, and the store is cleared at teardown - so this read is the only
              // thing that puts it back. Without it an in-progress update later in the
              // session has no floor and can write a lower percentage over the record.
              this.store.setAll({
                completionStatus: content.status,
                completionPercentage: content.completionPercentage,
              } as IScromData)
            }
            if (content.contentId === this.contentId && content.progressdetails) {
              found = true
              const details: any = content.progressdetails
              // The CMI store gets the bookkeeping fields plus every cmi.* entry, wherever
              // they were written. Anything else in the record is ignored: the player no
              // longer captures or restores a package's own localStorage keys - they could
              // not be told apart from any other key in this origin, and writing them back
              // meant restoring whatever unrelated script happened to be storing state.
              const cmi: any = {}

              for (const key of Object.keys(details)) {
                if (key === 'scormData' || key === 'scormLocalStorage') { continue }
                // Bookkeeping (spentTime, ...) and, on legacy records, flat cmi.* entries.
                cmi[key] = details[key]
              }
              const nested = details.scormData
              if (nested && typeof nested === 'object') {
                for (const key of Object.keys(nested)) {
                  // Legacy records nested the package's own localStorage keys here too, so
                  // the entries still have to be classified rather than copied wholesale.
                  if (isScormCmiKey(key)) {
                    cmi[key] = nested[key]
                  }
                }
              }

              cmi.completionStatus = content.status
              cmi.completionPercentage = content.completionPercentage
              this.store.setAll(cmi as IScromData)

              const cmiKeys = Object.keys(cmi).filter(k => k.startsWith('cmi.'))
              if (cmiKeys.length) {
                console.log('[SCORM] loadDataV2 - restored CMI for', this.contentId, cmiKeys)
              }

              // Determine initialization status
              if (cmi['Initialized'] || cmiKeys.length > 0) {
                this.store.setItem('Initialized', true)
                this.updateScormInitialized(scormLMSStatus.LMSPositive)
              } else {
                this.updateScormInitialized(scormLMSStatus.LMSNegative)
              }
            }
          }
          if (!found) {
            this.updateScormInitialized(scormLMSStatus.LMSWating)
          }
        } else {
          this.updateScormInitialized(scormLMSStatus.LMSWating)
        }
      },
      error => {
        // Without this the subject never emits, the iframe gate never releases and the
        // failure is invisible. Emit a terminal status so playback can still proceed.
        console.error('[SCORM] loadDataV2 - progress read failed for', requestedContentId,
          'courseId:', req.request.courseId, error)
        this._setError(101)
        if (requestedContentId === this.contentId) {
          this.updateScormInitialized(scormLMSStatus.LMSWating)
        }
      },
    )
    return this.loadDataSub
  }

  // --- SCORM 2004 API (window.API_1484_11) ---
  //
  // Version discovery is done BY the content, not by us: a 1.2 package walks window.parent
  // looking for `API`, a 2004 package looks for `API_1484_11`. So serving both versions
  // just means publishing both objects and letting each package bind to the one it
  // understands - nothing here has to know which version the platform "is".
  //
  // Exposed as a restricted object rather than the service itself, so a driver probing for
  // method names cannot mistake one version's surface for the other's.
  private scorm2004ApiObject: any = null
  private scorm2004Terminated = false

  get scorm2004Api(): any {
    if (!this.scorm2004ApiObject) {
      this.scorm2004ApiObject = {
        Initialize: (_param?: string) => this.scorm2004Initialize(),
        Terminate: (_param?: string) => this.scorm2004Terminate(),
        GetValue: (element: string) => this.scorm2004GetValue(element),
        SetValue: (element: string, value: string) => this.scorm2004SetValue(element, value),
        Commit: (_param?: string) => this.scorm2004Commit(),
        GetLastError: () => `${this.LMSGetLastError() || 0}`,
        GetErrorString: (code: any) => this.lookupError(scorm2004Errors, Number(code), 'errorString'),
        GetDiagnostic: (code: any) => this.lookupError(scorm2004Errors, Number(code), 'diagnostic'),
      }
    }
    return this.scorm2004ApiObject
  }

  // 2004 requires the string "true"/"false", not booleans. Its drivers are stricter about
  // this than 1.2 ones, which is why these paths are conformant where the LMS* ones are not.
  private scorm2004Initialize(): string {
    if (this.scorm2004Terminated) {
      this._setError(104)
      return SCORM_FALSE
    }
    if (this._isInitialized()) {
      this._setError(103)
      return SCORM_FALSE
    }
    this.store.contentKey = this.contentId
    this.store.setItem('Initialized', true)
    this.updateScormInitialized(scormLMSStatus.LMSPositive)
    return SCORM_TRUE
  }

  private scorm2004Terminate(): string {
    if (this.scorm2004Terminated) {
      this._setError(113)
      return SCORM_FALSE
    }
    if (!this._isInitialized()) {
      this._setError(112)
      return SCORM_FALSE
    }
    this.persistProgress()
    this.store.setItem('Initialized', false)
    this.scorm2004Terminated = true
    if (!this.suppressProgressApi) {
      this.store.clearAll()
    }
    return SCORM_TRUE
  }

  private scorm2004GetValue(element: string): string {
    if (this.scorm2004Terminated) {
      this._setError(123)
      return ""
    }
    if (!this._isInitialized()) {
      this._setError(122)
      return ""
    }
    if (!element) {
      this._setError(201)
      return ""
    }
    const value = this.store.getItem(element)
    if (value === null || value === undefined || value === "") {
      // 2004 distinguishes "no such value yet" from a general failure.
      this._setError(403)
      return ""
    }
    return `${value}`
  }

  private scorm2004SetValue(element: string, value: string): string {
    if (this.scorm2004Terminated) {
      this._setError(133)
      return SCORM_FALSE
    }
    if (!this._isInitialized()) {
      this._setError(132)
      return SCORM_FALSE
    }
    if (!element) {
      this._setError(201)
      return SCORM_FALSE
    }
    this.store.setItem(element, value)
    return SCORM_TRUE
  }

  private scorm2004Commit(): string {
    if (this.scorm2004Terminated) {
      this._setError(143)
      return SCORM_FALSE
    }
    if (!this._isInitialized()) {
      this._setError(142)
      return SCORM_FALSE
    }
    this.persistProgress()
    return SCORM_TRUE
  }

  updateScormInitialized(value: scormLMSStatus) {
    this.scormInitialized.next(value)
  }

  loadData() {
    this.http.get<any>(API_END_POINTS.SCROM_FETCH + '/' + this.contentId).subscribe((response) => {
      // console.log(response.result.data)
      const data = response.result.data
      const loadDatas: IScromData = {
        "cmi.core.exit": data["cmi.core.exit"],
        "cmi.core.lesson_status": data["cmi.core.lesson_status"],
        "cmi.core.session_time": data["cmi.core.session_time"],
        "cmi.suspend_data": data["cmi.suspend_data"],
        Initialized: data["Initialized"],
        // errors: data["errors"]
      }
      this.store.setAll(loadDatas)
    }, (error) => {
      if (error) {
        // console.log(error)
        this._setError(101)
      }
    })
  }
  addData(postData: IScromData) {
    this.http.post(API_END_POINTS.SCROM_ADD_UPDTE + '/' + this.contentId, postData, {
      headers: {
        'content-type': 'application/json'
      }
    })
    return this.http.post(API_END_POINTS.SCROM_ADD_UPDTE + '/' + this.contentId, postData)
  }

  getStatus(postData: any): number {
    try {
      if (!postData) {
        return 1
      }
      for (const element of SCORM_COMPLETION_ELEMENTS) {
        if (isCompleteStatusValue(postData[element])) {
          return 2
        }
      }
      return 1
    } catch (e) {
      // tslint:disable-next-line: no-console
      console.log('Error in getting completion status', e)
      return 1
    }
  }
  /**
   * @param forceApiUpdate write even when the host normally owns progress. Used for the
   * completion update on the mobile route: the app is still handed SCORM_EVENT, but the
   * completion itself is too important to depend on the host acting on that hand-off.
   */
  addDataV3(reqDetails: any, contentId?: string, forceApiUpdate = false) {
    let req: any
    const requestCourse = this.viewerSvc.getBatchIdAndCourseId(this.activatedRoute.snapshot.queryParams.collectionId,
      this.activatedRoute.snapshot.queryParams.batchId, this.contentId)
    if (this.configSvc.userProfile && requestCourse.courseId && requestCourse.batchId) {
      req = {
        request: {
          userId: this.configSvc.userProfile.userId || '',
          contents: [
            {
              contentId: contentId ? contentId : this.contentId,
              batchId: (requestCourse && requestCourse.batchId) ? requestCourse.batchId : '',
              courseId: (requestCourse && requestCourse.courseId) ? requestCourse.courseId : '',
              status: (reqDetails.status) || 0,
              lastAccessTime: dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss:SSSZZ'),
              completionPercentage: reqDetails.completionPercentage,
              progressdetails: { ...reqDetails.progressDetails },
            },
          ],
        },
      }
    } else {
      console.warn('[SCORM] addDataV3 skipped - no userProfile/courseId/batchId for', this.contentId)
      return EMPTY
    }
    if (this.suppressProgressApi && !forceApiUpdate) {
      console.log('[SCORM] addDataV3 suppressed, the host reports progress itself')
      return EMPTY
    }
    return this.http.patch(`${API_END_POINTS.SCROM_UPDTE_PROGRESS}/${this.contentId}`, req)
  }
}