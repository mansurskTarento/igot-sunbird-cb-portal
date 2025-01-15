import { Injectable } from '@angular/core'
import moment from 'moment'


declare const smartech:any
// const API_END_POINTS = {
// }

@Injectable({
  providedIn: 'root',
})

export class NetCoreService {

    netCoreUserLoginSetup(payload:any) {
        /* tslint:disable */
        console.log('this.configSvc.unMappedUser', payload)
        /* tslint:enable */
        smartech('contact', '2', payload)
    }

    netCoreUserNameUpdate(payload:any) {
         /* tslint:disable */
         console.log('this.configSvc.unMappedUser', payload)
         /* tslint:enable */        
        smartech('contact', '2', payload)
    }

    netCoreUserProfilepdate(payload:any) {
        /* tslint:disable */
        console.log('this.configSvc.unMappedUser', payload)
        /* tslint:enable */
        smartech('contact', '2', payload)
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
