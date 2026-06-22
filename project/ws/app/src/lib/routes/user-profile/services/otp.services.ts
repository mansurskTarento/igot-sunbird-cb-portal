import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable, of } from 'rxjs'
import { CommonMethodsService, ConfigDetails } from '@sunbird-cb/consumption'
const API_ENDPOINTS = {
    sendOtp: '/apis/proxies/v8/otp/v1/generate',
    ReSendOtp: '/apis/proxies/v8/otp/v1/generate',
    VerifyOtp: '/apis/proxies/v8/otp/v1/verify',
    sendEmailOtp: '/apis/proxies/v8/otp/v3/generate',
    VerifyEmailOtp: '/apis/proxies/v8/otp/v3/verify',
    verifyOTPV4: '/apis/proxies/v8/otp/v4/verify',
}

@Injectable()
export class OtpService {
    constructor(
        private http: HttpClient,
        private commonMethodsService: CommonMethodsService
    ) {
    }

    sendOtp(mob: number, configDetails?: ConfigDetails): Observable<any> {
        let url = API_ENDPOINTS.sendOtp
        if (configDetails) {
            configDetails['defaultUrl'] = API_ENDPOINTS.sendOtp
            url = this.commonMethodsService.getEnabledUrl(configDetails)
        }
        if (!url) {
            return of('')
        }
        const reqObj = {
            request: {
                type: 'phone',
                key: `${mob}`,
            },
        }
        return this.http.post(url, reqObj)
    }

    resendOtp(mob: number, configDetails?: ConfigDetails) {
        let url = API_ENDPOINTS.ReSendOtp
        if (configDetails) {
            configDetails['defaultUrl'] = API_ENDPOINTS.ReSendOtp
            url = this.commonMethodsService.getEnabledUrl(configDetails)
        }
        if (!url) {
            return of('')
        }
        const reqObj = {
            request: {
                type: 'phone',
                key: `${mob}`,
            },
        }
        return this.http.post(url, reqObj)

    }

    verifyOTP(otp: string, mob: number) {
        const reqObj = {
            request: {
                otp,
                type: 'phone',
                key: `${mob}`,
            },
        }
        return this.http.post(API_ENDPOINTS.VerifyOtp, reqObj)

    }

    sendEmailOtp(email: string, configDetails?: ConfigDetails): Observable<any> {
        let url = API_ENDPOINTS.sendEmailOtp
        if (configDetails) {
            configDetails['defaultUrl'] = API_ENDPOINTS.sendEmailOtp
            url = this.commonMethodsService.getEnabledUrl(configDetails)
        }
        if (!url) {
            return of('')
        }
        const reqObj = {
            request: {
                type: 'email',
                key: `${email}`,
                contextType: 'extPatch',
                context: ['profileDetails.personalDetails.primaryEmail'],
            },
        }
        return this.http.post(url, reqObj)
    }

    reSendEmailOtp(email: string, configDetails?: ConfigDetails): Observable<any> {
        let url = API_ENDPOINTS.sendEmailOtp
        if (configDetails) {
            configDetails['defaultUrl'] = API_ENDPOINTS.sendEmailOtp
            url = this.commonMethodsService.getEnabledUrl(configDetails)
        }
        if (!url) {
            return of('')
        }
        const reqObj = {
            request: {
                type: 'email',
                key: `${email}`,
                contextType: 'extPatch',
                context: ['profileDetails.personalDetails.primaryEmail'],
            },
        }
        return this.http.post(url, reqObj)
    }

    verifyEmailOTP(otp: any, email: number) {
        const reqObj = {
            request: {
                otp: otp.toString(),
                type: 'email',
                key: `${email}`,
            },
        }
        return this.http.post(API_ENDPOINTS.VerifyEmailOtp, reqObj)
    }

    verifyEmailOTPV4(otp: any, email: number, configDetails?: ConfigDetails) {
        let url = API_ENDPOINTS.verifyOTPV4
        if (configDetails) {
            configDetails['defaultUrl'] = API_ENDPOINTS.verifyOTPV4
            url = this.commonMethodsService.getEnabledUrl(configDetails)
        }
        if (!url) {
            return of('')
        }
        const reqObj = {
            request: {
                otp: otp.toString(),
                type: 'email',
                key: `${email}`,
            },
        }
        return this.http.post(url, reqObj)
    }

    verifyOTPV4(otp: any, mob: number, configDetails?: ConfigDetails) {
        let url = API_ENDPOINTS.verifyOTPV4
        if (configDetails) {
            configDetails['defaultUrl'] = API_ENDPOINTS.verifyOTPV4
            url = this.commonMethodsService.getEnabledUrl(configDetails)
        }
        if (!url) {
            return of('')
        }
        const reqObj = {
            request: {
                otp,
                type: 'phone',
                key: `${mob}`,
            },
        }
        return this.http.post(url, reqObj)
    }
}
