import { AppNavBarV2Component } from './app-nav-bar-v2.component'
import { of, Subject, BehaviorSubject } from 'rxjs'

describe('AppNavBarV2Component (No TestBed)', () => {
  let component: AppNavBarV2Component
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

  beforeEach(() => {
    routerEventsSubject = new Subject()

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
        showNavBarInSetup: false,
      },
      primaryNavBar: { color: '#fff' },
      pageNavBar: { color: '#000' },
      primaryNavBarConfig: {
        showMenu: true,
        mediumScreen: {
          left: [{ type: 'search' }],
          right: [{ type: 'profile' }],
        },
        smallScreen: {
          all: [{ type: 'home', config: { label: 'Home', path: '/page/home', icon: 'home' } }],
        },
      },
      appsConfig: { features: { learn: true, discuss: true } },
      tourGuideNotifier: new Subject(),
      rootOrg: 'igot',
      userProfile: { userId: 'user-123', rootOrgId: 'org-1' },
      unMappedUser: {
        id: 'user-123',
        identifier: 'user-123',
        profileDetails: {
          profileStatus: 'active',
          employmentDetails: { departmentName: 'IT' },
        },
        roles: ['PUBLIC'],
      },
      overrideThemeChanges: null,
      portalUrls: {},
      userRoles: new Set(),
      openExploreMenuForMWeb: new BehaviorSubject(false),
      languageTranslationFlag: new Subject(),
      iGOTAIConfig: null,
    }

    mockTourService = {
      createPopupTour: jest.fn().mockReturnValue({}),
      startTour: jest.fn(),
      cancelTour: jest.fn(),
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
      translateLabelWithoutspace: jest.fn().mockImplementation((label: string) => label),
    }

    mockUrlService = {
      previousUrl$: new BehaviorSubject(''),
    }

    mockUserSvc = {
      fetchUserBatchList: jest.fn().mockReturnValue(of([])),
    }

    mockNotificationsService = {
      getNotificationsData: jest.fn().mockReturnValue(of({ result: { unread: 5 } })),
      nofificationsCount: new BehaviorSubject(0),
    }

    mockLibNotificationsService = {
      unreadCount$: new BehaviorSubject(3),
      updateUnreadCount: jest.fn(),
    }

    mockDomainConfSvc = {
      getDomainAppLogo: jest.fn().mockReturnValue('/assets/logo.svg'),
      getDomainRedirectPath: jest.fn().mockReturnValue('/page/home'),
    }

    jest.spyOn(localStorage, 'getItem').mockImplementation((key: string) => {
      if (key === 'websiteLanguage') return null
      if (key === 'activeRoute') return 'home'
      if (key === 'userEnrollmentCount') return JSON.stringify({ userCourseEnrolmentInfo: { karmaPoints: 100 } })
      return null
    })
    jest.spyOn(localStorage, 'setItem').mockImplementation(() => { })
    jest.spyOn(localStorage, 'removeItem').mockImplementation(() => { })

    component = new AppNavBarV2Component(
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
      mockDomainConfSvc
    )
  })

  afterEach(() => {
    jest.restoreAllMocks()
    if (component.enrollInterval) {
      clearInterval(component.enrollInterval)
    }
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should set isHelpMenuRestricted to false by default', () => {
    expect(component.isHelpMenuRestricted).toBe(false)
  })

  it('should set isHelpMenuRestricted to true when restricted', () => {
    mockConfigSvc.restrictedFeatures = new Set(['helpNavBarMenu'])
    const comp = new AppNavBarV2Component(
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
      mockDomainConfSvc
    )
    expect(comp.isHelpMenuRestricted).toBe(true)
    if (comp.enrollInterval) clearInterval(comp.enrollInterval)
  })

  describe('ngOnInit', () => {
    it('should set isLoggedIn when userProfile has userId', () => {
      component.ngOnInit()
      expect(component.isLoggedIn()).toBe(true)
    })

    it('should set appIcon from domainConfSvc', () => {
      component.ngOnInit()
      expect(component.appIcon).toBe('/assets/logo.svg')
    })

    it('should set redirectPath from domainConfSvc', () => {
      component.ngOnInit()
      expect(component.redirectPath).toBe('/page/home')
    })

    it('should set featureApps from appsConfig', () => {
      component.ngOnInit()
      expect(component.featureApps).toEqual(['learn', 'discuss'])
    })

    it('should subscribe to tourGuideNotifier', () => {
      component.ngOnInit()
      mockConfigSvc.tourGuideNotifier.next(true)
      expect(component.isTourGuideAvailable()).toBe(true)
    })

    it('should set disableMenu when user is not-my-user and igot org', () => {
      mockConfigSvc.unMappedUser.profileDetails.profileStatus = 'not-my-user'
      mockConfigSvc.unMappedUser.profileDetails.employmentDetails.departmentName = 'igot'
      component.ngOnInit()
      expect(component.disableMenu()).toBe(true)
    })

    it('should set disableMenu to false for normal users', () => {
      component.ngOnInit()
      expect(component.disableMenu()).toBe(false)
    })

    it('should call getMyCount when user has identifier', () => {
      jest.spyOn(component, 'getMyCount')
      component.ngOnInit()
      expect(component.getMyCount).toHaveBeenCalled()
    })
  })

  describe('getMyCount', () => {
    it('should set notificationsCount from service', () => {
      component.getMyCount()
      expect(component.notificationsCount()).toBe(5)
    })

    it('should set notificationsCount to 0 on error', () => {
      mockNotificationsService.getNotificationsData.mockReturnValue(
        new (require('rxjs').Observable)((subscriber: any) => subscriber.error('error'))
      )
      component.getMyCount()
      expect(component.notificationsCount()).toBe(0)
    })
  })

  describe('displayLogo', () => {
    it('should set janDataEnable to false after animation duration', () => {
      jest.useFakeTimers()
      component.jan26Data = { desktop: { animationDuration: 1000 } }
      component.displayLogo()
      jest.advanceTimersByTime(1000)
      expect(component.janDataEnable()).toBe(false)
      jest.useRealTimers()
    })
  })

  describe('routeSubs', () => {
    it('should set showAppNavBar to false for public/home', () => {
      component.routeSubs({ url: '/public/home' } as any)
      expect(component.showAppNavBar()).toBe(false)
      expect(component.isPublicHomePage()).toBe(true)
    })

    it('should set showAppNavBar to false for viewer', () => {
      component.routeSubs({ url: '/viewer/pdf/123' } as any)
      expect(component.showAppNavBar()).toBe(false)
    })

    it('should set showAppNavBar to true for normal pages', () => {
      component.routeSubs({ url: '/page/learn' } as any)
      expect(component.showAppNavBar()).toBe(true)
    })

    it('should set isSetUpPage for /app/setup', () => {
      component.routeSubs({ url: '/app/setup' } as any)
      expect(component.isSetUpPage()).toBe(true)
    })
  })

  describe('cancelTour', () => {
    it('should call tourService.cancelPopupTour when popupTour exists', () => {
      component.popupTour = {}
      component.cancelTour()
      expect(mockTourService.cancelPopupTour).toHaveBeenCalled()
      expect(component.isTourGuideClosed()).toBe(false)
    })

    it('should not throw when popupTour is null', () => {
      component.popupTour = null
      expect(() => component.cancelTour()).not.toThrow()
    })
  })

  describe('bindUrl', () => {
    it('should set currentRoute for valid paths', () => {
      component.bindUrl('/page/learn')
      expect(component.currentRoute()).toBe('/page/learn')
    })

    it('should not set currentRoute for /app/competencies', () => {
      component.currentRoute.set('existing')
      component.bindUrl('/app/competencies')
      expect(component.currentRoute()).toBe('existing')
    })

    it('should not set currentRoute for empty string', () => {
      component.currentRoute.set('existing')
      component.bindUrl('')
      expect(component.currentRoute()).toBe('existing')
    })
  })

  describe('translateLabels', () => {
    it('should call langtranslations.translateLabelWithoutspace', () => {
      const result = component.translateLabels('test', 'type')
      expect(mockLangTranslations.translateLabelWithoutspace).toHaveBeenCalledWith('test', 'type', '')
      expect(result).toBe('test')
    })
  })

  describe('redirectToPath', () => {
    it('should navigate with queryParams when key exists', () => {
      component.redirectToPath({ path: '/app/seeAll', key: 'continueLearning' })
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/app/seeAll'],
        { queryParams: { key: 'continueLearning' } }
      )
    })

    it('should navigate without queryParams when no key', () => {
      component.redirectToPath({ path: '/page/home' })
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/page/home'])
    })
  })

  describe('openExploreMenu', () => {
    it('should set activeRoute and emit to configSvc', () => {
      component.openExploreMenu()
      expect(component.activeRoute()).toBe('explore')
      expect(mockConfigSvc.openExploreMenuForMWeb.value).toBe(true)
    })
  })

  describe('getKarmaCount', () => {
    it('should set countdata from localStorage', () => {
      component.getKarmaCount()
      expect(component.countdata()).toBe(100)
      expect(component.karmaPointLoading()).toBe(false)
    })

    it('should not update when localStorage is empty', () => {
      jest.spyOn(localStorage, 'getItem').mockReturnValue(null)
      component.karmaPointLoading.set(true)
      component.getKarmaCount()
      expect(component.karmaPointLoading()).toBe(true)
    })
  })

  describe('viewKarmapoints', () => {
    it('should navigate to karma-points page', () => {
      component.disableMenu.set(false)
      component.viewKarmapoints()
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/person-profile/karma-points'])
      expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalled()
    })

    it('should return false when menu is disabled', () => {
      component.disableMenu.set(true)
      const result = component.viewKarmapoints()
      expect(result).toBe(false)
    })
  })

  describe('raiseTelemetry', () => {
    it('should call events.raiseInteractTelemetry', () => {
      component.raiseTelemetry()
      expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'nav-karmapoints' }),
        {},
        expect.any(Object)
      )
    })
  })

  describe('handleNavigateBack', () => {
    it('should navigate to home when previousUrl includes /app/toc/do_', () => {
      component.previousUrl.set('/app/toc/do_123')
      component.handleNavigateBack()
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/page/home')
    })

    it('should navigate to home when previousUrl includes /viewer/pdf/do_', () => {
      component.previousUrl.set('/viewer/pdf/do_456')
      component.handleNavigateBack()
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/page/home')
    })

    it('should not navigate for other urls', () => {
      component.previousUrl.set('/page/learn')
      component.handleNavigateBack()
      expect(mockRouter.navigateByUrl).not.toHaveBeenCalled()
    })
  })

  describe('getItem', () => {
    it('should merge item with forPreview and enableLang', () => {
      const item = { type: 'profile', config: {} }
      const result = component.getItem(item)
      expect(result).toHaveProperty('forPreview')
      expect(result).toHaveProperty('enableLang')
      expect(result.type).toBe('profile')
    })
  })

  describe('fetchEnrollmentList', () => {
    it('should call userSvc.fetchUserBatchList', () => {
      component.fetchEnrollmentList()
      expect(mockUserSvc.fetchUserBatchList).toHaveBeenCalledWith('user-123')
    })
  })

  describe('ngOnDestroy', () => {
    it('should clear enrollInterval', () => {
      component.enrollInterval = setInterval(() => { }, 1000)
      const clearSpy = jest.spyOn(global, 'clearInterval')
      component.ngOnDestroy()
      expect(clearSpy).toHaveBeenCalled()
    })

    it('should not throw when no subscription or interval', () => {
      component.enrollInterval = null
      expect(() => component.ngOnDestroy()).not.toThrow()
    })
  })

  describe('computed signals', () => {
    it('needToHide should return false for normal routes', () => {
      component.currentRoute.set('/page/home')
      expect(component.needToHide()).toBe(false)
    })

    it('needToHide should return true for assessment routes', () => {
      component.currentRoute.set('/all/assessment/123')
      expect(component.needToHide()).toBe(true)
    })

    it('sShowAppNavBar should reflect showAppNavBar', () => {
      component.showAppNavBar.set(true)
      expect(component.sShowAppNavBar()).toBe(true)
      component.showAppNavBar.set(false)
      expect(component.sShowAppNavBar()).toBe(false)
    })
  })
})
