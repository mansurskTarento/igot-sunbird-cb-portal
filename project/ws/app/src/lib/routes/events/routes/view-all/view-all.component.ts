import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NsContent } from '@sunbird-cb/utils-v2';
import { EventService } from '../../services/events.service';
import * as _ from 'lodash'
import { DatePipe } from '@angular/common';
//import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { UntypedFormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MobileFiltersComponent } from '../events/mobile-filters/mobile-filters.component';

@Component({
  selector: 'ws-app-view-all',
  templateUrl: './view-all.component.html',
  styleUrls: ['./view-all.component.scss'],
  providers: [DatePipe]
})
export class ViewAllComponent {

  titles: any = []
  facetsData: any
  selectedFilters: any = {}
  contentDataList: any = []
  contnet: any = []
  startDate: any = ''
  endDate: any = ''
  searchControl = new UntypedFormControl('')
  constructor(private activateRoute: ActivatedRoute, private eventSvc: EventService,
    private datePipe: DatePipe, private bottomSheet: MatBottomSheet,
  ) {
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
          {
            key: "button"
          }
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

    this.searchControl.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged()
    ).subscribe(() => {
      this.fetchData()
    })
    this.activateRoute.queryParamMap.subscribe((data: any) => {
      if (data.params.resourceType) {
        this.selectedFilters['resourceType'] = [data.params.resourceType]
      }
    })

    console.log("selectedFilters", this.selectedFilters)
    this.fetchData()
  }

  generateRequestBoday() {
    let requestBody: any = {
      locale: [
        'en',
      ],
      query: '',
      request: {
        query: this.searchControl && this.searchControl.value ? this.searchControl.value : '',
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
    if (this.selectedFilters) {
      let startDate: any = ''
      let endDate: any = ''
      console.log(this.datePipe, startDate, endDate)
      if (this.selectedFilters.eventDate && this.selectedFilters.eventDate.length) {
        if (this.selectedFilters.eventDate.includes('Today') && !this.selectedFilters.eventDate.includes('Tomorrow')) {
          startDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd')
          endDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd')
        }
        if (!this.selectedFilters.eventDate.includes('Today') && this.selectedFilters.eventDate.includes('Tomorrow')) {
          let tomorrow = new Date()
          tomorrow.setDate(tomorrow.getDate() + 1)
          startDate = this.datePipe.transform(tomorrow, 'yyyy-MM-dd')
          endDate = this.datePipe.transform(tomorrow, 'yyyy-MM-dd')
        }
        if (this.selectedFilters.eventDate.includes('Today') && this.selectedFilters.eventDate.includes('Tomorrow')) {
          const today = new Date()
          let tomorrow = new Date()
          tomorrow.setDate(tomorrow.getDate() + 1)
          startDate = this.datePipe.transform(today, 'yyyy-MM-dd')
          endDate = this.datePipe.transform(tomorrow, 'yyyy-MM-dd')
        }
      }
      if (this.selectedFilters.dateRange && this.selectedFilters.dateRange.fromDate && this.selectedFilters.dateRange.toDate) {
        startDate = this.datePipe.transform(new Date(this.selectedFilters.dateRange.fromDate), 'yyyy-MM-dd')
        endDate = this.datePipe.transform(new Date(this.selectedFilters.dateRange.toDate), 'yyyy-MM-dd')
      }
      requestBody = {
        ...requestBody,
        request: {
          ...requestBody.request,
          filters: {
            ...requestBody.request.filters,
            resourceType: this.selectedFilters.resourceType ? this.selectedFilters.resourceType : [],
            ...(startDate ? { "startDate": { ">=": [startDate] } } : {}),
            ...(endDate ? { "endDate": { "<=": [endDate] } } : {}),
          },
        },
      }


    }
    console.log("this.selectedFilters.resourceType ", requestBody)
    return requestBody
  }

  fetchData() {
    this.contentDataList = this.transformSkeletonToWidgets(this.contnet)
    const requestBody = this.generateRequestBoday()
    this.eventSvc.getEventsList(requestBody).subscribe((resp: any) => {
      let response: any = _.get(resp, 'result.Event', [])
      if (response.length) {
        if (this.selectedFilters.eventStatus) {
          response = this.processResult(response)
          this.contentDataList = this.transformContentsToWidgets(response, {})
        } else {
          this.contentDataList = this.transformContentsToWidgets(response, {})
        }
      } else {
        this.contentDataList = this.transformContentsToWidgets([], {})
      }
      console.log("contentDataList ", this.contentDataList)
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

  processResult(events: any) {
    let processedEvents: any = []
    events.forEach((event: any) => {
      if (event.startDate && event.endDate && event.startTime && event.endTime) {
        // Conver current time into milliseconds
        let currentTime = new Date().getTime() / 1000
        // Combining date and time for start event
        let evenStarttDate = new Date(`${event.startDate} ${event.startTime}`).getTime() / 1000
        // Combining date and time for end event
        let eventEndDate = new Date(`${event.endDate} ${event.endTime}`).getTime() / 1000
        console.log(" time ", event.startDate, currentTime, evenStarttDate, eventEndDate)
        if (currentTime > eventEndDate) {
          if (this.selectedFilters.eventStatus.includes('Past Events')) {
            processedEvents.push(event)
          }
        } else if (currentTime <= eventEndDate && currentTime >= evenStarttDate) {
          if (this.selectedFilters.eventStatus.includes('Live Events')) {
            event.showLive = true
            processedEvents.push(event)
          }
        } else {
          if (this.selectedFilters.eventStatus.includes('Upcoming')) {
            processedEvents.push(event)
          }
        }
      }
    })
    return processedEvents
  }

  filterChange(data: any) {
    console.log(data)
    this.selectedFilters = data
    this.fetchData()
  }

  clearAll() {
    this.selectedFilters = {}
    this.startDate = ''
    this.endDate = ''
  }

  openBottomSheet(): void {
    const bottomSheetRef = this.bottomSheet.open(MobileFiltersComponent, {
      data: {
        facetsData: this.facetsData,
        selectedFilters: this.selectedFilters,
        clonedFilters: this.selectedFilters,
      },
      panelClass: 'filter-bottomsheet',
      disableClose: true
    })
    bottomSheetRef.afterDismissed().subscribe((result: any) => {
      if (result && result.action === 'apply') {
        this.selectedFilters = result.selectedFilters
        this.fetchData()
      }
    })
  }

  sortType(type: any) {
    if (type == 'asc') {
      this.contentDataList = this.contentDataList.sort((a: any, b: any) =>
        a.widgetData.content.name.localeCompare(b.widgetData.content.name))
    } else if (type === 'short') {
      this.contentDataList = this.contentDataList.sort(
        (a: any, b: any) => a.widgetData.content.duration - b.widgetData.content.duration)
    } else {
      this.contentDataList = this.contentDataList.sort(
        (a: any, b: any) => b.widgetData.content.duration - a.widgetData.content.duration)
    }
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

