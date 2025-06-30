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
  GET_RECOMMENDED_USERS: '/apis/protected/v8/connections/v2/connections/recommended',
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
      if( this.configSvc && this.configSvc.userProfileV2) {
        this.configSvc.userProfileV2['profileBannerUrl'] = _.get(requestBody, 'result.response.profileDetails.profileBannerUrl', '');
      }
    }

  getCommunities(formBody: any): Observable<any> {
    return this.http.post<any>(API_END_POINTS.GET_COMMUNITIES, formBody)
  }

  getRecommendedUsers(formBody: any): Observable<any> {
    return this.http.post<any>(API_END_POINTS.GET_RECOMMENDED_USERS, formBody)
  }

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
}
