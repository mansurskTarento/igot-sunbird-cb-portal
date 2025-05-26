import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NSProfileDataV2 } from '../models/profile-v2.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const API_END_POINTS = {
  GET_USER_BASIC_DETAILS: '/apis/proxies/v8/user/profile/v1/basic',
  GET_USER_ENTRIES: '/apis/proxies/v8/user/profile/v1/extended/',
  UPDATE_PROFILE_DETAILS: '/apis/proxies/v8/user/v1/extPatch',
  GET_RECOMMENDED_USERS : '/apis/protected/v8/connections/v2/connections/recommended',
  UPLOAD_PROFILE_PIC: '/apis/proxies/v8/storage/profilePhotoUpload/profileImage',
  UPLOAD_BANNER_PIC: '/apis/proxies/v8/storage/profilePhotoUpload/profileBanner',
  GET_CADRE_DETAILS: '/apis/proxies/v8/data/v2/system/settings/get/cadreConfig', // old
  APPROVAL_DETAILS: '/apis/proxies/v8/workflow/v2/userWFApplicationFieldsSearch', // old
  WITHDRAW_REQUEST: '/apis/protected/v8/workflowhandler/transition', // old
  ORG_SEARCH: '/apis/proxies/v8/org/v1/search', // old
  GET_DESIGNATIONS: '/apis/proxies/v8/user/v1/positions', // old
  GET_STATES_LIST: '/apis/proxies/v8/extendedprofile/list/states',
  GET_DISTRICTS_LIST: 'apis/proxies/v8/extendedprofile/list/districts',
  GET_DEGREES_LIST: 'apis/proxies/v8/masterdata/list/degrees',
  GET_INSTITUTIONS_LIST: 'apis/proxies/v8/masterdata/list/institutions',
  UPDATE_DEGREE: 'apis/proxies/v8/masterdata/update/degree',
  UPDATE_INSTITUTION: 'apis/proxies/v8/masterdata/update/institution',

  UPLOAD_ACHIEVEMENT_PIC: '/apis/proxies/v8/storage/profilePhotoUpload/userAchievements',
  ADD_ENTRIES: '/apis/proxies/v8/user/profile/v1/extended',
  UPDATE_ENTRIES: '/apis/proxies/v8/user/profile/v1/extended/update',
  DELETE_ENTRIES: '/apis/proxies/v8/user/profile/v1/extended/delete'
}

@Injectable({
  providedIn: 'root'
})
export class ProfileV2RevampService {

  constructor(
    private http: HttpClient
  ) { }

  fetchProfile(userId: string): Observable<NSProfileDataV2.IProfile> {
    return this.http.get<NSProfileDataV2.IProfile>(`${API_END_POINTS.GET_USER_BASIC_DETAILS}/${userId}`)
      .pipe(map(res => {
        return res
      }))
  }

  updateProfileDetails(requestBody: any): Observable<any> {
    return this.http.post<any>(API_END_POINTS.UPDATE_PROFILE_DETAILS, requestBody)
      .pipe(map(res => {
        return res
      }))
  }

  updateProfilePic(formData: FormData): Observable<any> {
    return this.http.post<any>(API_END_POINTS.UPLOAD_PROFILE_PIC, formData)
      .pipe(map(res => {
        return res
      }))
  }

  updateBannerPic(formData: FormData): Observable<any> {
    return this.http.post<any>(API_END_POINTS.UPLOAD_BANNER_PIC, formData)
      .pipe(map(res => {
        return res
      }))
  }

  fetchProfileEntries(userId: string, entryType: string = 'all'): Observable<NSProfileDataV2.IProfile> {
    return this.http.get<NSProfileDataV2.IProfile>(`${API_END_POINTS.GET_USER_ENTRIES}${entryType}/${userId}`)
      .pipe(map(res => {
        return res
      }))
  }

  getRecommendedUsers(formBody: any): Observable<any> {
    return this.http.post<any>(API_END_POINTS.GET_RECOMMENDED_USERS, formBody)
  }

  getOrgSearch(formBody: any): Observable<any> {
    return this.http.post<any>(API_END_POINTS.ORG_SEARCH, formBody)
  }
  getDesignations(_req: any): Observable<any> {
      return this.http.get<any>(API_END_POINTS.GET_DESIGNATIONS)
    }

  getStatesList(): Observable<any> {
    return this.http.get<any>(API_END_POINTS.GET_STATES_LIST)
  }

  getDistrictsList(state: string) {
    const formBody = {
      contextName: state
    }
    return this.http.post<any>(`${API_END_POINTS.GET_DISTRICTS_LIST}`, formBody)
  }

  getDegreesList(): Observable<any> {
    return this.http.get<any>(`${API_END_POINTS.GET_DEGREES_LIST}`)
  }

  getInstitutionsList() {
    return this.http.get<any>(API_END_POINTS.GET_INSTITUTIONS_LIST)
  }

  updateDegree(requestBody: any): Observable<any> {
    return this.http.post<any>(API_END_POINTS.UPDATE_DEGREE, requestBody)
  }

  updateInstitution(requestBody: any): Observable<any> {
    return this.http.post<any>(API_END_POINTS.UPDATE_INSTITUTION, requestBody)
  }

  updateAchievementPic(formData: FormData): Observable<any> {
    return this.http.post<any>(API_END_POINTS.UPLOAD_ACHIEVEMENT_PIC, formData)
  }

  addEntriesToProfile(requestBody: any): Observable<any> {
    return this.http.post<any>(API_END_POINTS.ADD_ENTRIES, requestBody)
  }

  updateEntriesOfProfile(requestBody: any): Observable<any> {
    return this.http.put<any>(API_END_POINTS.UPDATE_ENTRIES, requestBody)
  }

  deleteEntriesOfProfile(requestBody: any): Observable<any> {
    return this.http.delete<any>(API_END_POINTS.DELETE_ENTRIES, requestBody)
  }

}
