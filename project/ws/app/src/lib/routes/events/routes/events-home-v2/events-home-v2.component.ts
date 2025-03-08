import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NsWidgetResolver } from 'library/ws-widget/resolver/src/public-api'
import { debounceTime } from 'rxjs/operators';
import * as _ from 'lodash'
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { EventsEngagementComponent } from '../events-engagement/events-engagement.component';
import { EventsCalendarComponent } from '../events-calendar/events-calendar.component';

@Component({
  selector: 'ws-app-events-home-v2',
  templateUrl: './events-home-v2.component.html',
  styleUrls: ['./events-home-v2.component.scss']
})
export class EventsHomeV2Component implements OnInit {

  banner!: NsWidgetResolver.IWidgetData<any>
  eventsHome!: NsWidgetResolver.IWidgetData<any>
  engagementDetails: any = {
    eventsAttended: '200',
    eventsEnrolled: '15',
    hoursWatched: '8h 45m'
  } 

  searchControl = new FormControl()

  dummyWidgetData = {
    "active": true,
    "enabled": true,
    "title": "Trending",
    "navigation": true,
    "key": "sectionMandatoryCourses",
    "order": 1,
    "navOrder": 1,
    "column": [
        {
            "active": true,
            "enabled": true,
            "key": "myEvents",
            "title": "My Events",
            "data": {
                "order": 1,
                "strips": [
                    {   
                        "active": true,
                        "customeClass": "width-238",
                        "key": "myEvents",
                        "logo": "school",
                        "disableTranslate": true,
                        "title": "My Events",
                        "stripTitleLink": {
                            "link": "",
                            "icon": ""
                        },
                        "sliderConfig": {
                            "showNavs": true,
                            "showDots": true,
                            "maxWidgets": 12,
                            "showNavsSpacing": true
                        },
                        "viewMoreUrl": {
                          "path": "/app/seeAll",
                          "viewMoreText": "Show all",
                          "queryParams": {
                            "key": "ciosContent"
                          }
                        },
                        // "tabs": [
                        //   {
                        //     "label": "Today",
                        //     "value": "today",
                        //     "computeDataOnClick": false,
                        //     "computeDataOnClickKey": "",
                        //     "requestRequired": true,
                        //     "showTabDataCount": false,
                        //     "maxWidgets": 12,
                        //     "stripConfig": {
                        //       "cardSubType": "card-event-v2"
                        //     },
                        //     "nodataMsg": "No events found",
                        //     "request": {
                        //       "limit": 12,
                        //       "offset": 0,
                        //       "filters": {
                        //         "status": ['Live'],
                        //         "contentType": 'Event',
                        //         "startDate": {
                        //           ">=": "<today>"
                        //         },
                        //         "endDate": {
                        //             "<=": "<today>"
                        //         }
                        //       },
                        //       "sort_by": {
                        //         "lastUpdatedOn": 'desc',
                        //       },
                        //     },
                        //   },
                        //   {
                        //     "label": "Upcoming",
                        //     "value": "upcoming",
                        //     "computeDataOnClick": false,
                        //     "computeDataOnClickKey": "",
                        //     "requestRequired": true,
                        //     "showTabDataCount": false,
                        //     "maxWidgets": 12,
                        //     "stripConfig": {
                        //       "cardSubType": "card-event-v2"
                        //     },
                        //     "nodataMsg": "No events found",
                        //     "request": {
                        //       "limit": 12,
                        //       "offset": 0,
                        //       "filters": {
                        //         "status": ['Live'],
                        //         "contentType": 'Event',
                        //         "startDate": {
                        //           ">": "<today>"
                        //         }
                        //       },
                        //       "sort_by": {
                        //         "lastUpdatedOn": 'desc',
                        //       },
                        //     },
                        //   },
                        //   {
                        //     "label": "Past",
                        //     "value": "past",
                        //     "computeDataOnClick": false,
                        //     "computeDataOnClickKey": "",
                        //     "requestRequired": true,
                        //     "showTabDataCount": false,
                        //     "maxWidgets": 12,
                        //     "stripConfig": {
                        //       "cardSubType": "card-event-v2"
                        //     },
                        //     "nodataMsg": "No events found",
                        //     "request": {
                        //       "limit": 12,
                        //       "offset": 0,
                        //       "filters": {
                        //         "status": ['Live'],
                        //         "contentType": 'Event',
                        //         "endDate": {
                        //             "<": "<today>"
                        //         }
                        //       },
                        //       "sort_by": {
                        //         "lastUpdatedOn": 'desc',
                        //       },
                        //     },
                        //   }
                        // ],
                        "stripBackground": "",
                        "titleDescription": "Mandatory courses",
                        "stripConfig": {
                            "cardSubType": "card-event-v2"
                        },
                        "loader": true,
                        "loaderConfig": {
                            "cardSubType": "card-event-v2-skeleton"
                        },
                        "filters": [],
                        "request": {
                          "apiUrl": "apis/proxies/v8/sunbirdigot/search",
                          "searchV6": {
                            "request": {
                              "limit": 12,
                              "offset": 0,
                              "filters": {
                                "status": ['Live'],
                                "contentType": 'Event',
                              //   "startDate": {
                              //     ">=": "<today>"
                              // },
                              // "endDate": {
                              //     "<=": "<today>"
                              // }
                              },
                              "sort_by": {
                                "lastUpdatedOn": 'desc',
                              },
                            },
                          },
                          "fetchData": "events",
                        }
                    }
                ]
            }
        },
        {
          "active": true,
          "enabled": true,
          "key": "recommendedEvents",
          "title": "Recommended Events",
          "data": {
              "order": 2,
              "strips": [
                  {   
                    "active": true,
                    "customeClass": "width-238",
                    "key": "recommendedEvents",
                    "logo": "school",
                    "disableTranslate": true,
                    "title": "Recommended Events",
                    "stripTitleLink": {
                        "link": "",
                        "icon": ""
                    },
                    "sliderConfig": {
                        "showNavs": true,
                        "showDots": true,
                        "maxWidgets": 12,
                        "showNavsSpacing": true
                    },
                    "viewMoreUrl": {
                      "path": "/app/seeAll",
                      "viewMoreText": "See all",
                      "queryParams": {
                        "key": "ciosContent"
                      }
                    },
                    "stripBackground": "",
                    "titleDescription": "Mandatory courses",
                    "stripConfig": {
                        "cardSubType": "card-event-v2"
                    },
                    "loader": true,
                    "loaderConfig": {
                        "cardSubType": "card-event-v2-skeleton"
                    },
                    "filters": [],
                    "request": {
                      "apiUrl": "apis/proxies/v8/sunbirdigot/search",
                      "searchV6": {
                        "request": {
                          "limit": 12,
                          "offset": 0,
                          "filters": {
                            "status": ['Live'],
                            "contentType": 'Event',
                          },
                          "sort_by": {
                            "lastUpdatedOn": 'desc',
                          },
                        },
                      },
                      "fetchData": "events",
                    }
                  }
              ]
          }
        },
        {
          "active": true,
          "enabled": true,
          "key": "trendingEvents",
          "title": "Trending Events",
          "data": {
              "order": 2,
              "strips": [
                  {   
                    "active": true,
                    "customeClass": "width-238",
                    "key": "trendingEvents",
                    "logo": "school",
                    "disableTranslate": true,
                    "title": "Trending Events",
                    "stripTitleLink": {
                        "link": "",
                        "icon": ""
                    },
                    "sliderConfig": {
                        "showNavs": true,
                        "showDots": true,
                        "maxWidgets": 12,
                        "showNavsSpacing": true
                    },
                    "viewMoreUrl": {
                      "path": "/app/seeAll",
                      "viewMoreText": "See all",
                      "queryParams": {
                        "key": "ciosContent"
                      }
                    },
                    "stripBackground": "",
                    "titleDescription": "Mandatory courses",
                    "stripConfig": {
                        "cardSubType": "card-event-v2"
                    },
                    "loader": true,
                    "loaderConfig": {
                        "cardSubType": "card-event-v2-skeleton"
                    },
                    "filters": [],
                    "request": {
                      "apiUrl": "apis/proxies/v8/sunbirdigot/search",
                      "searchV6": {
                        "request": {
                          "limit": 12,
                          "offset": 0,
                          "filters": {
                            "status": ['Live'],
                            "contentType": 'Event',
                          },
                          "sort_by": {
                            "lastUpdatedOn": 'desc',
                          },
                        },
                      },
                      "fetchData": "events",
                    }
                  }
              ]
          }
        },
        {
          "active": true,
          "enabled": true,
          "key": "featuredEvents",
          "title": "Featured Events",
          "data": {
              "order": 2,
              "strips": [
                  {   
                    "active": true,
                    "customeClass": "width-238",
                    "key": "featuredEvents",
                    "logo": "school",
                    "disableTranslate": true,
                    "title": "Featured Events",
                    "stripTitleLink": {
                        "link": "",
                        "icon": ""
                    },
                    "sliderConfig": {
                        "showNavs": true,
                        "showDots": true,
                        "maxWidgets": 12,
                        "showNavsSpacing": true
                    },
                    "viewMoreUrl": {
                      "path": "/app/seeAll",
                      "viewMoreText": "See all",
                      "queryParams": {
                        "key": "ciosContent"
                      }
                    },
                    "stripBackground": "",
                    "titleDescription": "Mandatory courses",
                    "stripConfig": {
                        "cardSubType": "card-event-v2"
                    },
                    "loader": true,
                    "loaderConfig": {
                        "cardSubType": "card-event-v2-skeleton"
                    },
                    "filters": [],
                    "request": {
                      "apiUrl": "apis/proxies/v8/sunbirdigot/search",
                      "searchV6": {
                        "request": {
                          "limit": 12,
                          "offset": 0,
                          "filters": {
                            "status": ['Live'],
                            "contentType": 'Event',
                          },
                          "sort_by": {
                            "lastUpdatedOn": 'desc',
                          },
                        },
                      },
                      "fetchData": "events",
                    }
                  }
              ]
          }
        }
    ]
}

  constructor(
    private route: ActivatedRoute,
    private bottomSheet: MatBottomSheet
    ) {

    this.route.data.subscribe(data => {
      if (data && data.pageData) {
        _.get(data, 'pageData.data.version2.sectionList', []).forEach((section: any) => {
          if(section.key === 'banner') {
            this.banner = section
          } else if (section.key === 'eventsHome') {
            this.eventsHome = section
          }
        });
      }
    })
  }

  ngOnInit(): void {
    this.getEvents()
    this.searchControl.valueChanges
      .pipe(debounceTime(500))
      .subscribe(value => {
        console.log(value)
      })
  }

  getEvents() {
  }

  openEventEngagementBottomSheet() {
    this.bottomSheet.open(EventsEngagementComponent, {
      data: _.get(this.eventsHome, 'data?.leftSection.data.myEngagements', {}),
      panelClass: 'filter-bottomsheet',
    })
  }

  openEventCalendartBottomSheet() {
    this.bottomSheet.open(EventsCalendarComponent, {
      panelClass: 'filter-bottomsheet',
    })
  }

  raiseTelemetryInteratEvent(event: any) {
    console.log(event)
  }

}
