import { ProfileVerificationDialogComponent } from './profile-verification-dialog.component'

// ProfileVerificationDialogComponent uses plain constructor injection, so it can be
// instantiated directly with mocked dependencies — no TestBed needed. The previous
// TestBed-based spec failed with NG0201 (No provider for MAT_DIALOG_DATA).
describe('ProfileVerificationDialogComponent', () => {
  let component: ProfileVerificationDialogComponent
  let mockData: any
  let mockDialogRef: any
  let mockRouter: any
  let mockConfigSvc: any

  const create = () =>
    new ProfileVerificationDialogComponent(mockData, mockDialogRef, mockRouter, mockConfigSvc)

  beforeEach(() => {
    mockData = {}
    mockDialogRef = { close: jest.fn() }
    mockRouter = { navigate: jest.fn() }
    mockConfigSvc = {}
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('constructor', () => {
    it('should lowercase the ministryOrStateType when userProfile has one set', () => {
      mockConfigSvc.userProfile = { userRootOrg: { ministryOrStateType: 'MINISTRY' } }
      component = create()

      expect(component.userOrganization).toEqual({ ministryOrStateType: 'MINISTRY' })
      expect(component.ministryOrStateType).toBe('ministry')
    })

    it('should default ministryOrStateType to spv when userRootOrg has no ministryOrStateType', () => {
      mockConfigSvc.userProfile = { userRootOrg: {} }
      component = create()

      expect(component.userOrganization).toEqual({})
      expect(component.ministryOrStateType).toBe('spv')
    })

    it('should default ministryOrStateType to spv when userRootOrg is absent', () => {
      mockConfigSvc.userProfile = {}
      component = create()

      expect(component.userOrganization).toBeUndefined()
      expect(component.ministryOrStateType).toBe('spv')
    })

    it('should leave userOrganization undefined and keep the default when userProfile is absent entirely', () => {
      mockConfigSvc.userProfile = undefined
      component = create()

      expect(component.userOrganization).toBeUndefined()
      expect(component.ministryOrStateType).toBe('spv')
    })
  })

  describe('ngOnInit', () => {
    it('should not throw', () => {
      component = create()
      expect(() => component.ngOnInit()).not.toThrow()
    })
  })

  describe('onVerify', () => {
    it('should close the dialog with a verify action', () => {
      component = create()
      component.onVerify()
      expect(mockDialogRef.close).toHaveBeenCalledWith({ action: 'verify' })
    })
  })

  describe('onUpdateProfile', () => {
    it('should close the dialog with an update action and navigate to the profile page', () => {
      component = create()
      component.onUpdateProfile()
      expect(mockDialogRef.close).toHaveBeenCalledWith({ action: 'update' })
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/person-profile'])
    })
  })

  describe('onClose', () => {
    it('should close the dialog with a close action', () => {
      component = create()
      component.onClose()
      expect(mockDialogRef.close).toHaveBeenCalledWith({ action: 'close' })
    })
  })
})
