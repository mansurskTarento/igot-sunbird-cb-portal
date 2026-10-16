import { TestBed } from '@angular/core/testing'
import { AppNavBarComponent } from './app-nav-bar.component'
import { of, Subject, BehaviorSubject } from 'rxjs'

describe('AppNavBarComponent (No TestBed)', () => {
  let component: AppNavBarComponent
  let mockDomSanitizer: any
  let mockConfigSvc: any
  let mockTourService: any
  let mockRouter: any
  let mockTranslate: any
  let mockEvents: any
  let mockLangTranslations: any
  let mockUrlService: any
  let mockUserSvc: any
  let mockNotificationsService: any
  let mockLibNotificationsService: any
  let mockDomainConfSvc: any
  let routerEventsSubject: Subject<any>
  let summaryLoading$: BehaviorSubject<boolean>

  beforeEach(() => {
    // ngOnInit starts a logo setInterval it never clears — keep it from leaking across tests
    jest.useFakeTimers()
    routerEventsSubject = new Subject()
    summaryLoading$ = new BehaviorSubject<boolean>(false)

    mockDomSanitizer = {
      bypassSecurityTrustResourceUrl: jest.fn().mockImplementation((val: any) => val),
    }

    mockConfigSvc = {
      restrictedFeatures: new Set(),
      instanceConfig: {
        logos: {
          app: '/logo.svg',
          appSecondary: '/logo2.svg',
          appBottomNav: '/bottom-logo.svg',
        },
        hubs: [],
      },
      primaryNavBar: { color: '#fff' },
      pageNavBar: { color: '#000' },
      primaryNavBarConfig: { showMenu: true },
      appsConfig: { features: { learn: true, discuss: true } },
      tourGuideNotifier: new Subject(),
      rootOrg: 'igot',
      userProfile: { userId: 'user-123' },
      unMappedUser: { id: 'user-123' },
      overrideThemeChanges: null,
      portalUrls: {},
      userRoles: new Set(),
    }

    mockTourService = {
      createPopupTour: jest.fn().mockReturnValue({}),
      startPopupTour: jest.fn(),
      cancelPopupTour: jest.fn(),
      isTourComplete: true,
    }

    mockRouter = {
      events: routerEventsSubject.asObservable(),
      navigate: jest.fn(),
      navigateByUrl: jest.fn(),
    }

    mockTranslate = {
      setDefaultLang: jest.fn(),
      use: jest.fn(),
      instant: jest.fn().mockImplementation((key: string) => key),
    }

    mockEvents = {
      raiseInteractTelemetry: jest.fn(),
    }

    mockLangTranslations = {
      languageSelectedObservable: of(true),
      updatelanguageSelected: jest.fn(),
    }

    mockUrlService = {
      previousUrl$: new BehaviorSubject(''),
    }

    mockUserSvc = {
      fetchUserBatchList: jest.fn().mockReturnValue(of([])),
    }

    mockNotificationsService = {
      getNotificationsData: jest.fn().mockReturnValue(of({ result: { unread: 5 } })),
    }

    mockLibNotificationsService = {
      unreadCount$: new BehaviorSubject(3),
    }

    mockDomainConfSvc = {
      getDomainAppLogo: jest.fn().mockReturnValue('/assets/logo.svg'),
      getDomainRedirectPath: jest.fn().mockReturnValue('/page/home'),
      isConfigEnabled: jest.fn().mockReturnValue(false),
      getGlobalConfig: jest.fn().mockReturnValue({}),
    }

    jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      if (key === 'websiteLanguage') return null
      if (key === 'activeRoute') return 'home'
      if (key === 'userEnrollmentCount') return null
      return null
    })
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { })

    // the component injects DestroyRef, which needs an injection context
    component = TestBed.runInInjectionContext(() => new AppNavBarComponent(
      mockDomSanitizer,
      mockConfigSvc,
      mockTourService,
      mockRouter,
      mockTranslate,
      mockEvents,
      mockLangTranslations,
      mockUrlService,
      mockUserSvc,
      mockNotificationsService,
      mockLibNotificationsService,
      mockDomainConfSvc,
      { loading$: summaryLoading$.asObservable() } as any,
    ))
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
    jest.restoreAllMocks()
    if (component.enrollInterval) {
      clearInterval(component.enrollInterval)
    }
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should set isHelpMenuRestricted based on restrictedFeatures', () => {
    expect(component.isHelpMenuRestricted).toBe(false)
  })

  it('should set appIcon from instanceConfig', () => {
    component.ngOnInit()
    expect(component.appIcon).toBeDefined()
  })

  describe('ngOnInit', () => {
    it('should set isLoggedIn when userProfile exists', () => {
      component.ngOnInit()
      expect(component.isLoggedIn).toBe(true)
    })

    it('should set featureApps from appsConfig', () => {
      component.ngOnInit()
      expect(component.featureApps).toEqual(['learn', 'discuss'])
    })

    it('should set instanceVal from rootOrg', () => {
      component.ngOnInit()
      expect(component.instanceVal).toBe('igot')
    })

    it('should set redirectPath from domainConfSvc', () => {
      component.ngOnInit()
      expect(component.redirectPath).toBe('/page/home')
    })
  })

  describe('ngOnChanges', () => {
    it('should handle changes', () => {
      expect(() => component.ngOnChanges({} as any)).not.toThrow()
    })
  })

  describe('ngOnDestroy', () => {
    it('should not throw', () => {
      expect(() => component.ngOnDestroy()).not.toThrow()
    })
  })

  describe('bindUrl', () => {
    it('should set currentRoute when path is not /app/competencies', () => {
      component.bindUrl('/page/learn')
      expect(component.currentRoute).toBe('/page/learn')
    })

    it('should not set currentRoute for /app/competencies', () => {
      component.currentRoute = 'existing'
      component.bindUrl('/app/competencies')
      expect(component.currentRoute).toBe('existing')
    })
  })

  describe('karma points from the background enrolment summary', () => {
    const stored = JSON.stringify({ userCourseEnrolmentInfo: { karmaPoints: 120 } })

    it('should show the skeleton while the summary is loading', () => {
      summaryLoading$.next(true)
      component.ngOnInit()
      expect(component.karmaPointLoading).toBe(true)
    })

    it('should read the karma points once the summary lands', () => {
      summaryLoading$.next(true)
      component.ngOnInit()
      jest.spyOn(Storage.prototype, 'getItem')
        .mockImplementation((key: string) => (key === 'userEnrollmentCount' ? stored : null))
      summaryLoading$.next(false)
      expect(component.karmaPointLoading).toBe(false)
      expect(component.countdata).toBe(120)
    })
  })

  describe('cancelTour', () => {
    it('should cancel the popup tour when one is open', () => {
      component.popupTour = {}
      component.cancelTour()
      expect(mockTourService.cancelPopupTour).toHaveBeenCalled()
    })

    it('should do nothing when no popup tour is open', () => {
      component.popupTour = undefined
      component.cancelTour()
      expect(mockTourService.cancelPopupTour).not.toHaveBeenCalled()
    })
  })

  describe('startTour', () => {
    // the auto-start is switched off in the component (its body is commented out)
    it('should not start a popup tour', () => {
      component.startTour()
      expect(mockTourService.startPopupTour).not.toHaveBeenCalled()
    })
  })
})
