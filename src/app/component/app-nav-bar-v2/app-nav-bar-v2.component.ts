import { Component, computed, effect, input, OnDestroy, OnInit, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { DomSanitizer, SafeUrl } from '@angular/platform-browser'
import { Router, NavigationEnd, NavigationStart, RouterModule } from '@angular/router'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatIconModule } from '@angular/material/icon'
import { MatMenuModule } from '@angular/material/menu'
import { MatTooltipModule } from '@angular/material/tooltip'

import { IBtnAppsConfig, CustomTourService, WidgetUserService } from '@sunbird-cb/collection'
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
import { filter, Subscription } from 'rxjs'
import { UrlService } from '../../shared/url.service'
import { NotificationsService } from '../../services/notifications.service'
import { HeaderModule } from '../../header/header.module'

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
    HeaderModule
  ],
  templateUrl: './app-nav-bar-v2.component.html',
  styleUrl: './app-nav-bar-v2.component.scss'
})
export class AppNavBarV2Component implements OnInit, OnDestroy {
  // Inputs using Angular 20 input() signal
  mode = input<'top' | 'bottom'>('top');
  headerFooterConfigData = input<any>();
  leftNavBarOpen = input<boolean>(false);

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

  // Computed signals replacing getters
  isPlayerPage = computed(() => window.location.href.includes('/viewer/'));

  stillOnHomePage = computed(() => {
    return window.location.href.includes('/public/home')
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
    private domainConfSvc: DomainConfService
  ) {
    this.btnAppsConfig = { ...this.basicBtnAppsConfig }

    if (this.configSvc.restrictedFeatures) {
      this.isHelpMenuRestricted = this.configSvc.restrictedFeatures.has('helpNavBarMenu')
    }

    // Route subscription with modern RxJS operators
    this.router.events.pipe(
      filter(event => event instanceof NavigationStart || event instanceof NavigationEnd)
    ).subscribe(event => {
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

  ngOnInit() {
    if (this.configSvc) {
      this.jan26Data = this.configSvc.overrideThemeChanges
      this.logoDisplayTime = this.jan26Data?.desktop?.logoDisplayTime
      this.displayLogo()
      setInterval(() => {
        this.janDataEnable.set(true)
        this.displayLogo()
      }, this.logoDisplayTime)
    }

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

      if (event.url.includes('/page/home')) {
        this.activeRoute.set('home')
      } else if (event.url.includes('/page/explore')) {
        this.activeRoute.set('explorer')
      } else if (event.url.includes('app/globalsearch') || event.url.includes('/app/search/home')) {
        this.activeRoute.set('search')
      } else if (event.url.includes('app/careers')) {
        this.activeRoute.set('Career')
      } else if (event.url.includes('app/seeAll?key=continueLearning')) {
        this.activeRoute.set('my learnings')
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

    let isNotMyUser = false
    let isIgotOrg = false

    if (this.configSvc?.unMappedUser?.profileDetails?.profileStatus) {
      isNotMyUser = this.configSvc.unMappedUser.profileDetails.profileStatus.toLowerCase() === 'not-my-user'
    }

    if (this.configSvc?.unMappedUser?.profileDetails?.employmentDetails?.departmentName) {
      isIgotOrg = this.configSvc.unMappedUser.profileDetails.employmentDetails.departmentName.toLowerCase() === 'igot'
    }

    if (isNotMyUser && isIgotOrg) {
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
    this.configSvc.openExploreMenuForMWeb.next(true)
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

  ngOnDestroy() {
    if (this.myNotificationsSubscription) {
      this.myNotificationsSubscription.unsubscribe()
    }
    if (this.enrollInterval) {
      clearInterval(this.enrollInterval)
    }
  }
}
