import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable, Subject } from 'rxjs'
import * as _ from 'lodash'
const API_END_POINTS = {
  NOTIFICATIONS_COUNT: `apis/proxies/v8/v1/notifications/unread/count`,
  RESET_NOTIFICATIONS_COUNT: `apis/proxies/v8/v1/notifications/reset/unread/count`
}

@Injectable({
  providedIn: 'root',
})

export class NotificationsService {
  closeDialogPop = new Subject()
  nofificationsCount = new Subject()
  constructor(private http: HttpClient) { }

  getNotificationsData(): Observable<any> {
    return this.http.get(API_END_POINTS.NOTIFICATIONS_COUNT)
  }

  resetNotificationsCount(): Observable<any> {
    return this.http.get(API_END_POINTS.RESET_NOTIFICATIONS_COUNT, {})
  }


}
