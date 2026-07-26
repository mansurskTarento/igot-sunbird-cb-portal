import {
  AfterViewChecked,
  AfterViewInit,
  ApplicationRef,
  ChangeDetectorRef,
  Component,
  effect,
  ElementRef,
  HostListener,
  OnInit,
  signal,
  // TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core'
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  ActivatedRoute,
  ActivatedRouteSnapshot,
} from '@angular/router'
import { BreakpointObserver } from '@angular/cdk/layout'
// import { interval, concat, timer } from 'rxjs'
import { BtnPageBackService } from '@sunbird-cb/collection'
import { HttpClient } from '@angular/common/http'
import {
  AuthKeycloakService,
  ConfigurationsService,
  // LoggerService,
  DomainConfService,
  TelemetryService,
  ValueService,
  UtilityService,
  EventService,
  WsEvents,
  // NsInstanceConfig,
} from '@sunbird-cb/utils-v2'
import { delay, first, catchError, map, filter } from 'rxjs/operators'
import { combineLatest } from 'rxjs'
import { MobileAppsService } from '../../services/mobile-apps.service'
import { RootService } from './root.service'

import { CsModule } from '@project-sunbird/client-services'
import { SwUpdate } from '@angular/service-worker'
import { environment } from '../../../environments/environment'
import { MatDialog } from '@angular/material/dialog'
import { DialogConfirmComponent } from '../dialog-confirm/dialog-confirm.component'
import { concat, interval, timer, of } from 'rxjs'
// import { iGOTAIService } from './../../services/igot-ai.service'
import { CommonDataService } from '../../services/common-data.service'
import { UrlService } from '../../shared/url.service'
import { LibNotificationsService } from '@sunbird-cb/notification'
import { HomePageService } from '../../services/home-page.service'
import { trigger, style, animate, transition } from '@angular/animations'
import { DialogBoxComponent } from '../dialog-box/dialog-box.component'
import * as _ from 'lodash'
@Component({
  selector: 'ws-root',
  templateUrl: './root.component.html',
  styleUrls: ['./root.component.scss'],
  providers: [SwUpdate],
  standalone: false,
  animations: [
    trigger('slidePanel', [
      transition(':enter', [
        style({ left: 'calc(330px - 120px)', opacity: 0 }),
        animate('280ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          style({ left: 'calc(330px + 24px)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('220ms cubic-bezier(0.55, 0.06, 0.68, 0.19)',
          style({ left: 'calc(330px - 120px)', opacity: 0 }))
      ])
    ]),
    trigger('fadeBackdrop', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class RootComponent implements OnInit, AfterViewInit, AfterViewChecked {

  hideHeaderAndFooter = false
  disableHeightOnTop = false
  // iGOTAIConfigLoaded = false
  // dataSubject = new BehaviorSubject<boolean>(false)
  menuBarDetails: any = {}
  leftNavBarIsOpen = signal(true)
  showKarmaLeaderboard = signal(false)
  hideFooterSection = signal(false)
  isHomePage = signal(false)
  showFullScreen = signal(false)
  navBarOpenStatusBasedOnNav = signal(true)
  openStatusUserSelection = signal(true)
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private appRef: ApplicationRef,
    // private logger: LoggerService,
    private swUpdate: SwUpdate,
    private dialog: MatDialog,
    private http: HttpClient,
    private authSvc: AuthKeycloakService,
    public configSvc: ConfigurationsService,
    private valueSvc: ValueService,
    private telemetrySvc: TelemetryService,
    private eventSvc: EventService,
    private mobileAppsSvc: MobileAppsService,
    private rootSvc: RootService,
    private btnBackSvc: BtnPageBackService,
    private changeDetector: ChangeDetectorRef,
    private utilitySvc: UtilityService,
    private urlService: UrlService,
    // private iGOTAIService: iGOTAIService,
    private commonDataSvc: CommonDataService,
    public domainConfSvc: DomainConfService,
    private libNotificationsService: LibNotificationsService,
    private homePageSvc: HomePageService,
    private breakpointObserver: BreakpointObserver

  ) {
    effect(() => {
      if (!this.leftNavBarIsOpen()) {
        this.showKarmaLeaderboard.set(false)
      }
    })

    if (window.location.pathname.includes('/public/privacy-policy')) {
      this.hideHeaderAndFooter = true
    }
    if (this.configSvc.headerFooterConfigData) {
      this.headerFooterConfigData = this.configSvc.headerFooterConfigData
      this.showFooter = true
    }
    if (this.configSvc.instanceConfig && this.configSvc.instanceConfig.leftNavBar) {
      this.menuBarDetails = this.configSvc.instanceConfig.leftNavBar || undefined
      if (this.menuBarDetails) {
        this.openStatusUserSelection.set(this.menuBarDetails.defaultOpen)
        this.setAchivements()
        this.setOtherPortals()
        this.setNavOpenStatus()
      }
    } else {
      this.getLeftNavBarConfiguration().subscribe((sectionData: any) => {
        this.menuBarDetails = sectionData?.data || undefined
        if (this.menuBarDetails) {
          this.setAchivements()
          this.setOtherPortals()
          this.setNavOpenStatus()
        }
      })
    }

    if (window.location.pathname.includes('/public/home')
      || window.location.pathname.includes('/public/toc/')
      || window.location.pathname.includes('/viewer/')
    ) {
      this.customHeight = true
      // tslint: disable
    }
    if (this.configSvc.unMappedUser && this.configSvc.unMappedUser.profileDetails &&
      this.configSvc.unMappedUser.profileDetails.get_started_tour) {
      this.showTour = this.configSvc.unMappedUser.profileDetails.get_started_tour.skipped ||
        this.configSvc.unMappedUser.profileDetails.get_started_tour.visited
    }
    this.mobileAppsSvc.init()
    this.openIntro()
    const locationOrigin = location.origin

    CsModule.instance.init({
      core: {
        httpAdapter: 'HttpClientBrowserAdapter',
        global: {
          channelId: '', // required
          producerId: '', // required
          deviceId: '', // required
          sessionId: '',
        },
        api: {
          host: `${locationOrigin}/apis/proxies/v8`, // default host
          // host: 'http://localhost:3004/proxies/v8', // default host
          // host: 'http://localhost:3002', // default host
          authentication: {
            // bearerToken: "", // optional
            // userToken: "5574b3c5-16ca-49d8-8059-705304f2c7fb"
            // bearerToken: this.loginToken,
            // optional
          },
        },
      },
      services: {
        groupServiceConfig: {
          apiPath: '/learner/group/v1',
          dataApiPath: '/learner/data/v1/group',
          updateGroupGuidelinesApiPath: '/learner/group/membership/v1',
        },
        userServiceConfig: {
          apiPath: '/learner/user/v2',
        },
        formServiceConfig: {
          apiPath: '/learner/data/v1/form',
        },
        courseServiceConfig: {
          apiPath: '/learner/course/v1',
          certRegistrationApiPath: '/learner/certreg/v2/certs',
        },
        discussionServiceConfig: {
          apiPath: '/discussion',
        },
      },
    })
  }

  get navBarRequired(): boolean {
    return this.isNavBarRequired
  }

  get isShowNavbar(): boolean {
    return this.showNavbar
  }

  get isCustomHeight(): boolean {
    if (window.location.pathname.includes('/public/home')
      || window.location.pathname.includes('/public/faq')
      || window.location.pathname.includes('/public/contact')
      || window.location.pathname.includes('/public/signup')
      || window.location.pathname.includes('/public/request')
      || /^\/crp\/[^\/]+(\/[^\/]+)?$/.test(window.location.pathname)

    ) {
      this.customHeight = true
    }
    return this.customHeight
  }

  get showMenuBardetails(): boolean {
    return this.menuBarDetails && this.currentUrl &&
      !this.currentUrl.includes('public') &&
      !this.currentUrl.includes('viewer')
  }

  get showHeader(): boolean {
    return this.navBarRequired &&
      !this.hideHeaderAndFooter &&
      this.domainConfSvc.isConfigEnabled('components.header', 'enabled')
  }

  @ViewChild('previewContainer', { read: ViewContainerRef, static: true })
  // @ViewChild('userIntro', { static: true }) userIntro!: TemplateRef<any>
  previewContainerViewRef: ViewContainerRef | null = null
  @ViewChild('appUpdateTitle', { static: true })
  appUpdateTitleRef: ElementRef | null = null
  @ViewChild('appUpdateBody', { static: true })
  appUpdateBodyRef: ElementRef | null = null

  @ViewChild('skipper') skipper!: ElementRef

  isXSmall$ = this.valueSvc.isXSmall$
  // Matches the tablet overlay-drawer range used by sb-uic-dynamic-sidebar (768px - 1199.98px)
  isTabView$ = this.breakpointObserver
    .observe(['(min-width: 768px) and (max-width: 1024px)'])
    .pipe(map(state => state.matches))
  // Desktop-only: sidebar-driven widths (navBarOpenContent/navBarCloseContent) must not apply on mobile or tab
  isDesktopView$ = combineLatest([this.isXSmall$, this.isTabView$]).pipe(
    map(([isXSmall, isTabView]) => !isXSmall && !isTabView)
  )
  routeChangeInProgress = false
  showNavbar = true
  showFooter = false
  currentUrl!: string
  customHeight = false
  isNavBarRequired = true
  isInIframe = false
  appStartRaised = false
  isSetupPage = false
  processed: any
  loginToken: any
  showTour = false
  currentRouteData: any = []
  loggedinUser = !!(this.configSvc.userProfile && this.configSvc.userProfile.userId)
  headerFooterConfigData: any = null
  mobileTopHeaderVisibilityStatus = true
  activeMenu: any = ''
  backGroundTheme: any
  showHubs = true
  showBottomNav = true
  viewerPage = false

  prevUrl = ''
  currUrl = ''
  detailsChanged = signal(false)
  otherDetailsChanged = signal(false)
  @HostListener('window:unload', ['$event'])
  unloadHandler(event: any) {
    if (event && event.type === 'unload') {
      // this.authSvc.logout()
    }
  }

  reloadPage() {
    window.location.reload()
  }

  // used on the global-config error screen: force_logout works without any
  // loaded configuration (same path as the auth interceptor)
  logout() {
    this.authSvc.force_logout()
  }

  // dialog/popup visibility from global-config -> components.dialogs
  isDialogEnabled(dialogKey: string): boolean {
    return this.domainConfSvc.isConfigEnabled('components.dialogs', 'enabled')
      && this.domainConfSvc.isConfigEnabled('components.dialogs', dialogKey)
  }

  openIntro() {
    // if (!(this.rootSvc.getCookie('intro') && !!(this.rootSvc.getCookie('intro')))) {
    //   if (this.router.url === '/page/home') {
    //     this.dialog.open(AppIntroComponent, { data: {} })
    //   }
    // }
    // this.snackBar.openFromTemplate(this.userIntro, { duration: 20000, verticalPosition: 'bottom', horizontalPosition: 'left' })
  }
  public skipToMainContent(): void {
    this.skipper.nativeElement.focus()
    // tslint: disable
  }
  ngOnInit() {
    // let showTour = localStorage.getItem('tourGuide')? JSON.parse(localStorage.getItem('tourGuide')||''): {}
    // this.showTour = showTour && showTour.disable ? showTour.disable : false
    this.mobileAppsSvc.mobileTopHeaderVisibilityStatus.subscribe((status: any) => {
      this.mobileTopHeaderVisibilityStatus = status
    })
    this.configSvc.updateTourGuideMethod(this.showTour)
    // this.route.queryParams
    //   .subscribe(_params => {
    //   }
    //   )
    if (window.location.pathname.includes('/public/home')) {
      this.customHeight = true
    }
    try {
      this.isInIframe = window.self !== window.top
    } catch (_ex) {
      this.isInIframe = false
    }

    this.btnBackSvc.initialize()

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const isPlayer = event.url.includes('/viewer')

      // Extract fragment from URL
      const fragment = this.route.snapshot.fragment || ''
      // Initialize mandatory details from common data service
      if (this.configSvc?.unMappedUser && !['mandatorySection', 'orgDetails'].includes(fragment)) {
        this.commonDataSvc.mandatoryDetails(isPlayer)
      }
      // Check and show mandatory notification on route change
      this.prevUrl = this.currUrl

      this.currUrl = event.url

      this.urlService.setPreviousUrl(this.prevUrl)
      if (this.currUrl === '/page/home') {
        this.isHomePage.set(true)
        this.mobileAppsSvc.clearGlobalSearchForHomePage.next(true)
        // Fetch mandatory notification when navigating to home
        // this.commonDataSvc.fetchMandatoryNotification()
      } else {
        this.isHomePage.set(false)
        this.mobileAppsSvc.clearGlobalSearchForHomePage.next(false)
      }
      this.setNavOpenStatus()
      if (event && event.url) {
        if (event.url.includes('/app/network-v2') && window.innerWidth <= 768) {
          this.showNavbar = false
        } else if (event.url.includes('/page/home') && window.innerWidth <= 768) {
          this.showNavbar = true
        }
      }
    })

    this.router.events.subscribe((event: any) => {
      if (event instanceof NavigationEnd) {

        if (event.url.includes('/setup/')) {
          this.isSetupPage = true
        }
      }
      if (window.location.pathname.includes('/page/home')) {
        this.hideFooterSection.set(true)
        this.changeBg26Jan()
      } else {
        this.hideFooterSection.set(false)
        this.removeBg26Jan()
      }

      if (event instanceof NavigationStart) {
        let isMobile = false
        if (window.innerWidth <= 1200) {
          isMobile = true
        } else {
          isMobile = false
        }
        this.showNavbar = true
        if (event.url.includes('preview') || event.url.includes('embed')) {
          this.isNavBarRequired = false
        } else if (event.url.includes('author/') && this.isInIframe) {
          this.isNavBarRequired = false
        } else {
          this.isNavBarRequired = true
        }

        if (!(event.url.includes('/page/home')) && isMobile) {
          this.showHubs = false
        } else {
          if (event.url.includes('/public') || event.url.includes('/crp')) {
            this.showHubs = false
          } else {
            this.showHubs = true
          }
        }

        if (event.url.includes('/viewer')) {
          this.viewerPage = true
        } else {
          this.viewerPage = false
        }
        this.changeDetector.detectChanges()
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.routeChangeInProgress = false
        this.currentUrl = event.url

        if (this.currentUrl.includes('/public/home')) {
          this.customHeight = true

        } else {
          this.customHeight = false
        }
        if (
          this.currentUrl.startsWith('/app/toc') ||
          this.currentUrl.startsWith('/viewer/')
        ) {
          this.showFullScreen.set(true)
        } else {
          this.showFullScreen.set(false)
        }

        if (
          !!this.currentUrl.startsWith('/public/logout')
          || !!this.currentUrl.startsWith('/public/signup')
          || !!this.currentUrl.startsWith('/public/welcome')
          || !!this.currentUrl.startsWith('/viewer/')
          || !!this.currentUrl.startsWith('/public/request')
          || !!this.currentUrl.startsWith('/public/toc')
          || !!/^\/crp\/[^\/]+(\/[^\/]+)?$/.test(window.location.pathname)
        ) {
          this.showFooter = false
          this.showNavbar = false
          this.isNavBarRequired = false
        } else {
          this.showFooter = true
          this.showNavbar = true
          this.isNavBarRequired = true
        }
        if (window.location.pathname.includes('/learner-advisory')) {
          this.showNavbar = true
          this.isNavBarRequired = true
          this.showBottomNav = true
          this.showHubs = true

        }
        if (window.location.pathname.includes('/globalsearch')) {
          this.showFooter = false

        }

        if (!!this.currentUrl.startsWith('/app/toc/')) {
          this.showBottomNav = false
        }
      }

      if (event instanceof NavigationEnd) {
        // let snapshot = this.router.routerState.firstChild(this.activatedRoute).snapshot
        // console.log('this.route.snapshot :: ', this.route.snapshot)
        const snapshot = this.route.snapshot
        // console.log('root.snapshot.root.firstChild ', snapshot.root.firstChild)
        // console.log('firstChild ', snapshot.firstChild)
        const firstChild = snapshot.root.firstChild
        this.getChildRouteData(snapshot, firstChild)
        // tslint:disable-next-line: no-console
        // console.log('Final currentDataRoute', this.currentRouteData)
        this.utilitySvc.setRouteData(this.currentRouteData)
        const pageContext = this.utilitySvc.routeData
        const data = {
          pageContext,
        }
        const objectType = this.route.snapshot.queryParams.primaryCategory || ''
        this.raiseAppStartTelemetry()
        if (data.pageContext.pageId && data.pageContext.module) {
          this.telemetrySvc.impression(data, objectType)
        } else {
          this.telemetrySvc.impression()
        }
        this.currentRouteData = []
        this.activeMenu = localStorage.getItem('activeMenu')
        this.openIntro()

      }
      if (event && event.url && event.url.includes('/app/network-v2') && window.innerWidth <= 768) {
        this.showNavbar = false
      }
    })
    this.rootSvc.showNavbarDisplay$.pipe(delay(500)).subscribe((display: any) => {
      this.showNavbar = display
    })

    let isNotMyUser = false
    let isIgotOrg = false
    // if (this.configSvc && this.configSvc.unMappedUser && this.configSvc.unMappedUser.rootOrgId) {
    //   this.iGOTAIConfig()
    // }
    if (this.configSvc && this.configSvc.unMappedUser
      && this.configSvc.unMappedUser.profileDetails
      && this.configSvc.unMappedUser.profileDetails.profileStatus) {
      isNotMyUser = this.configSvc.unMappedUser.profileDetails.profileStatus.toLowerCase() === 'not-my-user' ? true : false
    }
    if (this.configSvc && this.configSvc.unMappedUser
      && this.configSvc.unMappedUser.profileDetails
      && this.configSvc.unMappedUser.profileDetails.employmentDetails
      && this.configSvc.unMappedUser.profileDetails.employmentDetails.departmentName) {
      isIgotOrg = this.configSvc.unMappedUser.profileDetails.employmentDetails.departmentName.toLowerCase() === 'igot' ? true : false
    }
    // let isIgotOrg = true
    if (isNotMyUser && isIgotOrg) {
      this.disableHeightOnTop = true
      this.router.navigateByUrl('app/person-profile/me#profileInfo')
    } else {
      this.disableHeightOnTop = false
    }

  }


  setAchivements() {
    const menuBarDetails = JSON.parse(JSON.stringify(this.menuBarDetails))
    const achievements = menuBarDetails?.navSections?.find((section: any) => section.sectionKey === 'my_achievements')
    achievements.sectionLoading = true
    this.sendDetailsChangedEvent(achievements)
    if (achievements) {
      try {
        const raw = localStorage.getItem('userEnrollmentCount')
        if (raw) {
          const parsed = JSON.parse(raw)
          const learningHours = _.get(parsed, 'userCourseEnrolmentInfo.timeSpentOnCompletedCourses', 0)
          const badges = _.get(parsed, 'userCourseEnrolmentInfo.badgeCount', 0)
          const itemsList = achievements.items.filter((item: any) => item.enabled !== false)
          if (itemsList && itemsList.length > 0) {
            itemsList.forEach((item: any) => {
              switch (item.code) {
                case 'rank':
                  break
                case 'learning_hours':
                  item.value = this.convertToHoursAndMinutes(learningHours)
                  break
                case 'badges':
                  item.value = `${badges} Badges`
                  break
                case 'karma_points':
                  const karmaPoints = _.get(parsed, 'userCourseEnrolmentInfo.karmaPoints', 0)
                  item.value = `${karmaPoints} Karma Points`
              }
            })
          }
          achievements.items = itemsList
        }
        const currentUserId = this.configSvc?.unMappedUser?.id
        const rankItem = achievements?.items?.find((item: any) => item.code === 'rank' && item.enabled !== false)
        if (currentUserId && rankItem) {
          this.homePageSvc.getLearnerLeaderboardCached().subscribe((res: any) => {
            const results = res?.result?.result
            if (Array.isArray(results) && results.length) {
              const currentUserRank = results.find((entry: any) => entry.userId === currentUserId)
              const rank = currentUserRank?.rank

              if (rank != null) {
                rankItem.value = `${this.toOrdinal(rank)} Rank`
              } else {
                rankItem.value = '0 Rank'
              }
            } else {
              rankItem.value = '0 Rank'
            }
            achievements.sectionLoading = false
            this.sendDetailsChangedEvent(achievements)
          }, (_error: any) => {
            achievements.sectionLoading = false
            this.sendDetailsChangedEvent(achievements)
          }
          )
        } else {
          achievements.sectionLoading = false
          this.sendDetailsChangedEvent(achievements)
        }
      } catch (_e) { /* ignore */ }
    }
  }

  setOtherPortals() {
    const menuBarDetails = JSON.parse(JSON.stringify(this.menuBarDetails))
    const quickActionSection = menuBarDetails?.navSections?.find((section: any) => section.sectionKey === 'quick_actions' && section.enabled !== false)
    if (quickActionSection && quickActionSection?.items && quickActionSection.items.length > 0) {
      const otherPortalsSection = quickActionSection?.items?.filter((item: any) => item.code === 'other_portals' && item.enabled !== false)
      if (otherPortalsSection && otherPortalsSection.length > 0) {
        const otherPortalChildren = otherPortalsSection?.[0]?.children || []
        const otherPortalsFilteredChildren: any[] = []
        if (otherPortalChildren && otherPortalChildren.length > 0) {
          // normalize user roles once to lowercase set for O(1) lookup
          const userRolesSet = new Set(Array.from(this.configSvc.userRoles || []).map((r: any) => (r || '').toString().toLowerCase()))
          otherPortalChildren.forEach((child: any) => {
            if (child.enabled === false) { return }

            // normalize child roles to array of strings
            let childRoles: string[] = []
            if (Array.isArray(child.rolesCanAccess)) {
              childRoles = child.rolesCanAccess
            } else if (typeof child.rolesCanAccess === 'string') {
              childRoles = child.rolesCanAccess.split(',').map((s: string) => s.trim()).filter(Boolean)
            }

            // check if any child role exists in user's roles (short-circuits on first match)
            const hasAccess = childRoles.some((cr: string) => userRolesSet.has((cr || '').toLowerCase()))
            if (hasAccess) {
              otherPortalsFilteredChildren.push(child)
            }
          })
          otherPortalsSection[0].children = otherPortalsFilteredChildren
          this.sendOtherDetailsChangedEvent(quickActionSection)
        }
      }
    }

  }

  setNavOpenStatus() {
    if (this.isHomePage()) {
      this.navBarOpenStatusBasedOnNav.set(this.openStatusUserSelection())
      this.leftNavBarIsOpen.set(this.openStatusUserSelection())
    } else {
      this.navBarOpenStatusBasedOnNav.set(false)
      this.leftNavBarIsOpen.set(false)
    }
  }

  sendDetailsChangedEvent(newAchievements: any) {
    const existingDetails = JSON.parse(JSON.stringify(this.menuBarDetails))
    existingDetails?.navSections?.forEach((section: any, index: number) => {
      if (section.sectionKey === 'my_achievements') {
        existingDetails.navSections[index] = newAchievements
      }
    })
    this.menuBarDetails = JSON.parse(JSON.stringify(existingDetails))
    this.detailsChanged.set(!this.detailsChanged())
  }

  sendOtherDetailsChangedEvent(quickActionSection: any) {
    const menuBarDetails = JSON.parse(JSON.stringify(this.menuBarDetails))
    menuBarDetails?.navSections?.forEach((section: any, index: number) => {
      if (section.sectionKey === 'quick_actions') {
        menuBarDetails.navSections[index] = quickActionSection
      }
    })
    this.menuBarDetails = JSON.parse(JSON.stringify(menuBarDetails))
    this.otherDetailsChanged.set(!this.otherDetailsChanged())
  }


  convertToHoursAndMinutes(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    return `${hours}h ${minutes}m`
  }

  // private async iGOTAIConfig(): Promise<NsInstanceConfig.IConfig> {
  //   const payload = {
  //     'request': {
  //       'type': 'page',
  //       'subType': 'iGOTAI',
  //       'action': 'page-configuration',
  //       'component': 'portal',
  //       'rootOrgId': this.configSvc.unMappedUser.rootOrgId,
  //     },
  //   }
  //   const publicConfig: any = await this.iGOTAIService.iGOTAIConfigReadData(payload).toPromise()
  //   // console.log('publicConfig', publicConfig)
  //   if (publicConfig && publicConfig && publicConfig.web) {
  //     this.configSvc.iGOTAIConfig = publicConfig.web
  //     //  console.log('this.configSvc', this.configSvc)
  //   }

  //   // this.configSvc.iGOTAIConfig = {
  //   //   "aiTutor": true,
  //   //   "iGOTAI": true,
  //   //   "subTitles": true,
  //   //   "transcription": true
  //   // }
  //   if (publicConfig && publicConfig.error && publicConfig.error.status === 404) {
  //     this.iGOTAIConfigLoaded = false
  //   } else {
  //     this.iGOTAIConfigLoaded = true
  //   }
  //   return publicConfig
  // }

  changeBg26Jan() {
    this.backGroundTheme = this.configSvc.overrideThemeChanges
    const docData: any = document.getElementById('app-bg')
    if (this.backGroundTheme && this.backGroundTheme.isEnabled) {
      docData.classList.add('jan-bg-change')
    } else {
      docData.classList.remove('jan-bg-change')
    }
  }

  removeBg26Jan() {
    this.backGroundTheme = this.configSvc.overrideThemeChanges
    const docData: any = document.getElementById('app-bg')
    docData.classList.remove('jan-bg-change')
  }

  raiseAppStartTelemetry() {
    if (!this.appStartRaised) {
      // Application start telemetry
      const event = {
        eventType: WsEvents.WsEventType.Telemetry,
        eventLogLevel: WsEvents.WsEventLogLevel.Info,
        data: {
          edata: { type: '' },
          object: {},
          state: WsEvents.EnumTelemetrySubType.Loaded,
          eventSubType: WsEvents.EnumTelemetrySubType.Loaded,
          type: 'app',
          mode: 'view',
        },
        from: '',
        to: 'Telemetry',
      }
      this.eventSvc.dispatchEvent<WsEvents.IWsEventTelemetryInteract>(event)
      this.appStartRaised = true
    }
  }

  ngAfterViewInit() {
    // this.initAppUpdateCheck()
  }

  getChildRouteData(snapshot: ActivatedRouteSnapshot, firstChild: ActivatedRouteSnapshot | null) {
    if (firstChild) {
      if (firstChild.data) {
        this.currentRouteData.push(firstChild.data)
      }
      if (firstChild.firstChild) {
        this.getChildRouteData(snapshot, firstChild.firstChild)
      }
    }
  }

  initAppUpdateCheck() {
    // this.logger.log('LOGGING IN ROOT FOR PWA INIT CHECK')
    if (environment.production) {
      const appIsStable$ = this.appRef.isStable.pipe(
        first(isStable => isStable),
      )
      const everySixHours$ = interval(6 * 60 * 60 * 1000)
      const everySixHoursOnceAppIsStable$ = concat(appIsStable$, everySixHours$)
      everySixHoursOnceAppIsStable$.subscribe(() => this.swUpdate.checkForUpdate())
      if (this.swUpdate.isEnabled) {
        // this.swUpdate.available.subscribe(() => {
        const dialogRef = this.dialog.open(DialogConfirmComponent, {
          data: {
            title: (this.appUpdateTitleRef && this.appUpdateTitleRef.nativeElement.value) || '',
            body: (this.appUpdateBodyRef && this.appUpdateBodyRef.nativeElement.value) || '',
          },
        })
        dialogRef.afterClosed().subscribe(
          result => {
            if (result) {
              this.swUpdate.activateUpdate().then(() => {
                if ('caches' in window) {
                  caches.keys()
                    .then(keyList => {
                      timer(2000).subscribe(
                        _ => window.location.reload(),
                      )
                      return Promise.all(keyList.map(key => {
                        return caches.delete(key)
                      }))
                    })
                }
              })
            }
          },
        )
        // })
      }
    }
  }

  getTourGuide() {
    let showTour = false
    this.configSvc.updateTourGuide.subscribe((res: any) => {

      showTour = res
    })
    this.showTour = showTour
    return showTour
  }

  getHeaderFooterConfiguration() {
    const baseUrl = this.configSvc.sitePath
    // tslint:disable-next-line: prefer-template
    return this.http.get(baseUrl + '/page/right-nav-config.json').pipe(
      map(data => ({ data, error: null })),
      catchError(err => of({ data: null, error: err })),
    )
  }

  getLeftNavBarConfiguration() {
    const baseUrl = this.configSvc.sitePath
    return this.http.get(`${baseUrl}/page/left-nav.json`).pipe(
      map(data => ({ data, error: null })),
      catchError(err => of({ data: null, error: err })),
    )
  }

  ngAfterViewChecked() {
    const show = this.getTourGuide()
    if (show !== this.showTour) { // check if it change, tell CD update view
      // this.showTour = this.showTour
    }
    this.changeDetector.detectChanges()
  }

  sidebarStateChanged(event: any) {
    if (event) {
      this.openStatusUserSelection.set(event.isOpen)
      this.leftNavBarIsOpen.set(event.isOpen)
      this.showKarmaLeaderboard.set(false)
    }
  }

  onNavItemClicked(event: any) {
    this.raiseTelemetryExploreContent(event.code, event.subType)
    switch (event.code) {
      case 'explore':
        this.exploreContent()
        this.menuBarDetails.activeItemCode = event.code
        break
      case 'view_all_achievements':
        this.viewAllAchievements()
        break
      case 'download-app':
        this.openAppDownloadDialog()
        break
      default:
        this.menuBarDetails.activeItemCode = event.code
    }
  }

  viewAllAchievements() {
    this.showKarmaLeaderboard.set(true)
  }

  exploreContent() {
    this.libNotificationsService.updateUnreadCount()
    this.raiseTelemetryExploreContent('explore_content')
    const queryParams = {
      q: '',
      search: null,
      category: 'courses',
      p: null,
      f: null,
      tab: 'explore-content',
      filtersPanel: 'show',
    }
    const navigationExtras = {
      queryParams,
      queryParamsHandling: 'merge' as 'merge',
    }
    this.router.navigate(['/app/globalsearch'], navigationExtras)
  }

  raiseTelemetryExploreContent(id: string, subType: string = '') {
    const eData: any = {
      type: WsEvents.EnumInteractTypes.CLICK,
      id: id,
    }
    if (subType) {
      const telemetrySubTypeKey = subType as keyof typeof WsEvents.EnumTelemetrySubType
      if (WsEvents.EnumTelemetrySubType[telemetrySubTypeKey]) {
        eData.subType = WsEvents.EnumTelemetrySubType[telemetrySubTypeKey]
      }
    }
    this.eventSvc.raiseInteractTelemetry(
      eData,
      {},
      {
        module: WsEvents.EnumTelemetrymodules.HOME,
      }
    )
  }

  openAppDownloadDialog() {
    const dialogRef = this.dialog.open(DialogBoxComponent, {
      width: '1000px',
      panelClass: 'download-app-popup-new'
    })
    dialogRef.afterClosed().subscribe(() => { })
  }

  private toOrdinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd']
    const v = n % 100
    return n + (s[(v - 20) % 10] || s[v] || s[0])
  }

}
