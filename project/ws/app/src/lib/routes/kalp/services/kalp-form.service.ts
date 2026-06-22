import { Injectable } from '@angular/core'
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router'
import { IResolveResponse } from '@sunbird-cb/utils-v2'
import { Observable, of, throwError } from 'rxjs'
import { catchError, switchMap } from 'rxjs/operators'
import { FormExtService } from '../../services/form-ext.service'
import { BHARAT_KALP_FALLBACK_FORM } from './bharat-kalp-fallback-form'

@Injectable({
  providedIn: 'root',
})
export class KalpFormService {
  constructor(private formSvc: FormExtService) { }

  resolve(
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): Observable<IResolveResponse<any>> {
    const requestType: string = _route?.data?.pageKey || 'bharat-kalp'
    const requestData = {
      request: {
        type: requestType,
        subType: 'microsite',
        action: 'page-configuration',
        component: 'portal',
        rootOrgId: '123456789',
      },
    }
    return this.formSvc.formReadData(requestData).pipe(
      switchMap((rData: any) => {
        if (rData?.responseCode === 'OK' && rData?.result?.form) {
          return of({ data: rData, error: null })
        }
        return throwError(() => new Error('bharat-kalp form config not found in backend'))
      }),
      catchError(() => of({ data: BHARAT_KALP_FALLBACK_FORM, error: null })),
    )
  }
}
