import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NSProfileDataV2 } from '../models/profile-v2.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const API_END_POINTS = {
  GET_USER_BASIC_DETAILS: '/apis/proxies/v8/user/profile/v1/basic',
  GET_USER_ENTRIES: '/apis/proxies/v8/user/profile/v1/extended/',
  UPDATE_PROFILE_PIC: '/apis/proxies/v8/storage/profilePhotoUpload/profileImage',
  GET_CADRE_DETAILS: '/apis/proxies/v8/data/v2/system/settings/get/cadreConfig', // old
  APPROVAL_DETAILS: '/apis/proxies/v8/workflow/v2/userWFApplicationFieldsSearch', // old
  WITHDRAW_REQUEST: '/apis/protected/v8/workflowhandler/transition', // old
  GET_STATES_LIST: '',
  GET_DISTRICTS_LIST: '',
  GET_DEGREES_LIST: '',
  GET_INSTITUTIONS_LIST: '',

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

  updateProfilePic(formData: FormData): Observable<any> {
    return this.http.post<any>(API_END_POINTS.UPDATE_PROFILE_PIC, formData)
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

  getStatesList(): Observable<any> {
    return this.http.get<any>(API_END_POINTS.GET_STATES_LIST)
  }

  getDistrictsList(state: string) {
    return this.http.get<any>(`${API_END_POINTS.GET_DISTRICTS_LIST}/${state}`)
  }

  getDegreesList(): Observable<any> {
    return this.http.get<any>(`${API_END_POINTS.GET_DEGREES_LIST}`)
  }

  getInstitutionsList() {
    return this.http.get<any>(API_END_POINTS.GET_INSTITUTIONS_LIST)
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
