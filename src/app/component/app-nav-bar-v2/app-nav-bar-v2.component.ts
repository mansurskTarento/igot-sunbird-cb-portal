import { Component, computed, effect, input, OnChanges, OnDestroy, OnInit, output, signal, SimpleChanges } from '@angular/core'
import { CommonModule } from '@angular/common'
import { DomSanitizer, SafeUrl } from '@angular/platform-browser'
import { Router, NavigationEnd, NavigationStart, RouterModule } from '@angular/router'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatIconModule } from '@angular/material/icon'
import { MatMenuModule } from '@angular/material/menu'
import { MatTooltipModule } from '@angular/material/tooltip'

import { IBtnAppsConfig, CustomTourService, WidgetUserService, BtnProfileModule } from '@sunbird-cb/collection'
import { NsWidgetResolver, WidgetResolverModule } from '@sunbird-cb/resolver'
import {
  ConfigurationsService,
  DomainConfService,
  EventService,
  MultilingualTranslationsService,
  NsInstanceConfig,
  NsPage,
  WsEvents
} from '@sunbird-cb/utils-v2'

import * as _ from 'lodash'
import { LibNotificationsService } from '@sunbird-cb/notification'
import { filter, map, Subscription } from 'rxjs'
import { UrlService } from '../../shared/url.service'
import { NotificationsService } from '../../services/notifications.service'
import { UserRestrictionService } from '../../services/user-restriction.service'
import { HeaderModule } from '../../header/header.module'
import { SearchInputHomeV4Component } from '../../../../project/ws/app/src/lib/routes/search-v3/components/search-input-home-v4/search-input-home-v4.component'
import { TopRightNavBarV2Component } from '../top-right-nav-bar-v2/top-right-nav-bar-v2.component'
import { BtnFeatureV2Component } from '@sunbird-cb/consumption'
import { ThemeService } from '@sunbird-cb/design-system'
import { BreakpointObserver } from '@angular/cdk/layout'

@Component({
  selector: 'ws-app-nav-bar-v2',
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    MatToolbarModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    WidgetResolverModule,
    HeaderModule,
    SearchInputHomeV4Component,
    BtnFeatureV2Component,
    TopRightNavBarV2Component,
    BtnProfileModule
  ],
  templateUrl: './app-nav-bar-v2.component.html',
  styleUrl: './app-nav-bar-v2.component.scss'
})
export class AppNavBarV2Component implements OnInit, OnChanges, OnDestroy {
  // Inputs using Angular 20 input() signal
  mode = input<'top' | 'bottom'>('top');
  showKarmaLeaderboard = input<boolean>(false)
  headerFooterConfigData = input<any>();
  leftNavBarOpen = input<boolean>(false);

  viewAchivements = output<boolean>()
  // Matches BREAKPOINT_QUERIES.TABLET in sb-uic-dynamic-sidebar and isTabView$ in root
  isTabView$ = this.breakpointObserver
    .observe(['(min-width: 600px) and (max-width: 1024px)'])
    .pipe(map(state => state.matches))

  // State signals
  hideKPOnNav = signal(false);
  showAppNavBar = signal(false);
  isPublicHomePage = signal(false);
  isSetUpPage = signal(false);
  isLoggedIn = signal(false);
  activeRoute = signal('');
  countdata = signal<any>(0);
  karmaPointLoading = signal(true);
  notificationsCount = signal(0);
  janDataEnable = signal(true);
  isHubEnable = signal(true);
  previousUrl = signal('');
  disableMenu = signal(false);
  showLangDropdown = signal(true);
  isTourGuideAvailable = signal(false);
  isTourGuideClosed = signal(false);
  activeItemKey = signal('')

  // Tracks the router url; kept as a signal so computeds below re-evaluate on navigation
  currentHref = signal(window.location.href);

  // Computed signals replacing getters
  isPlayerPage = computed(() => this.currentHref().includes('/viewer/'));

  stillOnHomePage = computed(() => {
    return this.currentHref().includes('/public/home')
  });

  fullMenuDispaly = computed(() => {
    return !(this.isPlayerPage() || this.stillOnHomePage())
  });

  sShowAppNavBar = computed(() => this.showAppNavBar());

  needToHide = computed(() => this.currentRoute().includes('all/assessment/'));

  isforPreview = computed(() => {
    return window.location.href.includes('/public/') ||
      window.location.href.includes('&preview=true') ||
      window.location.href.includes('/certs')
  });

  isenableLang = computed(() => {
    return window.location.href.includes('/public/faq') ||
      window.location.href.includes('/public/contact')
  });

  isThisSetUpPage = computed(() => {
    return window.location.pathname.includes('/app/setup')
  });

  // Regular properties
  basicBtnAppsConfig: NsWidgetResolver.IRenderConfigWithTypedData<IBtnAppsConfig> = {
    widgetType: 'actionButton',
    widgetSubType: 'actionButtonApps',
    widgetData: { allListingUrl: '' },
  };

  btnAppsConfig!: NsWidgetResolver.IRenderConfigWithTypedData<IBtnAppsConfig>
  appIcon: SafeUrl | null = null;
  appIconSecondary: SafeUrl | null = null;
  appBottomIcon?: SafeUrl
  primaryNavbarBackground: Partial<NsPage.INavBackground> | null = null;
  primaryNavbarConfig: NsInstanceConfig.IPrimaryNavbarConfig | null = null;
  filteredPrimaryNavbarConfig: NsInstanceConfig.IPrimaryNavbarConfig | null = null;
  // primaryNavbarConfig: any
  pageNavbar: Partial<NsPage.INavBackground> | null = null;
  featureApps: string[] = [];
  isHelpMenuRestricted = false;
  popupTour: any
  currentRoute = signal('page/home');
  enrollInterval: any
  tooltipDelay = 1000;
  jan26Data: any
  logoDisplayTime: any
  redirectPath = '/page/home';

  private myNotificationsSubscription?: Subscription

  constructor(
    private domSanitizer: DomSanitizer,
    private configSvc: ConfigurationsService,
    private tourService: CustomTourService,
    private router: Router,
    private translate: TranslateService,
    private events: EventService,
    private langtranslations: MultilingualTranslationsService,
    private urlService: UrlService,
    private userSvc: WidgetUserService,
    private notificationsService: NotificationsService,
    private libNotificationsService: LibNotificationsService,
    private domainConfSvc: DomainConfService,
    private themeSvc: ThemeService,
    private restrictionSvc: UserRestrictionService,
    private breakpointObserver: BreakpointObserver
  ) {
    this.btnAppsConfig = { ...this.basicBtnAppsConfig }

    if (this.configSvc.restrictedFeatures) {
      this.isHelpMenuRestricted = this.configSvc.restrictedFeatures.has('helpNavBarMenu')
    }

    // Route subscription with modern RxJS operators
    this.router.events.pipe(
      filter(event => event instanceof NavigationStart || event instanceof NavigationEnd)
    ).subscribe(event => {
      this.currentHref.set(event.url)
      if (event instanceof NavigationStart) {
        const isHubEnabled = !(event.url.includes('/certs') ||
          event.url.includes('/achievements') ||
          event.url.includes('/public/achievements') ||
          event.url.includes('/public/certs'))
        this.isHubEnable.set(isHubEnabled)
        this.cancelTour()
      } else if (event instanceof NavigationEnd) {
        const isHubEnabled = !(event.url.includes('/certs') ||
          event.url.includes('/achievements') ||
          event.url.includes('/public/achievements') ||
          event.url.includes('/public/certs'))
        this.isHubEnable.set(isHubEnabled)
        this.routeSubs(event)
        this.cancelTour()
        this.bindUrl(event.url.replace('/app/competencies/', ''))
      }

      this.showLangDropdown.set(!window.location.href.includes('/karmayogi-saptah'))
    })

    if (localStorage.getItem('websiteLanguage')) {
      this.translate.setDefaultLang('en')
      const lang = localStorage.getItem('websiteLanguage')!
      this.translate.use(lang)
    }

    // Effect for mode changes (replaces ngOnChanges)
    effect(() => {
      const currentMode = this.mode()
      if (currentMode === 'bottom') {
        this.btnAppsConfig = {
          ...this.basicBtnAppsConfig,
          widgetData: {
            ...this.basicBtnAppsConfig.widgetData,
            showTitle: true,
          },
        }
      } else {
        this.btnAppsConfig = { ...this.basicBtnAppsConfig }
      }
    })
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.showKarmaLeaderboard && changes.showKarmaLeaderboard.currentValue === false && this.activeItemKey() === 'achievements') {
      this.activeItemKey.set('')
    }
  }

  ngOnInit() {
    // this.setPrimaryConfig()
    if (this.configSvc) {
      this.jan26Data = this.configSvc.overrideThemeChanges
      this.logoDisplayTime = this.jan26Data?.desktop?.logoDisplayTime
      this.displayLogo()
      setInterval(() => {
        this.janDataEnable.set(true)
        this.displayLogo()
      }, this.logoDisplayTime)
    }

    this.setActiveRouteFromUrl(this.router.url)

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      if (localStorage.getItem('activeRoute')) {
        const route = localStorage.getItem('activeRoute')
        this.activeRoute.set(route ? route.toLowerCase() : '')
      }

      if (event.url.includes('/app/toc/do') && window.screen.availWidth < 768) {
        this.hideKPOnNav.set(true)
      } else {
        this.hideKPOnNav.set(false)
      }

      const themedRoute = this.supportsThemeToggle(event.url)
      if (themedRoute) {
        this.filteredPrimaryNavbarConfig = this.withoutDisabledItems(this.primaryNavbarConfig)
        const themeMode = this.themeSvc.currentTheme
        this.themeSvc.setTheme(themeMode)
      }
      this.setActiveRouteFromUrl(event.url)
      if (!themedRoute) {
        this.filteredPrimaryNavbarConfig =
          this.withoutDisabledItems(this.removeThemeToggleFromConfig(this.primaryNavbarConfig))
        this.themeSvc.applyTheme('light')
      }
    })

    if (this.configSvc.userProfile && this.configSvc.userProfile.userId) {
      this.isLoggedIn.set(true)
    }

    if (this.configSvc.instanceConfig) {
      this.appIcon = this.domSanitizer.bypassSecurityTrustResourceUrl(
        this.domainConfSvc.getDomainAppLogo()
      )
      this.redirectPath = this.domainConfSvc.getDomainRedirectPath()

      this.appIconSecondary = this.domSanitizer.bypassSecurityTrustResourceUrl(
        this.configSvc.instanceConfig.logos.appSecondary,
      )

      if (this.configSvc.instanceConfig.logos.appBottomNav) {
        this.appBottomIcon = this.domSanitizer.bypassSecurityTrustResourceUrl(
          this.configSvc.instanceConfig.logos.appBottomNav,
        )
      }
      this.primaryNavbarBackground = this.configSvc.primaryNavBar
      this.pageNavbar = this.configSvc.pageNavBar
      this.primaryNavbarConfig = this.configSvc.primaryNavBarConfig
    }

    if (this.configSvc.appsConfig) {
      this.featureApps = Object.keys(this.configSvc.appsConfig.features)
    }

    this.configSvc.tourGuideNotifier.subscribe(canShow => {
      if (
        this.configSvc.restrictedFeatures &&
        !this.configSvc.restrictedFeatures.has('tourGuide')
      ) {
        this.isTourGuideAvailable.set(canShow)
        this.popupTour = this.tourService.createPopupTour()
      }
    })

    this.startTour()
    this.enrollInterval = setInterval(() => {
      this.getKarmaCount()
    }, 1000)

    this.urlService.previousUrl$.subscribe((previousUrl: string) => {
      this.previousUrl.set(previousUrl)
    })

    // NOT-MY-USER alone disables the nav now — it used to also require the 'igot' holding
    // org, so disowned users of any other org kept a fully working bottom nav
    if (this.restrictionSvc.isNotMyUser) {
      this.disableMenu.set(true)
      this.fetchEnrollmentList()
    } else {
      this.disableMenu.set(false)
    }

    if (this.configSvc.unMappedUser && this.configSvc.unMappedUser.identifier) {
      this.getMyCount()
      this.myNotificationsSubscription = this.libNotificationsService.unreadCount$.subscribe((res: number) => {
        if (res > 0) {
          this.getMyCount()
        }
      })
    }
  }

  // setPrimaryConfig() {
  //   this.primaryNavbarConfig = {
  //     "mediumScreen": {
  //       "left": [],
  //       "right": [
  //         {
  //           "type": "langSelect",
  //           "config": {
  //             "actionBtnId": "feature_langselect",
  //             "toolTip": "Language",
  //             "className": "fixtopMargin",
  //             "config": {
  //               "actionBtnId": "feature_langselect",
  //               "type": "card-mini",
  //               "hideTitle": true
  //             }
  //           }
  //         },
  //         {
  //           type: 'themeToggle'
  //         },
  //         {
  //           "type": "fontButton",
  //           "config": {
  //             "actionBtnId": "feature_mydashboard",
  //             "toolTip": "My Dashboard",
  //             "className": "fixtopMargin",
  //             "config": {
  //               "actionBtnId": "feature_mydashboard",
  //               "type": "card-mini",
  //               "hideTitle": true
  //             }
  //           }
  //         },
  //         {
  //           "type": "notificationBell",
  //           "config": {
  //             "actionBtnId": "feature_notification",
  //             "toolTip": "Notification",
  //             "className": "fixtopMargin",
  //             "config": {
  //               "actionBtnId": "feature_notification",
  //               "type": "card-mini",
  //               "hideTitle": true
  //             }
  //           }
  //         },
  //         {
  //           "type": "widgetButton",
  //           "config": {
  //             "widgetType": "actionButton",
  //             "widgetSubType": "actionButtonProfile",
  //             "widgetData": {
  //               "disableViewProfile": true,
  //               "disableAllFeatures": true,
  //               "disableSettings": true,
  //               "removeClass": true
  //             }
  //           }
  //         }
  //       ]
  //     },
  //     "smallScreen": {
  //       "left": [
  //         {
  //           "type": "featureButton",
  //           "config": {
  //             "actionBtnId": "feature_catalog",
  //             "config": {
  //               "type": "card-mini"
  //             }
  //           }
  //         },
  //         {
  //           "type": "featureButton",
  //           "config": {
  //             "actionBtnId": "feature_profile",
  //             "config": {
  //               "type": "card-mini"
  //             }
  //           }
  //         }
  //       ],
  //       "right": [
  //         {
  //           "type": "featureButton",
  //           "config": {
  //             "actionBtnId": "feature_search",
  //             "config": {
  //               "type": "card-mini"
  //             }
  //           }
  //         }
  //       ],
  //       "all": [
  //         {
  //           "type": "iconButton",
  //           "config": {
  //             "icon": "home",
  //             "path": "/page/home",
  //             "label": "home"
  //           }
  //         },
  //         {
  //           "type": "explorerButton",
  //           "config": {
  //             "icon": "explorer",
  //             "path": "/page/learn",
  //             "label": "explore"
  //           }
  //         },
  //         {
  //           "type": "iconButton",
  //           "config": {
  //             "icon": "search",
  //             "path": "/app/search/home",
  //             "label": "search"
  //           }
  //         },
  //         {
  //           "type": "iconButton",
  //           "config": {
  //             "key": "continueLearning",
  //             "icon": "learn",
  //             "path": "/app/seeAll",
  //             "label": "my learnings"
  //           }
  //         }
  //       ]
  //     },
  //     "secondary": {
  //       "left": [
  //         {
  //           "type": "featureButton",
  //           "config": {
  //             "actionBtnId": "feature_home",
  //             "config": {
  //               "type": "mat-button"
  //             }
  //           }
  //         },
  //         {
  //           "type": "featureButton",
  //           "config": {
  //             "actionBtnId": "feature_goals",
  //             "config": {
  //               "type": "mat-button"
  //             }
  //           }
  //         },
  //         {
  //           "type": "featureButton",
  //           "config": {
  //             "actionBtnId": "feature_account",
  //             "config": {
  //               "type": "mat-button"
  //             }
  //           }
  //         }
  //       ],
  //       "right": []
  //     }
  //   }
  // }

  getMyCount() {
    this.notificationsService.getNotificationsData().subscribe(
      (res: any) => {
        this.notificationsCount.set(_.get(res, 'result.unread', 0))
      },
      error => {
        console.error('Error while fetching notifications count', error)
        this.notificationsCount.set(0)
      }
    )
  }

  displayLogo() {
    const animationDur = this.jan26Data?.desktop?.animationDuration
    setTimeout(() => {
      this.janDataEnable.set(false)
    }, animationDur)
  }

  routeSubs(e: NavigationEnd) {
    if (e.url.includes('/app/setup')) {
      this.isSetUpPage.set(true)
    } else {
      this.isSetUpPage.set(false)
    }

    if (
      e.url.includes('/public/logout') ||
      e.url.includes('/public/home') ||
      e.url.includes('/public/sso') ||
      e.url.includes('/public/google/sso') ||
      e.url.startsWith('/viewer')
    ) {
      this.showAppNavBar.set(false)
      this.isPublicHomePage.set(e.url.includes('/public/home'))
    } else if ((e.url.includes('/app/setup') && this.configSvc.instanceConfig && !this.configSvc.instanceConfig.showNavBarInSetup)) {
      this.showAppNavBar.set(false)
    } else {
      this.showAppNavBar.set(true)
    }
  }

  startTour() {
    // Tour guide logic
  }

  cancelTour() {
    if (this.popupTour) {
      this.tourService.cancelPopupTour()
      this.isTourGuideClosed.set(false)
    }
  }

  bindUrl(path: string) {
    if (path && path !== '/app/competencies') {
      this.currentRoute.set(path)
    }
  }

  translateLabels(label: string, type: any): string {
    return this.langtranslations.translateLabelWithoutspace(label, type, '')
  }

  private readonly themedRoutes = [
    '/page/home',
    '/app/person-profile/karma-wallet',
  ]

  private supportsThemeToggle(url: string): boolean {
    return this.themedRoutes.some(route => url.includes(route))
  }

  withoutDisabledItems(config: NsInstanceConfig.IPrimaryNavbarConfig | null): NsInstanceConfig.IPrimaryNavbarConfig | null {
    if (!config || !config.mediumScreen || !config.mediumScreen.right) {
      return config
    }

    const filteredConfig = JSON.parse(JSON.stringify(config))
    filteredConfig.mediumScreen.right = filteredConfig.mediumScreen.right
      .filter((item: any) => item && item.enabled !== false)
    return filteredConfig
  }

  removeThemeToggleFromConfig(config: NsInstanceConfig.IPrimaryNavbarConfig | null): NsInstanceConfig.IPrimaryNavbarConfig | null {
    if (!config || !config.mediumScreen || !config.mediumScreen.right) {
      return config
    }

    const filteredConfig = JSON.parse(JSON.stringify(config))
    filteredConfig.mediumScreen.right = filteredConfig.mediumScreen.right.filter((item: any) => item.type !== 'themeToggle')
    return filteredConfig
  }

  bottomNavClick(item: any) {
    this.activeItemKey.set('')
    if (item?.config?.key === 'achievements') {
      this.viewAchivements.emit(true)
      this.activeItemKey.set(item?.config?.key)
    } else if (item?.config?.key === 'continueLearning') {
      this.router.navigate(['/app/seeAll/new'], {
        queryParams: { key: 'continueLearning', tabSelected: 'Contents', pillSelected: 'inprogress' },
      })
      this.configSvc.openExploreMenuForMWeb.next(false)
    } else {
      this.redirectToPath(item?.config)
    }
  }

  redirectToPath(pathConfig: any) {
    if (pathConfig && pathConfig.key) {
      this.router.navigate([pathConfig.path], { queryParams: { key: pathConfig.key } })
    } else {
      this.router.navigate([pathConfig.path])
    }
    this.configSvc.openExploreMenuForMWeb.next(false)
  }

  openExploreMenu() {
    this.activeRoute.set('explore')
    this.router.navigate(['/app/explore'])
  }

  getKarmaCount() {
    const enrollList = localStorage.getItem('userEnrollmentCount')
    if (enrollList) {
      const parsedList = JSON.parse(enrollList)
      this.countdata.set(parsedList?.userCourseEnrolmentInfo?.karmaPoints || 0)
      this.karmaPointLoading.set(false)
      clearInterval(this.enrollInterval)
    }
  }

  viewKarmapoints(): any {
    if (this.disableMenu()) {
      return false
    }
    this.raiseTelemetry()
    this.router.navigate(['/app/person-profile/karma-points'])
  }

  raiseTelemetry() {
    this.events.raiseInteractTelemetry(
      {
        type: 'click',
        subType: 'nav-karmapoints',
        id: 'nav-karmapoints',
      },
      {},
      {
        module: WsEvents.EnumTelemetrymodules.KARMAPOINTS,
      }
    )
  }

  handleNavigateBack(): void {
    const prevUrl = this.previousUrl()
    if (prevUrl.includes('/app/toc/do_') || prevUrl.includes('/viewer/pdf/do_')) {
      this.router.navigateByUrl('/page/home')
    }
  }

  public getItem(item: any) {
    return { ...item, forPreview: !this.isforPreview(), enableLang: this.isenableLang() }
  }

  fetchEnrollmentList() {
    const userId = this.configSvc.userProfile?.userId || ''
    this.userSvc.fetchUserBatchList(userId).subscribe()
  }

  setActiveRouteFromUrl(url: string) {
    let activeRoute = ''
    if (url.includes('/page/home')) {
      activeRoute = 'home'
    } else if (url.includes('/app/explore') || url.includes('/page/explore')
      || url.includes('tab=explore-content')) {
      activeRoute = 'explore'
    } else if (url.includes('app/globalsearch') || url.includes('/app/search/home')) {
      activeRoute = 'search'
    } else if (url.includes('app/careers')) {
      activeRoute = 'Career'
    } else if (url.includes('app/seeAll') && url.includes('key=continueLearning')) {
      activeRoute = 'my learnings'
    }

    if (activeRoute) {
      this.activeItemKey.set('')
      this.activeRoute.set(activeRoute)
    }
  }

  isActive(itemConfig: any) {
    if (itemConfig && this.activeItemKey() && this.activeItemKey() === itemConfig.key) {
      return true
    } else if (itemConfig.label === this.activeRoute() && !this.activeItemKey()) {
      return true
    }

    return false
  }

  ngOnDestroy() {
    if (this.myNotificationsSubscription) {
      this.myNotificationsSubscription.unsubscribe()
    }
    if (this.enrollInterval) {
      clearInterval(this.enrollInterval)
    }
  }
}
