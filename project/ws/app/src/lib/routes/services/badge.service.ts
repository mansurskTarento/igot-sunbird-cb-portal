import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Observable } from 'rxjs'

const API_END_POINTS = {
  BADGE_DETAILS: 'apis/proxies/v8/user/v1/badge/details',
  BADGE_DOWNLOAD: '/apis/proxies/v8/badge/dynamic/v1/generate'
}

@Injectable({
  providedIn: 'root',
})
export class BadgeService {

  constructor(private http: HttpClient) { }

  fetchBadgeDetails(requestBody: any): Observable<any> {
    return this.http.post<any>(API_END_POINTS.BADGE_DETAILS, requestBody)
  }
  generateBadge(data: any): Observable<any> {
    return this.http.post(API_END_POINTS.BADGE_DOWNLOAD, data, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
      withCredentials: true,
    })
  }
}