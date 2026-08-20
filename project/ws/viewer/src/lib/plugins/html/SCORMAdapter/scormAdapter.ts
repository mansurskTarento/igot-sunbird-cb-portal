/* tslint:disable */
import { Injectable } from '@angular/core'
import { Storage, IScromData } from './storage'
import { errorCodes } from './errors'
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
 *     scormData:          { 'cmi.*', Initialized, errors } // SCORM data model (the API path)
 *     scormLocalStorage:  { ... }                          // keys a package wrote itself
 *   }
 *
 * Older records wrote the cmi.* entries flat onto progressdetails and used scormData for
 * the package's own localStorage keys, so the read path classifies by key name to accept
 * both. SCORM 1.2 defines every data model element as 'cmi.'-prefixed, which makes that
 * classification reliable rather than a guess.
 */
export function isScormCmiKey(key: string): boolean {
  return key.startsWith('cmi.') || key === 'Initialized' || key === 'errors'
}
@Injectable({
  providedIn: 'root',
})
export class SCORMAdapterService {
  id = ''
  scormLocalStorageData: Record<string, string> = {}
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
    let data = this.store.getAll()

    if (data) {
      delete data['errors']
      // delete data['Initialized']
      // let newData = JSON.stringify(data)
      // data = Base64.encode(newData)
      let _return = false

      // LMSCommit is the package explicitly asking for its state to be persisted, which
      // makes it the right moment for the hand-off - unlike a load-time or per-interaction
      // emit. Note this fires at every commit, not only at completion: the host needs the
      // incremental cmi.suspend_data writes too, or there is nothing to resume from.
      if (this.suppressProgressApi) {
        console.log('[SCORM] LMSCommit - handing progress to the host instead of the API')
        this.progressCommitted.next()
        return true
      }

      //only for complete and pass status, progress call should be done
      if (this.getStatus(data) === 2) {
        this.addDataV2(data).subscribe((response) => {
          if (response) {
            _return = true
          }
        }, (error) => {
          if (error) {
            this._setError(101)
            // console.log(error)
          }
        })
      }

      return _return
    }
    return false
  }

  LMSGetLastError() {
    const newErrors = JSON.parse(this.store.getItem('errors') || '[]')
    if (newErrors && newErrors.length > 0) {
      return newErrors.pop()
    }
    return ""
  }

  LMSGetErrorString(errorCode: number) {
    let error = errorCodes[errorCode]
    if (!error) return ""
    return error[errorCode]["errorString"]
  }

  LMSGetDiagnostic(errorCode: number) {
    let error = errorCodes[errorCode]
    if (!error) return ""
    return error[errorCode]["diagnostic"]
  }

  _isInitialized() {
    let initialized = this.store.getItem('Initialized')
    return initialized
  }

  _setError(errorCode: number) {
    let errors = this.store.getItem('errors')
    if (!errors) errors = '[]'
    const newErrors = JSON.parse(errors)
    if (newErrors && typeof (newErrors) === 'object') {
      newErrors.push(errorCode)
    }
    this.store.setItem('errors', errors)
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
    // This service is providedIn: 'root', so keys restored for an earlier content are
    // still on the instance. Drop them before the read so they can never be attributed
    // to this content when the response carries no scormData of its own.
    this.scormLocalStorageData = {}
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
            if (content.contentId === this.contentId && content.progressdetails) {
              found = true
              const details: any = content.progressdetails
              // The CMI store gets the bookkeeping fields plus every cmi.* entry, wherever
              // they were written. Package-owned localStorage keys go to flat localStorage.
              const cmi: any = {}
              const flat: Record<string, any> = {}

              for (const key of Object.keys(details)) {
                if (key === 'scormData' || key === 'scormLocalStorage') { continue }
                // Bookkeeping (spentTime, ...) and, on legacy records, flat cmi.* entries.
                cmi[key] = details[key]
              }
              const nested = details.scormData
              if (nested && typeof nested === 'object') {
                for (const key of Object.keys(nested)) {
                  // Current records nest CMI here; legacy records nested the package's own
                  // localStorage keys here instead.
                  if (isScormCmiKey(key)) {
                    cmi[key] = nested[key]
                  } else {
                    flat[key] = nested[key]
                  }
                }
              }
              if (details.scormLocalStorage && typeof details.scormLocalStorage === 'object') {
                Object.assign(flat, details.scormLocalStorage)
              }

              cmi.completionStatus = content.status
              cmi.completionPercentage = content.completionPercentage
              this.store.setAll(cmi as IScromData)

              if (Object.keys(flat).length > 0) {
                this.scormLocalStorageData = { ...flat }
                Object.keys(this.scormLocalStorageData).forEach(key => {
                  const val = this.scormLocalStorageData[key]
                  window.localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val))
                })
                console.log('[SCORM] loadDataV2 - restored', Object.keys(flat).length,
                  'localStorage keys for', this.contentId, Object.keys(flat))
              }
              const cmiKeys = Object.keys(cmi).filter(k => k.startsWith('cmi.'))
              if (cmiKeys.length) {
                console.log('[SCORM] loadDataV2 - restored CMI for', this.contentId, cmiKeys)
              }

              // Determine initialization status
              if (cmi['Initialized'] || cmiKeys.length > 0 || Object.keys(flat).length > 0) {
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
      if (postData["cmi.core.lesson_status"] === 'completed') {
        return 2
      }
      if (postData["cmi.core.lesson_status"] === 'passed') {
        return 2
      }
      return 1
    } catch (e) {
      // tslint:disable-next-line: no-console
      console.log('Error in getting completion status', e)
      return 1
    }
  }
  addDataV2(postData: IScromData) {
    let req: any
    const requestCourse = this.viewerSvc.getBatchIdAndCourseId(this.activatedRoute.snapshot.queryParams.collectionId,
      this.activatedRoute.snapshot.queryParams.batchId, this.contentId)
    if (this.configSvc.userProfile && requestCourse.courseId && requestCourse.batchId) {
      const language = this.viewerSvc.getResourceContentLanguage(this.contentId)
      req = {
        request: {
          userId: this.configSvc.userProfile.userId || '',
          contents: [
            {
              contentId: this.contentId,
              language: language,
              batchId: (requestCourse && requestCourse.batchId) ? requestCourse.batchId : '',
              courseId: (requestCourse && requestCourse.courseId) ? requestCourse.courseId : '',
              status: this.getStatus(postData),
              lastAccessTime: dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss:SSSZZ'),
              progressdetails: postData
            },
          ],
        },
      }
    } else {
      // Without a user profile and a resolved course/batch there is nothing the server can
      // attribute the progress to, and PATCHing `{}` just burns a request. Report why.
      console.warn('[SCORM] addDataV2 skipped - no userProfile/courseId/batchId for', this.contentId)
      return EMPTY
    }
    return this.http.patch(`${API_END_POINTS.SCROM_UPDTE_PROGRESS}/${this.contentId}`, req)
  }

  addDataV3(reqDetails: any, contentId?: string) {
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
    if (this.suppressProgressApi) {
      console.log('[SCORM] addDataV3 suppressed, the host reports progress itself')
      return EMPTY
    }
    return this.http.patch(`${API_END_POINTS.SCROM_UPDTE_PROGRESS}/${this.contentId}`, req)
  }
}