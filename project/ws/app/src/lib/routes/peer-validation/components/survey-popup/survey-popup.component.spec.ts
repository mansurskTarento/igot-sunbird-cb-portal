import { of, Subject } from 'rxjs'
import { SurveyPopupComponent } from './survey-popup.component'
import { NSPeerValidation } from '../../models/peer-validation.model'

const makeSurveyData = (overrides: Partial<NSPeerValidation.ISurveyPopupData> = {}): NSPeerValidation.ISurveyPopupData => ({
  learnerName: 'Alice',
  courseName: 'Angular Basics',
  completionDate: '2024-01-10',
  formId: 'form1',
  contextId: 'ctx1',
  contextOrgId: 'org1',
  notificationId: 'notif1',
  createdAt: '2024-01-01',
  thumbnail: '',
  ...overrides,
})

describe('SurveyPopupComponent', () => {
  let component: SurveyPopupComponent
  let dialogRefMock: any
  let dialogMock: any
  let peerValidationServiceMock: any

  beforeEach(() => {
    dialogRefMock = { close: jest.fn() }
    dialogMock = {
      open: jest.fn().mockReturnValue({ afterClosed: () => of(null) }),
    }
    peerValidationServiceMock = {
      dashboardRefresh$: new Subject<void>(),
      markNotificationIgnored: jest.fn().mockReturnValue(of({})),
    }

    component = new SurveyPopupComponent(
      dialogRefMock,
      makeSurveyData(),
      dialogMock,
      peerValidationServiceMock
    )
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  // ─── onYes ────────────────────────────────────────────────────────────────

  describe('onYes', () => {
    it('should open SurveyDialogComponent with correct config', () => {
      component.onYes()
      expect(dialogMock.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          width: '1100px',
          disableClose: true,
          data: component.data,
        })
      )
    })

    it('should close the popup dialog', () => {
      component.onYes()
      expect(dialogRefMock.close).toHaveBeenCalled()
    })
  })

  // ─── onNoButton (with notificationId + createdAt) ─────────────────────────

  describe('onNoButton – with valid notification', () => {
    it('should call markNotificationIgnored with correct args', () => {
      component.onNoButton()
      expect(peerValidationServiceMock.markNotificationIgnored).toHaveBeenCalledWith('notif1', '2024-01-01')
    })

    it('should emit dashboardRefresh$ on success', () => {
      const refreshSpy = jest.spyOn(peerValidationServiceMock.dashboardRefresh$, 'next')
      component.onNoButton()
      expect(refreshSpy).toHaveBeenCalled()
    })

    it('should close the dialog with "ignored" on success', () => {
      component.onNoButton()
      expect(dialogRefMock.close).toHaveBeenCalledWith('ignored')
    })

    it('should close the dialog (no args) on API error', () => {
      peerValidationServiceMock.markNotificationIgnored.mockImplementation(() => ({
        subscribe: ({ error }: any) => error(new Error('API error')),
      }))
      component.onNoButton()
      expect(dialogRefMock.close).toHaveBeenCalledWith()
    })
  })

  // ─── onNoButton (missing notificationId / createdAt) ─────────────────────

  describe('onNoButton – without notification data', () => {
    it('should close dialog without calling markNotificationIgnored', () => {
      // Create component with no notificationId
      const comp = new SurveyPopupComponent(
        dialogRefMock,
        makeSurveyData({ notificationId: undefined, createdAt: undefined }),
        dialogMock,
        peerValidationServiceMock
      )
      comp.onNoButton()
      expect(peerValidationServiceMock.markNotificationIgnored).not.toHaveBeenCalled()
      expect(dialogRefMock.close).toHaveBeenCalled()
    })

    it('should close dialog when notificationId is empty string', () => {
      const comp = new SurveyPopupComponent(
        dialogRefMock,
        makeSurveyData({ notificationId: '', createdAt: '' }),
        dialogMock,
        peerValidationServiceMock
      )
      comp.onNoButton()
      expect(dialogRefMock.close).toHaveBeenCalled()
      expect(peerValidationServiceMock.markNotificationIgnored).not.toHaveBeenCalled()
    })
  })

  // ─── onNo ─────────────────────────────────────────────────────────────────

  describe('onNo', () => {
    it('should close the dialog', () => {
      component.onNo()
      expect(dialogRefMock.close).toHaveBeenCalled()
    })

    it('should NOT call markNotificationIgnored', () => {
      component.onNo()
      expect(peerValidationServiceMock.markNotificationIgnored).not.toHaveBeenCalled()
    })
  })
})
