import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { EventService } from '../../../services/events.service';
import { MultilingualTranslationsService, NsContent } from '@sunbird-cb/utils-v2';
import * as _ from 'lodash'

@Component({
  selector: 'ws-app-see-all',
  templateUrl: './see-all.component.html',
  styleUrls: ['./see-all.component.scss']
})
export class SeeAllComponent {
  titles: any = []
  contentDataList: any = []
  contnet: any = []
  category: string = ''
  constructor(
    private activateRoute: ActivatedRoute,
    private translate: TranslateService,
    private eventSvc: EventService,
    private langtranslations: MultilingualTranslationsService
  ) {
    this.titles = [
      { title: 'events', url: '/app/event-hub/home', icon: 'event' },
    ]
    if (localStorage.getItem('websiteLanguage')) {
      this.translate.setDefaultLang('en')
      const lang = localStorage.getItem('websiteLanguage')!
      this.translate.use(lang)
    }
  }
  ngOnInit() {
    this.activateRoute.queryParamMap.subscribe((data: any) => {
      if (data.params.category) {
        this.category = data.params.category
        this.titles.push({
          title: this.translateLabels(this.category, 'events', ''), url: `none`, icon: ''
        })
      }
    })
    this.fetchData()
  }
  fetchData() {
    let requestBody: any = {
      locale: [
        'en',
      ],
      query: '',
      request: {
        query: '',
        filters: {
          status: ['Live'],
          contentType: 'Event',
          category: 'Event',
          resourceType: "Karmayogi talks"
        },
        sort_by: {
          startDate: 'desc',
        },
        limit: 500,
      },
    }
    this.contentDataList = this.transformSkeletonToWidgets(this.contnet)
    this.eventSvc.getEventsList(requestBody).subscribe((resp: any) => {
      let response: any = _.get(resp, 'result.Event', [])
      if (response.length) {
        this.contentDataList = this.transformContentsToWidgets(response, {})
      } else {
        this.contentDataList = this.transformContentsToWidgets([], {})
      }
    }, error => {
      console.log("error", error)
      this.contentDataList = this.transformContentsToWidgets([], {})
    })
  }

  isLiveEvent(event: any) {
    if (event.startDate && event.endDate && event.startTime && event.endTime) {
      // Conver current time into milliseconds
      let currentTime = new Date().getTime() / 1000
      // Combining date and time for start event
      let evenStarttDate = new Date(`${event.startDate} ${event.startTime}`).getTime() / 1000
      // Combining date and time for end event
      let eventEndDate = new Date(`${event.endDate} ${event.endTime}`).getTime() / 1000
      return (currentTime <= eventEndDate && currentTime >= evenStarttDate)
    }
    return false
  }

  translateLabels(label: string, type: any, subtype: any) {
    return this.langtranslations.translateActualLabel(label, type, subtype)
  }

  private transformSkeletonToWidgets(
    strip: any
  ) {
    return [1, 2, 3, 4, 5, 6, 7, 8].map(_content => ({
      widgetType: 'card',
      widgetSubType: 'cardContent',
      widgetHostClass: 'mb-2',
      widgetData: {
        cardSubType: strip.viewMoreUrl && strip.viewMoreUrl.loaderConfig
          && strip.viewMoreUrl.loaderConfig.cardSubType || 'card-event-v2-skeleton',
        cardCustomeClass: strip.customeClass ? strip.customeClass : 'card-resource-container-small',
      },
    }))
  }

  private transformContentsToWidgets(
    contents: NsContent.IContent[],
    strip: any,
  ) {
    return (contents || []).map((content, idx) => ({
      widgetType: 'card',
      widgetSubType: 'cardContent',
      widgetHostClass: 'mb-2',
      widgetData: {
        content: {
          ...content,
          showLive: this.isLiveEvent(content),
        },
        ...(content.batch && {
          batch: content.batch,
        }),
        cardSubType: 'card-event-v2',
        context: {
          pageSection: strip.key,
          position: idx,
        },
        cardCustomeClass: strip.customeClass ? strip.customeClass : 'card-resource-container-small',
        intranetMode: strip.stripConfig && strip.stripConfig.intranetMode,
        deletedMode: strip.stripConfig && strip.stripConfig.deletedMode,
        contentTags: strip.stripConfig && strip.stripConfig.contentTags,
      },
    }))
  }

}
