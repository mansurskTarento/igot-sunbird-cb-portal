import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Observable, of } from 'rxjs'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'

const API_END_POINTS = {
  BADGE_DETAILS: 'apis/proxies/v8/user/v1/badge/details',
  BADGE_DOWNLOAD: '/apis/proxies/v8/badge/dynamic/v1/generate',
}

@Injectable({
  providedIn: 'root',
})
export class BadgeService {

  constructor(private http: HttpClient, private configSvc: ConfigurationsService) { }

  fetchBadgeDetails(requestBody: any): Observable<any> {
    const cfg = this.configSvc.globalConfig?.apis?.user?.badgeDetails
    if (cfg && !cfg.enabled) {
      return of(null)
    }
    const url = (cfg?.enabled && cfg?.url) ? cfg.url : API_END_POINTS.BADGE_DETAILS
    return this.http.post<any>(url, requestBody)
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
