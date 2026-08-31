import { Component, OnInit, inject } from '@angular/core'
import { HttpErrorResponse } from '@angular/common/http'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { BtnSettingsService } from '@sunbird-cb/collection'
import { ContentApiService, VisibilityMode } from '@sunbird-cb/consumption'
import { ConfigurationsService, EventService, WsEvents } from '@sunbird-cb/utils-v2'
import { UserProfileService } from '@ws/app'
import { catchError, of } from 'rxjs'
import { CommonDataService } from '../../services/common-data.service'
import { HomePageService } from '../../services/home-page.service'

const APAR_COURSES_SECTION_KEY = 'aparCourses'

@Component({
  selector: 'ws-home-v2',
  templateUrl: './home-v2.component.html',
  styleUrls: ['./home-v2.component.scss'],
  standalone: false,
})
export class HomeV2Component implements OnInit {

  private readonly configSvc = inject(ConfigurationsService)
  readonly btnSettingsSvc = inject(BtnSettingsService)
  private readonly router = inject(Router)
  private readonly route = inject(ActivatedRoute)
  private readonly translate = inject(TranslateService)
  private readonly eventSvc = inject(EventService)
  private readonly userProfileService = inject(UserProfileService)
  private readonly matSnackBar = inject(MatSnackBar)
  private readonly commonDataSvc = inject(CommonDataService)
  private readonly contentApiService = inject(ContentApiService)
  private readonly homePageSvc = inject(HomePageService)

  isNudgeOpen: any
  canShowCustomAttrOpen: boolean = false
  pendingApprovalList: any

  ngOnInit(): void {
    this.initializeUserState()
    this.handleDefaultFontSetting()
    this.initializeLanguage()
    this.getListPendingApproval()
    this.loadPillsSectionInfo()
  }

  private loadPillsSectionInfo(): void {
    const configDetails = this.route.snapshot.data?.['home']?.data
    const pillsSection = configDetails?.homeSection?.find((section: any) => section.sectionKey === APAR_COURSES_SECTION_KEY)
    if (!pillsSection || pillsSection.visibilityMode !== VisibilityMode.Visible) {
      return
    }

    this.homePageSvc.getUserContentInfo().pipe(
      catchError(() => of(null)),
    ).subscribe(sectionRecordsCountRes => {
      const { pills, visibilityMode } = this.computePillsVisibility(pillsSection, sectionRecordsCountRes)
      this.contentApiService.updateSection(APAR_COURSES_SECTION_KEY, {
        pills,
        visibilityMode,
        sectionLoading: false,
      })
    })
  }

  private computePillsVisibility(pillsSection: any, sectionRecordsCountRes: any): { pills: any[]; visibilityMode: VisibilityMode } {
    if (!Array.isArray(pillsSection.pills)) {
      return { pills: pillsSection.pills, visibilityMode: pillsSection.visibilityMode }
    }
    if (!sectionRecordsCountRes || !sectionRecordsCountRes.result) {
      return { pills: pillsSection.pills, visibilityMode: VisibilityMode.Hidden }
    }
    let visablePillsCount = 0
    const pills = pillsSection.pills.map((pill: any) => {
      const isVisible = !!(pill.pillInfoCountKey && sectionRecordsCountRes.result[pill.pillInfoCountKey])
      if (isVisible) {
        visablePillsCount = visablePillsCount + 1
      }
      return { ...pill, visibilityMode: isVisible ? VisibilityMode.Visible : VisibilityMode.Hidden }
    })
    return {
      pills,
      visibilityMode: visablePillsCount === 0 ? VisibilityMode.Hidden : VisibilityMode.Visible,
    }
  }

  private initializeUserState(): void {
    const profileDetails = this.configSvc?.unMappedUser?.profileDetails
    const isNotMyUser = profileDetails?.profileStatus?.toLowerCase() === 'not-my-user'
    const isIgotOrg = profileDetails?.employmentDetails?.departmentName?.toLowerCase() === 'igot'

    if (isNotMyUser && isIgotOrg) {
      this.router.navigateByUrl('app/person-profile/me#profileInfo')
    }
  }

  private initializeLanguage(): void {
    const lang = localStorage.getItem('websiteLanguage')
    if (lang) {
      this.translate.setDefaultLang('en')
      this.translate.use(lang)
    }
  }

  private handleDefaultFontSetting(): void {
    const fontClass = localStorage.getItem('setting')
    this.btnSettingsSvc.changeFont(fontClass)
  }

  private getListPendingApproval(): void {
    this.userProfileService.listApprovalPendingFields().subscribe((res: any) => {
      this.pendingApprovalList = res.result.data
      if (!(this.pendingApprovalList && this.pendingApprovalList.length)) {
        this.handleUpdateMobileNudge()
      }
    }, (error: HttpErrorResponse) => {
      if (!error.ok) {
        this.matSnackBar.open('Unable to fetch pending approval list')
      }
    })
  }

  private handleUpdateMobileNudge(): void {
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
    }
  }

  // dialog/popup visibility from global-config -> components.dialogs
  isDialogEnabled(dialogKey: string): boolean {
    return this.commonDataSvc.isDialogEnabled(dialogKey)
  }

  handleRemindLater(): void {
    sessionStorage.setItem('hideUpdateProfilePopUp', 'true')
    this.isNudgeOpen = false
  }

  fetchProfile(): void {
    this.handleMDOMsgstatus()
    this.router.navigate(['/app/person-profile/me'])
  }

  private handleMDOMsgstatus(): void {
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
    this.userProfileService.editProfileDetails(reqUpdates).subscribe(undefined, (error: HttpErrorResponse) => {
      if (!error.ok) {
        this.matSnackBar.open(error.error.text)
      }
    })
  }

  redirectToCustomProfile(): void {
    this.commonDataSvc.redirectToCustomProfile()
  }

  cardClicked(event: any) {
    this.raiseTelemetryExploreContent(event.cardClickDetails)
  }

  raiseTelemetryExploreContent(cardClickDetails: any) {
    const eData: any = {
      type: WsEvents.EnumInteractTypes.CLICK,
      id: cardClickDetails?.id || '',
    }
    const object: any = {}
    if (cardClickDetails.subType) {
      eData.subType = cardClickDetails.subType
    }
    if (cardClickDetails.identifier) {
      object['id'] = cardClickDetails.identifier
      object['type'] = cardClickDetails.type || 'Course'
    }
    this.eventSvc.raiseInteractTelemetry(
      eData,
      object,
      {
        module: WsEvents.EnumTelemetrymodules.HOME,
      }
    )
  }
}
