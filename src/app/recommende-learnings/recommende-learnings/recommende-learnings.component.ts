import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
/* tslint:disable */
import _ from 'lodash'
/* tslint:enable */
import { TranslateService } from '@ngx-translate/core'
import { MultilingualTranslationsService, WidgetEnrollService } from '@sunbird-cb/utils-v2'
import { SeeAllService } from '@ws/app/src/lib/routes/see-all/services/see-all.service'


@Component({
  selector: 'ws-recommende-learnings',
  templateUrl: './recommende-learnings.component.html',
  styleUrls: ['./recommende-learnings.component.scss'],
})
export class RecommendeLearningsComponent implements OnInit {
  recommendedConfig: any
  slectedPill: string = ''
  
  constructor(
    private activatedRoute: ActivatedRoute,
    //private widgetSvc: WidgetUserServiceLib,
    private translate: TranslateService,
    //private configSvc: ConfigurationsService,
    private langtranslations: MultilingualTranslationsService,
    private seeAllSvc: SeeAllService,
    private enrollSvc: WidgetEnrollService

    ) {
      this.langtranslations.languageSelectedObservable.subscribe(() => {
        if (localStorage.getItem('websiteLanguage')) {
          this.translate.setDefaultLang('en')
          const lang = localStorage.getItem('websiteLanguage')!
          this.translate.use(lang)
        }
      })
    }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe((res: any) => {
      this.slectedPill = (res.pillSelected) ? res.pillSelected : ''
    })
    if (this.activatedRoute.snapshot.data.pageData) {
      this.recommendedConfig = this.activatedRoute.snapshot.data.pageData.data.recommendedConfig
    }
    this.getRecommendeLeanings()
  }

  pillClicked(pill: any) {
    this.slectedPill = pill.value
  }

  async getRecommendeLeanings() {
    let response = await this.seeAllSvc.fetchDesigantionsData(this.recommendedConfig.strip.request.designationsList.path).toPromise()
    if(response) {
      let request = {
        "request": {
            "courseId": response
        }
      }
      let enollData =  await this.enrollSvc.fetchEnrollContentData(request).toPromise().then(async (res: any) => {
        if (res && res.result && res.result.courses && res.result.courses.length) {
          res.result.courses
          return res.result.courses
        } else {
          return {}
        }
      }).catch((_err: any) => {
        return {}
      })
      console.log("enollData ", enollData)
    }
  }

  
  
}
