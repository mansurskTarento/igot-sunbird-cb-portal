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
import { SCORMAdapterService, scormLMSStatus } from './scormAdapter'
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

    it('still issues the request with an empty body when the user profile is missing', () => {
      configSvcMock.userProfile = null

      service.addDataV3(progressReq(2, 100), CONTENT_A).subscribe()

      const req = httpMock.expectOne(updateUrl(CONTENT_A))
      expect(req.request.body).toEqual({})
      req.flush({})
    })

    it('still issues the request with an empty body when courseId/batchId are unresolved', () => {
      viewerSvcMock.getBatchIdAndCourseId.mockReturnValue({ courseId: '', batchId: '' })

      service.addDataV3(progressReq(2, 100), CONTENT_A).subscribe()

      const req = httpMock.expectOne(updateUrl(CONTENT_A))
      expect(req.request.body).toEqual({})
      req.flush({})
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
