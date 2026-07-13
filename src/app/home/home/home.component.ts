import { AfterViewInit, Component, HostListener, OnInit } from '@angular/core'
import { HttpErrorResponse } from '@angular/common/http'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { MatSnackBar, MatSnackBarConfig as MatSnackBarConfig } from '@angular/material/snack-bar'
/* tslint:disable */
import _ from 'lodash'

/* tslint:enable */
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'

import { ConfigurationsService, DomainConfService, EventService, WsEvents } from '@sunbird-cb/utils-v2'
import { MobileAppsService } from '../../services/mobile-apps.service'
import { UserProfileService } from '@ws/app'
import { BtnSettingsService } from '@sunbird-cb/collection'

// import { NotificationComponent } from './notification/notification.component'

// const API_END_POINTS = {
//   fetchProfileById: (id: string) => `/apis/proxies/v8/api/user/v2/read/${id}`,
// }

// Add this helper function before your component class
function isStripActive(strip: any): boolean {
  return !!(strip &&
    strip.strips &&
    Array.isArray(strip.strips) &&
    strip.strips.length > 0 &&
    strip.strips[0] &&
    strip.strips[0].active === true)
}

// Add this constant at the top of your file (near other constants)
const INITIAL_VISIBLE_STRIPS = 5

@Component({
  selector: 'ws-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: false
})
export class HomeComponent implements OnInit, AfterViewInit {

  constructor(
    private activatedRoute: ActivatedRoute,
    private configSvc: ConfigurationsService,
    public btnSettingsSvc: BtnSettingsService,
    // private http: HttpClient,
    public mobileAppsService: MobileAppsService,
    private router: Router,
    private translate: TranslateService,
    private userProfileService: UserProfileService,
    private matSnackBar: MatSnackBar,
    private events: EventService,
    public domainConfSvc: DomainConfService,
  ) { }
  private destroySubject$ = new Subject()
  widgetData = {}
  sliderData: any = []
  contentStripData: any = {}
  discussStripData = {}
  networkStripData = {}
  carrierStripData = {}
  clientList: any = []
  homeConfig: any = {}
  homePageData: any = {}
  isNudgeOpen: any
  currentPosition: any
  mobileTopHeaderVisibilityStatus: any = true
  sectionList: any = []
  enableLazyLoadingFlag = true
  isKPPanelenabled = false
  enrollData: any
  enrollInterval: any
  // newHomeStrips: any
  jan26Change: any
  pendingApprovalList: any
  isTelemetryRaised = false
  isMDOMsgOpen = true
  approvedStatusList: any = []
  rejectedStatusList: any = []
  approvedStatus = false
  rejectedStatus = false
  disableMenu = false
  configSuccess: MatSnackBarConfig = {
    panelClass: 'style-success',
    duration: 20000,
    horizontalPosition: 'center',
    verticalPosition: 'bottom',
  }
  canShowCustomAttrOpen: boolean = false
  rootOrgId: string = ''

  // You could also add it as a class property for better encapsulation
  private readonly initialVisibleStrips = INITIAL_VISIBLE_STRIPS

  ngOnInit() {
    let isNotMyUser = false
    let isIgotOrg = false
    if (this.configSvc && this.configSvc.unMappedUser) {
      this.rootOrgId = this.configSvc.unMappedUser.rootOrgId || ''
    }
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
      this.disableMenu = true
      // this.router.navigateByUrl('app/person-profile/me#profileInfo')
    } else {
      this.disableMenu = false
    }
    if (this.disableMenu) {
      this.router.navigateByUrl('app/person-profile/me#profileInfo')
    }
    if (this.configSvc) {
      this.jan26Change = this.configSvc.overrideThemeChanges
      if (this.configSvc?.unMappedUser?.profileDetails && this.configSvc.unMappedUser.profileDetails.additionalProperties) {
        if (this.configSvc.unMappedUser.profileDetails.additionalProperties.isProfileUpdatedMsgViewed !== undefined) {
          this.isMDOMsgOpen = this.configSvc.unMappedUser.profileDetails.additionalProperties.isProfileUpdatedMsgViewed
          if (!this.isMDOMsgOpen && this.isDialogEnabled('mdoProfileUpdateStatus')) {
            this.getApprovedStatus()
            this.getRejectedStatus()
          }
        }
      }
    }
    this.mobileAppsService.mobileTopHeaderVisibilityStatus.subscribe((status: any) => {
      this.mobileTopHeaderVisibilityStatus = status
    })
    if (this.activatedRoute.snapshot.data.pageData) {
      this.homeConfig = this.activatedRoute.snapshot.data.pageData.data.homeConfig
      this.homePageData = this.activatedRoute.snapshot.data.pageData.data
    }
    // if (this.activatedRoute.snapshot.data.pageData) {
    //   this.newHomeStrips = this.activatedRoute.snapshot.data.pageData.data.newHomeStrip
    // }
    if (this.activatedRoute.snapshot.data.pageData && this.activatedRoute.snapshot.data.pageData.data) {
      this.contentStripData = this.activatedRoute.snapshot.data.pageData.data || []
      // tslint:disable-next-line: prefer-template
      this.contentStripData = (this.contentStripData.newHomeStrip || []).sort((a: any, b: any) => a.order - b.order)

      // Clear sectionList before adding new entries
      this.sectionList = []

      // Add all content strips to sectionList with correct indices
      this.contentStripData.forEach((strip: any, index: number) => {
        const obj: any = {}
        obj['section'] = 'section_' + index
        obj['isVisible'] = false
        obj['stripData'] = strip
        obj['isActive'] = isStripActive(strip)
        obj['order'] = strip.order
        this.sectionList.push(obj)
      })
    }

    this.clientList = this.activatedRoute.snapshot.data.pageData.data.clientList?.data
    this.widgetData = this.activatedRoute.snapshot.data.pageData.data.hubsData
    this.enableLazyLoadingFlag = this.activatedRoute.snapshot.data.pageData.data.enableLazyLoading

    this.discussStripData = {
      strips: [
        {
          key: 'discuss',
          logo: 'forum',
          title: 'discuss',
          stripBackground: 'assets/instances/eagle/background/discuss.svg',
          titleDescription: 'Trending Discussions',
          stripConfig: {
            cardSubType: 'cardHomeDiscuss',
          },
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

    this.networkStripData = {
      strips: [
        {
          key: 'network',
          logo: 'group',
          title: 'network',
          stripBackground: 'assets/instances/eagle/background/network.svg',
          titleDescription: 'Connect with people you may know',
          stripConfig: {
            cardSubType: 'cardHomeNetwork',
          },
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

    this.carrierStripData = {
      widgets:
        [
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
                    stripConfig: {
                      cardSubType: 'cardHomeCarrier',
                    },
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

    this.sliderData = this.activatedRoute.snapshot.data.pageData.data.sliderData?.data
    // slider position among the strips is driven by sliderData.order in the page config;
    // configs without an order keep the slider below all strips
    const sliderOrder = this.activatedRoute.snapshot.data.pageData.data.sliderData?.order
    this.sectionList.push({
      section: 'slider',
      isVisible: false,
      order: sliderOrder !== undefined && sliderOrder !== null ? sliderOrder : Number.MAX_SAFE_INTEGER,
    })
    this.sectionList.sort((a: any, b: any) =>
      (a.order !== undefined && a.order !== null ? a.order : Number.MAX_SAFE_INTEGER) -
      (b.order !== undefined && b.order !== null ? b.order : Number.MAX_SAFE_INTEGER))
    this.sectionList.push({ section: 'discuss', isVisible: false })
    this.sectionList.push({ section: 'network', isVisible: false })

    this.getListPendingApproval()
    // this.handleUpdateMobileNudge()
    this.handleDefaultFontSetting()

    if (this.homePageData?.karmaPointsPanel?.enabled) {
      this.enrollInterval = setInterval(() => {
        this.getEnrollmentData()
      }, 1000)
    }

    if (localStorage.getItem('websiteLanguage')) {
      this.translate.setDefaultLang('en')
      const lang = localStorage.getItem('websiteLanguage')!
      this.translate.use(lang)
    }
    // this.commondataSvc.mandatoryDetails()
  }

  ngAfterViewInit() {
    // Make the first few content strips visible initially. The scroll handler never re-checks
    // section_0..section_4, so those must always be marked visible regardless of where the
    // config-ordered slider lands. The slider itself is only pre-marked when it sits within
    // the initial viewport slots; further down it loads lazily on scroll.
    this.sectionList.forEach((sectionItem: any, index: number) => {
      if (sectionItem.section.match(new RegExp(`^section_[0-${this.initialVisibleStrips - 1}]$`))) {
        sectionItem.isVisible = true
      }
      if (sectionItem.section === 'slider' && index < this.initialVisibleStrips) {
        sectionItem.isVisible = true
      }
    })
  }

  getEnrollmentData() {
    this.enrollData = localStorage.getItem('userEnrollmentCount')
    if (this.enrollData) {
      this.enrollData = JSON.parse(this.enrollData)
      if (this.enrollData && this.enrollData.enrolledCourseCount) {
        this.isKPPanelenabled = false
      } else {
        this.isKPPanelenabled = true
      }
      clearInterval(this.enrollInterval)
    }
  }

  handleButtonClick(): void {
    // console.log('Working!!!')
  }

  translateHub(hubName: string): string {
    const translationKey = hubName
    return this.translate.instant(translationKey)
  }

  getListPendingApproval(): void {
    this.userProfileService.listApprovalPendingFields()
      .pipe(takeUntil(this.destroySubject$))
      .subscribe((res: any) => {
        this.pendingApprovalList = res.result.data
        // TODO...
        // this.matSnackBar.openFromComponent(NotificationComponent, {
        //   data: { type: 'pending' },
        // ...this.configSuccess,
        // })
        if (!(this.pendingApprovalList && this.pendingApprovalList.length)) {
          this.handleUpdateMobileNudge()
        }

      }, (error: HttpErrorResponse) => {
        if (!error.ok) {
          this.matSnackBar.open('Unable to fetch pending approval list')
        }
      })
  }

  // dialog/popup visibility from global-config -> components.dialogs
  isDialogEnabled(dialogKey: string): boolean {
    return this.domainConfSvc.isConfigEnabled('components.dialogs', 'enabled')
      && this.domainConfSvc.isConfigEnabled('components.dialogs', dialogKey)
  }

  handleUpdateMobileNudge() {
    if (!this.isDialogEnabled('profileUpdateNudge')) {
      this.isNudgeOpen = false
      return
    }
    if (this.configSvc.unMappedUser && this.configSvc.unMappedUser.id) {
      const profilePopUp = sessionStorage.getItem('hideUpdateProfilePopUp')
      if (this.configSvc.unMappedUser.profileDetails) {
        if (!(this.configSvc.unMappedUser.profileDetails.profileStatus === 'VERIFIED')
          && (profilePopUp === 'true' || profilePopUp === null)) {
          this.isNudgeOpen = true
        } else {
          this.isNudgeOpen = false
        }
      } else {
        this.isNudgeOpen = true
      }
      // this.fetchProfileById(this.configSvc.unMappedUser.id).subscribe((_obj: any) => {
      //   const profilePopUp = sessionStorage.getItem('hideUpdateProfilePopUp')

      //   if (_obj.profileDetails) {
      //     if (!(_obj.profileDetails.profileStatus === 'VERIFIED')
      //       && (profilePopUp === 'true' || profilePopUp === null)) {
      //       this.isNudgeOpen = true
      //     } else {
      //       this.isNudgeOpen = false
      //     }
      //   } else {
      //     this.isNudgeOpen = true
      //   }
      // })
    }
  }

  // fetchProfileById(id: any): Observable<any> {
  //   return this.http.get<[IUserProfileDetailsFromRegistry]>(API_END_POINTS.fetchProfileById(id))
  //     .pipe(map((res: any) => {
  //       return _.get(res, 'result.response')
  //     }))
  // }

  handleDefaultFontSetting() {
    const fontClass = localStorage.getItem('setting')
    this.btnSettingsSvc.changeFont(fontClass)
  }

  @HostListener('window:scroll', ['$event'])
  scrollHandler() {
    // Check visibility for sections that aren't already visible
    for (let i = 0; i < this.sectionList.length; i++) {
      if (!this.sectionList[i]['isVisible'] &&
        !this.sectionList[i]['section'].match(new RegExp(`^section_[0-${this.initialVisibleStrips - 1}]$`))) {
        this.checkSectionVisibility(this.sectionList[i]['section'])
      }
    }
  }

  checkSectionVisibility(className: string) {
    // Skip already visible sections
    if (className.match(new RegExp(`^section_[0-${this.initialVisibleStrips - 1}]$`))) {
      return
    }

    // Find the section in our list
    const sectionIndex = this.sectionList.findIndex((item: any) => item.section === className)
    if (sectionIndex === -1) return

    // Check if the element is in viewport
    const elements = document.getElementsByClassName(className)
    if (elements && elements.length > 0) {
      const rect = elements[0].getBoundingClientRect()
      const eleTop = rect.top
      const eleBottom = rect.bottom
      const isVisible = (eleTop >= 0) && (eleBottom <= window.innerHeight)

      // Update visibility
      if (isVisible) {
        this.sectionList[sectionIndex]['isVisible'] = true
      }
    }
  }

  handleRemindLater() {
    sessionStorage.setItem('hideUpdateProfilePopUp', 'true')
    this.isNudgeOpen = false
  }

  fetchProfile() {
    this.handleMDOMsgstatus()
    this.router.navigate(['/app/person-profile/me'])
  }

  closeKarmaPointsPanel() {
    this.isKPPanelenabled = false
  }

  handleMDOMsgstatus() {
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
    this.userProfileService.editProfileDetails(reqUpdates).subscribe((res: any) => {
      if (res) {
        this.isMDOMsgOpen = true
      }
    }, (error: HttpErrorResponse) => {
      if (!error.ok) {
        this.matSnackBar.open(error.error.text)
      }
    })
  }

  getApprovedStatus(): void {
    this.userProfileService.fetchApprovedFields()
      .pipe(takeUntil(this.destroySubject$))
      .subscribe((res: any) => {
        if (res) {
          this.approvedStatusList = res.result.data
          if (this.approvedStatusList && this.approvedStatusList.length > 0) {

            const exists = this.approvedStatusList.filter((obj: any) => {
              if (obj.hasOwnProperty('name') || obj.hasOwnProperty('group') || obj.hasOwnProperty('designation')) {
                return obj
              }
            }).length > 0
            if (exists) {
              this.approvedStatus = true
            } else {
              this.approvedStatus = false
            }
          } else {
            this.approvedStatus = false
          }
        }
      }, (error: HttpErrorResponse) => {
        if (!error.ok) {
          this.matSnackBar.open(error.error.text)
        }
      })
  }

  getRejectedStatus(): void {
    this.userProfileService.listRejectedFields()
      .pipe(takeUntil(this.destroySubject$))
      .subscribe((res: any) => {
        if (res) {
          this.rejectedStatusList = res.result.data
          if (this.rejectedStatusList && this.rejectedStatusList.length > 0) {
            const exists = this.rejectedStatusList.filter((obj: any) => {
              if (obj.hasOwnProperty('name') || obj.hasOwnProperty('group') || obj.hasOwnProperty('designation')) {
                return obj
              }
            }).length > 0

            if (exists) {
              this.rejectedStatus = true
            } else {
              this.rejectedStatus = false
            }
          } else {
            this.rejectedStatus = false
          }
        }
      }, (error: HttpErrorResponse) => {
        if (!error.ok) {
          this.matSnackBar.open(error.error.text)
        }
      })
  }

  raiseTelemetryInteratEvent(event: any) {
    if (event && event.viewMoreUrl) {
      this.raiseTelemetry(`${event.stripTitle} ${event.viewMoreUrl.viewMoreText}`, event.typeOfTelemetry)
    }
    if (!this.isTelemetryRaised && event && !event.viewMoreUrl) {
      if (event.contentId && event.contentId.includes('ext')) {
        this.events.raiseInteractTelemetry(
          {
            type: 'click',
            subType: event.typeOfTelemetry,
            id: 'card-content',
          },
          {
            id: event.contentId || event.identifier,
            type: 'External content',
          },
          {
            module: WsEvents.EnumTelemetrymodules.HOME,
          }
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
        }
        else if (event.typeOfTelemetry === 'cbpPlan' && event?.sakshamAIGenerated) {
          id = event.identifier
          type = event.primaryCategory
          _subType = 'igot-ai'
        }
        else if (event.typeOfTelemetry === 'providers') {
          id = event.orgId
          type = 'org'
          _subType = 'training-institutions'
        }

        this.events.raiseInteractTelemetry(
          {
            type: 'click',
            subType: _subType,
            id: 'card-content',
            pageid: '/page/home',
          },
          {
            id,
            type,
          },
          {
            module: WsEvents.EnumTelemetrymodules.HOME,
          }
        )
      }
    }
    this.isTelemetryRaised = true

  }

  raiseTelemetry(name: string, subtype: string) {
    this.events.raiseInteractTelemetry(
      {
        type: 'click',
        subType: subtype,
        id: `${_.kebabCase(name).toLocaleLowerCase()}`,
      },
      {},
      {
        module: WsEvents.EnumTelemetrymodules.HOME,
      }
    )
  }

}
