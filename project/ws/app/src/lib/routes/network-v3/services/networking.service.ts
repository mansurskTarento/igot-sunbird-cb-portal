import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ConfigurationsService } from '@sunbird-cb/utils-v2';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as _ from 'lodash';

const API_END_POINTS = {
  GET_USER_BASIC_DETAILS: '/apis/proxies/v8/user/profile/v1/basic',
  GET_COMMUNITIES: '/apis/proxies/v8/community/v1/search',
  GET_CONNECTION_REQUESTS: '/apis/protected/v8/connections/v2/connections/requests/received',
  GET_RECOMMENDED_USERS: '/apis/protected/v8/connections/v3/connections/recommended',
  GET_RECOMMENDED_MENTORS: '/apis/protected/v8/connections/v3/connections/recommended/mentors',
}

@Injectable({
  providedIn: 'root'
})
export class NetworkingService {

  constructor(
    private http: HttpClient,
    private translateService: TranslateService,
    private configSvc: ConfigurationsService
  ) { }

  fetchProfile(userId: string): Observable<any> {
    return this.http.get<any>(`${API_END_POINTS.GET_USER_BASIC_DETAILS}/${userId}`)
      .pipe(map(res => {
        this.configulreProfileDetails(res)
        return res
      }))
  }

  configulreProfileDetails(requestBody: any) {
    if (this.configSvc && this.configSvc.userProfileV2) {
      this.configSvc.userProfileV2['profileBannerUrl'] = _.get(requestBody, 'result.response.profileDetails.profileBannerUrl', '');
    }
  }

  getCommunities(formBody: any): Observable<any> {
    return this.http.post<any>(API_END_POINTS.GET_COMMUNITIES, formBody)
  }


  getConnectionRequests(): Observable<any> {
    return this.http.get<any>(API_END_POINTS.GET_CONNECTION_REQUESTS).pipe(
      map(response => {
        const modifiedResponse = this.formatedConnectionRequests(_.get(response, 'result.data'));
        return modifiedResponse;
      })
    )
  }

  formatedConnectionRequests(requests: any[]): any[] {
    if(requests) {
      requests.forEach((request: any) => {
        if(request.recievedAt) {
          request['timeAgo'] = this.getTimeAgo(request.recievedAt);
        }
      })
    }
    return requests
  }

  getTimeAgo(recievedAt: number): string {
    const now = Date.now();
    const diff = Math.max(0, now - recievedAt);

    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'}`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days === 1 ? '' : 's'}`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months === 1 ? '' : 's'}`;

    const years = Math.floor(months / 12);
    return `${years} year${years === 1 ? '' : 's'}`;
  }

  getRecommendedUsers(formBody: any): Observable<any> {
    return this.http.post<any>(API_END_POINTS.GET_RECOMMENDED_USERS, formBody)
  }

  getRecommendedMentors(formBody: any): Observable<any> {
    return this.http.post<any>(API_END_POINTS.GET_RECOMMENDED_MENTORS, formBody)
  }

  //#region (translation related methods)
  handleTranslateTo(menuName: string): string {
    // tslint:disable-next-line: prefer-template
    const translationKey = 'profileInfo.' + menuName.replace(/\s/g, '')
    return this.translateService.instant(translationKey)
  }

  getWebSiteLanguage() {
    if (localStorage.getItem('websiteLanguage')) {
      this.translateService.setDefaultLang('en')
      const lang = localStorage.getItem('websiteLanguage')!
      this.translateService.use(lang)
    }
  }
  //#endregion (translation related methods)
}
