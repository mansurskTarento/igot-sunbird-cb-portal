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
      ['not attempted', 1],
    ])('SCORM 1.2: maps cmi.core.lesson_status "%s" to %i', (lessonStatus, expected) => {
      expect(service.getStatus({ 'cmi.core.lesson_status': lessonStatus })).toBe(expected)
    })

    it.each([
      ['completed', 2],
      ['incomplete', 1],
      ['not attempted', 1],
      ['unknown', 1],
    ])('SCORM 2004: maps cmi.completion_status "%s" to %i', (status, expected) => {
      expect(service.getStatus({ 'cmi.completion_status': status })).toBe(expected)
    })

    it.each([
      ['passed', 2],
      ['failed', 1],
      ['unknown', 1],
    ])('SCORM 2004: maps cmi.success_status "%s" to %i', (status, expected) => {
      expect(service.getStatus({ 'cmi.success_status': status })).toBe(expected)
    })

    it('accepts completion reported on any one of the elements', () => {
      // 2004 content commonly reports completion and success separately
      expect(service.getStatus({ 'cmi.completion_status': 'incomplete', 'cmi.success_status': 'passed' })).toBe(2)
      expect(service.getStatus({ 'cmi.completion_status': 'completed', 'cmi.success_status': 'failed' })).toBe(2)
    })

    it('is tolerant of casing and stray whitespace', () => {
      expect(service.getStatus({ 'cmi.core.lesson_status': 'Completed' })).toBe(2)
      expect(service.getStatus({ 'cmi.completion_status': ' completed ' })).toBe(2)
    })

    it('falls back to 1 when no status element is present', () => {
      expect(service.getStatus({ 'cmi.suspend_data': 'slide=3' })).toBe(1)
      expect(service.getStatus({})).toBe(1)
    })

    it('falls back to 1 instead of throwing on a null payload', () => {
      expect(service.getStatus(null)).toBe(1)
    })

    it('ignores non-string values rather than coercing them', () => {
      expect(service.getStatus({ 'cmi.core.lesson_status': 1 })).toBe(1)
      expect(service.getStatus({ 'cmi.core.lesson_status': true })).toBe(1)
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

    it('records the raised code so LMSGetLastError can report it', () => {
      service.LMSFinish() // raises 301 (not initialized)

      expect(service.LMSGetLastError()).toBe(301)
    })

    it('reports the most recent code and pops it off the log', () => {
      service.LMSSetValue('cmi.core.exit', 'suspend') // 301, not initialized
      service.LMSInitialize()
      service.LMSGetValue('cmi.core.score.raw')       // 201, element never set

      expect(service.LMSGetLastError()).toBe(201)
    })

    it('resolves error strings and diagnostics for real SCORM 1.2 codes', () => {
      expect(service.LMSGetErrorString(0)).toBe('No Error')
      expect(service.LMSGetErrorString(101)).toBe('General Exception')
      expect(service.LMSGetErrorString(201)).toBe('Invalid argument error')
      expect(service.LMSGetErrorString(301)).toBe('Not initialized')
      expect(service.LMSGetDiagnostic(301)).toContain('before the call to LMSInitialize')
    })

    it('returns "" for a code it does not know', () => {
      expect(service.LMSGetErrorString(9999)).toBe('')
      expect(service.LMSGetDiagnostic(9999)).toBe('')
    })

    it('LMSFinish wipes the content key from localStorage', () => {
      service.LMSInitialize()
      service.LMSSetValue('cmi.core.lesson_status', 'incomplete')
      expect(localStorage.getItem(CONTENT_A)).not.toBeNull()

      service.LMSFinish()

      expect(localStorage.getItem(CONTENT_A)).toBeNull()
    })
  })

  describe('SCORM 2004 API (window.API_1484_11)', () => {
    let api: any
    beforeEach(() => { api = service.scorm2004Api })

    it('exposes exactly the 2004 method names, and none of the 1.2 ones', () => {
      expect(Object.keys(api).sort()).toEqual([
        'Commit', 'GetDiagnostic', 'GetErrorString', 'GetLastError',
        'GetValue', 'Initialize', 'SetValue', 'Terminate',
      ])
      // a driver probing for methods must not mistake this for the 1.2 surface
      expect(api.LMSInitialize).toBeUndefined()
      expect(api.LMSSetValue).toBeUndefined()
    })

    it('is a stable object across accesses, so a driver may cache it', () => {
      expect(service.scorm2004Api).toBe(api)
    })

    it('answers with the strings "true"/"false", not booleans', () => {
      expect(api.Initialize('')).toBe('true')
      expect(api.SetValue('cmi.location', 'page-1')).toBe('true')
      expect(api.Commit('')).toBe('true')
      expect(api.Terminate('')).toBe('true')
      // no completion reported, so nothing should have been PATCHed
      httpMock.expectNone(updateUrl(CONTENT_A))
    })

    it('round-trips values through the same CMI store as the 1.2 path', () => {
      api.Initialize('')
      api.SetValue('cmi.location', 'page-4')
      api.SetValue('cmi.suspend_data', 'state-blob')

      expect(api.GetValue('cmi.location')).toBe('page-4')
      expect(store.getItem('cmi.suspend_data')).toBe('state-blob')
    })

    it('reports completion to getStatus via the 2004 elements', () => {
      api.Initialize('')
      api.SetValue('cmi.completion_status', 'completed')

      expect(service.getStatus(store.getAll())).toBe(2)
    })

    it('rejects Initialize twice with 103 Already Initialized', () => {
      expect(api.Initialize('')).toBe('true')
      expect(api.Initialize('')).toBe('false')
      expect(api.GetLastError()).toBe('103')
      expect(api.GetErrorString(103)).toBe('Already Initialized')
    })

    it.each([
      ['GetValue', 122, 'Retrieve Data Before Initialization'],
      ['SetValue', 132, 'Store Data Before Initialization'],
      ['Commit', 142, 'Commit Before Initialization'],
      ['Terminate', 112, 'Termination Before Initialization'],
    ])('rejects %s before Initialize with %i', (method, code, text) => {
      const result = api[method]('cmi.location', 'x')
      expect(result).toBe(method === 'GetValue' ? '' : 'false')
      expect(api.GetLastError()).toBe(`${code}`)
      expect(api.GetErrorString(code)).toBe(text)
    })

    it.each([
      ['GetValue', 123],
      ['SetValue', 133],
      ['Commit', 143],
      ['Terminate', 113],
    ])('rejects %s after Terminate with %i', (method, code) => {
      api.Initialize('')
      api.Terminate('')

      const result = api[method]('cmi.location', 'x')
      expect(result).toBe(method === 'GetValue' ? '' : 'false')
      expect(api.GetLastError()).toBe(`${code}`)
    })

    it('rejects Initialize after Terminate with 104 Content Instance Terminated', () => {
      api.Initialize('')
      api.Terminate('')

      expect(api.Initialize('')).toBe('false')
      expect(api.GetLastError()).toBe('104')
    })

    it('raises 403 for an element that has no value yet', () => {
      api.Initialize('')

      expect(api.GetValue('cmi.progress_measure')).toBe('')
      expect(api.GetLastError()).toBe('403')
      expect(api.GetErrorString(403)).toBe('Data Model Element Value Not Initialized')
    })

    it('uses the 2004 error table, where the 4xx codes differ from 1.2', () => {
      // 401 is "Not implemented" in 1.2 but "Undefined Data Model Element" in 2004
      expect(api.GetErrorString(401)).toBe('Undefined Data Model Element')
      expect(service.LMSGetErrorString(401)).toBe('Not implemented error')
    })

    it('Commit reaches the same progress path as LMSCommit', () => {
      const commits: number[] = []
      service.progressCommitted$.subscribe(() => commits.push(1))
      api.Initialize('')
      api.SetValue('cmi.completion_status', 'completed')

      api.Commit('')

      expect(commits.length).toBe(1)
      httpMock.expectNone(updateUrl(CONTENT_A))
    })

    it('Commit hands off to the host, suppressed or not', () => {
      service.suppressProgressApi = true
      const commits: number[] = []
      service.progressCommitted$.subscribe(() => commits.push(1))
      api.Initialize('')
      api.SetValue('cmi.location', 'page-2')

      expect(api.Commit('')).toBe('true')

      expect(commits.length).toBe(1)
      httpMock.expectNone(updateUrl(CONTENT_A))
    })

    it('a new content resets the terminated state, so the next session can initialize', () => {
      api.Initialize('')
      api.Terminate('')

      service.contentId = CONTENT_B

      expect(api.Initialize('')).toBe('true')
    })
  })

  describe('LMSCommit - hands the write to the component', () => {
    // The adapter used to PATCH here itself whenever the status was complete. That was a
    // second writer: it knows neither completionPercentage nor spentTime, so it wrote a
    // thinner record over the component's, once per commit - and a package commits per
    // slide. The component is now the only writer; a commit just says "now".

    it('signals rather than writing when lesson_status is completed', () => {
      const commits: number[] = []
      service.progressCommitted$.subscribe(() => commits.push(1))
      service.LMSInitialize()
      service.LMSSetValue('cmi.core.lesson_status', 'completed')

      service.LMSCommit()

      expect(commits.length).toBe(1)
      httpMock.expectNone(updateUrl(CONTENT_A))
    })

    it('signals while the content is still incomplete too, so bookmarks are saved', () => {
      const commits: number[] = []
      service.progressCommitted$.subscribe(() => commits.push(1))
      service.LMSInitialize()
      service.LMSSetValue('cmi.core.lesson_status', 'incomplete')

      service.LMSCommit()

      expect(commits.length).toBe(1)
      httpMock.expectNone(updateUrl(CONTENT_A))
    })

    it('reports success to the package, which a conformant driver checks', () => {
      service.LMSInitialize()
      service.LMSSetValue('cmi.core.lesson_status', 'completed')

      expect(service.LMSCommit()).toBe(true)
    })

    it('repeated commits never turn into repeated requests', () => {
      service.LMSInitialize()
      service.LMSSetValue('cmi.core.lesson_status', 'completed')

      service.LMSCommit()
      service.LMSCommit()
      service.LMSCommit()

      httpMock.expectNone(updateUrl(CONTENT_A))
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

    it('lets the completion update through when the caller forces it', () => {
      // The mobile route hands running state to the app, but writes completion itself: a
      // completion that only exists as a hand-off is lost if the webview dies first.
      service.suppressProgressApi = true

      service.addDataV3(progressReq(2, 100), CONTENT_A, true).subscribe()

      const req = httpMock.expectOne(updateUrl(CONTENT_A))
      const content = req.request.body.request.contents[0]
      expect(content.status).toBe(2)
      expect(content.completionPercentage).toBe(100)
      req.flush({})
    })

    it('still suppresses an unforced update after a forced one', () => {
      service.suppressProgressApi = true

      service.addDataV3(progressReq(2, 100), CONTENT_A, true).subscribe()
      httpMock.expectOne(updateUrl(CONTENT_A)).flush({})

      service.addDataV3(progressReq(1, 40), CONTENT_A).subscribe()
      httpMock.expectNone(updateUrl(CONTENT_A))
    })

    it('stops LMSCommit from issuing a request even at a completed status', () => {
      service.suppressProgressApi = true
      service.LMSInitialize()
      service.LMSSetValue('cmi.core.lesson_status', 'completed')

      service.LMSCommit()

      httpMock.expectNone(updateUrl(CONTENT_A))
    })

    it('makes no difference to LMSCommit, which never writes either way', () => {
      service.suppressProgressApi = false
      service.LMSInitialize()
      service.LMSSetValue('cmi.core.lesson_status', 'completed')

      service.LMSCommit()

      httpMock.expectNone(updateUrl(CONTENT_A))
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

    it('signals the hand-off from LMSFinish, and keeps the store so the status survives', () => {
      service.suppressProgressApi = true
      let dataAtCommit: any = null
      service.progressCommitted$.subscribe(() => { dataAtCommit = { ...(store.getAll() as any) } })
      service.LMSInitialize()
      service.LMSSetValue('cmi.suspend_data', 'slide=7')
      service.LMSSetValue('cmi.core.lesson_status', 'completed')

      service.LMSFinish()

      expect(dataAtCommit).not.toBeNull()
      expect(dataAtCommit['cmi.suspend_data']).toBe('slide=7')
      // The CMI store is the only copy on this route - clearing it would lose completion,
      // because the driver only writes lesson_status when the learner reaches the end.
      expect(store.getItem('cmi.core.lesson_status')).toBe('completed')
      expect(service.getStatus(store.getAll())).toBe(2)
    })

    it('a resumed session can still read back the completion the driver relies on', () => {
      service.suppressProgressApi = true
      service.LMSInitialize()
      service.LMSSetValue('cmi.core.lesson_status', 'completed')
      service.LMSFinish()

      // next launch: the driver calls LMSInitialize then reads the status back
      service.LMSInitialize()
      expect(service.LMSGetValue('cmi.core.lesson_status')).toBe('completed')
    })

    it('signals progressCommitted$ on the API path too - the component writes either way', () => {
      service.suppressProgressApi = false
      const commits: number[] = []
      service.progressCommitted$.subscribe(() => commits.push(1))
      service.LMSInitialize()
      service.LMSSetValue('cmi.core.lesson_status', 'completed')

      service.LMSCommit()

      expect(commits.length).toBe(1)
      httpMock.expectNone(updateUrl(CONTENT_A))
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

    it('restores CMI fields into the store and emits LMSPositive', () => {
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
      // The package's own localStorage keys are neither restored nor kept.
      expect(localStorage.getItem('slide-bookmark')).toBeNull()
      expect(localStorage.getItem('quiz-state')).toBeNull()
      expect(emitted).toEqual([scormLMSStatus.LMSPositive])
    })

    // The component clears the CMI store at teardown, so this read is the only thing that
    // puts the server's view back - including for a record that carries no progressdetails.
    it('restores completion bookkeeping from a record with no progressdetails', () => {
      service.loadDataV2()

      httpMock.expectOne(readUrl()).flush({
        result: { contentList: [{ contentId: CONTENT_A, status: 2, completionPercentage: 100 }] },
      })

      expect(store.getItem('completionStatus')).toBe(2)
      expect(store.getItem('completionPercentage')).toBe(100)
    })

    it('leaves another content\'s record alone', () => {
      service.loadDataV2()

      httpMock.expectOne(readUrl()).flush({
        result: { contentList: [{ contentId: CONTENT_B, status: 2, completionPercentage: 100 }] },
      })

      expect(store.getAll()).toBeNull()
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
    })

    it('ignores a scormLocalStorage bucket left by an older build, restoring only CMI', () => {
      service.loadDataV2()
      httpMock.expectOne(readUrl()).flush(progressResponse(CONTENT_A, {
        spentTime: 12,
        scormData: { 'cmi.suspend_data': 'slide=4' },
        scormLocalStorage: { 'rise-bookmark': '4', 'quiz-state': '{"q1":true}' },
      }))

      expect(store.getItem('cmi.suspend_data')).toBe('slide=4')
      // Not written back to localStorage, and not allowed to pollute the CMI store either.
      expect(localStorage.getItem('rise-bookmark')).toBeNull()
      expect(localStorage.getItem('quiz-state')).toBeNull()
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

    it('LEGACY: drops non-CMI keys inside scormData instead of restoring them', () => {
      // Before the split, scormData was the bucket for a package's own localStorage.
      const emitted: scormLMSStatus[] = []
      service.scormInitialized$.subscribe(v => emitted.push(v))

      service.loadDataV2()
      httpMock.expectOne(readUrl()).flush(progressResponse(CONTENT_A, {
        spentTime: 30,
        scormData: { 'rise-bookmark': '7', 'progress-map': '{"a":1}' },
      }))

      expect(localStorage.getItem('rise-bookmark')).toBeNull()
      expect(localStorage.getItem('progress-map')).toBeNull()
      expect(store.getItem('rise-bookmark')).toBeUndefined()
      // Nothing resumable was found, so the player must not claim there was.
      expect(emitted).toEqual([scormLMSStatus.LMSNegative])
    })

    it('LEGACY: splits a mixed scormData bucket by key, keeping the CMI and dropping the rest', () => {
      service.loadDataV2()
      httpMock.expectOne(readUrl()).flush(progressResponse(CONTENT_A, {
        scormData: { 'cmi.suspend_data': 'slide=9', 'rise-bookmark': '9' },
      }))

      expect(store.getItem('cmi.suspend_data')).toBe('slide=9')
      expect(localStorage.getItem('rise-bookmark')).toBeNull()
      expect(localStorage.getItem('cmi.suspend_data')).toBeNull()
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
