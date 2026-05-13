import { Component, Input, OnInit } from '@angular/core'
import { NsContent } from '@sunbird-cb/collection'
import { ActivatedRoute } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'

@Component({
    selector: 'viewer-survey-container',
    templateUrl: './survey.component.html',
    styleUrls: ['./survey.component.scss'],
    standalone: false
})
export class SurveyComponent implements OnInit {
  @Input() isFetchingDataComplete = false
  @Input() surveyData: NsContent.IContent | null = null
  @Input() forPreview = false
  @Input() widgetResolverSurveyData: any = {
    widgetType: 'player',
    widgetSubType: 'playerSurvey',
    widgetData: {
      surveyUrl: '',
      identifier: '',
      disableTelemetry: false,
      hideControls: true,
    },
  }
  @Input() isPreviewMode = false
  isTypeOfCollection = false
  isRestricted = false
  constructor(
    private activatedRoute: ActivatedRoute,
    private configSvc: ConfigurationsService
  ) { }

  ngOnInit() {
    if (this.configSvc.restrictedFeatures) {
      this.isRestricted =
        !this.configSvc.restrictedFeatures.has('disscussionForum')
    }
    this.isTypeOfCollection = this.activatedRoute.snapshot.queryParams.collectionType ? true : false
  }
}
