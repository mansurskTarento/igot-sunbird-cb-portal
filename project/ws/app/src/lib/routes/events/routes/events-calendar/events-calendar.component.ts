import { DatePipe } from '@angular/common';
import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { EventService } from '../../services/events.service';
import { HttpErrorResponse } from '@angular/common/http';
import { MatLegacySnackBar } from '@angular/material/legacy-snack-bar';
import * as _ from 'lodash'
import { ConfigurationsService, WsEvents } from '@sunbird-cb/utils-v2';
import { Router } from '@angular/router';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MultilingualTranslationsService } from '@sunbird-cb/utils-v2'
import { EventService as libEventService } from '@sunbird-cb/utils-v2'


@Component({
  selector: 'ws-app-events-calendar',
  templateUrl: './events-calendar.component.html',
  styleUrls: ['./events-calendar.component.scss']
})
export class EventsCalendarComponent implements OnInit {
  @Input() eventCalendarDetails: any
  selected = new Date();
  selectedDateText = 'Today'
  currentMonth = new Date();
  currentMonthYearText = ''
  daysInMonth: {
    date: Date,
    isPrevisDate: Boolean,
    hasRegisteredEvent: Boolean,
    isCurrentMonth: Boolean
  }[] = [];
  weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  userEventsList = []
  selectedDateEvents: any = []

  constructor(
    private datePipe: DatePipe,
    private eventService: EventService,
    private matSnackBar: MatLegacySnackBar,
    private configSvc: ConfigurationsService,
    private router: Router,
    private bottomSheetRef: MatBottomSheetRef<any>,
    @Inject(MAT_BOTTOM_SHEET_DATA) @Optional() public data: any,
    private langtranslations: MultilingualTranslationsService,
    private events: libEventService,
  ) {
    if (this.data) {
      this.eventCalendarDetails = this.data
    }
  }

  ngOnInit() {
    this.getEnrolledEvents()
    this.selected = new Date()
    this.selected.setHours(0, 0, 0, 0)
    this.selectedDateText = this.datePipe.transform(this.selected, 'dd MMM yyyy') as string
    this.currentMonthYearText = this.datePipe.transform(this.currentMonth, 'MMM yyyy') as string;
  }

  getEnrolledEvents() {
    const requestBody = {
      request: {
        retiredCoursesEnabled: true,
        status: 'All'
      }
    }

    if (_.get(this.configSvc, 'userProfile.userId')) {
      this.eventService.getUserEnrollEvents(_.get(this.configSvc, 'userProfile.userId'), requestBody).subscribe({
        next: (res: any) => {
          this.userEventsList = _.get(res, 'result.events')
          this.generateCalendarDays();
          this.getSelectedDateEvents()
        },
        error: (error: HttpErrorResponse) => {
          this.generateCalendarDays();
          const errorMessage = _.get(error, 'error.message', 'Something went wrong please try again')
          this.openSnackBar(errorMessage)
        }
      })
    }
  }

  generateCalendarDays() {
    this.daysInMonth = [];
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Add padding for days from previous month
    const firstDayOfWeek = firstDay.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      const date = new Date(year, month, -i)
      const details: {
        date: Date,
        isPrevisDate: Boolean,
        hasRegisteredEvent: Boolean,
        isCurrentMonth: Boolean
      } = {
        date: date,
        hasRegisteredEvent: this.hasEvent(date),
        isPrevisDate: date.getTime() < today.getTime(),
        isCurrentMonth: false
      }
      this.daysInMonth.unshift(details);
    }

    const lastDayOfMonth = lastDay.getDate()
    for (let i = 1; i <= lastDayOfMonth; i++) {
      const date = new Date(year, month, i)
      const details: {
        date: Date,
        isPrevisDate: Boolean,
        hasRegisteredEvent: Boolean,
        isCurrentMonth: Boolean
      } = {
        date: date,
        hasRegisteredEvent: this.hasEvent(date),
        isPrevisDate: date.getTime() < today.getTime(),
        isCurrentMonth: true
      }
      this.daysInMonth.push(details);
    }
  }

  hasEvent(dateToCheck: Date): boolean {
    let hasEvent = false
    if (this.userEventsList && this.userEventsList.length) {
      this.userEventsList.forEach((event: any) => {
        if (_.get(event, 'event.startDate')) {
          const eventData = new Date(_.get(event, 'event.startDate'))
          eventData.setHours(0, 0, 0, 0)
          if (dateToCheck.getTime() === eventData.getTime()) {
            hasEvent = true
            return hasEvent
          }
        }
      })
    }
    return hasEvent
  }

  prevMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.currentMonthYearText = this.datePipe.transform(this.currentMonth, 'MMM yyyy') as string;
    this.generateCalendarDays();
  }

  nextMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.currentMonthYearText = this.datePipe.transform(this.currentMonth, 'MMM yyyy') as string;
    this.generateCalendarDays();
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }

  selectDate(date: Date) {
    this.selected = date;
    this.selectedDateText = this.datePipe.transform(this.selected, 'dd MMM yyyy') as string
    this.getSelectedDateEvents()
  }

  getSelectedDateEvents() {
    this.selectedDateEvents = []
    if (this.userEventsList && this.userEventsList.length) {
      this.userEventsList.forEach((event: any) => {
        if (_.get(event, 'event.startDate')) {
          const eventData = new Date(_.get(event, 'event.startDate'))
          eventData.setHours(0, 0, 0, 0)
          if (this.selected.getTime() === eventData.getTime()) {
            const eventDetails = JSON.parse(JSON.stringify(_.get(event, 'event')))
            if (eventDetails && eventDetails.startDateTime && eventDetails.endDateTime) {
              const currentTime = new Date();
              const startTime = new Date(eventDetails.startDateTime);
              const endTime = new Date(eventDetails.endDateTime);
              eventDetails['startTime'] = this.datePipe.transform(eventDetails.startDateTime, 'hh:mm a')
              eventDetails['isLive'] = currentTime >= startTime && currentTime <= endTime
            }
            if (eventDetails['isLive']) {
              this.selectedDateEvents.unshift(eventDetails)
            } else {
              this.selectedDateEvents.push(eventDetails)
            }
          }
        }
      })
    }
  }

  translateLabels(label: string, type: any) {
    return this.langtranslations.translateActualLabel(label, type, '')
  }

  redirectTo(myEvent: any) {
    this.events.raiseInteractTelemetry(
      {
        type: 'click',
        subType: 'calendar-section',
        id: "card-content",
      },
      {
        id: _.get(myEvent, 'identifier'),
        type: "event"
      },
      {
        module: WsEvents.EnumTelemetrymodules.EVENTS,
      }
    )
    this.router.navigate([`/app/event-hub/home/${myEvent.identifier}`])
  }

  private openSnackBar(message: string) {
    this.matSnackBar.open(message)
  }

  closeDiaolg() {
    this.bottomSheetRef.dismiss()
  }

}
