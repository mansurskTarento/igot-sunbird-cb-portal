import { Component, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { EventService } from '../../../services/events.service';
import { MultilingualTranslationsService, NsContent, WsEvents } from '@sunbird-cb/utils-v2';
import * as _ from 'lodash'
import { EventService as libEventService } from '@sunbird-cb/utils-v2'
import { Subscription } from 'rxjs';

@Component({
  selector: 'ws-app-my-all-events',
  templateUrl: './my-all-events.component.html',
  styleUrls: ['./my-all-events.component.scss']
})
export class MyAllEventsComponent {
  titles: any = []
  contentDataList: any = []
  contnet: any = []
  tabSelected: string = ''
  tabIndex = 0
  currentPage: number = 0
  pageLimit: number = 12
  total = 0
  showNextPage = false
  isLoading = false
  dataScription: Subscription | null = null
  constructor(
    private activateRoute: ActivatedRoute,
    private translate: TranslateService,
    private eventSvc: EventService,
    private langtranslations: MultilingualTranslationsService,
    private events: libEventService,
  ) {
    this.titles = [
      { title: 'events', url: '/app/event-hub/home', icon: 'event' },
      { title: this.translateLabels("myEvents", 'events', ''), url: `none`, icon: '' }
    ]
    if (localStorage.getItem('websiteLanguage')) {
      this.translate.setDefaultLang('en')
      const lang = localStorage.getItem('websiteLanguage')!
      this.translate.use(lang)
    }
  }
  ngOnInit() {
    this.activateRoute.queryParamMap.subscribe((data: any) => {
      this.tabSelected = _.get(data, 'params.tabSelected', 'today')
    })
    this.fetchData()
  }

  @HostListener('window:scroll', [])

  onScroll(): void {
    if (
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 400 && !this.isLoading && this.showNextPage
    ) {
      this.fetchData()
    }
  }
  fetchData() {
    if (!this.isLoading) {
      this.contentDataList = [...this.contentDataList, ...this.transformSkeletonToWidgets(this.contnet)]
    }
    console.log("tabSelected ", this.tabSelected)
    let resourceType = ''
    if (this.tabSelected === 'today') {
      this.tabIndex = 0
      resourceType = 'Karmayogi Talks'
    } else if (this.tabSelected === 'upcoming') {
      resourceType = 'Karmayogi Saptah'
      this.tabIndex = 1
    } else if (this.tabSelected === 'past') {
      resourceType = 'Webinar'
      this.tabIndex = 2
    }
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
          resourceType: resourceType
        },
        sort_by: {
          startDate: 'desc',
        },
        limit: this.pageLimit || 12,
        offset: (this.pageLimit * this.currentPage) || 0
      },
    }
    if (this.dataScription) {
      this.dataScription.unsubscribe()
      this.dataScription = null
    }
    this.isLoading = true
    //this.contentDataList = this.transformSkeletonToWidgets(this.contnet)
    this.dataScription = this.eventSvc.getEventsList(requestBody).subscribe((resp: any) => {
      let response: any = _.get(resp, 'result.Event', [])
      this.contentDataList = this.contentDataList.slice(0, -12)
      this.total = this.contentDataList.length
      this.showNextPage = this.total < _.get(resp, 'result.count', 0)
      if (response.length) {
        this.contentDataList = [...this.contentDataList, ...this.transformContentsToWidgets(response, {})]
        this.currentPage = this.currentPage + 1
      } else {
        this.contentDataList = [...this.contentDataList, ...this.transformContentsToWidgets([], {})]
      }
      this.isLoading = false
    }, error => {
      console.log("error", error)
      this.contentDataList = [...this.contentDataList, ...this.transformContentsToWidgets([], {})]
      this.isLoading = false
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

  raiseTelemetry(event: any) {
    let subType = ''
    if (this.tabSelected === 'featuredEvents') {
      subType = 'featured-events'
    } else if (this.tabSelected === 'trendingEvents') {
      subType = 'trending-events'
    } else {
      subType = 'recommended-events'
    }
    this.events.raiseInteractTelemetry(
      {
        type: 'click',
        subType: subType,
        id: "card-content",
      },
      {
        id: _.get(event, event.identifier || ''),
        type: "event"
      },
      {
        module: WsEvents.EnumTelemetrymodules.EVENTS,
      }
    )
  }

  tabClick(tab: any) {
    this.tabIndex = tab.index
    if (tab.index === 0) {
      this.tabSelected = 'today'
    } else if (tab.index === 1) {
      this.tabSelected = 'upcoming'
    } else if (tab.index === 2) {
      this.tabSelected = 'past'
    }
    this.resetData()
    this.fetchData()
  }

  resetData() {
    if (this.dataScription) {
      this.dataScription.unsubscribe()
      this.dataScription = null
    }
    this.contentDataList = []
    this.currentPage = 0
    this.pageLimit = 12
  }

  private transformSkeletonToWidgets(
    strip: any
  ) {
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(_content => ({
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
