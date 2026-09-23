import { MandatoryNotificationModalComponent } from './mandatory-notification-modal.component'

// MandatoryNotificationModalComponent uses plain constructor injection, so it can be
// instantiated directly with mocked dependencies — no TestBed needed. The previous
// TestBed-based spec failed with NG0201 (No provider for MAT_DIALOG_DATA).
describe('MandatoryNotificationModalComponent', () => {
  let component: MandatoryNotificationModalComponent
  let mockData: any
  let mockEvents: any
  let mockDialogRef: any

  beforeEach(() => {
    mockData = {
      notification: {
        message: {
          data: {
            assessmentId: 'assessment-1',
            primaryCategory: 'Course',
          },
        },
      },
    }
    mockEvents = { raiseInteractTelemetry: jest.fn() }
    mockDialogRef = { close: jest.fn(), disableClose: false }

    component = new MandatoryNotificationModalComponent(mockData, mockEvents, mockDialogRef)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should be defined', () => {
    expect(component).toBeDefined()
  })

  it('should disable close on the dialog ref during construction', () => {
    expect(mockDialogRef.disableClose).toBe(true)
  })

  describe('onAccept', () => {
    it('should raise telemetry with accept and close the dialog with accepted', () => {
      const telemetrySpy = jest.spyOn(component, 'raiseTelemetryForShare')
      component.onAccept()
      expect(telemetrySpy).toHaveBeenCalledWith('accept')
      expect(mockDialogRef.close).toHaveBeenCalledWith('accepted')
    })
  })

  describe('onReject', () => {
    it('should raise telemetry with reject and close the dialog with rejected', () => {
      const telemetrySpy = jest.spyOn(component, 'raiseTelemetryForShare')
      component.onReject()
      expect(telemetrySpy).toHaveBeenCalledWith('reject')
      expect(mockDialogRef.close).toHaveBeenCalledWith('rejected')
    })
  })

  describe('raiseTelemetryForShare', () => {
    it('should include the assessmentId and primaryCategory when data is present', () => {
      component.raiseTelemetryForShare('accept')

      expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalledWith(
        {
          type: 'click',
          subType: 'accept',
          id: 'mandatory-notification-modal',
        },
        {
          id: 'assessment-1',
          type: 'Course',
        },
        {
          module: 'mandatory-notification',
        }
      )
    })

    it('should fall back to empty id and default category when notification data is missing', () => {
      component.data = {}
      component.raiseTelemetryForShare('reject')

      expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalledWith(
        {
          type: 'click',
          subType: 'reject',
          id: 'mandatory-notification-modal',
        },
        {
          id: '',
          type: 'Comprehensive Assessment Program',
        },
        {
          module: 'mandatory-notification',
        }
      )
    })

    it('should fall back to empty id and default category when data itself is undefined', () => {
      component.data = undefined
      component.raiseTelemetryForShare('accept')

      expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalledWith(
        expect.any(Object),
        {
          id: '',
          type: 'Comprehensive Assessment Program',
        },
        expect.any(Object)
      )
    })
  })
})
