import { Injectable } from '@angular/core'
import moment from 'moment'
import { HttpClient } from '@angular/common/http'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { Observable, of } from 'rxjs'
import { catchError, map } from 'rxjs/operators'

const API_END_POINTS = {
  FORM_READ: `/apis/v1/form/read`,
}

declare const smartech:any

@Injectable({
  providedIn: 'root',
})

export class NetCoreService {
    constructor(
        private http: HttpClient,
        public configSvc: ConfigurationsService
      ) {
    
      }

    netCoreConfigReadData(payload:any): Observable<any> {
        return this.formReadData(payload).pipe(
            map((rData: any) => {
            const finalData = rData && rData.result.form.data
            return (finalData)
            }),
            catchError((_error: any) => {
                console.log('_error', _error)
            const baseUrl = this.configSvc.sitePath
            return this.http.get(`${baseUrl}/netcore.json`).pipe(
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

    netCoreUserLoginSetup(payload:any) {
        /* tslint:disable */
        console.log('this.configSvc.unMappedUser', payload)
        /* tslint:enable */
        smartech('contact', '', payload)
    }

    netCoreUserNameUpdate(payload:any) {
         /* tslint:disable */
         console.log('this.configSvc.unMappedUser', payload)
         /* tslint:enable */        
        smartech('contact', '', payload)
    }

    netCoreUserProfilePhotoUpdate(payload:any) {
        /* tslint:disable */
        console.log('this.configSvc.unMappedUser', payload)
        /* tslint:enable */        
       smartech('contact', '', payload)
    }

    netCoreUserProfilepdate(payload:any) {
        /* tslint:disable */
        console.log('this.configSvc.unMappedUser', payload)
        /* tslint:enable */
        smartech('contact', '', payload)
    }
    
    netCoreUserProfileUpdateEvent(payload:any, eventName: any, userIdentifier:any) {
        /* tslint:disable */
        console.log('this.configSvc.unMappedUser', payload)
        console.log('eventName', eventName)
        console.log('userIdentifier', userIdentifier)
        /* tslint:enable */
        smartech('identify', userIdentifier)
        smartech('dispatch', eventName, payload)
    }

    trackEvent(eventName:any, userIdentifier:any, userpayload?:any) {
        // Get the current time (server time)
        let serverTime = moment();
        serverTime = serverTime.add(5, 'hours').add(30, 'minutes');

        // Display the server time
        /* tslint:disable */
        console.log("Server Time: ", serverTime.format('YYYY-MM-DD HH:mm:ss'));
        console.log('eventName', eventName)
        console.log('userIdentifier', userIdentifier)
        
        let payload:any = {
            'action_time': serverTime.format('YYYY-MM-DD HH:mm:ss'),
            'action_device': 'Desktop'
        }
        console.log('payload', payload)
        console.log('userpayload', userpayload)
        if(typeof userpayload === 'object'  && Object.keys(userpayload).length) {
            payload['profile_attribute_updated'] = JSON.stringify(userpayload)
        }
        console.log('payload', payload)
        smartech('identify', userIdentifier)
        smartech('dispatch', eventName, payload)
    }
}
