import { Component } from '@angular/core';

@Component({
  selector: 'ws-app-view-all',
  templateUrl: './view-all.component.html',
  styleUrls: ['./view-all.component.scss']
})
export class ViewAllComponent {

  titles: any = []
  facetsData: any
  selectedFilters: any = {}
  constructor() {
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

  }

  returnZero() {
    return 0
  }

  changeSelection(event: any, key: any, keyData: any, allKeyData: any) {
    console.log('changeSelection', event, key, keyData, allKeyData)
    if (event) {
      if (key === 'resourceType') {
        if (this.selectedFilters[key]) {
          let slected = this.selectedFilters[key]
          slected.push(keyData.name)
          this.selectedFilters[key] = slected
        } else {
          this.selectedFilters[key] = [keyData.name]
        }
      }
      if (key === 'eventStatus') {
        delete this.selectedFilters['resourceType']
      }
    } else {
      if (key === 'resourceType') {
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


}
