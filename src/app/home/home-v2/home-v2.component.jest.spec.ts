import { HomeV2Component } from './home-v2.component'
import { of, throwError } from 'rxjs'

// This component uses inject() as field initializers, which requires an Angular
// injection context. We avoid TestBed entirely by creating the instance via
// Object.create (skipping the constructor/field initializers) and manually
// assigning the private fields the class relies on.
jest.mock('@angular/core', () => {
  const actual = jest.requireActual('@angular/core')
  return {
    ...actual,
    inject: jest.fn(),
  }
})

// @sunbird-cb/collection and @sunbird-cb/consumption are workspace/yarn-linked packages whose
// real barrels transitively pull in unrelated modules (e.g. btn-kb -> horizontal-scroller-v2 ->
// a stale @sunbird-cb/utils-v2 prebuilt bundle referencing a package that isn't installed in this
// environment). None of that is needed here — we only import type/enum references and stub every
// injected dependency manually below — so these are mocked as virtual modules to avoid ever
// resolving the real (broken) chain.
jest.mock('@sunbird-cb/collection', () => ({
  BtnSettingsService: jest.fn(),
}), { virtual: true })

jest.mock('@sunbird-cb/consumption', () => ({
  ContentApiService: jest.fn(),
  VisibilityMode: { Visible: 'visible', Hidden: 'hidden', Disabled: 'disabled' },
}), { virtual: true })

// @ws/app's barrel (project/ws/app/src/public-api.ts) transitively pulls in the entire app-setup
// route tree, which reaches a stale @sunbird-cb/discussion-v2 bundle referencing an uninstalled
// 'ckeditor5' package. We only need the UserProfileService reference, stubbed below anyway.
jest.mock('@ws/app', () => ({
  UserProfileService: jest.fn(),
}), { virtual: true })

describe('HomeV2Component (No TestBed)', () => {
  let component: HomeV2Component
  let mockConfigSvc: any
  let mockBtnSettingsSvc: any
  let mockRouter: any
  let mockRoute: any
  let mockTranslate: any
  let mockEventSvc: any
  let mockUserProfileService: any
  let mockMatSnackBar: any
  let mockCommonDataSvc: any
  let mockContentApiService: any
  let mockHomePageSvc: any
  let mockLocalStorage: any
  let mockSessionStorage: any

  const buildHomeSection = () => [
    {
      sectionKey: 'aparCourses',
      sectionLoading: true,
      visibilityMode: 'visible',
      pills: [
        { pillKey: 'p1', pillInfoCountKey: 'countA' },
        { pillKey: 'p2', pillInfoCountKey: 'countB' },
      ],
    },
  ]

  beforeEach(() => {
    mockConfigSvc = {
      unMappedUser: {
        id: 'user-1',
        profileDetails: {
          profileStatus: 'VERIFIED',
          employmentDetails: { departmentName: 'someDept' },
        },
      },
    }
    mockBtnSettingsSvc = { changeFont: jest.fn() }
    mockRouter = { navigateByUrl: jest.fn(), navigate: jest.fn() }
    mockRoute = { snapshot: { data: { home: { data: { homeSection: buildHomeSection() } } } } }
    mockTranslate = { setDefaultLang: jest.fn(), use: jest.fn() }
    mockEventSvc = { raiseInteractTelemetry: jest.fn() }
    mockUserProfileService = {
      listApprovalPendingFields: jest.fn().mockReturnValue(of({ result: { data: [] } })),
      editProfileDetails: jest.fn().mockReturnValue(of(null)),
    }
    mockMatSnackBar = { open: jest.fn() }
    mockCommonDataSvc = {
      isDialogEnabled: jest.fn().mockReturnValue(true),
      redirectToCustomProfile: jest.fn(),
    }
    mockContentApiService = { updateSection: jest.fn() }
    mockHomePageSvc = { getUserContentInfo: jest.fn().mockReturnValue(of(null)) }

    // jest.spyOn on the real Storage prototype breaks in this jsdom setup (its methods are
    // non-configurable), so swap the whole global object for a plain mock instead.
    mockLocalStorage = { getItem: jest.fn().mockReturnValue(null), setItem: jest.fn() }
    mockSessionStorage = { getItem: jest.fn().mockReturnValue(null), setItem: jest.fn() }
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage, writable: true, configurable: true })
    Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage, writable: true, configurable: true })

    component = Object.create(HomeV2Component.prototype)
    ; (component as any).configSvc = mockConfigSvc
    ; (component as any).btnSettingsSvc = mockBtnSettingsSvc
    ; (component as any).router = mockRouter
    ; (component as any).route = mockRoute
    ; (component as any).translate = mockTranslate
    ; (component as any).eventSvc = mockEventSvc
    ; (component as any).userProfileService = mockUserProfileService
    ; (component as any).matSnackBar = mockMatSnackBar
    ; (component as any).commonDataSvc = mockCommonDataSvc
    ; (component as any).contentApiService = mockContentApiService
    ; (component as any).homePageSvc = mockHomePageSvc
    ; (component as any).canShowCustomAttrOpen = false
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should be defined', () => {
    expect(component).toBeDefined()
  })

  describe('ngOnInit', () => {
    it('should run all initialization steps', () => {
      jest.spyOn(component as any, 'initializeUserState').mockImplementation(() => undefined)
      jest.spyOn(component as any, 'handleDefaultFontSetting').mockImplementation(() => undefined)
      jest.spyOn(component as any, 'initializeLanguage').mockImplementation(() => undefined)
      jest.spyOn(component as any, 'getListPendingApproval').mockImplementation(() => undefined)
      jest.spyOn(component as any, 'loadPillsSectionInfo').mockImplementation(() => undefined)

      component.ngOnInit()

      expect((component as any).initializeUserState).toHaveBeenCalled()
      expect((component as any).handleDefaultFontSetting).toHaveBeenCalled()
      expect((component as any).initializeLanguage).toHaveBeenCalled()
      expect((component as any).getListPendingApproval).toHaveBeenCalled()
      expect((component as any).loadPillsSectionInfo).toHaveBeenCalled()
    })
  })

  describe('initializeUserState', () => {
    it('should redirect to profile page when user is not-my-user in an igot org', () => {
      mockConfigSvc.unMappedUser.profileDetails.profileStatus = 'not-my-user'
      mockConfigSvc.unMappedUser.profileDetails.employmentDetails.departmentName = 'igot'

      ; (component as any).initializeUserState()

      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('app/person-profile/me#profileInfo')
    })

    it('should not redirect for a verified user', () => {
      ; (component as any).initializeUserState()
      expect(mockRouter.navigateByUrl).not.toHaveBeenCalled()
    })
  })

  describe('initializeLanguage', () => {
    it('should set the language from localStorage when present', () => {
      mockLocalStorage.getItem.mockReturnValue('hi')
      ; (component as any).initializeLanguage()
      expect(mockTranslate.setDefaultLang).toHaveBeenCalledWith('en')
      expect(mockTranslate.use).toHaveBeenCalledWith('hi')
    })

    it('should do nothing when localStorage has no language', () => {
      ; (component as any).initializeLanguage()
      expect(mockTranslate.setDefaultLang).not.toHaveBeenCalled()
      expect(mockTranslate.use).not.toHaveBeenCalled()
    })
  })

  describe('handleDefaultFontSetting', () => {
    it('should apply the font stored in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('large-typography')
      ; (component as any).handleDefaultFontSetting()
      expect(mockBtnSettingsSvc.changeFont).toHaveBeenCalledWith('large-typography')
    })
  })

  describe('getListPendingApproval', () => {
    it('should store the pending approval list when non-empty', () => {
      mockUserProfileService.listApprovalPendingFields.mockReturnValue(of({ result: { data: [{ id: 1 }] } }))
      const nudgeSpy = jest.spyOn(component as any, 'handleUpdateMobileNudge').mockImplementation(() => undefined)

      ; (component as any).getListPendingApproval()

      expect(component.pendingApprovalList).toEqual([{ id: 1 }])
      expect(nudgeSpy).not.toHaveBeenCalled()
    })

    it('should trigger the mobile nudge when the list is empty', () => {
      mockUserProfileService.listApprovalPendingFields.mockReturnValue(of({ result: { data: [] } }))
      const nudgeSpy = jest.spyOn(component as any, 'handleUpdateMobileNudge').mockImplementation(() => undefined)

      ; (component as any).getListPendingApproval()

      expect(nudgeSpy).toHaveBeenCalled()
    })

    it('should show a snackbar when the request errors', () => {
      mockUserProfileService.listApprovalPendingFields.mockReturnValue(
        throwError(() => ({ ok: false }))
      )

      ; (component as any).getListPendingApproval()

      expect(mockMatSnackBar.open).toHaveBeenCalledWith('Unable to fetch pending approval list')
    })

    it('should not show a snackbar when the error response is ok', () => {
      mockUserProfileService.listApprovalPendingFields.mockReturnValue(
        throwError(() => ({ ok: true }))
      )

      ; (component as any).getListPendingApproval()

      expect(mockMatSnackBar.open).not.toHaveBeenCalled()
    })
  })

  describe('handleUpdateMobileNudge', () => {
    it('should set isNudgeOpen to false when the dialog is disabled', () => {
      mockCommonDataSvc.isDialogEnabled.mockReturnValue(false)
      ; (component as any).handleUpdateMobileNudge()
      expect(component.isNudgeOpen).toBe(false)
    })

    it('should leave isNudgeOpen unset when there is no unMappedUser id', () => {
      mockConfigSvc.unMappedUser = {}
      ; (component as any).handleUpdateMobileNudge()
      expect(component.isNudgeOpen).toBeUndefined()
    })

    it('should open the nudge when profileDetails is missing', () => {
      mockConfigSvc.unMappedUser.profileDetails = null
      ; (component as any).handleUpdateMobileNudge()
      expect(component.isNudgeOpen).toBe(true)
    })

    it('should open the nudge when profile is not verified and the popup was not dismissed', () => {
      mockConfigSvc.unMappedUser.profileDetails.profileStatus = 'PENDING'
      mockSessionStorage.getItem.mockReturnValue(null)
      ; (component as any).handleUpdateMobileNudge()
      expect(component.isNudgeOpen).toBe(true)
    })

    it('should keep the nudge closed when the popup was previously dismissed', () => {
      mockConfigSvc.unMappedUser.profileDetails.profileStatus = 'PENDING'
      mockSessionStorage.getItem.mockReturnValue('false')
      ; (component as any).handleUpdateMobileNudge()
      expect(component.isNudgeOpen).toBe(false)
    })

    it('should keep the nudge closed for a verified profile', () => {
      mockConfigSvc.unMappedUser.profileDetails.profileStatus = 'VERIFIED'
      ; (component as any).handleUpdateMobileNudge()
      expect(component.isNudgeOpen).toBe(false)
    })
  })

  describe('isDialogEnabled', () => {
    it('should delegate to commonDataSvc', () => {
      mockCommonDataSvc.isDialogEnabled.mockReturnValue(true)
      expect(component.isDialogEnabled('profileUpdateNudge')).toBe(true)
      expect(mockCommonDataSvc.isDialogEnabled).toHaveBeenCalledWith('profileUpdateNudge')
    })
  })

  describe('handleRemindLater', () => {
    it('should persist the dismissal and close the nudge', () => {
      component.handleRemindLater()
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('hideUpdateProfilePopUp', 'true')
      expect(component.isNudgeOpen).toBe(false)
    })
  })

  describe('fetchProfile', () => {
    it('should update the profile message flag and navigate', () => {
      const handleSpy = jest.spyOn(component as any, 'handleMDOMsgstatus').mockImplementation(() => undefined)
      component.fetchProfile()
      expect(handleSpy).toHaveBeenCalled()
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/person-profile/me'])
    })
  })

  describe('handleMDOMsgstatus', () => {
    it('should submit the profile update request', () => {
      ; (component as any).handleMDOMsgstatus()
      expect(mockUserProfileService.editProfileDetails).toHaveBeenCalledWith({
        request: {
          userId: 'user-1',
          profileDetails: {
            additionalProperties: {
              isProfileUpdatedMsgViewed: true,
            },
          },
        },
      })
    })

    it('should show a snackbar with the error text on failure', () => {
      mockUserProfileService.editProfileDetails.mockReturnValue(
        throwError(() => ({ ok: false, error: { text: 'failed' } }))
      )
      ; (component as any).handleMDOMsgstatus()
      expect(mockMatSnackBar.open).toHaveBeenCalledWith('failed')
    })

    it('should not show a snackbar when the error response is ok', () => {
      mockUserProfileService.editProfileDetails.mockReturnValue(
        throwError(() => ({ ok: true, error: { text: 'failed' } }))
      )
      ; (component as any).handleMDOMsgstatus()
      expect(mockMatSnackBar.open).not.toHaveBeenCalled()
    })
  })

  describe('redirectToCustomProfile', () => {
    it('should delegate to commonDataSvc', () => {
      component.redirectToCustomProfile()
      expect(mockCommonDataSvc.redirectToCustomProfile).toHaveBeenCalled()
    })
  })

  describe('cardClicked', () => {
    it('should raise telemetry for the clicked card', () => {
      const cardClickDetails = { id: 'card-1' }
      const telemetrySpy = jest.spyOn(component, 'raiseTelemetryExploreContent')
      component.cardClicked({ cardClickDetails })
      expect(telemetrySpy).toHaveBeenCalledWith(cardClickDetails)
    })
  })

  describe('raiseTelemetryExploreContent', () => {
    it('should include subType and identifier when present', () => {
      component.raiseTelemetryExploreContent({
        id: 'card-1',
        subType: 'course',
        identifier: 'id-1',
        type: 'Program',
      })

      expect(mockEventSvc.raiseInteractTelemetry).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'card-1', subType: 'course' }),
        expect.objectContaining({ id: 'id-1', type: 'Program' }),
        expect.any(Object)
      )
    })

    it('should default the object type to Course when not provided', () => {
      component.raiseTelemetryExploreContent({ id: 'card-2', identifier: 'id-2' })

      expect(mockEventSvc.raiseInteractTelemetry).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'card-2' }),
        expect.objectContaining({ id: 'id-2', type: 'Course' }),
        expect.any(Object)
      )
    })

    it('should handle click details with neither subType nor identifier', () => {
      component.raiseTelemetryExploreContent({})

      expect(mockEventSvc.raiseInteractTelemetry).toHaveBeenCalledWith(
        expect.objectContaining({ id: '' }),
        {},
        expect.any(Object)
      )
    })
  })

  describe('loadPillsSectionInfo', () => {
    it('should do nothing when the pills section is not present in the route data', () => {
      mockRoute.snapshot.data.home.data.homeSection = [{ sectionKey: 'otherSection' }]

      ; (component as any).loadPillsSectionInfo()

      expect(mockHomePageSvc.getUserContentInfo).not.toHaveBeenCalled()
    })

    it('should not call the info API when the section is not already visible', () => {
      mockRoute.snapshot.data.home.data.homeSection[0].visibilityMode = 'hidden'

      ; (component as any).loadPillsSectionInfo()

      expect(mockHomePageSvc.getUserContentInfo).not.toHaveBeenCalled()
      expect(mockContentApiService.updateSection).not.toHaveBeenCalled()
    })

    it('should update the section with the computed visibility once the info API responds', () => {
      mockHomePageSvc.getUserContentInfo.mockReturnValue(
        of({ result: { countA: 3, countB: 0 } })
      )

      ; (component as any).loadPillsSectionInfo()

      expect(mockContentApiService.updateSection).toHaveBeenCalledWith('aparCourses', {
        pills: [
          { pillKey: 'p1', pillInfoCountKey: 'countA', visibilityMode: 'visible' },
          { pillKey: 'p2', pillInfoCountKey: 'countB', visibilityMode: 'hidden' },
        ],
        visibilityMode: 'visible',
        sectionLoading: false,
      })
    })

    it('should hide the whole section when no pill has a matching count', () => {
      mockHomePageSvc.getUserContentInfo.mockReturnValue(
        of({ result: { countA: 0, countB: 0 } })
      )

      ; (component as any).loadPillsSectionInfo()

      expect(mockContentApiService.updateSection).toHaveBeenCalledWith('aparCourses', {
        pills: [
          { pillKey: 'p1', pillInfoCountKey: 'countA', visibilityMode: 'hidden' },
          { pillKey: 'p2', pillInfoCountKey: 'countB', visibilityMode: 'hidden' },
        ],
        visibilityMode: 'hidden',
        sectionLoading: false,
      })
    })

    it('should hide the section and clear sectionLoading when the info API call fails', () => {
      mockHomePageSvc.getUserContentInfo.mockReturnValue(throwError(() => new Error('network error')))
      const originalPills = mockRoute.snapshot.data.home.data.homeSection[0].pills

      ; (component as any).loadPillsSectionInfo()

      expect(mockContentApiService.updateSection).toHaveBeenCalledWith('aparCourses', {
        pills: originalPills,
        visibilityMode: 'hidden',
        sectionLoading: false,
      })
    })

    it('should hide the section when the info API responds without a usable result', () => {
      mockHomePageSvc.getUserContentInfo.mockReturnValue(of({}))
      const originalPills = mockRoute.snapshot.data.home.data.homeSection[0].pills

      ; (component as any).loadPillsSectionInfo()

      expect(mockContentApiService.updateSection).toHaveBeenCalledWith('aparCourses', {
        pills: originalPills,
        visibilityMode: 'hidden',
        sectionLoading: false,
      })
    })
  })

  describe('computePillsVisibility', () => {
    it('should return the pills unchanged when pills is not an array', () => {
      const pillsSection = { pills: null, visibilityMode: 'visible' }
      const result = (component as any).computePillsVisibility(pillsSection, { result: {} })
      expect(result).toEqual({ pills: null, visibilityMode: 'visible' })
    })

    it('should hide the section when the info response is null (API failure)', () => {
      const pillsSection = { pills: [{ pillKey: 'p1' }], visibilityMode: 'visible' }
      const result = (component as any).computePillsVisibility(pillsSection, null)
      expect(result.pills).toBe(pillsSection.pills)
      expect(result.visibilityMode).toBe('hidden')
    })

    it('should hide the section when the info response has no result', () => {
      const pillsSection = { pills: [{ pillKey: 'p1' }], visibilityMode: 'visible' }
      const result = (component as any).computePillsVisibility(pillsSection, {})
      expect(result.pills).toBe(pillsSection.pills)
      expect(result.visibilityMode).toBe('hidden')
    })
  })
})
