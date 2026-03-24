import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'

const API_END_POINTS = {
  BADGE_DETAILS: 'apis/proxies/v8/user/v1/badge/details',
}

@Injectable({
  providedIn: 'root',
})
export class BadgeService {

  constructor(private http: HttpClient) { }

  fetchBadgeDetails(requestBody: any): Observable<any> {
    return this.http.post<any>(API_END_POINTS.BADGE_DETAILS, requestBody)
  }
}