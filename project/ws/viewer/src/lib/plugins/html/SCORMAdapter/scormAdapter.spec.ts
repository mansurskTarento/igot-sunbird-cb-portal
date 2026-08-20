// The @sunbird-cb/toc barrel transitively loads @sunbird-cb/consumption, which ships ESM
// `uuid` that jest does not transform. Only the ViewerUtilService DI token is needed here,
// so stub the barrel - both this spec and scormAdapter.ts then resolve the same class.
jest.mock('@sunbird-cb/toc', () => ({
  ViewerUtilService: class ViewerUtilService { },
}))

import { TestBed } from '@angular/core/testing'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { ActivatedRoute } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { ViewerUtilService } from '@sunbird-cb/toc'
import { SCORMAdapterService, scormLMSStatus, isScormCmiKey } from './scormAdapter'
import { Storage } from './storage'

const PROGRESS_UPDATE_URL = '/apis/proxies/v8/content-progres'
const PROGRESS_READ_URL = '/apis/proxies/v8/read/content-progres'

const CONTENT_A = 'do_content_A'
const CONTENT_B = 'do_content_B'
const COURSE_ID = 'do_course_1'
const BATCH_ID = 'batch_1'
const USER_ID = 'user_1'

describe('SCORMAdapterService', () => {
  let service: SCORMAdapterService
  let store: Storage
  let httpMock: HttpTestingController
  let viewerSvcMock: any
  let configSvcMock: any

  const readUrl = () => `${PROGRESS_READ_URL}/${COURSE_ID}`
  const updateUrl = (contentId: string) => `${PROGRESS_UPDATE_URL}/${contentId}`

  /** Body the component hands to addDataV3 - mirrors html.component.fireRealTimeProgress */
  const progressReq = (status: number, completionPercentage: number, spentTime = 0) => ({
    content_type: 'Resource',
    primaryCategory: 'Learning Resource',
    current: ['1'],
    max_size: 1,
    mime_type: 'application/zip',
    user_id_type: 'uuid',
    status,
    completionPercentage,
    progressDetails: { spentTime, scormData: { 'slide-bookmark': '7' } },
  })

  beforeEach(() => {
    localStorage.clear()
    jest.spyOn(console, 'log').mockImplementation(() => undefined)
    jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    jest.spyOn(console, 'error').mockImplementation(() => undefined)

    viewerSvcMock = {
      getBatchIdAndCourseId: jest.fn().mockReturnValue({ courseId: COURSE_ID, batchId: BATCH_ID }),
      getResourceContentLanguage: jest.fn().mockReturnValue('en'),
    }
    configSvcMock = { userProfile: { userId: USER_ID } }

    TestBed.configureTestingModule({
      providers: [
        SCORMAdapterService,
        Storage,
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: { collectionId: COURSE_ID, batchId: BATCH_ID } } } },
        { provide: ConfigurationsService, useValue: configSvcMock },
        { provide: ViewerUtilService, useValue: viewerSvcMock },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    })

    service = TestBed.inject(SCORMAdapterService)
    store = TestBed.inject(Storage)
    httpMock = TestBed.inject(HttpTestingController)
    service.contentId = CONTENT_A
  })

  afterEach(() => {
    httpMock.verify()
    jest.restoreAllMocks()
    localStorage.clear()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('contentId', () => {
    it('points the Storage service at the same localStorage key', () => {
      service.contentId = CONTENT_B
      expect(service.contentId).toBe(CONTENT_B)
      expect(store.contentKey).toBe(CONTENT_B)
    })

    it('scopes stored CMI data per content', () => {
      service.LMSInitialize()
      service.LMSSetValue('cmi.suspend_data', 'A-position')

      service.contentId = CONTENT_B
      expect(store.getItem('cmi.suspend_data')).toBeNull()

      service.contentId = CONTENT_A
      expect(store.getItem('cmi.suspend_data')).toBe('A-position')
    })
  })

  describe('isScormCmiKey', () => {
    it.each(['cmi.core.exit', 'cmi.suspend_data', 'cmi.core.lesson_status', 'Initialized', 'errors'])(
      'classifies "%s" as SCORM data model state', key => {
        expect(isScormCmiKey(key)).toBe(true)
      })

    it.each(['spentTime', 'completionStatus', 'completionPercentage', 'rise-bookmark', 'progress-map'])(
      'classifies "%s" as not SCORM data model state', key => {
        expect(isScormCmiKey(key)).toBe(false)
      })
  })

  describe('getStatus', () => {
    it.each([
      ['completed', 2],
      ['passed', 2],
      ['incomplete', 1],
      ['failed', 1],
      ['browsed', 1],
    ])('maps lesson_status "%s" to %i', (lessonStatus, expected) => {
      expect(service.getStatus({ 'cmi.core.lesson_status': lessonStatus })).toBe(expected)
    })

    it('falls back to 1 when lesson_status is absent', () => {
      expect(service.getStatus({})).toBe(1)
    })

    it('falls back to 1 instead of throwing on a null payload', () => {
      expect(service.getStatus(null)).toBe(1)
    })
  })

  describe('SCORM 1.2 API surface', () => {
    it('LMSInitialize marks the store initialized and emits LMSPositive', () => {
      const emitted: scormLMSStatus[] = []
      service.scormInitialized$.subscribe(v => emitted.push(v))

      expect(service.LMSInitialize()).toBe(true)
      expect(service._isInitialized()).toBe(true)
      expect(emitted).toEqual([scormLMSStatus.LMSPositive])
    })

    it('LMSSetValue / LMSGetValue are rejected before LMSInitialize', () => {
      expect(service.LMSSetValue('cmi.core.lesson_status', 'completed')).toBe(false)
      expect(service.LMSGetValue('cmi.core.lesson_status')).toBe(false)
    })

    it('LMSSetValue / LMSGetValue round-trip once initialized', () => {
      service.LMSInitialize()
      expect(service.LMSSetValue('cmi.suspend_data', 'slide=12')).toBe('slide=12')
      expect(service.LMSGetValue('cmi.suspend_data')).toBe('slide=12')
    })

    it('LMSGetValue returns "" for an element that was never set', () => {
      service.LMSInitialize()
      expect(service.LMSGetValue('cmi.core.score.raw')).toBe('')
    })

    it('LMSFinish is refused when not initialized', () => {
      expect(service.LMSFinish()).toBe(false)
    })

    // --- Characterization tests: these pin down two live defects in error reporting.
    //     They assert what the code does today, not what SCORM 1.2 requires.

    it('DEFECT: _setError discards the raised code, so LMSGetLastError never reports it', () => {
      // _setError parses the stored array into newErrors, pushes onto newErrors, then
      // writes back the original `errors` string - the push is thrown away.
      // Fix: this.store.setItem('errors', JSON.stringify(newErrors))
      service.LMSFinish() // raises 301 (not initialized)

      expect(service.LMSGetLastError()).toBe('')
      expect(store.getItem('errors')).toBe('[]')
    })

    it('DEFECT: LMSGetErrorString only resolves code 0, because errorCodes is an array holding one map', () => {
      // errorCodes = [{ 0: {...}, 101: {...}, 201: {...} }], so errorCodes[101] is
      // undefined and every real code returns ''. Fix: index errorCodes[0][errorCode].
      expect(service.LMSGetErrorString(0)).toBe('No Error')
      expect(service.LMSGetErrorString(101)).toBe('')
      expect(service.LMSGetErrorString(201)).toBe('')
      expect(service.LMSGetDiagnostic(301)).toBe('')
    })

    it('LMSFinish wipes the content key from localStorage', () => {
      service.LMSInitialize()
      service.LMSSetValue('cmi.core.lesson_status', 'incomplete')
      expect(localStorage.getItem(CONTENT_A)).not.toBeNull()

      service.LMSFinish()

      expect(localStorage.getItem(CONTENT_A)).toBeNull()
    })
  })

  describe('LMSCommit - completion gated', () => {
    it('sends a progress update when lesson_status is completed', () => {
      service.LMSInitialize()
      service.LMSSetValue('cmi.core.lesson_status', 'completed')

      service.LMSCommit()

      const req = httpMock.expectOne(updateUrl(CONTENT_A))
      expect(req.request.method).toBe('PATCH')
      expect(req.request.body.request.contents[0].status).toBe(2)
      req.flush({})
    })

    it('sends nothing while the content is still incomplete', () => {
      service.LMSInitialize()
      service.LMSSetValue('cmi.core.lesson_status', 'incomplete')

      service.LMSCommit()

      httpMock.expectNone(updateUrl(CONTENT_A))
    })

    it('returns false even on a successful commit, because the request resolves asynchronously', () => {
      service.LMSInitialize()
      service.LMSSetValue('cmi.core.lesson_status', 'completed')

      expect(service.LMSCommit()).toBe(false)

      httpMock.expectOne(updateUrl(CONTENT_A)).flush({ result: 'ok' })
    })
  })

  describe('addDataV3 - not completion gated', () => {
    it('carries status, completionPercentage and progressDetails through to the request', () => {
      service.addDataV3(progressReq(1, 45, 90), CONTENT_A).subscribe()

      const req = httpMock.expectOne(updateUrl(CONTENT_A))
      const content = req.request.body.request.contents[0]
      expect(req.request.method).toBe('PATCH')
      expect(content.contentId).toBe(CONTENT_A)
      expect(content.courseId).toBe(COURSE_ID)
      expect(content.batchId).toBe(BATCH_ID)
      expect(content.status).toBe(1)
      expect(content.completionPercentage).toBe(45)
      expect(content.progressdetails).toEqual({ spentTime: 90, scormData: { 'slide-bookmark': '7' } })
      req.flush({})
    })

    it('defaults a missing status to 0', () => {
      service.addDataV3({ completionPercentage: 10, progressDetails: {} }, CONTENT_A).subscribe()

      const req = httpMock.expectOne(updateUrl(CONTENT_A))
      expect(req.request.body.request.contents[0].status).toBe(0)
      req.flush({})
    })

    it('addresses the URL by the active contentId while the body uses the explicit one', () => {
      // html.component passes oldData.identifier when switching away from a content
      service.addDataV3(progressReq(1, 20), CONTENT_B).subscribe()

      const req = httpMock.expectOne(updateUrl(CONTENT_A))
      expect(req.request.body.request.contents[0].contentId).toBe(CONTENT_B)
      req.flush({})
    })

    it('sends nothing when the user profile is missing, rather than PATCHing an empty body', () => {
      configSvcMock.userProfile = null

      service.addDataV3(progressReq(2, 100), CONTENT_A).subscribe()

      httpMock.expectNone(updateUrl(CONTENT_A))
    })

    it('sends nothing when courseId/batchId are unresolved', () => {
      viewerSvcMock.getBatchIdAndCourseId.mockReturnValue({ courseId: '', batchId: '' })

      service.addDataV3(progressReq(2, 100), CONTENT_A).subscribe()

      httpMock.expectNone(updateUrl(CONTENT_A))
    })

    it('completes without emitting when it skips the request, so no success handler runs', () => {
      configSvcMock.userProfile = null
      const next = jest.fn()
      const complete = jest.fn()

      service.addDataV3(progressReq(2, 100), CONTENT_A).subscribe({ next, complete })

      expect(next).not.toHaveBeenCalled()
      expect(complete).toHaveBeenCalled()
      httpMock.expectNone(updateUrl(CONTENT_A))
    })
  })

  describe('suppressProgressApi - the host reports progress itself', () => {
    // Set when the viewer is embedded in the mobile app: the app receives SCORM_EVENT and
    // performs its own progress update, so nothing here may PATCH.

    it('stops addDataV3 from issuing a request', () => {
      service.suppressProgressApi = true

      service.addDataV3(progressReq(2, 100), CONTENT_A).subscribe()

      httpMock.expectNone(updateUrl(CONTENT_A))
    })

    it('stops LMSCommit from issuing a request even at a completed status', () => {
      service.suppressProgressApi = true
      service.LMSInitialize()
      service.LMSSetValue('cmi.core.lesson_status', 'completed')

      service.LMSCommit()

      httpMock.expectNone(updateUrl(CONTENT_A))
    })

    it('leaves LMSCommit alone when not suppressed', () => {
      service.suppressProgressApi = false
      service.LMSInitialize()
      service.LMSSetValue('cmi.core.lesson_status', 'completed')

      service.LMSCommit()

      httpMock.expectOne(updateUrl(CONTENT_A)).flush({})
    })

    it('signals progressCommitted$ on every LMSCommit so the host gets the hand-off', () => {
      service.suppressProgressApi = true
      const commits: number[] = []
      service.progressCommitted$.subscribe(() => commits.push(1))
      service.LMSInitialize()

      // incomplete - the API path would not have saved this, but the host still needs it
      service.LMSSetValue('cmi.suspend_data', 'slide=2')
      service.LMSCommit()
      // and again once the package reports completion
      service.LMSSetValue('cmi.core.lesson_status', 'completed')
      service.LMSCommit()

      expect(commits.length).toBe(2)
      httpMock.expectNone(updateUrl(CONTENT_A))
    })

    it('reports success back to the package when the host takes the commit', () => {
      service.suppressProgressApi = true
      service.LMSInitialize()
      service.LMSSetValue('cmi.suspend_data', 'slide=2')

      expect(service.LMSCommit()).toBe(true)
    })

    it('signals the hand-off from LMSFinish before the store is cleared', () => {
      service.suppressProgressApi = true
      let dataAtCommit: any = null
      service.progressCommitted$.subscribe(() => { dataAtCommit = { ...(store.getAll() as any) } })
      service.LMSInitialize()
      service.LMSSetValue('cmi.suspend_data', 'slide=7')

      service.LMSFinish()

      // LMSFinish clears the store, so the emit has to see the data before that happens
      expect(dataAtCommit).not.toBeNull()
      expect(dataAtCommit['cmi.suspend_data']).toBe('slide=7')
      expect(localStorage.getItem(CONTENT_A)).toBeNull()
    })

    it('does not signal progressCommitted$ when the API path is active', () => {
      service.suppressProgressApi = false
      const commits: number[] = []
      service.progressCommitted$.subscribe(() => commits.push(1))
      service.LMSInitialize()
      service.LMSSetValue('cmi.core.lesson_status', 'completed')

      service.LMSCommit()

      expect(commits.length).toBe(0)
      httpMock.expectOne(updateUrl(CONTENT_A)).flush({})
    })

    it('does not block the progress read, which resume still needs', () => {
      service.suppressProgressApi = true

      service.loadDataV2()

      httpMock.expectOne(readUrl()).flush({ result: { contentList: [] } })
    })

    it('defaults to off', () => {
      expect(new SCORMAdapterService(
        store, {} as any, {} as any, {} as any, {} as any, {} as any,
      ).suppressProgressApi).toBe(false)
    })
  })

  describe('progress updates continue after 100% completion', () => {
    // The component reaches status 2 / 100% from the time-based threshold in
    // calculateCompletionStatus, then keeps calling fireRealTimeProgress from
    // debouncedProgressUpdate on every SCORM emit (click, keydown, slide mutation,
    // localStorage write, hashchange). addDataV3 has no completion guard, so each of
    // those emits produces another PATCH.

    it('sends the update that first reports 100%', () => {
      service.addDataV3(progressReq(2, 100, 600), CONTENT_A).subscribe()

      const req = httpMock.expectOne(updateUrl(CONTENT_A))
      const content = req.request.body.request.contents[0]
      expect(content.status).toBe(2)
      expect(content.completionPercentage).toBe(100)
      req.flush({})
    })

    it('does not suppress a repeat update once 100% has already been reported', () => {
      service.addDataV3(progressReq(2, 100, 600), CONTENT_A).subscribe()
      httpMock.expectOne(updateUrl(CONTENT_A)).flush({})

      service.addDataV3(progressReq(2, 100, 620), CONTENT_A).subscribe()

      const repeat = httpMock.expectOne(updateUrl(CONTENT_A))
      expect(repeat.request.body.request.contents[0].completionPercentage).toBe(100)
      repeat.flush({})
    })

    it('issues one request per SCORM emit after completion', () => {
      const emitsAfterCompletion = 5

      for (let i = 0; i < emitsAfterCompletion; i += 1) {
        service.addDataV3(progressReq(2, 100, 600 + i), CONTENT_A).subscribe()
      }

      const requests = httpMock.match(updateUrl(CONTENT_A))
      expect(requests.length).toBe(emitsAfterCompletion)
      requests.forEach(r => {
        expect(r.request.body.request.contents[0].status).toBe(2)
        expect(r.request.body.request.contents[0].completionPercentage).toBe(100)
        r.flush({})
      })
    })

    it('keeps refreshing lastAccessTime and spentTime on each post-completion update', () => {
      service.addDataV3(progressReq(2, 100, 600), CONTENT_A).subscribe()
      const first = httpMock.expectOne(updateUrl(CONTENT_A))
      const firstContent = first.request.body.request.contents[0]
      first.flush({})

      service.addDataV3(progressReq(2, 100, 900), CONTENT_A).subscribe()
      const second = httpMock.expectOne(updateUrl(CONTENT_A))
      const secondContent = second.request.body.request.contents[0]
      second.flush({})

      expect(firstContent.progressdetails.spentTime).toBe(600)
      expect(secondContent.progressdetails.spentTime).toBe(900)
      expect(secondContent.lastAccessTime).toBeDefined()
    })

    it('never downgrades a reported status - the component clamps before calling', () => {
      // calculateCompletionStatus returns status 2 for every call once the stored
      // completionStatus is 2, so a post-completion emit cannot send status 1.
      service.addDataV3(progressReq(2, 100), CONTENT_A).subscribe()
      service.addDataV3(progressReq(2, 100), CONTENT_A).subscribe()

      const requests = httpMock.match(updateUrl(CONTENT_A))
      expect(requests.map(r => r.request.body.request.contents[0].status)).toEqual([2, 2])
      requests.forEach(r => r.flush({}))
    })
  })

  describe('loadDataV2', () => {
    const progressResponse = (contentId: string, progressdetails: any, status = 1, completionPercentage = 50) => ({
      result: { contentList: [{ contentId, status, completionPercentage, progressdetails }] },
    })

    it('restores CMI fields into the store and flat keys into localStorage, then emits LMSPositive', () => {
      const emitted: scormLMSStatus[] = []
      service.scormInitialized$.subscribe(v => emitted.push(v))

      service.loadDataV2()

      httpMock.expectOne(readUrl()).flush(progressResponse(CONTENT_A, {
        'cmi.suspend_data': 'slide=12',
        spentTime: 420,
        scormData: { 'slide-bookmark': '12', 'quiz-state': '{"q1":true}' },
      }, 1, 60))

      expect(store.getItem('cmi.suspend_data')).toBe('slide=12')
      expect(store.getItem('completionPercentage')).toBe(60)
      expect(localStorage.getItem('slide-bookmark')).toBe('12')
      expect(localStorage.getItem('quiz-state')).toBe('{"q1":true}')
      expect(service.scormLocalStorageData).toEqual({ 'slide-bookmark': '12', 'quiz-state': '{"q1":true}' })
      expect(emitted).toEqual([scormLMSStatus.LMSPositive])
    })

    it('keeps scormData out of the CMI store object', () => {
      service.loadDataV2()
      httpMock.expectOne(readUrl()).flush(progressResponse(CONTENT_A, {
        'cmi.suspend_data': 'slide=3',
        scormData: { bookmark: '3' },
      }))

      expect((store.getAll() as any).scormData).toBeUndefined()
    })

    it('emits LMSWating when the course has no entry for this content', () => {
      const emitted: scormLMSStatus[] = []
      service.scormInitialized$.subscribe(v => emitted.push(v))

      service.loadDataV2()
      httpMock.expectOne(readUrl()).flush(progressResponse(CONTENT_B, { 'cmi.suspend_data': 'other' }))

      expect(emitted).toEqual([scormLMSStatus.LMSWating])
    })

    it('emits LMSWating on an empty content list', () => {
      const emitted: scormLMSStatus[] = []
      service.scormInitialized$.subscribe(v => emitted.push(v))

      service.loadDataV2()
      httpMock.expectOne(readUrl()).flush({ result: { contentList: [] } })

      expect(emitted).toEqual([scormLMSStatus.LMSWating])
    })

    it('emits LMSNegative when progress exists but carries neither Initialized nor scormData', () => {
      const emitted: scormLMSStatus[] = []
      service.scormInitialized$.subscribe(v => emitted.push(v))

      service.loadDataV2()
      httpMock.expectOne(readUrl()).flush(progressResponse(CONTENT_A, { spentTime: 30 }))

      expect(emitted).toEqual([scormLMSStatus.LMSNegative])
    })

    it('clears keys restored for a previous content before the read', () => {
      service.scormLocalStorageData = { 'stale-key-from-previous-content': 'x' }

      service.loadDataV2()

      expect(service.scormLocalStorageData).toEqual({})
      httpMock.expectOne(readUrl()).flush({ result: { contentList: [] } })
    })

    it('does not inherit the previous content keys when the new content has no scormData', () => {
      service.scormLocalStorageData = { 'a-bookmark': '9' }

      service.contentId = CONTENT_B
      service.loadDataV2()
      httpMock.expectOne(readUrl()).flush(progressResponse(CONTENT_B, { spentTime: 5 }))

      expect(service.scormLocalStorageData).toEqual({})
      expect(localStorage.getItem('a-bookmark')).toBeNull()
    })

    it('emits LMSWating on a failed read so the caller is never left waiting', () => {
      const emitted: scormLMSStatus[] = []
      service.scormInitialized$.subscribe(v => emitted.push(v))

      service.loadDataV2()
      httpMock.expectOne(readUrl()).flush('boom', { status: 500, statusText: 'Server Error' })

      expect(emitted).toEqual([scormLMSStatus.LMSWating])
    })

    it('ignores a response that arrives after the viewer moved to another content', () => {
      const emitted: scormLMSStatus[] = []
      service.scormInitialized$.subscribe(v => emitted.push(v))

      service.loadDataV2()
      const pending = httpMock.expectOne(readUrl())

      // user clicked Next before the read came back
      service.contentId = CONTENT_B
      pending.flush(progressResponse(CONTENT_A, { scormData: { 'a-bookmark': '9' } }))

      expect(localStorage.getItem('a-bookmark')).toBeNull()
      expect(emitted).toEqual([])
    })

    it('nests CMI under scormData on restore, keeping bookkeeping flat (current shape)', () => {
      service.loadDataV2()
      httpMock.expectOne(readUrl()).flush(progressResponse(CONTENT_A, {
        spentTime: 686,
        scormData: {
          Initialized: true,
          errors: '[]',
          'cmi.core.exit': 'suspend',
          'cmi.core.lesson_location': 'index.html#/lessons/NEaGucirDA',
          'cmi.suspend_data': '{"v":2,"d":[123]}',
          'cmi.core.session_time': '0000:48:40.0',
        },
      }, 2, 100))

      // Everything lands in the CMI store, so LMSGetValue keeps working unchanged.
      expect(store.getItem('cmi.suspend_data')).toBe('{"v":2,"d":[123]}')
      expect(store.getItem('cmi.core.exit')).toBe('suspend')
      expect(store.getItem('cmi.core.lesson_location')).toBe('index.html#/lessons/NEaGucirDA')
      expect(store.getItem('spentTime')).toBe(686)
      expect(store.getItem('completionStatus')).toBe(2)
      expect(store.getItem('completionPercentage')).toBe(100)
      // scormData must not leak into the store as a nested object
      expect((store.getAll() as any).scormData).toBeUndefined()
      // CMI is not the package's own localStorage - nothing should be written flat
      expect(localStorage.getItem('cmi.suspend_data')).toBeNull()
      expect(service.scormLocalStorageData).toEqual({})
    })

    it('restores scormLocalStorage into flat localStorage, separately from CMI', () => {
      service.loadDataV2()
      httpMock.expectOne(readUrl()).flush(progressResponse(CONTENT_A, {
        spentTime: 12,
        scormData: { 'cmi.suspend_data': 'slide=4' },
        scormLocalStorage: { 'rise-bookmark': '4', 'quiz-state': '{"q1":true}' },
      }))

      expect(store.getItem('cmi.suspend_data')).toBe('slide=4')
      expect(localStorage.getItem('rise-bookmark')).toBe('4')
      expect(localStorage.getItem('quiz-state')).toBe('{"q1":true}')
      expect(service.scormLocalStorageData).toEqual({ 'rise-bookmark': '4', 'quiz-state': '{"q1":true}' })
      // and the package keys must not pollute the CMI store
      expect(store.getItem('rise-bookmark')).toBeUndefined()
    })

    // --- Backward compatibility with records written before CMI was nested ---

    it('LEGACY: restores cmi.* entries written flat on progressdetails', () => {
      // This is the exact shape the player used to upload.
      service.loadDataV2()
      httpMock.expectOne(readUrl()).flush(progressResponse(CONTENT_A, {
        spentTime: 686,
        completionStatus: 1,
        completionPercentage: 0,
        Initialized: true,
        errors: '[]',
        'cmi.core.exit': 'suspend',
        'cmi.core.lesson_location': 'index.html#/lessons/NEaGucirDA',
        'cmi.suspend_data': '{"v":2,"d":[123]}',
        'cmi.core.session_time': '0000:48:40.0',
      }, 2, 100))

      expect(store.getItem('cmi.suspend_data')).toBe('{"v":2,"d":[123]}')
      expect(store.getItem('cmi.core.exit')).toBe('suspend')
      expect(store.getItem('spentTime')).toBe(686)
      // top-level status/percentage win over the stale values inside progressdetails
      expect(store.getItem('completionStatus')).toBe(2)
      expect(store.getItem('completionPercentage')).toBe(100)
    })

    it('LEGACY: treats non-CMI keys inside scormData as the package localStorage keys', () => {
      // Before the split, scormData was the bucket for a package's own localStorage.
      service.loadDataV2()
      httpMock.expectOne(readUrl()).flush(progressResponse(CONTENT_A, {
        spentTime: 30,
        scormData: { 'rise-bookmark': '7', 'progress-map': '{"a":1}' },
      }))

      expect(localStorage.getItem('rise-bookmark')).toBe('7')
      expect(localStorage.getItem('progress-map')).toBe('{"a":1}')
      expect(service.scormLocalStorageData).toEqual({ 'rise-bookmark': '7', 'progress-map': '{"a":1}' })
    })

    it('LEGACY: splits a mixed scormData bucket by key, CMI to the store and the rest flat', () => {
      service.loadDataV2()
      httpMock.expectOne(readUrl()).flush(progressResponse(CONTENT_A, {
        scormData: { 'cmi.suspend_data': 'slide=9', 'rise-bookmark': '9' },
      }))

      expect(store.getItem('cmi.suspend_data')).toBe('slide=9')
      expect(localStorage.getItem('rise-bookmark')).toBe('9')
      expect(localStorage.getItem('cmi.suspend_data')).toBeNull()
      expect(service.scormLocalStorageData).toEqual({ 'rise-bookmark': '9' })
    })

    it('emits LMSPositive when only cmi.* data is present and Initialized is absent', () => {
      const emitted: scormLMSStatus[] = []
      service.scormInitialized$.subscribe(v => emitted.push(v))

      service.loadDataV2()
      httpMock.expectOne(readUrl()).flush(progressResponse(CONTENT_A, {
        scormData: { 'cmi.suspend_data': 'slide=2' },
      }))

      expect(emitted).toEqual([scormLMSStatus.LMSPositive])
      expect(service._isInitialized()).toBe(true)
    })

    it('still emits LMSNegative when there is neither CMI nor package storage', () => {
      const emitted: scormLMSStatus[] = []
      service.scormInitialized$.subscribe(v => emitted.push(v))

      service.loadDataV2()
      httpMock.expectOne(readUrl()).flush(progressResponse(CONTENT_A, { spentTime: 8 }))

      expect(emitted).toEqual([scormLMSStatus.LMSNegative])
    })

    it('cancels an in-flight read when the next content starts loading', () => {
      service.loadDataV2()
      const first = httpMock.expectOne(readUrl())

      service.contentId = CONTENT_B
      service.loadDataV2()

      expect(first.cancelled).toBe(true)
      httpMock.expectOne(readUrl()).flush({ result: { contentList: [] } })
    })
  })
})
