import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'

const API_POINTS = {
    COMPETENCY_LIST: 'apis/proxies/v8/competency/v4/search',
    CERTIFICATE_URL: 'apis/protected/v8/cohorts/course/batch/cert/download/',
    ALL_COMPETENCY_LIST: 'apis/proxies/v8/framework/v1/read/kcmfinal_fw',
    MY_COMPETENCY_LIST: 'apis/proxies/v8/learner/v1/competency/read',
    IGOT_COURSE_LIST: 'apis/proxies/v8/sunbirdigot/v4/search',
    EXT_COURSE_LIST: 'apis/proxies/v8/cios/v1/search/content',
    ACHIEVEMENTS_LIST: 'apis/proxies/v8/learner/achievement/v2/list',
    FETCH_MISSING_THEMES: `apis/proxies/v8/competencyTheme/search`
}

@Injectable({ providedIn: 'root' })

export class CompetencyPassbookService {
    // tslint: disable-next-line: whitespace
    constructor(private http: HttpClient) { }
    getCompetencyList(payload: any): Observable<any> {
        return this.http.post(API_POINTS.COMPETENCY_LIST, payload)
    }

    fetchCertificate(certId: string): Observable<any> {
        return this.http.get(API_POINTS.CERTIFICATE_URL + certId)
    }

    fetchAllCompetencyList(): Observable<any> {
        return this.http.get(API_POINTS.ALL_COMPETENCY_LIST)
    }

    getMyCompetencyList(): Observable<any> {
        return this.http.get(API_POINTS.MY_COMPETENCY_LIST)
    }

    getIGOTCourseList(payload: any): Observable<any> {
        return this.http.post(API_POINTS.IGOT_COURSE_LIST, payload)
    }

    getExternalCourseList(payload: any): Observable<any> {
        return this.http.post(API_POINTS.EXT_COURSE_LIST, payload)
    }

    getAcheivementsList(payload: any): Observable<any> {
        return this.http.post(API_POINTS.ACHIEVEMENTS_LIST, payload)
    }

    fetchMissingThemes(payload: any): Observable<any> {
        return this.http.post(API_POINTS.FETCH_MISSING_THEMES, payload)
    }
}
