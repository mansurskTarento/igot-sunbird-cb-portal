import { Component, OnInit, AfterViewInit, OnDestroy, inject, signal, computed, DestroyRef } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { HttpErrorResponse } from '@angular/common/http'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar'
import _ from 'lodash'

import { ConfigurationsService, EventService, WsEvents } from '@sunbird-cb/utils-v2'
import { MobileAppsService } from '../../services/mobile-apps.service'
import { UserProfileService } from '@ws/app'
import { BtnSettingsService } from '@sunbird-cb/collection'

function isStripActive(strip: any): boolean {
  return !!(strip &&
    strip.strips &&
    Array.isArray(strip.strips) &&
    strip.strips.length > 0 &&
    strip.strips[0] &&
    strip.strips[0].active === true)
}

const INITIAL_VISIBLE_STRIPS = 5

@Component({
  selector: 'ws-home-v2',
  templateUrl: './home-v2.component.html',
  styleUrls: ['./home-v2.component.scss'],
  standalone: false,
})
export class HomeV2Component implements OnInit, AfterViewInit, OnDestroy {

  // Angular 20 - inject() pattern for DI
  private readonly activatedRoute = inject(ActivatedRoute)
  private readonly configSvc = inject(ConfigurationsService)
  readonly btnSettingsSvc = inject(BtnSettingsService)
  readonly mobileAppsService = inject(MobileAppsService)
  private readonly router = inject(Router)
  private readonly translate = inject(TranslateService)
  private readonly userProfileService = inject(UserProfileService)
  private readonly matSnackBar = inject(MatSnackBar)
  private readonly events = inject(EventService)
  private readonly destroyRef = inject(DestroyRef)

  // Angular 20 - Signals for reactive state
  readonly isKPPanelenabled = signal(false)
  readonly isNudgeOpen = signal<boolean | undefined>(undefined)
  readonly isMDOMsgOpen = signal(true)
  readonly mobileTopHeaderVisibilityStatus = signal(true)
  readonly disableMenu = signal(false)
  readonly approvedStatus = signal(false)
  readonly rejectedStatus = signal(false)
  readonly canShowCustomAttrOpen = signal(false)
  readonly isTelemetryRaised = signal(false)
  readonly enableLazyLoadingFlag = signal(true)
  readonly rootOrgId = signal('')
  readonly jan26Change = signal<any>(null)

  // Data signals
  readonly contentStripData = signal<any[]>([])
  readonly sectionList = signal<any[]>([])
  readonly widgetData = signal<any>({})
  readonly sliderData = signal<any>({})
  readonly homeConfig = signal<any>({})
  readonly clientList = signal<any>(undefined)
  readonly pendingApprovalList = signal<any>(null)
  readonly enrollData = signal<any>(null)

  // Computed signals
  readonly activeSections = computed(() =>
    this.sectionList().filter((item: any) => item.isVisible && item.isActive)
  )

  // Static data
  readonly discussStripData = {
    strips: [
      {
        key: 'discuss',
        logo: 'forum',
        title: 'discuss',
        stripBackground: 'assets/instances/eagle/background/discuss.svg',
        titleDescription: 'Trending Discussions',
        stripConfig: { cardSubType: 'cardHomeDiscuss' },
        viewMoreUrl: {
          path: '/app/discuss/home',
          viewMoreText: 'Discuss',
          queryParams: {},
        },
        filters: [],
        request: {
          api: {
            path: '/apis/proxies/v8/discussion/recent',
            queryParams: {},
          },
        },
      },
    ],
  }

  readonly networkStripData = {
    strips: [
      {
        key: 'network',
        logo: 'group',
        title: 'network',
        stripBackground: 'assets/instances/eagle/background/network.svg',
        titleDescription: 'Connect with people you may know',
        stripConfig: { cardSubType: 'cardHomeNetwork' },
        viewMoreUrl: {
          path: '/app/network-v2',
          viewMoreText: 'Network',
          queryParams: {},
        },
        filters: [],
        request: {
          api: {
            path: '/apis/protected/v8/connections/v2/connections/recommended/userDepartment',
            queryParams: '',
          },
        },
      },
    ],
  }

  readonly carrierStripData = {
    widgets: [
      {
        dimensions: {},
        className: '',
        widget: {
          widgetType: 'carrierStrip',
          widgetSubType: 'CarrierStripMultiple',
          widgetData: {
            strips: [
              {
                key: 'Career',
                logo: 'work',
                title: 'Careers',
                stripBackground: 'assets/instances/eagle/background/careers.svg',
                titleDescription: 'Latest openings',
                stripConfig: { cardSubType: 'cardHomeCarrier' },
                viewMoreUrl: {
                  path: '/app/careers/home',
                  viewMoreText: 'Career',
                  queryParams: {},
                },
                filters: [],
                request: {
                  api: {
                    path: '/apis/protected/v8/discussionHub/categories/1',
                    queryParams: {},
                  },
                },
              },
            ],
          },
        },
      },
    ],
  }

  readonly homePageSections = [
    {
      sectionKey: 'aparCourses',
      header: 'APAR Courses',
      translateHeader: true,
      visibilityMode: 'visible',
      displayType: 'pills',
      defaultPillKey: 'apar',
      pills: [
        {
          pillKey: 'apar',
          pillLabel: 'APAR',
          pillDescription: ['Annual Performance', 'Appraisal Report'],
          pillImageUrl: '/assets/icons/home/apar.svg',
          translateLabel: true,
          visibilityMode: 'visible',
          contentConfig: {
            apiDetailsKey: 'aparApi',
            cardType: 'courseCard',
            maxCardsToShow: 4,
            cardClickUrl: '/app/course/:identifier',
            viewAllUrl: '/app/apar',
            showViewAll: true,
          },
        },
        {
          pillKey: 'caProgram',
          pillLabel: 'C.A. Program',
          pillDescription: ['Chartered Accountant Program courses'],
          pillImageUrl: '/assets/icons/home/ca-program.svg',
          translateLabel: true,
          visibilityMode: 'visible',
          contentConfig: {
            apiDetailsKey: 'aparCaProgramApi',
            cardType: 'courseCard',
            maxCardsToShow: 4,
            cardClickUrl: '/app/course/:identifier',
            viewAllUrl: '/app/apar/ca-program',
            showViewAll: true,
          },
        },
        {
          pillKey: 'learningPath',
          pillLabel: 'Learning Path',
          pillDescription: ['Structured learning paths'],
          pillImageUrl: '/assets/icons/home/learning-path.svg',
          translateLabel: true,
          visibilityMode: 'visible',
          contentConfig: {
            apiDetailsKey: 'aparLearningPathApi',
            cardType: 'courseCard',
            maxCardsToShow: 4,
            cardClickUrl: '/app/course/:identifier',
            viewAllUrl: '/app/apar/learning-path',
            showViewAll: true,
          },
        },
        {
          pillKey: 'standaloneAssessment',
          pillLabel: 'Standalone Assessment',
          pillDescription: ['Individual assessment modules'],
          pillImageUrl: '/assets/icons/home/assessment.svg',
          translateLabel: true,
          visibilityMode: 'visible',
          contentConfig: {
            apiDetailsKey: 'aparStandaloneApi',
            cardType: 'courseCard',
            maxCardsToShow: 4,
            cardClickUrl: '/app/course/:identifier',
            viewAllUrl: '/app/apar/standalone-assessment',
            showViewAll: true,
          },
        },
        {
          pillKey: 'moderatedContent',
          pillLabel: 'Moderated Content',
          pillDescription: ['Curated and reviewed content'],
          pillImageUrl: '/assets/icons/home/moderated-content.svg',
          translateLabel: true,
          visibilityMode: 'visible',
          contentConfig: {
            apiDetailsKey: 'aparModeratedApi',
            cardType: 'courseCard',
            maxCardsToShow: 4,
            cardClickUrl: '/app/course/:identifier',
            viewAllUrl: '/app/apar/moderated-content',
            showViewAll: true,
          },
        },
        {
          pillKey: 'exploreMore',
          pillLabel: 'Explore more...',
          pillDescription: ['Discover more content'],
          pillImageUrl: '/assets/icons/home/explore-more.svg',
          translateLabel: true,
          visibilityMode: 'visible',
          contentConfig: {
            apiDetailsKey: 'aparExploreMoreApi',
            cardType: 'courseCard',
            maxCardsToShow: 4,
            cardClickUrl: '/app/course/:identifier',
            viewAllUrl: '/app/apar/explore',
            showViewAll: true,
          },
        },
      ],
    },
    {
      sectionKey: 'spotlight',
      header: 'In Spotlight',
      translateHeader: true,
      visibilityMode: 'visible',
      displayType: 'cards',
      contentConfig: {
        apiDetailsKey: 'spotlightApi',
        cardType: 'spotlightCard',
        maxCardsToShow: 4,
        cardClickUrl: '/app/spotlight/:identifier',
        viewAllUrl: null,
        showViewAll: false,
      },
    },
    {
      sectionKey: 'popularOnIgot',
      header: 'Popular on iGOT',
      translateHeader: true,
      visibilityMode: 'visible',
      displayType: 'cards',
      isCollapsible: true,
      contentConfig: {
        apiDetailsKey: 'popularOnIgotApi',
        cardType: 'courseCard',
        maxCardsToShow: 4,
        cardClickUrl: '/app/course/:identifier',
        viewAllUrl: '/app/popular',
        showViewAll: true,
      },
    },
    {
      sectionKey: 'trendingCourses',
      header: 'Trending on iGOT',
      translateHeader: true,
      visibilityMode: 'visible',
      displayType: 'cards',
      isCollapsible: true,
      contentConfig: {
        apiDetailsKey: 'trendingAllApi',
        cardType: 'courseCard',
        maxCardsToShow: 4,
        cardClickUrl: '/app/course/:identifier',
        viewAllUrl: '/app/trending',
        showViewAll: true,
      },
    },
    {
      sectionKey: 'featuredAiCourses',
      header: 'Featured AI Courses',
      translateHeader: true,
      visibilityMode: 'visible',
      displayType: 'cards',
      isCollapsible: true,
      badge: {
        label: 'AI - powered',
        type: 'highlight',
      },
      contentConfig: {
        apiDetailsKey: 'featuredAiCoursesApi',
        cardType: 'courseCard',
        maxCardsToShow: 4,
        cardClickUrl: '/app/course/:identifier',
        viewAllUrl: '/app/featured-ai',
        showViewAll: true,
      },
    },
    {
      sectionKey: 'thirtyMinutesOrLess',
      header: '30 Minutes or Less',
      translateHeader: true,
      visibilityMode: 'visible',
      displayType: 'cards',
      isCollapsible: true,
      contentConfig: {
        apiDetailsKey: 'thirtyMinutesOrLessApi',
        cardType: 'courseCard',
        maxCardsToShow: 4,
        cardClickUrl: '/app/course/:identifier',
        viewAllUrl: '/app/30-minutes',
        showViewAll: true,
      },
    },
    {
      sectionKey: 'newReleases',
      header: 'New Releases',
      translateHeader: true,
      visibilityMode: 'visible',
      displayType: 'cards',
      isCollapsible: true,
      badge: {
        label: 'New',
        type: 'new',
      },
      contentConfig: {
        apiDetailsKey: 'newReleasesApi',
        cardType: 'courseCard',
        maxCardsToShow: 4,
        cardClickUrl: '/app/course/:identifier',
        viewAllUrl: '/app/new-releases',
        showViewAll: true,
      },
    },
  ]

  private readonly initialVisibleStrips = INITIAL_VISIBLE_STRIPS
  private enrollInterval: ReturnType<typeof setInterval> | null = null

  // Angular 20 - IntersectionObserver for lazy loading (replaces scroll listener)
  private intersectionObserver: IntersectionObserver | null = null

  configSuccess: MatSnackBarConfig = {
    panelClass: 'style-success',
    duration: 20000,
    horizontalPosition: 'center',
    verticalPosition: 'bottom',
  }

  ngOnInit(): void {
    this.initializeUserState()
    this.initializePageData()
    this.initializeSubscriptions()
    this.getListPendingApproval()
    this.handleDefaultFontSetting()
    this.startEnrollmentPolling()
    this.initializeLanguage()
  }

  ngAfterViewInit(): void {
    // Make initial strips visible
    this.sectionList.update(list => {
      const updated = [...list]
      for (let i = 0; i < updated.length && i < this.initialVisibleStrips; i++) {
        if (updated[i].section.startsWith('section_')) {
          updated[i] = { ...updated[i], isVisible: true }
        }
      }
      return updated
    })

    // Angular 20 - Use IntersectionObserver instead of scroll events
    this.setupIntersectionObserver()
  }

  ngOnDestroy(): void {
    if (this.enrollInterval) {
      clearInterval(this.enrollInterval)
    }
    this.intersectionObserver?.disconnect()
  }

  private initializeUserState(): void {
    let isNotMyUser = false
    let isIgotOrg = false

    if (this.configSvc?.unMappedUser) {
      this.rootOrgId.set(this.configSvc.unMappedUser.rootOrgId || '')
    }

    const profileDetails = this.configSvc?.unMappedUser?.profileDetails
    if (profileDetails?.profileStatus) {
      isNotMyUser = profileDetails.profileStatus.toLowerCase() === 'not-my-user'
    }
    if (profileDetails?.employmentDetails?.departmentName) {
      isIgotOrg = profileDetails.employmentDetails.departmentName.toLowerCase() === 'igot'
    }

    this.disableMenu.set(isNotMyUser && isIgotOrg)

    if (this.disableMenu()) {
      this.router.navigateByUrl('app/person-profile/me#profileInfo')
    }

    if (this.configSvc) {
      this.jan26Change.set(this.configSvc.overrideThemeChanges)
      const additionalProps = profileDetails?.additionalProperties
      if (additionalProps?.isProfileUpdatedMsgViewed !== undefined) {
        this.isMDOMsgOpen.set(additionalProps.isProfileUpdatedMsgViewed)
        if (!this.isMDOMsgOpen()) {
          this.getApprovedStatus()
          this.getRejectedStatus()
        }
      }
    }
  }

  private initializePageData(): void {
    const pageData = this.activatedRoute.snapshot.data.pageData

    if (pageData) {
      this.homeConfig.set(pageData.data.homeConfig)
    }

    if (pageData?.data) {
      let stripData = pageData.data.newHomeStrip || []
      stripData = [...stripData].sort((a: any, b: any) => a.order - b.order)
      this.contentStripData.set(stripData)

      const sections: any[] = []
      stripData.forEach((strip: any, index: number) => {
        sections.push({
          section: 'section_' + index,
          isVisible: false,
          stripData: strip,
          isActive: isStripActive(strip),
        })
      })

      this.clientList.set(pageData.data.clientList)
      this.widgetData.set(pageData.data.hubsData)
      this.enableLazyLoadingFlag.set(pageData.data.enableLazyLoading)
      this.sliderData.set(pageData.data.sliderData)

      sections.push({ section: 'slider', isVisible: false })
      sections.push({ section: 'discuss', isVisible: false })
      sections.push({ section: 'network', isVisible: false })

      this.sectionList.set(sections)
    }
  }

  private initializeSubscriptions(): void {
    this.mobileAppsService.mobileTopHeaderVisibilityStatus
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((status: any) => {
        this.mobileTopHeaderVisibilityStatus.set(status)
      })
  }

  private initializeLanguage(): void {
    const lang = localStorage.getItem('websiteLanguage')
    if (lang) {
      this.translate.setDefaultLang('en')
      this.translate.use(lang)
    }
  }

  private setupIntersectionObserver(): void {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const className = entry.target.getAttribute('data-section')
            if (className) {
              this.sectionList.update(list =>
                list.map(item =>
                  item.section === className ? { ...item, isVisible: true } : item
                )
              )
              this.intersectionObserver?.unobserve(entry.target)
            }
          }
        })
      },
      { rootMargin: '200px' }
    )

    // Observe sections that aren't initially visible
    setTimeout(() => {
      const sections = document.querySelectorAll('[data-section]')
      sections.forEach(el => {
        const sectionName = el.getAttribute('data-section')
        const sectionItem = this.sectionList().find((s: any) => s.section === sectionName)
        if (sectionItem && !sectionItem.isVisible) {
          this.intersectionObserver?.observe(el)
        }
      })
    })
  }

  private startEnrollmentPolling(): void {
    this.enrollInterval = setInterval(() => {
      this.getEnrollmentData()
    }, 1000)
  }

  getEnrollmentData(): void {
    const data = localStorage.getItem('userEnrollmentCount')
    if (data) {
      const parsed = JSON.parse(data)
      this.enrollData.set(parsed)
      this.isKPPanelenabled.set(!(parsed?.enrolledCourseCount))
      if (this.enrollInterval) {
        clearInterval(this.enrollInterval)
        this.enrollInterval = null
      }
    }
  }

  translateHub(hubName: string): string {
    return this.translate.instant(hubName)
  }

  getListPendingApproval(): void {
    this.userProfileService.listApprovalPendingFields()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.pendingApprovalList.set(res.result.data)
          if (!(res.result.data && res.result.data.length)) {
            this.handleUpdateMobileNudge()
          }
        },
        error: (error: HttpErrorResponse) => {
          if (!error.ok) {
            this.matSnackBar.open('Unable to fetch pending approval list')
          }
        },
      })
  }

  handleUpdateMobileNudge(): void {
    if (this.configSvc.unMappedUser?.id) {
      const profilePopUp = sessionStorage.getItem('hideUpdateProfilePopUp')
      const profileDetails = this.configSvc.unMappedUser.profileDetails

      if (profileDetails) {
        this.isNudgeOpen.set(
          profileDetails.profileStatus !== 'VERIFIED' &&
          (profilePopUp === 'true' || profilePopUp === null)
        )
      } else {
        this.isNudgeOpen.set(true)
      }
    }
  }

  handleDefaultFontSetting(): void {
    const fontClass = localStorage.getItem('setting')
    this.btnSettingsSvc.changeFont(fontClass)
  }

  handleRemindLater(): void {
    sessionStorage.setItem('hideUpdateProfilePopUp', 'true')
    this.isNudgeOpen.set(false)
  }

  fetchProfile(): void {
    this.handleMDOMsgstatus()
    this.router.navigate(['/app/person-profile/me'])
  }

  closeKarmaPointsPanel(): void {
    this.isKPPanelenabled.set(false)
  }

  handleMDOMsgstatus(): void {
    const reqUpdates = {
      request: {
        userId: this.configSvc.unMappedUser.id,
        profileDetails: {
          additionalProperties: {
            isProfileUpdatedMsgViewed: true,
          },
        },
      },
    }
    this.userProfileService.editProfileDetails(reqUpdates)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.isMDOMsgOpen.set(true)
          }
        },
        error: (error: HttpErrorResponse) => {
          if (!error.ok) {
            this.matSnackBar.open(error.error.text)
          }
        },
      })
  }

  getApprovedStatus(): void {
    this.userProfileService.fetchApprovedFields()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          if (res) {
            const list = res.result.data
            if (list?.length > 0) {
              this.approvedStatus.set(
                list.some((obj: any) =>
                  obj.hasOwnProperty('name') || obj.hasOwnProperty('group') || obj.hasOwnProperty('designation')
                )
              )
            } else {
              this.approvedStatus.set(false)
            }
          }
        },
        error: (error: HttpErrorResponse) => {
          if (!error.ok) {
            this.matSnackBar.open(error.error.text)
          }
        },
      })
  }

  getRejectedStatus(): void {
    this.userProfileService.listRejectedFields()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          if (res) {
            const list = res.result.data
            if (list?.length > 0) {
              this.rejectedStatus.set(
                list.some((obj: any) =>
                  obj.hasOwnProperty('name') || obj.hasOwnProperty('group') || obj.hasOwnProperty('designation')
                )
              )
            } else {
              this.rejectedStatus.set(false)
            }
          }
        },
        error: (error: HttpErrorResponse) => {
          if (!error.ok) {
            this.matSnackBar.open(error.error.text)
          }
        },
      })
  }

  // Track by function for optimal ngFor rendering
  trackBySection(_index: number, item: any): string {
    return item.section
  }

  trackByIndex(index: number): number {
    return index
  }

  raiseTelemetryInteratEvent(event: any): void {
    if (event?.viewMoreUrl) {
      this.raiseTelemetry(`${event.stripTitle} ${event.viewMoreUrl.viewMoreText}`, event.typeOfTelemetry)
    }

    if (!this.isTelemetryRaised() && event && !event.viewMoreUrl) {
      if (event.contentId?.includes('ext')) {
        this.events.raiseInteractTelemetry(
          { type: 'click', subType: event.typeOfTelemetry, id: 'card-content' },
          { id: event.contentId || event.identifier, type: 'External content' },
          { module: WsEvents.EnumTelemetrymodules.HOME }
        )
      } else {
        let id = event.typeOfTelemetry === 'mdoChannel' ? event.identifier : event.orgId
        let type = event.typeOfTelemetry === 'mdoChannel' ? 'org/ministry' : event.title
        let _subType = event.typeOfTelemetry === 'mdoChannel' ? 'mdo-channel' :
          event.typeOfTelemetry === 'karmaProgram' ? 'karma-programs' : event.typeOfTelemetry

        if ((event.typeOfTelemetry === 'cbpPlan' && !event?.sakshamAIGenerated
          || event.typeOfTelemetry === 'forYou'
          || event.typeOfTelemetry === 'continueLearning') && event.selectedTab && event.selectedPill
        ) {
          id = event.identifier
          type = event.primaryCategory
          _subType = `${event.selectedTab}-${event.selectedPill}`
        } else if (event.typeOfTelemetry === 'cbpPlan' && event?.sakshamAIGenerated) {
          id = event.identifier
          type = event.primaryCategory
          _subType = 'igot-ai'
        } else if (event.typeOfTelemetry === 'providers') {
          id = event.orgId
          type = 'org'
          _subType = 'training-institutions'
        }

        this.events.raiseInteractTelemetry(
          { type: 'click', subType: _subType, id: 'card-content', pageid: '/page/home' },
          { id, type },
          { module: WsEvents.EnumTelemetrymodules.HOME }
        )
      }
    }

    this.isTelemetryRaised.set(true)
  }

  raiseTelemetry(name: string, subtype: string): void {
    this.events.raiseInteractTelemetry(
      { type: 'click', subType: subtype, id: `${_.kebabCase(name).toLocaleLowerCase()}` },
      {},
      { module: WsEvents.EnumTelemetrymodules.HOME }
    )
  }

  redirectToCustomProfile(): void {
    this.router.navigate(['/app/person-profile/me'])
  }
}
