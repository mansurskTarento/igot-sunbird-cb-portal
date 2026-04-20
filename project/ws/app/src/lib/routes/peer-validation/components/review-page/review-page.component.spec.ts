import { of, throwError, Subject } from 'rxjs'
import { ReviewPageComponent } from './review-page.component'
import { NSPeerValidation } from '../../models/peer-validation.model'

// ─── helpers ─────────────────────────────────────────────────────────────────

const makeReviewRequest = (overrides: Partial<NSPeerValidation.IReviewRequest> = {}): NSPeerValidation.IReviewRequest => ({
  submissionId: 'sub1',
  formId: 'form1',
  submittedBy: 'user1',
  learnerName: 'Alice',
  courseName: 'Test Course',
  completionDate: '2024-01-15',
  contextId: 'ctx1',
  contextOrgId: 'org1',
  status: 'PENDING',
  responses: [],
  attachments: [],
  ...overrides,
})

const makeQueryParams = (overrides: Record<string, string> = {}) => ({
  requestedName: 'John Doe',
  courseName: 'My Course',
  formId: 'form1',
  submittedBy: 'user1',
  courseId: 'course1',
  notificationId: 'notif1',
  createdAt: '2024-01-01',
  surveyEndDate: '',
  ...overrides,
})

// ─── test suite ──────────────────────────────────────────────────────────────

describe('ReviewPageComponent', () => {
  let component: ReviewPageComponent
  let routeMock: any
  let routerMock: any
  let locationMock: any
  let peerValidationServiceMock: any
  let dialogMock: any
  let snackBarMock: any

  beforeEach(() => {
    routeMock = {
      snapshot: {
        queryParams: makeQueryParams(),
        paramMap: { get: jest.fn().mockReturnValue('review1') },
      },
    }
    routerMock = {
      getCurrentNavigation: jest.fn().mockReturnValue(null),
      navigate: jest.fn(),
      serializeUrl: jest.fn().mockReturnValue('/app/peer-validation'),
      createUrlTree: jest.fn().mockReturnValue({}),
    }
    locationMock = { back: jest.fn() }
    peerValidationServiceMock = {
      dashboardRefresh$: new Subject<void>(),
      getSubmission: jest.fn().mockReturnValue(of(makeReviewRequest())),
      submitReview: jest.fn().mockReturnValue(of({ result: 'ok' })),
    }
    dialogMock = {
      open: jest.fn().mockReturnValue({ afterClosed: () => of(null) }),
    }
    snackBarMock = { open: jest.fn() }

    component = new ReviewPageComponent(
      routeMock,
      routerMock,
      locationMock,
      peerValidationServiceMock,
      dialogMock,
      snackBarMock
    )
  })

  // ─── ngOnInit ──────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('should populate fields from queryParams', () => {
      component.ngOnInit()
      expect(component.requestedName).toBe('John Doe')
      expect(component.courseName).toBe('My Course')
      expect(component.formId).toBe('form1')
      expect(component.submittedBy).toBe('user1')
      expect(component.notificationId).toBe('notif1')
    })

    it('should set requestId from paramMap', () => {
      component.ngOnInit()
      expect(component.requestId).toBe('review1')
    })

    it('should call fetchSubmission when submittedBy and formId are present', () => {
      component.ngOnInit()
      expect(peerValidationServiceMock.getSubmission).toHaveBeenCalledWith('user1', 'form1', 'course1')
    })

    it('should NOT call fetchSubmission when submittedBy is absent', () => {
      routeMock.snapshot.queryParams = makeQueryParams({ submittedBy: '' })
      component.ngOnInit()
      expect(peerValidationServiceMock.getSubmission).not.toHaveBeenCalled()
    })

    it('should NOT call fetchSubmission when formId is absent', () => {
      routeMock.snapshot.queryParams = makeQueryParams({ formId: '' })
      component.ngOnInit()
      expect(peerValidationServiceMock.getSubmission).not.toHaveBeenCalled()
    })

    it('should show snackBar and go back when surveyEndDate is in the past', () => {
      routeMock.snapshot.queryParams = makeQueryParams({ surveyEndDate: '2020-01-01' })
      component.ngOnInit()
      expect(snackBarMock.open).toHaveBeenCalledWith('Survey has ended.', 'X', { duration: 3000 })
      expect(locationMock.back).toHaveBeenCalled()
      // fetchSubmission should NOT be called after early return
      expect(peerValidationServiceMock.getSubmission).not.toHaveBeenCalled()
    })

    it('should use router navigation state as fallback', () => {
      routeMock.snapshot.queryParams = {}
      routerMock.getCurrentNavigation.mockReturnValue({
        extras: { state: { requestedName: 'State User', formId: 'stateForm', submittedBy: 'stateUser', courseName: 'State Course' } },
      })
      component.ngOnInit()
      expect(component.requestedName).toBe('State User')
      expect(component.formId).toBe('stateForm')
    })

    it('should fall back to empty object when getCurrentNavigation returns null', () => {
      routeMock.snapshot.queryParams = { requestedName: 'QueryUser', formId: 'qForm' }
      routerMock.getCurrentNavigation.mockReturnValue(null)
      component.ngOnInit()
      expect(component.requestedName).toBe('QueryUser')
    })

    it('should read isReviewSubmitted from state', () => {
      routeMock.snapshot.queryParams = {}
      routerMock.getCurrentNavigation.mockReturnValue({
        extras: { state: { isReviewSubmitted: true } },
      })
      component.ngOnInit()
      expect(component.isReviewSubmitted).toBe(true)
    })
  })

  // ─── fetchSubmission ──────────────────────────────────────────────────────

  describe('fetchSubmission', () => {
    it('should populate requestData on success', () => {
      component.fetchSubmission('user1', 'form1', 'ctx1')
      expect(component.requestData).not.toBeNull()
      expect(component.requestData!.submissionId).toBe('sub1')
      expect(component.isLoadingSubmission).toBe(false)
    })

    it('should update courseName and requestedName from data if not set', () => {
      component.courseName = null
      component.requestedName = null
      component.fetchSubmission('user1', 'form1', 'ctx1')
      expect(component.courseName).toBe('Test Course')
      expect(component.requestedName).toBe('Alice')
    })

    it('should NOT overwrite existing courseName', () => {
      component.courseName = 'Existing Course'
      component.fetchSubmission('user1', 'form1', 'ctx1')
      expect(component.courseName).toBe('Existing Course')
    })

    it('should not set requestData when response is null', () => {
      peerValidationServiceMock.getSubmission.mockReturnValue(of(null))
      component.fetchSubmission('user1', 'form1', 'ctx1')
      expect(component.requestData).toBeNull()
    })

    it('should set isLoadingSubmission false on error', () => {
      peerValidationServiceMock.getSubmission.mockReturnValue(throwError(() => new Error('Network error')))
      component.isLoadingSubmission = true
      component.fetchSubmission('user1', 'form1', 'ctx1')
      expect(component.isLoadingSubmission).toBe(false)
    })

    it('should leave courseName null when data.courseName is absent', () => {
      component.courseName = null
      peerValidationServiceMock.getSubmission.mockReturnValue(of({ submissionId: 's1', courseName: null, learnerName: 'Bob' } as any))
      component.fetchSubmission('u1', 'f1', 'c1')
      expect(component.courseName).toBeNull()
    })

    it('should leave requestedName null when data.learnerName is absent', () => {
      component.requestedName = null
      peerValidationServiceMock.getSubmission.mockReturnValue(of({ submissionId: 's1', courseName: 'C', learnerName: null } as any))
      component.fetchSubmission('u1', 'f1', 'c1')
      expect(component.requestedName).toBeNull()
    })
  })

  // ─── attachment helpers ───────────────────────────────────────────────────

  describe('getAttachmentName', () => {
    it('should extract filename from URL path', () => {
      expect(component.getAttachmentName('http://cdn.test/docs/report.pdf')).toBe('report.pdf')
    })

    it('should strip query string from filename', () => {
      expect(component.getAttachmentName('http://cdn.test/file.pdf?token=abc')).toBe('file.pdf')
    })

    it('should return original URL when no segments', () => {
      expect(component.getAttachmentName('report.pdf')).toBe('report.pdf')
    })
  })

  describe('isPdf', () => {
    it('should return true for .pdf URL', () => {
      expect(component.isPdf('http://cdn.test/file.pdf')).toBe(true)
    })
    it('should return true for .pdf URL with query string', () => {
      expect(component.isPdf('http://cdn.test/file.pdf?v=1')).toBe(true)
    })
    it('should return false for non-pdf URL', () => {
      expect(component.isPdf('http://cdn.test/file.mp4')).toBe(false)
    })
  })

  describe('isVideo', () => {
    it('should return true for .mp4', () => { expect(component.isVideo('video.mp4')).toBe(true) })
    it('should return true for .webm', () => { expect(component.isVideo('video.webm')).toBe(true) })
    it('should return true for .ogg', () => { expect(component.isVideo('video.ogg')).toBe(true) })
    it('should return true for .mov', () => { expect(component.isVideo('video.mov')).toBe(true) })
    it('should return false for .pdf', () => { expect(component.isVideo('file.pdf')).toBe(false) })
  })

  describe('isImage', () => {
    it('should return true for .png', () => { expect(component.isImage('img.png')).toBe(true) })
    it('should return true for .jpg', () => { expect(component.isImage('img.jpg')).toBe(true) })
    it('should return true for .jpeg', () => { expect(component.isImage('img.jpeg')).toBe(true) })
    it('should return true for .gif', () => { expect(component.isImage('img.gif')).toBe(true) })
    it('should return true for .webp', () => { expect(component.isImage('img.webp')).toBe(true) })
    it('should return false for .mp4', () => { expect(component.isImage('video.mp4')).toBe(false) })
  })

  describe('openAttachment', () => {
    it('should call window.open with _blank', () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
      component.openAttachment('http://cdn.test/file.pdf')
      expect(openSpy).toHaveBeenCalledWith('http://cdn.test/file.pdf', '_blank')
      openSpy.mockRestore()
    })
  })

  // ─── navigation helpers ───────────────────────────────────────────────────

  describe('goBack', () => {
    it('should call clearHistoryStateAndGoBack', () => {
      component.goBack()
      expect(locationMock.back).toHaveBeenCalled()
    })
  })

  describe('clearHistoryStateAndGoBack', () => {
    it('should call location.back', () => {
      component.clearHistoryStateAndGoBack()
      expect(locationMock.back).toHaveBeenCalled()
    })

    it('should call router.serializeUrl and router.createUrlTree', () => {
      component.clearHistoryStateAndGoBack()
      expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/app/peer-validation'])
      expect(routerMock.serializeUrl).toHaveBeenCalled()
    })
  })

  // ─── submitDecision ───────────────────────────────────────────────────────

  describe('submitDecision', () => {
    beforeEach(() => {
      component.requestData = makeReviewRequest({ submissionId: 'sub1' })
      component.notificationId = 'notif1'
      component.createdAt = '2024-01-01'
    })

    it('should show snackBar and return when submissionId is absent', () => {
      component.requestData = null
      component.notificationId = null
      component.submitDecision('APPROVED')
      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Missing submission or notification details.', 'X', { duration: 3000 }
      )
      expect(peerValidationServiceMock.submitReview).not.toHaveBeenCalled()
    })

    it('should show snackBar when notificationId is absent', () => {
      component.notificationId = null
      component.submitDecision('APPROVED')
      expect(snackBarMock.open).toHaveBeenCalled()
    })

    it('should call submitReview with correct payload on APPROVED', () => {
      component.submitDecision('APPROVED')
      expect(peerValidationServiceMock.submitReview).toHaveBeenCalledWith({
        actionType: 'REVIEW',
        submissionId: 'sub1',
        reviewStatus: 'APPROVED',
        notificationId: 'notif1',
        createdAt: '2024-01-01',
      })
    })

    it('should call submitReview with REJECTED', () => {
      component.submitDecision('REJECTED')
      expect(peerValidationServiceMock.submitReview).toHaveBeenCalledWith(
        expect.objectContaining({ reviewStatus: 'REJECTED' })
      )
    })

    it('should emit dashboardRefresh$ and open SuccessDialog on success', () => {
      const refreshSpy = jest.spyOn(peerValidationServiceMock.dashboardRefresh$, 'next')
      component.submitDecision('APPROVED')
      expect(refreshSpy).toHaveBeenCalled()
      expect(dialogMock.open).toHaveBeenCalled()
    })

    it('should navigate back after SuccessDialog closes', () => {
      component.submitDecision('APPROVED')
      // afterClosed emits synchronously via of(null), so location.back is called
      expect(locationMock.back).toHaveBeenCalled()
    })

    it('should show snackBar when response has failed status', () => {
      peerValidationServiceMock.submitReview.mockReturnValue(
        of({ params: { status: 'failed', errMsg: 'Review failed' } })
      )
      component.submitDecision('APPROVED')
      expect(snackBarMock.open).toHaveBeenCalledWith('Review failed', 'X', { duration: 4000 })
    })

    it('should show snackBar when responseCode is BAD_REQUEST', () => {
      peerValidationServiceMock.submitReview.mockReturnValue(
        of({ responseCode: 'BAD_REQUEST', params: {} })
      )
      component.submitDecision('APPROVED')
      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Failed to submit review. Please try again.', 'X', { duration: 4000 }
      )
    })

    it('should show snackBar on HTTP error', () => {
      // Bypass zone.js by using a fake subscribe that directly invokes the error callback
      peerValidationServiceMock.submitReview.mockImplementation(() => ({
        subscribe: ({ error }: any) => error({ error: { params: { errMsg: 'Server down' } } }),
      }))
      component.submitDecision('APPROVED')
      expect(snackBarMock.open).toHaveBeenCalledWith('Server down', 'X', { duration: 4000 })
    })

    it('should show default message when error has no errMsg', () => {
      peerValidationServiceMock.submitReview.mockReturnValue(throwError(() => ({})))
      component.submitDecision('APPROVED')
      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Failed to submit review. Please try again.', 'X', { duration: 4000 }
      )
    })
  })

  // ─── approve / reject ─────────────────────────────────────────────────────

  describe('approve', () => {
    it('should call submitDecision with APPROVED', () => {
      component.requestData = makeReviewRequest()
      component.notificationId = 'n1'
      component.approve()
      expect(peerValidationServiceMock.submitReview).toHaveBeenCalledWith(
        expect.objectContaining({ reviewStatus: 'APPROVED' })
      )
    })
  })

  describe('reject', () => {
    it('should call submitDecision with REJECTED', () => {
      component.requestData = makeReviewRequest()
      component.notificationId = 'n1'
      component.reject()
      expect(peerValidationServiceMock.submitReview).toHaveBeenCalledWith(
        expect.objectContaining({ reviewStatus: 'REJECTED' })
      )
    })
  })

  // ─── getCheckboxItems ─────────────────────────────────────────────────────

  describe('getCheckboxItems', () => {
    it('should return array as-is when input is already an array', () => {
      expect(component.getCheckboxItems(['A', 'B'] as any)).toEqual(['A', 'B'])
    })

    it('should split comma-separated string', () => {
      expect(component.getCheckboxItems('A, B, C')).toEqual(['A', 'B', 'C'])
    })

    it('should return empty array for empty string', () => {
      expect(component.getCheckboxItems('')).toEqual([])
    })

    it('should return empty array for whitespace-only string', () => {
      expect(component.getCheckboxItems('   ')).toEqual([])
    })

    it('should filter empty items from array', () => {
      expect(component.getCheckboxItems(['A', '', 'B'] as any)).toEqual(['A', 'B'])
    })
  })

  // ─── getRange ─────────────────────────────────────────────────────────────

  describe('getRange', () => {
    it('should return array [1..n]', () => {
      expect(component.getRange(5)).toEqual([1, 2, 3, 4, 5])
    })

    it('should return empty array for 0', () => {
      expect(component.getRange(0)).toEqual([])
    })
  })

  // ─── formatFileSize ───────────────────────────────────────────────────────

  describe('formatFileSize', () => {
    it('should return bytes for < 1024', () => {
      expect(component.formatFileSize(512)).toBe('512 B')
    })

    it('should return KB for < 1 MB', () => {
      expect(component.formatFileSize(2048)).toBe('2.0 KB')
    })

    it('should return MB for >= 1 MB', () => {
      expect(component.formatFileSize(1048576)).toBe('1.0 MB')
    })
  })

  // ─── previewDocument ──────────────────────────────────────────────────────

  describe('previewDocument', () => {
    it('should open VideoPreviewDialogComponent for PDF URL', () => {
      component.previewDocument('http://cdn.test/report.pdf')
      expect(dialogMock.open).toHaveBeenCalled()
    })

    it('should open VideoPreviewDialogComponent for video URL', () => {
      component.previewDocument('http://cdn.test/video.mp4')
      expect(dialogMock.open).toHaveBeenCalled()
    })

    it('should call window.open for unsupported type (e.g. image URL)', () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
      component.previewDocument('http://cdn.test/img.png')
      expect(openSpy).toHaveBeenCalledWith('http://cdn.test/img.png', '_blank')
      openSpy.mockRestore()
    })

    it('should call window.open for generic unsupported URL', () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
      component.previewDocument('http://cdn.test/file.zip')
      expect(openSpy).toHaveBeenCalledWith('http://cdn.test/file.zip', '_blank')
      openSpy.mockRestore()
    })
  })
})
