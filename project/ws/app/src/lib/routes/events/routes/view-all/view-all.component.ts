import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NsContent } from '@sunbird-cb/utils-v2';
import { EventService } from '../../services/events.service';
import * as _ from 'lodash'

@Component({
  selector: 'ws-app-view-all',
  templateUrl: './view-all.component.html',
  styleUrls: ['./view-all.component.scss']
})
export class ViewAllComponent {

  titles: any = []
  facetsData: any
  selectedFilters: any = {}
  contentDataList: any = []
  contnet: any = [
  ]
  constructor(private activateRoute: ActivatedRoute, private eventSvc: EventService,) {
    this.titles = [
      { title: 'Events', url: '/app/event-hub/home', disableTranslate: true, icon: 'event' },
      { title: 'Recommended Events', url: `none`, icon: '' },
    ]

    this.facetsData = {
      resourceType: {
        name: "Event Type",
        displayName: "Event Type",
        label: "Event Type",
        placeHolder: "Seach Event Type",
        viewMore: false,
        values: [
          {
            key: "karmayogiTalks",
            name: "Karmayogi Talks",
          },
          {
            key: "karmayogiSaptah",
            name: "karmayogi Saptah",
          },
          {
            key: "webinar",
            name: "Webinar",
          }
        ]
      },
      eventStatus: {
        name: "Event Status",
        displayName: "Event Status",
        label: "Event Status",
        viewMore: false,
        values: [
          {
            key: "upcoming",
            name: "Upcoming",
          },
          {
            key: "liveEvents",
            name: "Live Events",
          },
          {
            key: "pastEvents",
            name: "Past Events",
          }
        ]
      },
      eventDate: {
        name: "Event Date/Time",
        displayName: "Event Date/Time",
        label: "Event Date/Time",
        viewMore: false,
        values: [
          {
            key: "toDay",
            name: "Today",
          },
          {
            key: "tomorrow",
            name: "Tomorrow",
          },
        ]
      },
      dateRange: {
        name: "Date Range",
        displayName: "Choose Date Range",
        label: "Choose Date Range",
        viewMore: false,
        values: [
          {
            key: "fromDate",
            name: "From:",
            PlaceHolder: "Select Date",
          },
          {
            key: "toDate",
            name: "To:",
            PlaceHolder: "Select Date",
          },
        ]
      },
      eventDuration: {
        name: "Event Duration",
        displayName: "Event Duration",
        label: "Event Duration",
        viewMore: false,
        values: [
          {
            key: "lessThanHour",
            name: "Less than a hour",
          },
          {
            key: "2to3hrs",
            name: "2 to 3hr",
          },
          {
            key: "3to5hts",
            name: "3 to 5hr",
          }
        ]
      },
    }
  }

  ngOnInit() {
    this.activateRoute.queryParamMap.subscribe((data: any) => {
      if (data.params.resourceType) {
        this.selectedFilters['resourceType'] = [data.params.resourceType]
      }
    })
    console.log("selectedFilters", this.selectedFilters)
    this.contentDataList = this.transformSkeletonToWidgets(this.contnet)
    this.fetchData()
  }

  generateRequestBoday() {
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
        },
        sort_by: {
          startDate: 'desc',
        },
        limit: 500,
      },
    }
    if (this.selectedFilters && this.selectedFilters.resourceType) {
      requestBody = {
        ...requestBody,
        request: {
          ...requestBody.request,
          filters: {
            ...requestBody.request.filters,
            resourceType: this.selectedFilters.resourceType,
          },
        },
      };
    }
    console.log("this.selectedFilters.resourceType ", requestBody)
    return requestBody
  }

  fetchData() {
    const requestBody = this.generateRequestBoday()
    this.eventSvc.getEventsList(requestBody).subscribe((resp: any) => {
      const response = _.get(resp, 'result.Event', [])
      if (response.length) {
        this.contentDataList = this.transformContentsToWidgets(response, {})
      } else {
        this.contentDataList = this.transformContentsToWidgets([], {})
      }
      console.log("contentDataList ", this.contentDataList)
    }, error => {
      console.log("error", error)
      this.contentDataList = this.transformContentsToWidgets([], {})
    })
  }

  returnZero() {
    return 0
  }

  changeSelection(event: any, key: any, keyData: any, allKeyData: any) {
    console.log('changeSelection', event, key, keyData, allKeyData)
    if (event) {
      if (['resourceType', 'eventStatus', 'eventDuration'].includes(key)) {
        if (this.selectedFilters[key]) {
          let slected = this.selectedFilters[key]
          slected.push(keyData.name)
          this.selectedFilters[key] = slected
        } else {
          this.selectedFilters[key] = [keyData.name]
        }
        delete this.selectedFilters.key
      }
    } else {
      if (['resourceType', 'eventStatus', 'eventDuration'].includes(key)) {
        let filtered = this.selectedFilters[key].filter((item: any) => item !== keyData.name)
        if (filtered.length === 0) {
          delete this.selectedFilters[key]
        } else {
          this.selectedFilters[key] = filtered
        }
      }
    }
    console.log('selectedFilters', this.selectedFilters)
  }

  canCheck(key: any, keyData: any) {
    if (this.selectedFilters[key]) {
      return this.selectedFilters[key].includes(keyData.name)
    }
  }

  clearAll() {
    this.selectedFilters = {}
  }

  private transformSkeletonToWidgets(
    strip: any
  ) {
    return [1, 2, 3, 4, 5, 6].map(_content => ({
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
        content,
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
