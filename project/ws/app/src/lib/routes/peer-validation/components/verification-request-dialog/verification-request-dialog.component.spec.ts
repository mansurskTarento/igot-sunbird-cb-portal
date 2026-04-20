import { of, Subject } from 'rxjs'
import { VerificationRequestDialogComponent } from './verification-request-dialog.component'

const makeData = (overrides = {}) => ({
  requestedName: 'John Doe',
  courseName: 'My Course',
  formId: 'form1',
  isReviewSubmitted: false,
  surveyEndDate: '2027-12-31',
  notificationId: 'notif1',
  createdAt: '2024-01-01',
  contextId: 'ctx1',
  submittedBy: 'user1',
  ...overrides,
})

describe('VerificationRequestDialogComponent', () => {
  let component: VerificationRequestDialogComponent
  let dialogRefMock: any
  let routerMock: any
  let peerValidationServiceMock: any

  beforeEach(() => {
    dialogRefMock = { close: jest.fn() }
    routerMock = { navigate: jest.fn() }
    peerValidationServiceMock = {
      dashboardRefresh$: new Subject<void>(),
      markNotificationIgnored: jest.fn().mockReturnValue(of({})),
    }
    component = new VerificationRequestDialogComponent(
      dialogRefMock,
      makeData(),
      routerMock,
      peerValidationServiceMock
    )
  })

  // ─── onYes ────────────────────────────────────────────────────────────────

  describe('onYes', () => {
    it('should close the dialog', () => {
      component.onYes()
      expect(dialogRefMock.close).toHaveBeenCalled()
    })

    it('should navigate to review page with correct query params', () => {
      component.onYes()
      expect(routerMock.navigate).toHaveBeenCalledWith(
        ['/app/peer-validation/review', 'form1'],
        expect.objectContaining({
          queryParams: expect.objectContaining({
            formId: 'form1',
            courseName: 'My Course',
            requestedName: 'John Doe',
            submittedBy: 'user1',
            courseId: 'ctx1',
            notificationId: 'notif1',
            surveyEndDate: '2027-12-31',
            createdAt: '2024-01-01',
          }),
        })
      )
    })

    it('should pass router state with all fields', () => {
      component.onYes()
      const call = routerMock.navigate.mock.calls[0][1]
      expect(call.state).toEqual(
        expect.objectContaining({
          requestedName: 'John Doe',
          formId: 'form1',
          isReviewSubmitted: false,
        })
      )
    })

    it('should handle empty optional fields gracefully', () => {
      component = new VerificationRequestDialogComponent(
        dialogRefMock,
        makeData({ notificationId: '', createdAt: '', surveyEndDate: '' }),
        routerMock,
        peerValidationServiceMock
      )
      component.onYes()
      const qp = routerMock.navigate.mock.calls[0][1].queryParams
      expect(qp.notificationId).toBe('')
      expect(qp.surveyEndDate).toBe('')
    })
  })

  // ─── onNoButton ───────────────────────────────────────────────────────────

  describe('onNoButton', () => {
    it('should call markNotificationIgnored when notificationId and createdAt are set', () => {
      component.onNoButton()
      expect(peerValidationServiceMock.markNotificationIgnored).toHaveBeenCalledWith('notif1', '2024-01-01')
    })

    it('should emit dashboardRefresh$ and close with "ignored" on success', () => {
      const refreshSpy = jest.spyOn(peerValidationServiceMock.dashboardRefresh$, 'next')
      component.onNoButton()
      expect(refreshSpy).toHaveBeenCalled()
      expect(dialogRefMock.close).toHaveBeenCalledWith('ignored')
    })

    it('should close without argument on markNotificationIgnored error', () => {
      peerValidationServiceMock.markNotificationIgnored.mockImplementation(() => ({
        subscribe: ({ error }: any) => error(new Error('fail')),
      }))
      component.onNoButton()
      expect(dialogRefMock.close).toHaveBeenCalledWith()
    })

    it('should close without argument when notificationId is empty', () => {
      component = new VerificationRequestDialogComponent(
        dialogRefMock,
        makeData({ notificationId: '' }),
        routerMock,
        peerValidationServiceMock
      )
      component.onNoButton()
      expect(peerValidationServiceMock.markNotificationIgnored).not.toHaveBeenCalled()
      expect(dialogRefMock.close).toHaveBeenCalledWith()
    })

    it('should close without argument when createdAt is empty', () => {
      component = new VerificationRequestDialogComponent(
        dialogRefMock,
        makeData({ createdAt: '' }),
        routerMock,
        peerValidationServiceMock
      )
      component.onNoButton()
      expect(dialogRefMock.close).toHaveBeenCalledWith()
    })
  })

  // ─── onNo ────────────────────────────────────────────────────────────────

  describe('onNo', () => {
    it('should close the dialog', () => {
      component.onNo()
      expect(dialogRefMock.close).toHaveBeenCalled()
    })

    it('should NOT call markNotificationIgnored', () => {
      component.onNo()
      expect(peerValidationServiceMock.markNotificationIgnored).not.toHaveBeenCalled()
    })

    it('should NOT navigate', () => {
      component.onNo()
      expect(routerMock.navigate).not.toHaveBeenCalled()
    })
  })

  // ─── data exposure ────────────────────────────────────────────────────────

  describe('data', () => {
    it('should expose injected data publicly', () => {
      expect(component.data.requestedName).toBe('John Doe')
      expect(component.data.courseName).toBe('My Course')
    })
  })

  // ─── onYes – OR-fallback branches ─────────────────────────────────────────

  describe('onYes – null/undefined field fallbacks', () => {
    it('should use empty string for courseName when it is null', () => {
      component = new VerificationRequestDialogComponent(
        dialogRefMock,
        makeData({ courseName: null as any }),
        routerMock,
        peerValidationServiceMock
      )
      component.onYes()
      const qp = routerMock.navigate.mock.calls[0][1].queryParams
      expect(qp.courseName).toBe('')
    })

    it('should use empty string for requestedName when it is null', () => {
      component = new VerificationRequestDialogComponent(
        dialogRefMock,
        makeData({ requestedName: null as any }),
        routerMock,
        peerValidationServiceMock
      )
      component.onYes()
      const qp = routerMock.navigate.mock.calls[0][1].queryParams
      expect(qp.requestedName).toBe('')
    })

    it('should use empty string for submittedBy when it is null', () => {
      component = new VerificationRequestDialogComponent(
        dialogRefMock,
        makeData({ submittedBy: null as any }),
        routerMock,
        peerValidationServiceMock
      )
      component.onYes()
      const qp = routerMock.navigate.mock.calls[0][1].queryParams
      expect(qp.submittedBy).toBe('')
    })

    it('should use empty string for courseId when contextId is null', () => {
      component = new VerificationRequestDialogComponent(
        dialogRefMock,
        makeData({ contextId: null as any }),
        routerMock,
        peerValidationServiceMock
      )
      component.onYes()
      const qp = routerMock.navigate.mock.calls[0][1].queryParams
      expect(qp.courseId).toBe('')
    })
  })
})
