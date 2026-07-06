import { Component, OnInit, inject } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { BtnSettingsService } from '@sunbird-cb/collection'
import { ConfigurationsService, EventService, WsEvents } from '@sunbird-cb/utils-v2'

@Component({
  selector: 'ws-home-v2',
  templateUrl: './home-v2.component.html',
  styleUrls: ['./home-v2.component.scss'],
  standalone: false,
})
export class HomeV2Component implements OnInit {

  private readonly activatedRoute = inject(ActivatedRoute)
  private readonly configSvc = inject(ConfigurationsService)
  readonly btnSettingsSvc = inject(BtnSettingsService)
  private readonly router = inject(Router)
  private readonly translate = inject(TranslateService)
  private readonly eventSvc = inject(EventService)

  homePageSections: any

  ngOnInit(): void {
    this.initializeUserState()
    this.initializePageData()
    this.handleDefaultFontSetting()
    this.initializeLanguage()
  }

  private initializeUserState(): void {
    const profileDetails = this.configSvc?.unMappedUser?.profileDetails
    const isNotMyUser = profileDetails?.profileStatus?.toLowerCase() === 'not-my-user'
    const isIgotOrg = profileDetails?.employmentDetails?.departmentName?.toLowerCase() === 'igot'

    if (isNotMyUser && isIgotOrg) {
      this.router.navigateByUrl('app/person-profile/me#profileInfo')
    }
  }

  private initializePageData(): void {
    const pageData = this.activatedRoute.snapshot.data?.home?.data
    if (pageData) {
      this.homePageSections = pageData.homeSection
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
