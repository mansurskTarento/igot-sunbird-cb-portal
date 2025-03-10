import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { debounceTime, map } from 'rxjs/operators';
import * as _ from 'lodash'
import { EventsEngagementComponent } from '../events-engagement/events-engagement.component';
import { EventsCalendarComponent } from '../events-calendar/events-calendar.component';
import { EventService } from '../../services/events.service';
import { NsWidgetResolver } from 'library/ws-widget/resolver/src/public-api'
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatBottomSheet } from '@angular/material/bottom-sheet';


@Component({
  selector: 'ws-app-events-v2',
  templateUrl: './events-v2.component.html',
  styleUrls: ['./events-v2.component.scss']
})
export class EventsV2Component {

  eventsHome!: NsWidgetResolver.IWidgetData<any>
  banner!: NsWidgetResolver.IWidgetData<any>
  engagementDetails: any = {
    eventsAttended: '200',
    eventsEnrolled: '15',
    hoursSpentOnEvents: '8h 45m'
  } 

  searchControl = new FormControl()

  constructor(
    private activatedRoute: ActivatedRoute,
    private bottomSheet: MatBottomSheet,
    private eventsService: EventService
    ) {
    this.activatedRoute.data.subscribe(data => {
      if (data && data.pageData) {
        _.get(data, 'pageData.data.version2.sectionList', []).forEach((section: any) => {
          if (section.key === 'eventsHome') {
            this.eventsHome = section
          } else if(section.key === 'banner') {
            this.banner = section
          }
        });
      }
    })
  }

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(500))
      .subscribe(value => {
        console.log(value)
      })
      this.getEventsEngagemeants()
  }

  getEventsEngagemeants() {
    this.eventsService.getEventEngagements().pipe(map((res: any) => {
      let result: any = {}
      if(_.get(res, 'result.userEventEnrolmentInfo')) {
        result = _.get(res, 'result.userEventEnrolmentInfo')
        result['hoursSpentOnEvents'] = this.convertMinutesToHoursAndMinutes(result['hoursSpentOnEvents'])
      }
      return result
    })).subscribe({
      next: (res: any) => {
        if(res) {
          this.engagementDetails = res
        }
      }, error: (error: HttpErrorResponse) => {
        if(error) {}
      }
    })
  }

  convertMinutesToHoursAndMinutes(minutes: number): string {
    let convertedTime = '0h 0m'
    if(minutes) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      convertedTime = `${hours}h ${remainingMinutes}m`
    }
    return convertedTime
  }

  openEventEngagementBottomSheet() {
    this.bottomSheet.open(EventsEngagementComponent, {
      data: {
        engagements: _.get(this.eventsHome, 'data.leftSection.data.myEngagements', {}),
        engagementDetails: this.engagementDetails
      },
      panelClass: 'engagement-bottomsheet',
    })
  }

  openEventCalendartBottomSheet() {
    this.bottomSheet.open(EventsCalendarComponent, {
      panelClass: 'calendar-bottomsheet',
    })
  }

  raiseTelemetryInteratEvent(event: any) {
    console.log(event)
  }

}
