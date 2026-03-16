import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { Observable, of } from 'rxjs'
import { catchError, map } from 'rxjs/operators'
import * as _ from 'lodash'
const API_END_POINTS = {
    FORM_READ: `/apis/v1/form/read`,
    ORG_READ: '/api/org/v1/read',
    MANDATE_NOTIFICATION_READ: 'apis/proxies/v8/v1/notifications/mandatory',
    MARK_MANDATORY_AS_READ: `apis/proxies/v8/v1/notifications/mandatory/read`,
}

declare const smartech: any

@Injectable({
    providedIn: 'root',
})

export class iGOTAIService {
    constructor(
        private http: HttpClient,
        public configSvc: ConfigurationsService
    ) {

    }

    getOrgReadData(organisationId: string): Observable<any> {
        const request = {
            request: {
                organisationId,
            },
        }
        return this.http.post<any>(API_END_POINTS.ORG_READ, request).pipe(
            map((res: any) => {
                return _.get(res, 'result.response')
            })
        )
    }

    iGOTAIConfigReadData(payload: any): Observable<any> {
        return this.formReadData(payload).pipe(
            map((rData: any) => {
                const finalData = rData && rData.result.form.data
                return (finalData)
            }),
            catchError((_error: any) => {
                const baseUrl = this.configSvc.sitePath
                return this.http.get(`${baseUrl}/igot-ai.json`).pipe(
                    map(data => (data)),
                    catchError(err => of({ data: null, error: err })),
                )
            }
            ),
        )
    }

    formReadData(request: any): Observable<any> {
        return this.http.post<any>(API_END_POINTS.FORM_READ, request)
    }

    getMandatoryNotification(): Observable<any> {
        return this.http.get<any>(API_END_POINTS.MANDATE_NOTIFICATION_READ).pipe(
            map((res: any) => {
                return _.get(res, 'result.notification')
            }),
            catchError((_error: any) => of({ data: null, error: _error })),
        )
    }

    markMandatoryAsRead(request: any): Observable<any> {
        return this.http.patch(API_END_POINTS.MARK_MANDATORY_AS_READ, request)
    }
}
