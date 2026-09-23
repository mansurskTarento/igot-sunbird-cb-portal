import { CommonDataService } from './common-data.service'
import { of, throwError } from 'rxjs'

// CommonDataService imports UserProfileService from '@ws/app', whose real barrel
// transitively pulls in a stale @sunbird-cb/discussion-v2 bundle referencing an
// uninstalled 'ckeditor5' package. We only need the UserProfileService reference,
// which is stubbed manually below anyway, so mock the module as virtual.
jest.mock('@ws/app', () => ({
  UserProfileService: jest.fn(),
}), { virtual: true })

// CommonDataService uses plain constructor injection, so it can be instantiated
// directly with mocked dependencies — no TestBed needed. The previous spec was
// stale: it passed 5 constructor args (current constructor takes 8) and called
// methods without the now-required isPlayer argument, so it failed to compile.
describe('CommonDataService', () => {
  let service: CommonDataService
  let mockRouter: any
  let mockConfigSvc: any
  let mockUserProfileService: any
  let mockDialog: any
  let mockMatSnackBar: any
  let mockMandatoryNotificationsService: any
  let mockHttp: any
  let mockDomainConfSvc: any
  let mockLocalStorage: any

  const create = () =>
    new CommonDataService(
      mockRouter,
      mockConfigSvc,
      mockUserProfileService,
      mockDialog,
      mockMatSnackBar,
      mockMandatoryNotificationsService,
      mockHttp,
      mockDomainConfSvc
    )

  beforeEach(() => {
    mockRouter = { navigate: jest.fn() }

    mockConfigSvc = {
      unMappedUser: {
        id: 'user-123',
        rootOrgId: 'org-456',
        profileDetails: {
          personalDetails: {
            mobile: '9876543210',
            primaryEmail: 'user@example.com',
            lastProfileVerificationPromptDate: null,
          },
        },
      },
      userProfile: {
        firstName: 'John',
        lastName: 'Doe',
        rootOrgId: 'org-456',
      },
      globalConfig: {
        mandatoryPopupDuration: 7200,
        languageMap: { odisha: 'odia' },
        languageBasedContent: {
          odia: { welcomeBanner: 'odia-banner' },
          english: { welcomeBanner: 'english-banner' },
        },
      },
    }

    mockUserProfileService = {
      editProfileDetails: jest.fn().mockReturnValue(of({ result: { response: 'SUCCESS' } })),
      readOrgData: jest.fn().mockReturnValue(of({ result: { response: {} } })),
      readCustomattributeDetails: jest.fn().mockReturnValue(of({ result: { response: { customFieldValues: [] } } })),
    }

    mockDialog = { open: jest.fn() }
    mockMatSnackBar = { open: jest.fn() }

    mockMandatoryNotificationsService = {
      getMandatoryNotification: jest.fn().mockReturnValue(of(null)),
      markMandatoryAsRead: jest.fn().mockReturnValue(of({ responseCode: 'OK' })),
    }

    mockHttp = {
      get: jest.fn().mockReturnValue(of({ result: { response: { profileDetails: { additionalProperties: {} } } } })),
    }

    mockDomainConfSvc = {
      isConfigEnabled: jest.fn().mockReturnValue(true),
    }

    mockLocalStorage = { getItem: jest.fn().mockReturnValue(null), setItem: jest.fn() }
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage, writable: true, configurable: true })

    service = create()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('constructor', () => {
    it('should initialize rootOrgId from configSvc.unMappedUser', () => {
      expect(service.rootOrgId).toBe('org-456')
    })

    it('should default rootOrgId to empty string when unMappedUser is absent', () => {
      mockConfigSvc.unMappedUser = null
      const newService = create()
      expect(newService.rootOrgId).toBe('')
    })

    it('should default rootOrgId to empty string when unMappedUser.rootOrgId is absent', () => {
      mockConfigSvc.unMappedUser = { id: 'user-1' }
      const newService = create()
      expect(newService.rootOrgId).toBe('')
    })

    it('should read popupDuration from globalConfig.mandatoryPopupDuration', () => {
      expect(service.popupDuration).toBe(7200)
    })

    it('should default popupDuration to 7200 when globalConfig is absent', () => {
      mockConfigSvc.globalConfig = undefined
      const newService = create()
      expect(newService.popupDuration).toBe(7200)
    })
  })

  describe('redirectToCustomProfile', () => {
    it('should navigate to the custom profile with orgDetails fragment', () => {
      service.redirectToCustomProfile()
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/person-profile/me'], { fragment: 'orgDetails' })
    })
  })

  describe('isDialogEnabled', () => {
    it('should return true when both components.dialogs.enabled and the given key are enabled', () => {
      mockDomainConfSvc.isConfigEnabled.mockReturnValue(true)
      expect(service.isDialogEnabled('profileVerification')).toBe(true)
    })

    it('should return false when components.dialogs is disabled', () => {
      mockDomainConfSvc.isConfigEnabled.mockReturnValue(false)
      expect(service.isDialogEnabled('profileVerification')).toBe(false)
    })
  })

  describe('mandatoryDetails', () => {
    it('should skip the verification dialog and call getOrgDetails when dialog is disabled', () => {
      mockDomainConfSvc.isConfigEnabled.mockReturnValue(false)
      const getOrgDetailsSpy = jest.spyOn(service, 'getOrgDetails').mockImplementation(() => undefined)

      service.mandatoryDetails(false)

      expect(mockDialog.open).not.toHaveBeenCalled()
      expect(getOrgDetailsSpy).toHaveBeenCalledWith(false)
    })

    it('should call getOrgDetails without opening the dialog when the last prompt was recent', () => {
      const recentTime = Date.now() - 1 * 24 * 60 * 60 * 1000
      mockConfigSvc.unMappedUser.profileDetails.personalDetails.lastProfileVerificationPromptDate = recentTime.toString()
      const getOrgDetailsSpy = jest.spyOn(service, 'getOrgDetails').mockImplementation(() => undefined)

      service.mandatoryDetails(true)

      expect(mockDialog.open).not.toHaveBeenCalled()
      expect(getOrgDetailsSpy).toHaveBeenCalledWith(true)
    })

    it('should open the dialog when the last prompt is older than 90 days', () => {
      const oldTime = Date.now() - 91 * 24 * 60 * 60 * 1000
      mockConfigSvc.unMappedUser.profileDetails.personalDetails.lastProfileVerificationPromptDate = oldTime.toString()
      mockDialog.open.mockReturnValue({ afterClosed: () => of(null), close: jest.fn() })

      service.mandatoryDetails(false)

      expect(mockDialog.open).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          panelClass: 'profile-verification-dialog-container',
          disableClose: true,
          maxWidth: '95vw',
          width: '500px',
        })
      )
    })

    it('should open the dialog when lastProfileVerificationPromptDate is null', () => {
      mockConfigSvc.unMappedUser.profileDetails.personalDetails.lastProfileVerificationPromptDate = null
      mockDialog.open.mockReturnValue({ afterClosed: () => of(null), close: jest.fn() })

      service.mandatoryDetails(false)

      expect(mockDialog.open).toHaveBeenCalled()
    })

    it('should navigate to the mandatory section and close the dialog when the result action is update', () => {
      mockConfigSvc.unMappedUser.profileDetails.personalDetails.lastProfileVerificationPromptDate = null
      const dialogRefClose = jest.fn()
      mockDialog.open.mockReturnValue({ afterClosed: () => of({ action: 'update' }), close: dialogRefClose })

      service.mandatoryDetails(false)

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/app/person-profile/me'],
        { fragment: 'mandatorySection', queryParams: { source: 'mandatoryUpdate' } }
      )
      expect(dialogRefClose).toHaveBeenCalled()
    })

    it('should call callExtPatchProfile when the result action is verify', () => {
      mockConfigSvc.unMappedUser.profileDetails.personalDetails.lastProfileVerificationPromptDate = null
      mockDialog.open.mockReturnValue({ afterClosed: () => of({ action: 'verify' }), close: jest.fn() })
      const patchSpy = jest.spyOn(service, 'callExtPatchProfile').mockImplementation(() => undefined)

      service.mandatoryDetails(true)

      expect(patchSpy).toHaveBeenCalledWith(true)
    })

    it('should do nothing extra when the result has no recognized action', () => {
      mockConfigSvc.unMappedUser.profileDetails.personalDetails.lastProfileVerificationPromptDate = null
      mockDialog.open.mockReturnValue({ afterClosed: () => of({ action: 'close' }), close: jest.fn() })
      const patchSpy = jest.spyOn(service, 'callExtPatchProfile').mockImplementation(() => undefined)

      service.mandatoryDetails(false)

      expect(mockRouter.navigate).not.toHaveBeenCalled()
      expect(patchSpy).not.toHaveBeenCalled()
    })
  })

  describe('callExtPatchProfile', () => {
    it('should show a success snackbar and update lastProfileVerificationPromptDate on success with personalDetails present', () => {
      const getOrgDetailsSpy = jest.spyOn(service, 'getOrgDetails').mockImplementation(() => undefined)

      service.callExtPatchProfile(false)

      expect(mockUserProfileService.editProfileDetails).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.objectContaining({
            userId: 'user-123',
            profileDetails: expect.objectContaining({
              personalDetails: expect.objectContaining({
                lastProfileVerificationPromptDate: expect.any(String),
              }),
            }),
          }),
        })
      )
      expect(mockMatSnackBar.open).toHaveBeenCalledWith(
        'Profile verification  updated successfully', 'X', service.configSuccess
      )
      expect(mockConfigSvc.unMappedUser.profileDetails.personalDetails.lastProfileVerificationPromptDate).toEqual(expect.any(String))
      expect(getOrgDetailsSpy).toHaveBeenCalledWith(false)
    })

    it('should not throw when personalDetails is absent on success', () => {
      mockConfigSvc.unMappedUser.profileDetails = undefined
      const getOrgDetailsSpy = jest.spyOn(service, 'getOrgDetails').mockImplementation(() => undefined)

      expect(() => service.callExtPatchProfile(true)).not.toThrow()
      expect(getOrgDetailsSpy).toHaveBeenCalledWith(true)
    })

    it('should not show a snackbar and still call getOrgDetails on a non-success response', () => {
      mockUserProfileService.editProfileDetails.mockReturnValue(of({ result: { response: 'FAILED' } }))
      const getOrgDetailsSpy = jest.spyOn(service, 'getOrgDetails').mockImplementation(() => undefined)

      service.callExtPatchProfile(false)

      expect(mockMatSnackBar.open).not.toHaveBeenCalled()
      expect(getOrgDetailsSpy).toHaveBeenCalledWith(false)
    })
  })

  describe('getOrgDetails', () => {
    it('should call readCustomattributeDetails when the cached unMappedUser has popup-eligible custom fields', () => {
      mockConfigSvc.unMappedUser.rootOrg = {
        customfieldsdata: { isPopupEnabled: true, customFieldsCount: 1, customFieldIds: ['f1'] },
      }
      const readCustomSpy = jest.spyOn(service, 'readCustomattributeDetails').mockImplementation(() => undefined)

      service.getOrgDetails(false)

      expect(readCustomSpy).toHaveBeenCalledWith(false)
      expect(mockUserProfileService.readOrgData).not.toHaveBeenCalled()
    })

    it('should update player status and check mandatory notification when cached unMappedUser is not popup-eligible', () => {
      mockConfigSvc.unMappedUser.rootOrg = { customfieldsdata: { isPopupEnabled: false } }
      const updatePlayerStatusSpy = jest.spyOn(service, 'updatePlayerStatus')
      const checkSpy = jest.spyOn(service, 'checkAndShowMandatoryNotification').mockImplementation(() => undefined)

      const result = service.getOrgDetails(true)

      expect(updatePlayerStatusSpy).toHaveBeenCalledWith(true)
      expect(checkSpy).toHaveBeenCalled()
      expect(result).toBe(false)
    })

    it('should fetch org data via the API and call readCustomattributeDetails when popup-eligible', () => {
      mockConfigSvc.unMappedUser = {}
      mockUserProfileService.readOrgData.mockReturnValue(of({
        result: {
          response: {
            customfieldsdata: { isPopupEnabled: true, customFieldsCount: 1, customFieldIds: ['f1'] },
          },
        },
      }))
      const readCustomSpy = jest.spyOn(service, 'readCustomattributeDetails').mockImplementation(() => undefined)

      service.getOrgDetails(false)

      expect(mockUserProfileService.readOrgData).toHaveBeenCalledWith({ request: { organisationId: 'org-456' } })
      expect(readCustomSpy).toHaveBeenCalledWith(false)
    })

    it('should update player status and check mandatory notification via the API path when not popup-eligible', () => {
      mockConfigSvc.unMappedUser = {}
      mockUserProfileService.readOrgData.mockReturnValue(of({
        result: { response: { customfieldsdata: { isPopupEnabled: false } } },
      }))
      const updatePlayerStatusSpy = jest.spyOn(service, 'updatePlayerStatus')
      const checkSpy = jest.spyOn(service, 'checkAndShowMandatoryNotification').mockImplementation(() => undefined)

      service.getOrgDetails(false)

      expect(updatePlayerStatusSpy).toHaveBeenCalledWith(false)
      expect(checkSpy).toHaveBeenCalled()
    })

    it('should log and swallow errors from the API path', () => {
      mockConfigSvc.unMappedUser = {}
      mockUserProfileService.readOrgData.mockReturnValue(throwError(() => new Error('fail')))
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)

      expect(() => service.getOrgDetails(false)).not.toThrow()
      expect(errorSpy).toHaveBeenCalled()
    })
  })

  describe('readCustomattributeDetails', () => {
    it('should redirect to the custom profile when customFieldValues is empty', () => {
      mockUserProfileService.readCustomattributeDetails.mockReturnValue(
        of({ result: { response: { customFieldValues: [] } } })
      )
      const redirectSpy = jest.spyOn(service, 'redirectToCustomProfile').mockImplementation(() => undefined)

      service.readCustomattributeDetails(false)

      expect(mockUserProfileService.readCustomattributeDetails).toHaveBeenCalledWith('user-123', 'org-456')
      expect(redirectSpy).toHaveBeenCalled()
    })

    it('should update player status and check mandatory notification when customFieldValues is non-empty', () => {
      mockUserProfileService.readCustomattributeDetails.mockReturnValue(
        of({ result: { response: { customFieldValues: [{ id: 'f1', value: 'v1' }] } } })
      )
      const redirectSpy = jest.spyOn(service, 'redirectToCustomProfile').mockImplementation(() => undefined)
      const updatePlayerStatusSpy = jest.spyOn(service, 'updatePlayerStatus')
      const checkSpy = jest.spyOn(service, 'checkAndShowMandatoryNotification').mockImplementation(() => undefined)

      service.readCustomattributeDetails(true)

      expect(redirectSpy).not.toHaveBeenCalled()
      expect(updatePlayerStatusSpy).toHaveBeenCalledWith(true)
      expect(checkSpy).toHaveBeenCalled()
    })

    it('should log and swallow errors', () => {
      mockUserProfileService.readCustomattributeDetails.mockReturnValue(throwError(() => new Error('fail')))
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)

      expect(() => service.readCustomattributeDetails(false)).not.toThrow()
      expect(errorSpy).toHaveBeenCalled()
    })
  })

  describe('fetchMandatoryNotification', () => {
    it('should set showMandatoryNotification to false when the dialog is disabled', () => {
      mockDomainConfSvc.isConfigEnabled.mockReturnValue(false)

      service.fetchMandatoryNotification()

      expect(service.showMandatoryNotification).toBe(false)
      expect(mockMandatoryNotificationsService.getMandatoryNotification).not.toHaveBeenCalled()
    })

    it('should store the notification and open the modal for a valid unread notification', () => {
      mockMandatoryNotificationsService.getMandatoryNotification.mockReturnValue(
        of({ notification_id: 'n1', read: false })
      )
      const openModalSpy = jest.spyOn(service, 'openMandatoryNotificationModal').mockImplementation(() => undefined)

      service.fetchMandatoryNotification()

      expect(service.mandatoryNotificationData).toEqual({ notification_id: 'n1', read: false })
      expect(service.showMandatoryNotification).toBe(true)
      expect(openModalSpy).toHaveBeenCalled()
    })

    it('should keep showMandatoryNotification false when the notification is already read', () => {
      mockMandatoryNotificationsService.getMandatoryNotification.mockReturnValue(
        of({ notification_id: 'n1', read: true })
      )

      service.fetchMandatoryNotification()

      expect(service.showMandatoryNotification).toBe(false)
    })

    it('should keep showMandatoryNotification false when the response is empty', () => {
      mockMandatoryNotificationsService.getMandatoryNotification.mockReturnValue(of({}))

      service.fetchMandatoryNotification()

      expect(service.showMandatoryNotification).toBe(false)
    })

    it('should log and set showMandatoryNotification to false on error', () => {
      mockMandatoryNotificationsService.getMandatoryNotification.mockReturnValue(throwError(() => new Error('fail')))
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)

      service.fetchMandatoryNotification()

      expect(service.showMandatoryNotification).toBe(false)
      expect(errorSpy).toHaveBeenCalled()
    })
  })

  describe('openMandatoryNotificationModal', () => {
    it('should return early when the modal is already open', () => {
      service.isMandatoryModalOpen = true
      service.showMandatoryNotification = true
      service.openMandatoryNotificationModal()
      expect(mockDialog.open).not.toHaveBeenCalled()
    })

    it('should return early when showMandatoryNotification is false', () => {
      service.isMandatoryModalOpen = false
      service.showMandatoryNotification = false
      service.openMandatoryNotificationModal()
      expect(mockDialog.open).not.toHaveBeenCalled()
    })

    it('should return early when isPlayer is true', () => {
      service.showMandatoryNotification = true
      service.isPlayer = true
      service.openMandatoryNotificationModal()
      expect(mockDialog.open).not.toHaveBeenCalled()
    })

    it('should return early when the dialog is disabled', () => {
      service.showMandatoryNotification = true
      mockDomainConfSvc.isConfigEnabled.mockReturnValue(false)
      service.openMandatoryNotificationModal()
      expect(mockDialog.open).not.toHaveBeenCalled()
    })

    it('should navigate and mark as read when the result is accepted and marking succeeds', () => {
      service.showMandatoryNotification = true
      service.mandatoryNotificationData = {
        notification_id: 'n1',
        created_at: 'now',
        type: 'assessment',
        message: { data: { assessmentId: 'a1', primaryCategory: 'cat', collectionId: 'c1', collectionType: 'ct', batchId: 'b1' } },
      }
      mockDialog.open.mockReturnValue({ afterClosed: () => of('accepted') })
      mockMandatoryNotificationsService.markMandatoryAsRead.mockReturnValue(of({ responseCode: 'OK' }))

      service.openMandatoryNotificationModal()

      expect(service.isMandatoryModalOpen).toBe(false)
      expect(mockMandatoryNotificationsService.markMandatoryAsRead).toHaveBeenCalledWith({
        request: { id: 'n1', created_at: 'now', type: 'assessment' },
      })
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/viewer/practice/', 'a1'],
        { queryParams: { primaryCategory: 'cat', collectionId: 'c1', collectionType: 'ct', batchId: 'b1' } }
      )
    })

    it('should not navigate when marking as read does not respond OK', () => {
      service.showMandatoryNotification = true
      service.mandatoryNotificationData = { notification_id: 'n1', created_at: 'now', type: 'assessment' }
      mockDialog.open.mockReturnValue({ afterClosed: () => of('accepted') })
      mockMandatoryNotificationsService.markMandatoryAsRead.mockReturnValue(of({ responseCode: 'FAILED' }))

      service.openMandatoryNotificationModal()

      expect(mockRouter.navigate).not.toHaveBeenCalled()
    })

    it('should log the error and set a re-trigger timer when marking as read fails', () => {
      service.showMandatoryNotification = true
      service.mandatoryNotificationData = { notification_id: 'n1', created_at: 'now', type: 'assessment' }
      mockDialog.open.mockReturnValue({ afterClosed: () => of('accepted') })
      mockMandatoryNotificationsService.markMandatoryAsRead.mockReturnValue(throwError(() => new Error('fail')))
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)

      service.openMandatoryNotificationModal()

      expect(errorSpy).toHaveBeenCalled()
      expect(service.showMandatoryNotification).toBe(false)
      expect(service.lastNotificationActionTime).toEqual(expect.any(Number))
    })

    it('should set showMandatoryNotification to false and set a timer when the result is not accepted', () => {
      service.showMandatoryNotification = true
      service.mandatoryNotificationData = { notification_id: 'n1' }
      mockDialog.open.mockReturnValue({ afterClosed: () => of('rejected') })

      service.openMandatoryNotificationModal()

      expect(service.showMandatoryNotification).toBe(false)
      expect(service.lastNotificationActionTime).toEqual(expect.any(Number))
    })
  })

  describe('checkAndShowMandatoryNotification', () => {
    it('should skip entirely when isPlayer is true', () => {
      service.isPlayer = true
      const fetchSpy = jest.spyOn(service, 'fetchMandatoryNotification').mockImplementation(() => undefined)

      service.checkAndShowMandatoryNotification()

      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('should skip entirely when the modal is already open', () => {
      service.isMandatoryModalOpen = true
      const fetchSpy = jest.spyOn(service, 'fetchMandatoryNotification').mockImplementation(() => undefined)

      service.checkAndShowMandatoryNotification()

      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('should fetch the notification when there is no lastNotificationActionTime (elapsed time exceeds duration)', () => {
      service.lastNotificationActionTime = null
      const fetchSpy = jest.spyOn(service, 'fetchMandatoryNotification').mockImplementation(() => undefined)

      service.checkAndShowMandatoryNotification()

      expect(service.showMandatoryNotification).toBe(true)
      expect(fetchSpy).toHaveBeenCalled()
    })

    it('should fetch the notification when elapsed time is above the popup duration', () => {
      service.popupDuration = 10
      service.lastNotificationActionTime = Date.now() - 20 * 1000
      const fetchSpy = jest.spyOn(service, 'fetchMandatoryNotification').mockImplementation(() => undefined)

      service.checkAndShowMandatoryNotification()

      expect(fetchSpy).toHaveBeenCalled()
    })

    it('should not fetch the notification when elapsed time is below the popup duration', () => {
      service.popupDuration = 7200
      service.lastNotificationActionTime = Date.now()
      const fetchSpy = jest.spyOn(service, 'fetchMandatoryNotification').mockImplementation(() => undefined)

      service.checkAndShowMandatoryNotification()

      expect(fetchSpy).not.toHaveBeenCalled()
    })
  })

  describe('updatePlayerStatus', () => {
    it('should set isPlayer to the given value', () => {
      service.updatePlayerStatus(true)
      expect(service.isPlayer).toBe(true)
    })
  })

  describe('checkAndCacheNlw2026Eligibility', () => {
    it('should cache the value from the profile when defined', () => {
      service.checkAndCacheNlw2026Eligibility({ profileDetails: { additionalProperties: { isNlw2026Certified: true } } })
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('isNlw2026Certified', 'true')
    })

    it('should cache false when the value is undefined', () => {
      service.checkAndCacheNlw2026Eligibility({ profileDetails: { additionalProperties: {} } })
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('isNlw2026Certified', 'false')
    })
  })

  describe('getLanguageBasedContentUrl', () => {
    it('should resolve content using the mapped language', () => {
      mockConfigSvc.unMappedUser.profileDetails.ministryOrStateOrgName = 'Odisha'
      const result = service.getLanguageBasedContentUrl('welcomeBanner')
      expect(result).toBe('odia-banner')
    })

    it('should fall back to english when there is no language mapping', () => {
      mockConfigSvc.unMappedUser.profileDetails.ministryOrStateOrgName = 'Unmapped'
      const result = service.getLanguageBasedContentUrl('welcomeBanner')
      expect(result).toBe('english-banner')
    })
  })

  describe('getNlw2026CertifiedStatus', () => {
    it('should return the cached value from localStorage when present', done => {
      mockLocalStorage.getItem.mockReturnValue('true')

      service.getNlw2026CertifiedStatus().subscribe((result: boolean) => {
        expect(result).toBe(true)
        expect(mockHttp.get).not.toHaveBeenCalled()
        done()
      })
    })

    it('should read from configSvc and cache it when not cached but present on the profile', done => {
      mockConfigSvc.unMappedUser.profileDetails.additionalProperties = { isNlw2026Certified: false }

      service.getNlw2026CertifiedStatus().subscribe((result: boolean) => {
        expect(result).toBe(false)
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('isNlw2026Certified', 'false')
        expect(mockHttp.get).not.toHaveBeenCalled()
        done()
      })
    })

    it('should call the API and resolve a matched profile when neither cached nor on configSvc but a userId exists', done => {
      mockHttp.get.mockReturnValue(of({
        result: { response: { profileDetails: { additionalProperties: { isNlw2026Certified: true } } } },
      }))

      service.getNlw2026CertifiedStatus().subscribe((result: boolean) => {
        expect(mockHttp.get).toHaveBeenCalledWith('/apis/proxies/v8/api/user/v2/read/user-123')
        expect(result).toBe(true)
        expect(mockConfigSvc.unMappedUser).toEqual({ profileDetails: { additionalProperties: { isNlw2026Certified: true } } })
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('isNlw2026Certified', 'true')
        done()
      })
    })

    it('should return false and cache false when the API response has no certification value', done => {
      mockHttp.get.mockReturnValue(of({ result: { response: { profileDetails: { additionalProperties: {} } } } }))

      service.getNlw2026CertifiedStatus().subscribe((result: boolean) => {
        expect(result).toBe(false)
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('isNlw2026Certified', 'false')
        done()
      })
    })

    it('should return false and cache false when there is no userId at all', done => {
      mockConfigSvc.unMappedUser = {}

      service.getNlw2026CertifiedStatus().subscribe((result: boolean) => {
        expect(result).toBe(false)
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('isNlw2026Certified', 'false')
        expect(mockHttp.get).not.toHaveBeenCalled()
        done()
      })
    })
  })
})
