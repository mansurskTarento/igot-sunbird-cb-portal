import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NsWidgetResolver } from 'library/ws-widget/resolver/src/public-api'

@Component({
  selector: 'ws-app-events-home-v2',
  templateUrl: './events-home-v2.component.html',
  styleUrls: ['./events-home-v2.component.scss']
})
export class EventsHomeV2Component implements OnInit {

  banner!: NsWidgetResolver.IWidgetData<any>
  private bannerSubscription: any
  engagementDetails: any = {
    eventsAttended: '200',
    eventsEnrolled: '15',
    hoursWatched: '8h 45m'
  } 

  eventsList: any

  constructor(private route: ActivatedRoute) {

    this.bannerSubscription = this.route.data.subscribe(data => {
      if (data && data.pageData) {
        this.banner = data.pageData.data.banner || []
      }
    })
  }

  ngOnInit(): void {
    console.log(this.bannerSubscription)
    this.getEvents()
  }

  getEvents() {
    this.eventsList = [
      {
        eventName: 'Mission Youth',
        eventDescription: 'To transform Indian civil services capacity To transform Indian civil services capacity',
        eventTime: ''
      },
      {
        eventName: 'Mission Youth',
        eventDescription: 'To transform Indian civil services capacity To transform Indian civil services capacity',
        eventTime: '6:00pm'
      },
    ]
  }

}
