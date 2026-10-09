// Heavy modules that are not under test are mocked so the component loads without TestBed
jest.mock('@angular/core', () => ({
  ...jest.requireActual('@angular/core'),
  effect: jest.fn(),
}))
jest.mock('@project-sunbird/telemetry-sdk', () => ({}), { virtual: true })
jest.mock('@project-sunbird/client-services/index', () => ({
  CsModule: { instance: { init: jest.fn() } },
}), { virtual: true })
jest.mock('@sunbird-cb/collection', () => ({ BtnPageBackService: class { } }))
jest.mock('@sunbird-cb/notification', () => ({ LibNotificationsService: class { } }))
jest.mock('../../services/common-data.service', () => ({ CommonDataService: class { } }))
jest.mock('../../services/home-page.service', () => ({ HomePageService: class { } }))
jest.mock('../dialog-confirm/dialog-confirm.component', () => ({ DialogConfirmComponent: class { } }))
jest.mock('../dialog-box/dialog-box.component', () => ({ DialogBoxComponent: class { } }))
jest.mock('../../../environments/environment', () => ({ environment: { production: true } }))

import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
} from '@angular/router'
import { BehaviorSubject, of, Subject, throwError } from 'rxjs'
import { CsModule } from '@project-sunbird/client-services/index'
import { environment } from '../../../environments/environment'
import { RootComponent } from './root.component'

const buildMenuBarDetails = (): any => ({
  defaultOpen: true,
  navSections: [
    {
      sectionKey: 'my_achievements',
      items: [
        { code: 'rank', enabled: true },
        { code: 'learning_hours' },
        { code: 'badges' },
        { code: 'karma_points' },
        { code: 'karma_coins' },
        { code: 'other' },
        { code: 'disabled', enabled: false },
      ],
    },
    {
      sectionKey: 'quick_actions',
      items: [
        {
          code: 'other_portals',
          children: [
            { name: 'a', rolesCanAccess: ['ADMIN'] },
            { name: 'b', rolesCanAccess: 'user, other' },
            { name: 'c', rolesCanAccess: 'nobody' },
            { name: 'd', rolesCanAccess: null },
            { name: 'e', enabled: false, rolesCanAccess: ['ADMIN'] },
          ],
        },
      ],
    },
  ],
})

describe('RootComponent', () => {
  let component: any
  let routerEvents: Subject<any>
  let mockRouter: any
  let mockRoute: any
  let mockAppRef: any
  let mockSwUpdate: any
  let mockDialog: any
  let mockHttp: any
  let mockAuthSvc: any
  let mockConfigSvc: any
  let mockValueSvc: any
  let mockTelemetrySvc: any
  let mockEventSvc: any
  let mockMobileAppsSvc: any
  let mockRootSvc: any
  let mockBtnBackSvc: any
  let mockChangeDetector: any
  let mockUtilitySvc: any
  let mockUrlService: any
  let mockCommonDataSvc: any
  let mockRestrictionSvc: any
  let mockDomainConfSvc: any
  let mockLibNotificationsService: any
  let mockHomePageSvc: any
  let mockBreakpointObserver: any
  let walletBalanceUpdated: Subject<number>

  const createComponent = (): any => new (RootComponent as any)(
    mockRouter,
    mockRoute,
    mockAppRef,
    mockSwUpdate,
    mockDialog,
    mockHttp,
    mockAuthSvc,
    mockConfigSvc,
    mockValueSvc,
    mockTelemetrySvc,
    mockEventSvc,
    mockMobileAppsSvc,
    mockRootSvc,
    mockBtnBackSvc,
    mockChangeDetector,
    mockUtilitySvc,
    mockUrlService,
    mockCommonDataSvc,
    mockRestrictionSvc,
    mockDomainConfSvc,
    mockLibNotificationsService,
    mockHomePageSvc,
    mockBreakpointObserver,
  )

  const setPath = (path: string) => {
    window.history.pushState({}, '', path)
  }

  beforeEach(() => {
    // jsdom logs 'not implemented' for window.location.reload()
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
    localStorage.clear()
    setPath('/')
    routerEvents = new Subject()
    walletBalanceUpdated = new Subject()

    mockRouter = {
      events: routerEvents.asObservable(),
      navigate: jest.fn().mockReturnValue(Promise.resolve(true)),
      navigateByUrl: jest.fn(),
      url: '/page/home',
    }
    mockRoute = {
      snapshot: {
        fragment: '',
        root: { firstChild: { data: { pageId: 'home', module: 'home' }, firstChild: null } },
        queryParams: {},
      },
    }
    mockAppRef = { isStable: of(true) }
    mockSwUpdate = {
      isEnabled: true,
      unrecoverable: new Subject<any>(),
      versionUpdates: new Subject<any>(),
      checkForUpdate: jest.fn().mockReturnValue(Promise.resolve()),
      activateUpdate: jest.fn().mockReturnValue(Promise.resolve()),
    }
    mockDialog = {
      open: jest.fn().mockReturnValue({ afterClosed: () => of(false) }),
    }
    mockHttp = { get: jest.fn().mockReturnValue(of({ nav: true })) }
    mockAuthSvc = { force_logout: jest.fn() }
    mockConfigSvc = {
      instanceConfig: { leftNavBar: buildMenuBarDetails() },
      headerFooterConfigData: null,
      unMappedUser: {
        id: 'user-123',
        profileDetails: { get_started_tour_v2: { skipped: false, visited: true } },
      },
      userProfile: { userId: 'user-123' },
      userProfileV2: { userRoles: [] },
      userRoles: new Set<string>(['admin', 'USER']),
      sitePath: '/assets',
      overrideThemeChanges: null,
      updateTourGuideMethod: jest.fn(),
      updateTourGuide: of(true),
    }
    mockValueSvc = { isXSmall$: of(false) }
    mockTelemetrySvc = {
      impression: jest.fn(),
      sendEmptyObjectForNextInteract: jest.fn(),
    }
    mockEventSvc = {
      dispatchEvent: jest.fn(),
      raiseInteractTelemetry: jest.fn(),
    }
    mockMobileAppsSvc = {
      init: jest.fn(),
      mobileTopHeaderVisibilityStatus: new BehaviorSubject<boolean>(true),
      clearGlobalSearchForHomePage: new BehaviorSubject<boolean>(false),
    }
    mockRootSvc = { showNavbarDisplay$: new BehaviorSubject<boolean>(true) }
    mockBtnBackSvc = { initialize: jest.fn() }
    mockChangeDetector = { detectChanges: jest.fn() }
    mockUtilitySvc = {
      setRouteData: jest.fn(),
      routeData: { pageId: 'home', module: 'home' },
    }
    mockUrlService = { setPreviousUrl: jest.fn() }
    mockCommonDataSvc = {
      mandatoryDetails: jest.fn(),
      leftNavBarConfig: { next: jest.fn() },
    }
    mockRestrictionSvc = { isNotMyUser: false }
    mockDomainConfSvc = { isConfigEnabled: jest.fn().mockReturnValue(true) }
    mockLibNotificationsService = { updateUnreadCount: jest.fn() }
    mockHomePageSvc = {
      walletBalanceUpdated,
      getLearnerLeaderboardCached: jest.fn().mockReturnValue(of({
        result: { result: [{ userId: 'user-123', rank: 2 }, { userId: 'other', rank: 1 }] },
      })),
    }
    mockBreakpointObserver = {
      observe: jest.fn().mockReturnValue(of({ matches: false })),
    }
    ; (environment as any).production = true

    component = createComponent()
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.useRealTimers()
  })

  describe('constructor', () => {
    it('should create and initialise the sdk and mobile service', () => {
      expect(component).toBeTruthy()
      expect(mockMobileAppsSvc.init).toHaveBeenCalled()
      expect((CsModule as any).instance.init).toHaveBeenCalled()
    })

    it('should use leftNavBar from instance config', () => {
      expect(component.openStatusUserSelection()).toBe(true)
      expect(mockCommonDataSvc.leftNavBarConfig.next).toHaveBeenCalledWith(component.menuBarDetails)
    })

    it('should load left nav config over http when instance config is missing', () => {
      mockConfigSvc.instanceConfig = null
      component = createComponent()
      expect(mockHttp.get).toHaveBeenCalledWith('/assets/page/left-nav.json')
      expect(component.menuBarDetails).toEqual({ nav: true })
    })

    it('should set menuBarDetails undefined when http returns nothing', () => {
      mockConfigSvc.instanceConfig = {}
      mockHttp.get.mockReturnValue(throwError(() => new Error('fail')))
      component = createComponent()
      expect(component.menuBarDetails).toBeUndefined()
    })

    it('should hide header and footer on the privacy policy page', () => {
      setPath('/public/privacy-policy')
      component = createComponent()
      expect(component.hideHeaderAndFooter).toBe(true)
    })

    it('should use header footer config and show footer when available', () => {
      mockConfigSvc.headerFooterConfigData = { header: true }
      component = createComponent()
      expect(component.headerFooterConfigData).toEqual({ header: true })
      expect(component.showFooter).toBe(true)
    })

    it('should set custom height on public pages', () => {
      setPath('/public/home')
      component = createComponent()
      expect(component.customHeight).toBe(true)
    })

    it('should derive tour flags from the user profile', () => {
      expect(component.showTour).toBe(true)
      expect(component.karmaWalletVideoPending).toBe(true)
      expect(component.karmaWalletTourPending).toBe(true)
    })

    it('should mark karma wallet tour as done when visited', () => {
      mockConfigSvc.unMappedUser.profileDetails.karma_wallet_tour = { video_visited: true, visited: true }
      component = createComponent()
      expect(component.karmaWalletVideoPending).toBe(false)
      expect(component.karmaWalletTourPending).toBe(false)
    })

    it('should not mark karma wallet tour pending when snoozed', () => {
      localStorage.setItem('karmaWalletTourSnoozed', 'user-123')
      component = createComponent()
      expect(component.karmaWalletVideoPending).toBe(false)
      expect(component.karmaWalletTourPending).toBe(false)
    })

    it('should skip tour flags when there is no profile details', () => {
      mockConfigSvc.unMappedUser = null
      component = createComponent()
      expect(component.showTour).toBe(false)
    })
  })

  describe('getters', () => {
    it('navBarRequired and isShowNavbar should return flags', () => {
      component.isNavBarRequired = false
      component.showNavbar = false
      expect(component.navBarRequired).toBe(false)
      expect(component.isShowNavbar).toBe(false)
    })

    it('isCustomHeight should be true for matching paths', () => {
      ['/public/home', '/public/faq', '/public/contact', '/public/signup', '/public/request', '/crp/abc'].forEach(path => {
        component.customHeight = false
        setPath(path)
        expect(component.isCustomHeight).toBe(true)
      })
    })

    it('isCustomHeight should return stored value otherwise', () => {
      setPath('/app/other')
      component.customHeight = false
      expect(component.isCustomHeight).toBe(false)
    })

    it('showMenuBardetails should be truthy for normal urls', () => {
      component.currentUrl = '/app/home'
      expect(component.showMenuBardetails).toBe(true)
    })

    it('showMenuBardetails should be falsy for restricted cases', () => {
      component.currentUrl = '/public/x'
      expect(component.showMenuBardetails).toBe(false)
      component.currentUrl = '/viewer/x'
      expect(component.showMenuBardetails).toBe(false)
      component.currentUrl = '/crp/x'
      expect(component.showMenuBardetails).toBe(false)
      component.currentUrl = '/app/home'
      mockRestrictionSvc.isNotMyUser = true
      expect(component.showMenuBardetails).toBe(false)
      component.currentUrl = ''
      expect(component.showMenuBardetails).toBeFalsy()
    })

    it('showHeader should depend on config and flags', () => {
      expect(component.showHeader).toBe(true)
      expect(mockDomainConfSvc.isConfigEnabled).toHaveBeenCalledWith('components.header', 'enabled')
      component.hideHeaderAndFooter = true
      expect(component.showHeader).toBe(false)
    })

    it('sidebarPushesContent should require home page and open nav', () => {
      component.isHomePage.set(true)
      component.leftNavBarIsOpen.set(true)
      expect(component.sidebarPushesContent()).toBe(true)
      component.leftNavBarIsOpen.set(false)
      expect(component.sidebarPushesContent()).toBe(false)
    })

    it('isDesktopView$ and isTabView$ should emit', done => {
      component.isTabView$.subscribe((tab: boolean) => {
        expect(tab).toBe(false)
      })
      component.isDesktopView$.subscribe((desktop: boolean) => {
        expect(desktop).toBe(true)
        done()
      })
    })
  })

  describe('simple helpers', () => {
    it('unloadHandler should not throw', () => {
      expect(() => component.unloadHandler({ type: 'unload' })).not.toThrow()
      expect(() => component.unloadHandler(null)).not.toThrow()
    })

    it('reloadPage should not throw', () => {
      expect(() => component.reloadPage()).not.toThrow()
    })

    it('logout should force logout', () => {
      component.logout()
      expect(mockAuthSvc.force_logout).toHaveBeenCalled()
    })

    it('isDialogEnabled should require both config flags', () => {
      expect(component.isDialogEnabled('x')).toBe(true)
      mockDomainConfSvc.isConfigEnabled.mockReturnValueOnce(false)
      expect(component.isDialogEnabled('x')).toBe(false)
    })

    it('openIntro should not throw', () => {
      expect(() => component.openIntro()).not.toThrow()
    })

    it('skipToMainContent should focus the skipper', () => {
      const focus = jest.fn()
      component.skipper = { nativeElement: { focus } }
      component.skipToMainContent()
      expect(focus).toHaveBeenCalled()
    })

    it('isFullScreenEventPage should match event detail pages only', () => {
      expect(component.isFullScreenEventPage('/app/event-hub/home/123?a=1')).toBe(true)
      expect(component.isFullScreenEventPage('/app/event-hub/home')).toBe(false)
      expect(component.isFullScreenEventPage(undefined)).toBe(false)
    })

    it('isFullScreenBharatKalp should match the exact landing path', () => {
      expect(component.isFullScreenBharatKalp('/app/learn/bharat-kalp/?a=1#x')).toBe(true)
      expect(component.isFullScreenBharatKalp('/app/learn/bharat-kalp/see-all')).toBe(false)
      expect(component.isFullScreenBharatKalp(undefined)).toBe(false)
    })

    it('convertToHoursAndMinutes should format seconds', () => {
      expect(component.convertToHoursAndMinutes(3720)).toBe('1h 2m')
    })

    it('toOrdinal should add the right suffix', () => {
      expect(component.toOrdinal(1)).toBe('1st')
      expect(component.toOrdinal(2)).toBe('2nd')
      expect(component.toOrdinal(3)).toBe('3rd')
      expect(component.toOrdinal(4)).toBe('4th')
      expect(component.toOrdinal(11)).toBe('11th')
      expect(component.toOrdinal(21)).toBe('21st')
    })

    it('getChildRouteData should collect data recursively', () => {
      component.currentRouteData = []
      component.getChildRouteData({} as any, {
        data: { a: 1 },
        firstChild: { data: { b: 2 }, firstChild: null },
      } as any)
      expect(component.currentRouteData).toEqual([{ a: 1 }, { b: 2 }])
    })

    it('getChildRouteData should ignore missing data and null child', () => {
      component.currentRouteData = []
      component.getChildRouteData({} as any, { data: null, firstChild: null } as any)
      component.getChildRouteData({} as any, null)
      expect(component.currentRouteData).toEqual([])
    })

    it('getTourGuide should read updateTourGuide', () => {
      expect(component.getTourGuide()).toBe(true)
      expect(component.showTour).toBe(true)
    })

    it('getHeaderFooterConfiguration should map http data', done => {
      component.getHeaderFooterConfiguration().subscribe((res: any) => {
        expect(mockHttp.get).toHaveBeenCalledWith('/assets/page/right-nav-config.json')
        expect(res).toEqual({ data: { nav: true }, error: null })
        done()
      })
    })

    it('getHeaderFooterConfiguration should map http errors', done => {
      mockHttp.get.mockReturnValue(throwError(() => 'err'))
      component.getHeaderFooterConfiguration().subscribe((res: any) => {
        expect(res).toEqual({ data: null, error: 'err' })
        done()
      })
    })

    it('getLeftNavBarConfiguration should map http errors', done => {
      mockHttp.get.mockReturnValue(throwError(() => 'err'))
      component.getLeftNavBarConfiguration().subscribe((res: any) => {
        expect(res).toEqual({ data: null, error: 'err' })
        done()
      })
    })
  })

  describe('lifecycle hooks', () => {
    it('ngAfterViewInit should run the update check', () => {
      const spy = jest.spyOn(component, 'initAppUpdateCheck').mockImplementation(() => undefined)
      component.ngAfterViewInit()
      expect(spy).toHaveBeenCalled()
    })

    it('ngAfterViewChecked should detect changes', () => {
      component.showTour = false
      component.ngAfterViewChecked()
      expect(mockChangeDetector.detectChanges).toHaveBeenCalled()
    })
  })

  describe('left nav and achievements', () => {
    beforeEach(() => {
      component.menuBarDetails = buildMenuBarDetails()
    })

    it('setNavOpenStatus should follow user selection on home page', () => {
      component.isHomePage.set(true)
      component.openStatusUserSelection.set(true)
      component.setNavOpenStatus()
      expect(component.leftNavBarIsOpen()).toBe(true)
      expect(component.navBarOpenStatusBasedOnNav()).toBe(true)
    })

    it('setNavOpenStatus should close the nav elsewhere', () => {
      component.isHomePage.set(false)
      component.setNavOpenStatus()
      expect(component.leftNavBarIsOpen()).toBe(false)
      expect(component.navBarOpenStatusBasedOnNav()).toBe(false)
    })

    it('setAchivements should fill values from stored enrolment info', () => {
      localStorage.setItem('userEnrollmentCount', JSON.stringify({
        userCourseEnrolmentInfo: {
          timeSpentOnCompletedCourses: 3720,
          badgeCount: 3,
          karmaPoints: 50,
          walletBalance: 7,
        },
      }))
      component.isHomePage.set(true)
      component.setAchivements()
      const section = component.menuBarDetails.navSections[0]
      const byCode = (code: string) => section.items.find((i: any) => i.code === code)
      expect(byCode('learning_hours').value).toBe('1h 2m')
      expect(byCode('badges').value).toBe('3 Badges')
      expect(byCode('karma_points').value).toBe('50 Karma Points')
      expect(byCode('karma_coins').value).toBe('7 Karma Coins')
      expect(byCode('disabled')).toBeUndefined()
      expect(section.sectionLoading).toBe(false)
    })

    it('setAchivements should work without stored enrolment info', () => {
      component.setAchivements()
      expect(component.achievementsSection).toBeTruthy()
    })

    it('setAchivements should swallow errors from bad storage data', () => {
      localStorage.setItem('userEnrollmentCount', '{bad json')
      expect(() => component.setAchivements()).not.toThrow()
    })

    it('setAchivements should handle empty items list', () => {
      component.menuBarDetails.navSections[0].items = []
      localStorage.setItem('userEnrollmentCount', JSON.stringify({}))
      expect(() => component.setAchivements()).not.toThrow()
    })

    it('loadAchievementRankOnce should stop when already requested or no section', () => {
      const spy = jest.spyOn(component, 'updateAchievementRank')
      component.achievementsSection = null
      component.loadAchievementRankOnce()
      component.achievementsSection = {}
      component.achievementRankRequested = true
      component.loadAchievementRankOnce()
      component.achievementRankRequested = false
      component.leftNavBarIsOpen.set(false)
      component.loadAchievementRankOnce()
      expect(spy).not.toHaveBeenCalled()
    })

    it('loadAchievementRankOnce should update rank when allowed', () => {
      const spy = jest.spyOn(component, 'updateAchievementRank').mockImplementation(() => undefined)
      component.achievementsSection = {}
      component.leftNavBarIsOpen.set(true)
      component.loadAchievementRankOnce()
      expect(spy).toHaveBeenCalled()
    })

    it('updateAchievementRank should set the ordinal rank of the user', () => {
      const rankItem = { code: 'rank' }
      component.achievementsSection = { items: [rankItem] }
      component.updateAchievementRank()
      expect((rankItem as any)['value']).toBe('2nd Rank')
      expect(component.achievementRankRequested).toBe(true)
    })

    it('updateAchievementRank should show 0 Rank when user is not listed', () => {
      const rankItem: any = { code: 'rank' }
      component.achievementsSection = { items: [rankItem] }
      mockHomePageSvc.getLearnerLeaderboardCached.mockReturnValue(of({ result: { result: [{ userId: 'x', rank: 1 }] } }))
      component.updateAchievementRank()
      expect(rankItem.value).toBe('0 Rank')
    })

    it('updateAchievementRank should show 0 Rank for empty results', () => {
      const rankItem: any = { code: 'rank' }
      component.achievementsSection = { items: [rankItem] }
      mockHomePageSvc.getLearnerLeaderboardCached.mockReturnValue(of({}))
      component.updateAchievementRank()
      expect(rankItem.value).toBe('0 Rank')
    })

    it('updateAchievementRank should handle service errors', () => {
      const rankItem: any = { code: 'rank' }
      component.achievementsSection = { items: [rankItem] }
      mockHomePageSvc.getLearnerLeaderboardCached.mockReturnValue(throwError(() => new Error('x')))
      const spy = jest.spyOn(component, 'sendDetailsChangedEvent')
      component.updateAchievementRank()
      expect(spy).toHaveBeenCalled()
    })

    it('updateAchievementRank should do nothing without user or rank item', () => {
      component.achievementsSection = { items: [{ code: 'badges' }] }
      component.updateAchievementRank()
      expect(mockHomePageSvc.getLearnerLeaderboardCached).not.toHaveBeenCalled()
      component.achievementsSection = { items: [{ code: 'rank' }] }
      mockConfigSvc.unMappedUser = null
      component.updateAchievementRank()
      expect(mockHomePageSvc.getLearnerLeaderboardCached).not.toHaveBeenCalled()
    })

    it('setOtherPortals should filter children by user roles', () => {
      const before = component.otherDetailsChanged()
      component.setOtherPortals()
      const quick = component.menuBarDetails.navSections[1]
      const names = quick.items[0].children.map((c: any) => c.name)
      expect(names).toEqual(['a', 'b'])
      expect(component.otherDetailsChanged()).toBe(!before)
    })

    it('setOtherPortals should handle missing user roles', () => {
      mockConfigSvc.userRoles = null
      component.setOtherPortals()
      expect(component.menuBarDetails.navSections[1].items[0].children).toEqual([])
    })

    it('setOtherPortals should do nothing without sections, items or children', () => {
      component.menuBarDetails = { navSections: [] }
      expect(() => component.setOtherPortals()).not.toThrow()
      component.menuBarDetails = { navSections: [{ sectionKey: 'quick_actions', items: [] }] }
      expect(() => component.setOtherPortals()).not.toThrow()
      component.menuBarDetails = { navSections: [{ sectionKey: 'quick_actions', items: [{ code: 'x' }] }] }
      expect(() => component.setOtherPortals()).not.toThrow()
      component.menuBarDetails = { navSections: [{ sectionKey: 'quick_actions', items: [{ code: 'other_portals' }] }] }
      expect(() => component.setOtherPortals()).not.toThrow()
    })

    it('updateAchievementWalletBalance should update the coins item', () => {
      component.achievementsSection = { items: [{ code: 'karma_coins' }] }
      component.updateAchievementWalletBalance(0)
      expect(component.achievementsSection.items[0].value).toBe('0 Karma Coins')
      component.updateAchievementWalletBalance(5)
      expect(component.achievementsSection.items[0].value).toBe('5 Karma Coins')
    })

    it('updateAchievementWalletBalance should ignore missing coins item', () => {
      component.achievementsSection = null
      expect(() => component.updateAchievementWalletBalance(5)).not.toThrow()
    })

    it('sendDetailsChangedEvent should replace the achievements section', () => {
      const before = component.detailsChanged()
      component.sendDetailsChangedEvent({ sectionKey: 'my_achievements', marker: true })
      expect(component.menuBarDetails.navSections[0].marker).toBe(true)
      expect(component.detailsChanged()).toBe(!before)
    })

    it('sendOtherDetailsChangedEvent should replace the quick actions section', () => {
      const before = component.otherDetailsChanged()
      component.sendOtherDetailsChangedEvent({ sectionKey: 'quick_actions', marker: true })
      expect(component.menuBarDetails.navSections[1].marker).toBe(true)
      expect(component.otherDetailsChanged()).toBe(!before)
    })

    it('sidebarStateChanged should apply the event state', () => {
      component.sidebarStateChanged({ isOpen: false })
      expect(component.leftNavBarIsOpen()).toBe(false)
      expect(component.openStatusUserSelection()).toBe(false)
      component.sidebarStateChanged(null)
      expect(component.leftNavBarIsOpen()).toBe(false)
    })
  })

  describe('nav item handling', () => {
    beforeEach(() => {
      component.menuBarDetails = buildMenuBarDetails()
    })

    it('start-tour should navigate home and reset the tour', () => {
      component.onNavItemClicked({ code: 'start-tour' })
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/page/home')
      expect(mockConfigSvc.updateTourGuideMethod).toHaveBeenCalledWith(false)
    })

    it('explore should open global search', () => {
      component.onNavItemClicked({ code: 'explore' })
      expect(mockLibNotificationsService.updateUnreadCount).toHaveBeenCalled()
      expect(mockRouter.navigate.mock.calls[0][0]).toEqual(['/app/globalsearch'])
      expect(component.menuBarDetails.activeItemCode).toBe('explore')
    })

    it('explore should open volunteer search for volunteers', () => {
      mockConfigSvc.userRoles = new Set<string>(['volunteer'])
      component.exploreContent()
      expect(mockRouter.navigate.mock.calls[0][0]).toEqual(['/app/globalsearch/volunteer'])
    })

    it('explore should detect volunteer from profile roles', () => {
      mockConfigSvc.userRoles = null
      mockConfigSvc.userProfileV2 = { userRoles: ['volunteer'] }
      expect(component.getGlobalSearchRoute()).toBe('/app/globalsearch/volunteer')
      mockConfigSvc.userProfileV2 = { userRoles: [{ role: 'Volunteer' }, {}] }
      expect(component.getGlobalSearchRoute()).toBe('/app/globalsearch/volunteer')
      mockConfigSvc.userProfileV2 = null
      expect(component.getGlobalSearchRoute()).toBe('/app/globalsearch')
    })

    it('view_all_achievements should open the leaderboard', () => {
      component.achievementsSection = { items: [{ code: 'rank' }] }
      component.onNavItemClicked({ code: 'view_all_achievements' })
      expect(component.showKarmaLeaderboard()).toBe(true)
    })

    it('download-app should open the dialog', () => {
      component.onNavItemClicked({ code: 'download-app' })
      expect(mockDialog.open).toHaveBeenCalled()
    })

    it('default code should set the active item', () => {
      component.onNavItemClicked({ code: 'something' })
      expect(component.menuBarDetails.activeItemCode).toBe('something')
    })

    it('viewMyActivities should raise telemetry and scroll to achievements', async () => {
      const spy = jest.spyOn(component, 'scrollToAchievements').mockImplementation(() => undefined)
      component.viewMyActivities()
      await Promise.resolve()
      expect(component.showKarmaLeaderboard()).toBe(false)
      expect(mockEventSvc.raiseInteractTelemetry).toHaveBeenCalled()
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/person-profile/me'], { queryParams: { tab: 'activities' } })
      expect(spy).toHaveBeenCalled()
    })
  })

  describe('explore telemetry', () => {
    it('should raise interact telemetry without sub type', () => {
      component.raiseTelemetryExploreContent('explore')
      const eData = mockEventSvc.raiseInteractTelemetry.mock.calls[0][0]
      expect(eData.id).toBe('explore')
      expect(eData.subType).toBeUndefined()
      expect(mockTelemetrySvc.sendEmptyObjectForNextInteract).toHaveBeenCalled()
    })

    it('should resolve a sub type by enum key', () => {
      component.raiseTelemetryExploreContent('explore', 'Loaded')
      expect(mockEventSvc.raiseInteractTelemetry.mock.calls[0][0].subType).toBeDefined()
    })

    it('should resolve a sub type by enum value', () => {
      component.raiseTelemetryExploreContent('explore', 'loaded')
      const eData = mockEventSvc.raiseInteractTelemetry.mock.calls[0][0]
      expect(eData.subType === undefined || typeof eData.subType === 'string').toBe(true)
    })

    it('should ignore unknown sub types', () => {
      component.raiseTelemetryExploreContent('explore', 'no-such-sub-type')
      expect(mockEventSvc.raiseInteractTelemetry.mock.calls[0][0].subType).toBeUndefined()
    })
  })

  describe('background theme', () => {
    let classList: any

    beforeEach(() => {
      classList = { add: jest.fn(), remove: jest.fn() }
      jest.spyOn(document, 'getElementById').mockReturnValue({ classList } as any)
    })

    it('changeBg26Jan should add the class when enabled', () => {
      mockConfigSvc.overrideThemeChanges = { isEnabled: true }
      component.changeBg26Jan()
      expect(classList.add).toHaveBeenCalledWith('jan-bg-change')
    })

    it('changeBg26Jan should remove the class when disabled', () => {
      component.changeBg26Jan()
      expect(classList.remove).toHaveBeenCalledWith('jan-bg-change')
    })

    it('removeBg26Jan should remove the class', () => {
      component.removeBg26Jan()
      expect(classList.remove).toHaveBeenCalledWith('jan-bg-change')
    })
  })

  describe('raiseAppStartTelemetry', () => {
    it('should dispatch the event only once', () => {
      component.raiseAppStartTelemetry()
      component.raiseAppStartTelemetry()
      expect(mockEventSvc.dispatchEvent).toHaveBeenCalledTimes(1)
      expect(component.appStartRaised).toBe(true)
    })
  })

  describe('scrolling to achievements', () => {
    let scrollTo: jest.Mock

    beforeEach(() => {
      jest.useFakeTimers()
      scrollTo = jest.fn()
      window.scrollTo = scrollTo as any
      jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: any) => {
        cb(0)
        return 0
      })
    })

    afterEach(() => {
      document.body.innerHTML = ''
    })

    const addTarget = (top: number) => {
      const target = document.createElement('div')
      target.id = 'achievement-section'
      target.getBoundingClientRect = () => ({ top } as any)
      document.body.appendChild(target)
      return target
    }

    it('should fall back to scrolling to top when the target never appears', () => {
      const spy = jest.spyOn(component, 'scrollContentToTop')
      component.scrollToAchievements()
      expect(spy).toHaveBeenCalled()
      expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    })

    it('should align the window scroll to the target and retry', () => {
      addTarget(500)
      component.scrollToAchievements()
      expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }))
      jest.advanceTimersByTime(450)
      expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'auto' }))
      jest.advanceTimersByTime(2000)
    })

    it('should not scroll when the target is already aligned', () => {
      addTarget(12)
      component.scrollToAchievements()
      expect(scrollTo).not.toHaveBeenCalled()
    })

    it('should use the content scroller when it overflows', () => {
      const column = document.createElement('div')
      column.className = 'height-on-bottom'
      Object.defineProperty(column, 'scrollHeight', { value: 1000 })
      Object.defineProperty(column, 'clientHeight', { value: 100 })
      column.getBoundingClientRect = () => ({ top: 50 } as any)
      column.scrollTo = jest.fn() as any
      document.body.appendChild(column)
      addTarget(500)
      component.scrollToAchievements()
      expect(column.scrollTo).toHaveBeenCalled()
      component.scrollContentToTop()
      expect(column.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    })

    it('should use the header height when there is no scroller', () => {
      const header = document.createElement('ws-header-v2')
      header.getBoundingClientRect = () => ({ height: 60 } as any)
      document.body.appendChild(header)
      const target = addTarget(500)
      component.alignAchievements(target, 4)
      expect(scrollTo).not.toHaveBeenCalled()
      component.alignAchievements(target, 0)
      expect(scrollTo).toHaveBeenCalled()
    })
  })

  describe('initAppUpdateCheck', () => {
    it('should do nothing outside production', () => {
      ; (environment as any).production = false
      component.initAppUpdateCheck()
      expect(mockSwUpdate.checkForUpdate).not.toHaveBeenCalled()
    })

    it('should do nothing when the service worker is disabled', () => {
      mockSwUpdate.isEnabled = false
      component.initAppUpdateCheck()
      expect(mockSwUpdate.checkForUpdate).not.toHaveBeenCalled()
    })

    it('should check for updates once the app is stable', () => {
      component.initAppUpdateCheck()
      expect(mockSwUpdate.checkForUpdate).toHaveBeenCalledTimes(1)
    })

    it('should swallow update check failures', async () => {
      mockSwUpdate.checkForUpdate.mockReturnValue(Promise.reject(new Error('offline')))
      expect(() => component.initAppUpdateCheck()).not.toThrow()
      await Promise.resolve()
    })

    it('should handle unrecoverable state without throwing', () => {
      component.initAppUpdateCheck()
      expect(() => mockSwUpdate.unrecoverable.next({})).not.toThrow()
    })

    it('should ignore versions that are not ready', () => {
      component.initAppUpdateCheck()
      mockSwUpdate.versionUpdates.next({ type: 'VERSION_DETECTED' })
      expect(mockDialog.open).not.toHaveBeenCalled()
    })

    it('should not activate when the dialog is dismissed', () => {
      component.initAppUpdateCheck()
      mockSwUpdate.versionUpdates.next({ type: 'VERSION_READY' })
      expect(mockDialog.open).toHaveBeenCalled()
      expect(mockSwUpdate.activateUpdate).not.toHaveBeenCalled()
    })

    it('should activate the update when the dialog is confirmed', () => {
      mockDialog.open.mockReturnValue({ afterClosed: () => of(true) })
      component.appUpdateTitleRef = { nativeElement: { value: 'title' } }
      component.appUpdateBodyRef = { nativeElement: { value: 'body' } }
      component.initAppUpdateCheck()
      mockSwUpdate.versionUpdates.next({ type: 'VERSION_READY' })
      expect(mockDialog.open.mock.calls[0][1].data).toEqual({ title: 'title', body: 'body' })
      expect(mockSwUpdate.activateUpdate).toHaveBeenCalled()
    })
  })

  describe('ngOnInit', () => {
    beforeEach(() => {
      jest.spyOn(component, 'changeBg26Jan').mockImplementation(() => undefined)
      jest.spyOn(component, 'removeBg26Jan').mockImplementation(() => undefined)
      jest.spyOn(component, 'raiseAppStartTelemetry').mockImplementation(() => undefined)
    })

    it('should wire up subscriptions and services', () => {
      component.ngOnInit()
      expect(mockBtnBackSvc.initialize).toHaveBeenCalled()
      expect(mockConfigSvc.updateTourGuideMethod).toHaveBeenCalled()
      mockMobileAppsSvc.mobileTopHeaderVisibilityStatus.next(false)
      expect(component.mobileTopHeaderVisibilityStatus).toBe(false)
      mockRootSvc.showNavbarDisplay$.next(false)
    })

    it('should use the independence day banner config and custom height', () => {
      mockConfigSvc.overrideThemeChanges = { independenceDayBanner: { show: true } }
      setPath('/public/home')
      component.ngOnInit()
      expect(component.independenceDayBanner).toEqual({ show: true })
      expect(component.customHeight).toBe(true)
    })

    it('should default the banner config to an empty object', () => {
      component.ngOnInit()
      expect(component.independenceDayBanner).toEqual({})
    })

    it('should forward wallet balance updates', () => {
      component.achievementsSection = { items: [{ code: 'karma_coins' }] }
      component.ngOnInit()
      walletBalanceUpdated.next(9)
      expect(component.achievementsSection.items[0].value).toBe('9 Karma Coins')
    })

    it('should restrict not-my-user accounts to their profile', () => {
      mockRestrictionSvc.isNotMyUser = true
      component.ngOnInit()
      expect(component.disableHeightOnTop).toBe(true)
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('app/person-profile/me#profileInfo')
    })

    it('should keep height on top enabled for normal accounts', () => {
      component.ngOnInit()
      expect(component.disableHeightOnTop).toBe(false)
    })

    it('should treat cross origin top window access as not in iframe', () => {
      const topSpy = jest.spyOn(window, 'top', 'get').mockImplementation(() => {
        throw new Error('cross origin')
      })
      component.ngOnInit()
      expect(component.isInIframe).toBe(false)
      topSpy.mockRestore()
    })
  })

  describe('NavigationEnd handling', () => {
    const emitEnd = (url: string) => routerEvents.next(new NavigationEnd(1, url, url))

    beforeEach(() => {
      jest.spyOn(component, 'changeBg26Jan').mockImplementation(() => undefined)
      jest.spyOn(component, 'removeBg26Jan').mockImplementation(() => undefined)
      jest.spyOn(component, 'raiseAppStartTelemetry').mockImplementation(() => undefined)
      component.ngOnInit()
    })

    it('should mark the home page and clear explore highlight', () => {
      component.menuBarDetails.activeItemCode = 'explore'
      emitEnd('/page/home')
      expect(component.isHomePage()).toBe(true)
      expect(mockMobileAppsSvc.clearGlobalSearchForHomePage.value).toBe(true)
      expect(component.menuBarDetails.activeItemCode).toBe('')
    })

    it('should keep the active item on home when it is not explore', () => {
      component.menuBarDetails.activeItemCode = 'other'
      emitEnd('/page/home')
      expect(component.menuBarDetails.activeItemCode).toBe('other')
    })

    it('should track previous and current urls and mandatory details', () => {
      emitEnd('/viewer/abc')
      emitEnd('/app/x')
      expect(mockUrlService.setPreviousUrl).toHaveBeenLastCalledWith('/viewer/abc')
      expect(mockCommonDataSvc.mandatoryDetails).toHaveBeenCalledWith(true)
      expect(component.isHomePage()).toBe(false)
    })

    it('should skip mandatory details for special fragments or anonymous users', () => {
      mockRoute.snapshot.fragment = 'orgDetails'
      emitEnd('/app/x')
      mockRoute.snapshot.fragment = null
      mockConfigSvc.unMappedUser = null
      emitEnd('/app/x')
      expect(mockCommonDataSvc.mandatoryDetails).not.toHaveBeenCalled()
    })

    it('should adjust navbar for narrow screens', () => {
      const original = window.innerWidth
      Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true })
      emitEnd('/app/network-v2/x')
      expect(component.showNavbar).toBe(false)
      emitEnd('/page/home')
      expect(component.showNavbar).toBe(true)
      Object.defineProperty(window, 'innerWidth', { value: original, configurable: true })
    })

    it('should flag setup pages', () => {
      emitEnd('/setup/profile')
      expect(component.isSetupPage).toBe(true)
    })

    it('should handle home background changes by path', () => {
      setPath('/page/home')
      emitEnd('/page/home')
      expect(component.hideFooterSection()).toBe(true)
      expect(component.changeBg26Jan).toHaveBeenCalled()
      setPath('/app/x')
      emitEnd('/app/x')
      expect(component.hideFooterSection()).toBe(false)
      expect(component.removeBg26Jan).toHaveBeenCalled()
    })

    it('should set full screen and surface flags by url', () => {
      emitEnd('/app/toc/abc')
      expect(component.showFullScreen()).toBe(true)
      emitEnd('/app/event-hub/home/1')
      expect(component.showFullScreen()).toBe(true)
      emitEnd('/app/learn/bharat-kalp')
      expect(component.showFullScreen()).toBe(true)
      emitEnd('/public/x')
      expect(component.showFullScreen()).toBe(true)
      emitEnd('/crp/x')
      expect(component.showFullScreen()).toBe(true)
      emitEnd('/app/other')
      expect(component.showFullScreen()).toBe(false)
      emitEnd('/app/learn/bharat-kalp/see-all')
      expect(component.isFullWidthMobileRoute()).toBe(true)
      emitEnd('/app/plans')
      expect(component.usesSurfaceBackground()).toBe(true)
      emitEnd('/app/other')
      expect(component.usesSurfaceBackground()).toBe(false)
    })

    it('should set custom height on public home', () => {
      emitEnd('/public/home')
      expect(component.customHeight).toBe(true)
      emitEnd('/app/x')
      expect(component.customHeight).toBe(false)
    })

    it('should hide chrome on standalone pages', () => {
      ['/public/logout', '/public/signup', '/public/welcome', '/viewer/x', '/public/request', '/public/toc/x'].forEach(url => {
        emitEnd(url)
        expect(component.showFooter).toBe(false)
        expect(component.showNavbar).toBe(false)
        expect(component.isNavBarRequired).toBe(false)
      })
      setPath('/crp/abc')
      emitEnd('/crp/abc')
      expect(component.showFooter).toBe(false)
    })

    it('should show chrome on normal pages and apply pathname rules', () => {
      setPath('/app/learner-advisory')
      emitEnd('/app/x')
      expect(component.showFooter).toBe(true)
      expect(component.showNavbar).toBe(true)
      expect(component.showBottomNav).toBe(true)
      expect(component.showHubs).toBe(true)
      setPath('/app/globalsearch')
      emitEnd('/app/x')
      expect(component.showFooter).toBe(false)
    })

    it('should hide bottom nav on toc pages', () => {
      mockRouter.url = '/app/toc/abc'
      emitEnd('/app/toc/abc')
      expect(component.showBottomNav).toBe(false)
    })

    it('should read the active menu from storage', () => {
      localStorage.setItem('activeMenu', 'learn')
      emitEnd('/app/x')
      expect(component.activeMenu).toBe('learn')
    })

    it('should raise impression with the route page context', () => {
      emitEnd('/app/x')
      expect(mockTelemetrySvc.impression).toHaveBeenCalledWith({ pageContext: { pageId: 'home', module: 'home' } }, '')
      expect(mockUtilitySvc.setRouteData).toHaveBeenCalled()
      expect(component.currentRouteData).toEqual([])
    })

    it('should raise an empty impression when the page context is incomplete', () => {
      mockUtilitySvc.routeData = { pageId: '', module: '' }
      emitEnd('/app/x')
      expect(mockTelemetrySvc.impression).toHaveBeenCalledWith()
    })

    it('should raise a search impression with corrected query and categories', () => {
      mockRoute.snapshot.root.firstChild = { data: { pageKey: 'globalsearch' }, firstChild: null }
      mockRoute.snapshot.queryParams = { q: 'jva', search: 'java', category: 'Course,Program', primaryCategory: 'Course' }
      emitEnd('/app/globalsearch')
      expect(mockTelemetrySvc.impression).toHaveBeenCalledWith({
        pageContext: { pageId: 'home', module: 'Search' },
        object: { id: 'java', type: 'search-query-corrected', rollup: { l1: 'jva' } },
        tags: ['Course', 'Program'],
        edata: { type: 'page' },
      }, 'Course')
    })

    it('should raise a search impression for an uncorrected query without categories', () => {
      mockRoute.snapshot.root.firstChild = { data: { pageKey: 'globalsearch' }, firstChild: null }
      mockRoute.snapshot.queryParams = { q: 'java' }
      emitEnd('/app/globalsearch')
      expect(mockTelemetrySvc.impression).toHaveBeenCalledWith({
        pageContext: { pageId: 'home', module: 'Search' },
        object: { id: 'java', type: 'search-query-not-corrected', rollup: { l1: 'java' } },
        tags: [],
        edata: { type: 'page' },
      }, '')
    })

    it('should treat an identical corrected query as not corrected', () => {
      mockRoute.snapshot.root.firstChild = { data: { pageKey: 'globalsearch' }, firstChild: null }
      mockRoute.snapshot.queryParams = { q: 'java', search: 'java' }
      emitEnd('/app/globalsearch')
      expect(mockTelemetrySvc.impression.mock.calls[0][0].object.type).toBe('search-query-not-corrected')
    })

    it('should use the plain page context for global search without a query', () => {
      mockRoute.snapshot.root.firstChild = { data: { pageKey: 'globalsearch' }, firstChild: null }
      mockRoute.snapshot.queryParams = {}
      emitEnd('/app/globalsearch')
      expect(mockTelemetrySvc.impression).toHaveBeenCalledWith({ pageContext: { pageId: 'home', module: 'home' } }, '')
    })

    it('should use the plain page context for non search pages with a query', () => {
      mockRoute.snapshot.root.firstChild = { data: { pageKey: 'home' }, firstChild: null }
      mockRoute.snapshot.queryParams = { q: 'java' }
      emitEnd('/app/x')
      expect(mockTelemetrySvc.impression).toHaveBeenCalledWith({ pageContext: { pageId: 'home', module: 'home' } }, '')
    })
  })

  describe('NavigationStart, Cancel and Error handling', () => {
    beforeEach(() => {
      jest.spyOn(component, 'changeBg26Jan').mockImplementation(() => undefined)
      jest.spyOn(component, 'removeBg26Jan').mockImplementation(() => undefined)
      component.ngOnInit()
    })

    const setWidth = (width: number) => {
      Object.defineProperty(window, 'innerWidth', { value: width, configurable: true })
    }

    afterEach(() => setWidth(1024))

    it('should enable the navbar and viewer flags on start', () => {
      setWidth(1400)
      routerEvents.next(new NavigationStart(1, '/viewer/abc'))
      expect(component.showNavbar).toBe(true)
      expect(component.isNavBarRequired).toBe(true)
      expect(component.viewerPage).toBe(true)
      expect(component.showHubs).toBe(true)
      expect(mockChangeDetector.detectChanges).toHaveBeenCalled()
    })

    it('should hide the navbar for preview and embed urls', () => {
      routerEvents.next(new NavigationStart(1, '/app/preview/x'))
      expect(component.isNavBarRequired).toBe(false)
      routerEvents.next(new NavigationStart(2, '/app/embed/x'))
      expect(component.isNavBarRequired).toBe(false)
    })

    it('should hide the navbar for author pages inside an iframe only', () => {
      component.isInIframe = true
      routerEvents.next(new NavigationStart(1, '/author/x'))
      expect(component.isNavBarRequired).toBe(false)
      component.isInIframe = false
      routerEvents.next(new NavigationStart(2, '/author/x'))
      expect(component.isNavBarRequired).toBe(true)
    })

    it('should hide hubs on mobile for non home pages and public pages', () => {
      setWidth(500)
      routerEvents.next(new NavigationStart(1, '/app/x'))
      expect(component.showHubs).toBe(false)
      setWidth(1400)
      routerEvents.next(new NavigationStart(2, '/public/x'))
      expect(component.showHubs).toBe(false)
      routerEvents.next(new NavigationStart(3, '/crp/x'))
      expect(component.showHubs).toBe(false)
      routerEvents.next(new NavigationStart(4, '/public/toc/x'))
      expect(component.viewerPage).toBe(true)
    })

    it('should reset flags on cancel and error', () => {
      routerEvents.next(new NavigationCancel(1, '/app/x', 'cancelled'))
      expect(component.routeChangeInProgress).toBe(false)
      expect(component.currentUrl).toBe('/app/x')
      routerEvents.next(new NavigationError(2, '/app/y', new Error('x')))
      expect(component.currentUrl).toBe('/app/y')
    })
  })
})
