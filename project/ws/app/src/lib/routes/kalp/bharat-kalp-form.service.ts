import { Injectable } from '@angular/core'
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router'
import { IResolveResponse } from '@sunbird-cb/utils-v2'
import { Observable, of } from 'rxjs'
import { catchError, map } from 'rxjs/operators'
import { FormExtService } from '../services/form-ext.service'

@Injectable({
  providedIn: 'root',
})
export class BharatKalpFormService {
  private _cache: IResolveResponse<any> | null = null

  constructor(private formSvc: FormExtService) {}

  resolve(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): Observable<IResolveResponse<any>> {
    /* Return cached response on subsequent navigations (e.g. see-all page) */
    if (this._cache) return of(this._cache)

    const requestData = {
      request: {
        type:       route.data?.pageKey || 'bharat-kalp',
        subType:    'microsite',
        action:     'page-configuration',
        component:  'portal',
        rootOrgId:  '*',
      },
    }
    return this.formSvc.formReadData(requestData).pipe(
      map((rData: any) => {
        this._cache = { data: rData, error: null }
        return this._cache
      }),
      catchError((error: any) => of({ data: null, error })),
    )
  }
}
