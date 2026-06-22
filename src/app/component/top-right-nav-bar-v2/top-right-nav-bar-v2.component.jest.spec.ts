import { TopRightNavBarV2Component } from './top-right-nav-bar-v2.component'
import { of, Subject, BehaviorSubject } from 'rxjs'

// Mock inject() since this component uses inject() pattern
jest.mock('@angular/core', () => {
  const actual = jest.requireActual('@angular/core')
  return {
    ...actual,
    inject: jest.fn(),
  }
})

describe('TopRightNavBarV2Component (No TestBed)', () => {
  let component: TopRightNavBarV2Component
  let mockDialog: any
  let mockHomePageService: any
  let mockConfigSvc: any
  let mockLangTranslations: any
  let mockTranslate: any
  let mockHttp: any
  let mockSanitizer: any
  let mockEvents: any
  let mockSnackBar: any
  let mockRouter: any
  let mockNotificationsService: any
  let mockRootService: any
  let mockThemeSvc: any
  let mockBtnSettingsSvc: any

  beforeEach(() => {
    mockDialog = {
      open: jest.fn().mockReturnValue({ afterClosed: () => of(null) }),
    }

    mockHomePageService = {
      closeDialogPop: new Subject(),
    }

    mockConfigSvc = {
      instanceConfig: {
        websitelanguages: [
          { key: 'en', value: 'English', active: true },
          { key: 'hi', value: 'Hindi', active: true },
        ],
        isMultilingualEnabled: true,
      },
      userProfile: { userId: 'user-123', firstName: 'Test', lastName: 'User', rootOrgId: 'org-1' },
      unMappedUser: { id: 'user-123', roles: ['PUBLIC'] },
      languageTranslationFlag: new Subject(),
      iGOTAIConfig: null,
    }

    mockLangTranslations = {
      languageSelectedObservable: of(true),
      updatelanguageSelected: jest.fn(),
      translateLabel: jest.fn().mockImplementation((label: string) => label),
    }

    mockTranslate = {
      setDefaultLang: jest.fn(),
      use: jest.fn(),
    }

    mockHttp = {
      get: jest.fn().mockReturnValue(of('<html></html>')),
    }

    mockSanitizer = {
      bypassSecurityTrustHtml: jest.fn().mockImplementation((val: any) => val),
    }

    mockEvents = {
      raiseInteractTelemetry: jest.fn(),
    }

    mockSnackBar = {
      open: jest.fn(),
    }

    mockRouter = {
      navigate: jest.fn(),
    }

    mockNotificationsService = {
      resetNotificationsCount: jest.fn().mockReturnValue(of({ responseCode: 'OK' })),
      handleRedirection: jest.fn(),
      nofificationsCount: new BehaviorSubject(0),
    }

    mockRootService = {
      openSupportAIChatbot: new BehaviorSubject(false),
    }

    mockThemeSvc = {
      isDarkMode: jest.fn().mockReturnValue(false),
    }

    mockBtnSettingsSvc = {
      changeFont: jest.fn(),
    }

    jest.spyOn(localStorage, 'getItem').mockImplementation((key: string) => {
      if (key === 'websiteLanguage') return 'en'
      if (key === 'setting') return 'normal-typography'
      return null
    })
    jest.spyOn(localStorage, 'setItem').mockImplementation(() => { })

    // Since this component uses inject(), we need to manually construct and assign
    // We'll create a partial instance and manually set up the methods
    const { inject } = require('@angular/core')
    const injectMocks: any = {
      MatDialog: mockDialog,
      HomePageService: mockHomePageService,
      ConfigurationsService: mockConfigSvc,
      MultilingualTranslationsService: mockLangTranslations,
      TranslateService: mockTranslate,
      HttpClient: mockHttp,
      DomSanitizer: mockSanitizer,
      EventService: mockEvents,
      MatSnackBar: mockSnackBar,
      Router: mockRouter,
      NotificationsService: mockNotificationsService,
      RootService: mockRootService,
      ThemeService: mockThemeSvc,
      BtnSettingsService: mockBtnSettingsSvc,
    }

    // Since inject() pattern makes unit testing without TestBed tricky,
    // we'll test using a manually constructed object approach
    component = Object.create(TopRightNavBarV2Component.prototype)

      // Manually assign private services (same approach as inject)
      ; (component as any).dialog = mockDialog
      ; (component as any).homePageService = mockHomePageService
      ; (component as any).configSvc = mockConfigSvc
      ; (component as any).langtranslations = mockLangTranslations
      ; (component as any).translate = mockTranslate
      ; (component as any).http = mockHttp
      ; (component as any).sanitizer = mockSanitizer
      ; (component as any).events = mockEvents
      ; (component as any).snackBar = mockSnackBar
      ; (component as any).router = mockRouter
      ; (component as any).notificationsService = mockNotificationsService
      ; (component as any).rootService = mockRootService
      ; (component as any).themeSvc = mockThemeSvc
      ; (component as any).btnSettingsSvc = mockBtnSettingsSvc
      ; (component as any).subs = []
      ; (component as any).zohoUrl = '/assets/static-data/zoho-code.html'
      ; (component as any).fontClasses = ['x-small-typography', 'small-typography', 'normal-typography', 'large-typography', 'x-large-typography']
      ; (component as any).fontLabels = ['XS', 'S', 'M', 'L', 'XL']

    // Initialize signals manually
    component.notificationsCount = { __proto__: null, set: jest.fn(), update: jest.fn() } as any
    component.selectedLanguage = { __proto__: null, set: jest.fn() } as any
    component.multiLang = { __proto__: null, set: jest.fn() } as any
    component.zohoHtml = { __proto__: null, set: jest.fn() } as any
    component.isMultiLangEnabled = { __proto__: null, set: jest.fn() } as any
    component.showDropdown = { __proto__: null, set: jest.fn() } as any
    component.roles = { __proto__: null, set: jest.fn() } as any
    component.enableSupportAI = { __proto__: null, set: jest.fn() } as any
    component.fontSizeLevel = { __proto__: null, set: jest.fn(), update: jest.fn() } as any

    // Use simple signal mocks that return values
    const createSignal = (initialValue: any) => {
      let value = initialValue
      const fn: any = () => value
      fn.set = (v: any) => { value = v }
      fn.update = (updater: any) => { value = updater(value) }
      return fn
    }

    component.notificationsCount = createSignal(5)
    component.selectedLanguage = createSignal('en')
    component.multiLang = createSignal([])
    component.zohoHtml = createSignal('')
    component.isMultiLangEnabled = createSignal(false)
    component.showDropdown = createSignal(false)
    component.roles = createSignal(['PUBLIC'])
    component.enableSupportAI = createSignal(false)
    component.fontSizeLevel = createSignal(2)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should be defined', () => {
    expect(component).toBeDefined()
  })

  describe('translateLabels', () => {
    it('should call langtranslations.translateLabel', () => {
      const result = component.translateLabels('hello', 'type')
      expect(mockLangTranslations.translateLabel).toHaveBeenCalledWith('hello', 'type', '')
      expect(result).toBe('hello')
    })
  })

  describe('onBellClick', () => {
    it('should reset notifications count when count > 0', () => {
      jest.useFakeTimers()
      component.onBellClick()
      expect(mockNotificationsService.resetNotificationsCount).toHaveBeenCalled()
      expect(component.notificationsCount()).toBe(0)
      jest.useRealTimers()
    })

    it('should set showDropdown to true after timeout', () => {
      jest.useFakeTimers()
      component.notificationsCount.set(0)
      component.onBellClick()
      expect(component.showDropdown()).toBe(false)
      jest.advanceTimersByTime(0)
      expect(component.showDropdown()).toBe(true)
      jest.useRealTimers()
    })
  })

  describe('onMenuClosed', () => {
    it('should set showDropdown to false', () => {
      component.showDropdown.set(true)
      component.onMenuClosed()
      expect(component.showDropdown()).toBe(false)
    })
  })

  describe('selectLanguage', () => {
    it('should update selectedLanguage and localStorage', () => {
      component.selectLanguage('hi')
      expect(component.selectedLanguage()).toBe('hi')
      expect(localStorage.setItem).toHaveBeenCalledWith('websiteLanguage', 'hi')
      expect(mockLangTranslations.updatelanguageSelected).toHaveBeenCalledWith(true, 'hi', 'user-123')
    })
  })

  describe('getZohoForm', () => {
    it('should open dialog', () => {
      jest.useFakeTimers()
      component.getZohoForm()
      expect(mockDialog.open).toHaveBeenCalled()
      jest.useRealTimers()
    })
  })

  describe('openDialog', () => {
    it('should open DialogBoxComponent', () => {
      component.openDialog()
      expect(mockDialog.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ width: '1000px' })
      )
    })
  })

  describe('viewAllClick', () => {
    it('should navigate to notifications for tab events', () => {
      component.viewAllClick('all')
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/app/notifications'],
        { queryParams: { tab: 'all' } }
      )
    })

    it('should handle PEER_VALIDATION category with PEER_REVIEW_ASSIGNED', () => {
      const event = {
        category: 'PEER_VALIDATION',
        sub_category: 'PEER_REVIEW_ASSIGNED',
        notification_id: 'n1',
        message: { data: [{}] },
        status: 'PENDING',
      }
      jest.spyOn(component, 'openVerificationPopup').mockImplementation(() => { })
      component.viewAllClick(event)
      expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalled()
      expect(component.openVerificationPopup).toHaveBeenCalledWith(event)
    })

    it('should handle PEER_VALIDATION category with survey', () => {
      const event = {
        category: 'PEER_VALIDATION',
        sub_category: 'SURVEY',
        notification_id: 'n1',
        message: { data: [{}] },
        status: 'PENDING',
      }
      jest.spyOn(component, 'openSurveypopup').mockImplementation(() => { })
      component.viewAllClick(event)
      expect(component.openSurveypopup).toHaveBeenCalledWith(event)
    })

    it('should handle other categories with redirection', () => {
      const event = { category: 'CONTENT', notification_id: 'n1' }
      component.viewAllClick(event)
      expect(mockNotificationsService.handleRedirection).toHaveBeenCalled()
    })
  })

  describe('formatDate', () => {
    it('should format a valid date string', () => {
      const result = component.formatDate('2025-01-15T10:00:00Z')
      expect(result).toBe('15-01-2025')
    })

    it('should return empty string for empty input', () => {
      expect(component.formatDate('')).toBe('')
    })

    it('should return original string for invalid date', () => {
      expect(component.formatDate('not-a-date')).toBe('not-a-date')
    })
  })

  describe('openSurveypopup', () => {
    it('should show snackbar for SUBMITTED status', () => {
      component.openSurveypopup({ status: 'SUBMITTED', message: { data: [{}] } })
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'You have already completed the survey.', 'X', { duration: 3000 }
      )
    })

    it('should show snackbar for IGNORED status', () => {
      component.openSurveypopup({ status: 'IGNORED', message: { data: [{}] } })
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'You have already submitted the response.', 'X', { duration: 3000 }
      )
    })

    it('should show snackbar for EXPIRED status', () => {
      component.openSurveypopup({ status: 'EXPIRED', message: { data: [{}] } })
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Survey has ended.', 'X', { duration: 3000 }
      )
    })

    it('should open dialog for PENDING status', () => {
      const notification = {
        status: 'PENDING',
        notification_id: 'n1',
        created_at: '2025-01-01',
        message: { data: [{ courseName: 'Test', formId: 'f1' }] },
      }
      component.openSurveypopup(notification)
      expect(mockDialog.open).toHaveBeenCalled()
    })
  })

  describe('openVerificationPopup', () => {
    it('should show snackbar for APPROVED status', () => {
      component.openVerificationPopup({ status: 'APPROVED', message: { data: [{}] } })
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'You have already submitted the review.', 'X', { duration: 3000 }
      )
    })

    it('should show snackbar for REJECTED status', () => {
      component.openVerificationPopup({ status: 'REJECTED', message: { data: [{}] } })
      expect(mockSnackBar.open).toHaveBeenCalled()
    })

    it('should open dialog for PENDING status', () => {
      const notification = {
        status: 'PENDING',
        notification_id: 'n1',
        created_at: '2025-01-01',
        message: { data: [{ requestedName: 'User', courseName: 'Course' }] },
      }
      component.openVerificationPopup(notification)
      expect(mockDialog.open).toHaveBeenCalled()
    })
  })

  describe('reCountNotifications', () => {
    it('should emit to notificationsService', () => {
      component.reCountNotifications(10)
      expect(mockNotificationsService.nofificationsCount.value).toBe(10)
    })
  })

  describe('raiseTelemetryEventForNotification', () => {
    it('should call raiseInteractTelemetry', () => {
      component.raiseTelemetryEventForNotification({ notification_id: 'n1' })
      expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'n1' }),
        {},
        expect.any(Object)
      )
    })
  })

  describe('openSupportChatBot', () => {
    it('should open support AI when config has supportAI.all', () => {
      mockConfigSvc.iGOTAIConfig = { supportAI: { all: true } }
      component.openSupportChatBot()
      expect(component.enableSupportAI()).toBe(true)
      expect(mockRootService.openSupportAIChatbot.value).toBe(true)
    })

    it('should open support AI when org is in forOrg list', () => {
      mockConfigSvc.iGOTAIConfig = { supportAI: { forOrg: ['org-1'] } }
      component.openSupportChatBot()
      expect(component.enableSupportAI()).toBe(true)
    })

    it('should open zoho form when no AI config', () => {
      mockConfigSvc.iGOTAIConfig = null
      jest.spyOn(component, 'getZohoForm').mockImplementation(() => { })
      component.openSupportChatBot()
      expect(component.getZohoForm).toHaveBeenCalled()
    })
  })

  describe('increaseFontSize', () => {
    it('should increase font level when below max', () => {
      component.fontSizeLevel.set(2)
      component.increaseFontSize()
      expect(component.fontSizeLevel()).toBe(3)
    })

    it('should not increase font level when at max', () => {
      component.fontSizeLevel.set(4)
      component.increaseFontSize()
      expect(component.fontSizeLevel()).toBe(4)
    })
  })

  describe('decreaseFontSize', () => {
    it('should decrease font level when above min', () => {
      component.fontSizeLevel.set(2)
      component.decreaseFontSize()
      expect(component.fontSizeLevel()).toBe(1)
    })

    it('should not decrease font level when at min', () => {
      component.fontSizeLevel.set(0)
      component.decreaseFontSize()
      expect(component.fontSizeLevel()).toBe(0)
    })
  })

  describe('ngOnDestroy', () => {
    it('should unsubscribe all subscriptions', () => {
      const mockSub = { unsubscribe: jest.fn() }
        ; (component as any).subs = [mockSub]
      component.ngOnDestroy()
      expect(mockSub.unsubscribe).toHaveBeenCalled()
    })
  })
})
