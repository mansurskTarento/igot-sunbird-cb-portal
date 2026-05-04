import { Injectable } from '@angular/core'
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router'
import { ConfigurationsService, IResolveResponse } from '@sunbird-cb/utils-v2'
import { Observable, of } from 'rxjs'
import { catchError, map } from 'rxjs/operators'
import { HttpClient } from '@angular/common/http'

@Injectable({
  providedIn: 'root',
})
export class FormDataResolverService implements
  Resolve<Observable<IResolveResponse<any>> | IResolveResponse<any>> {
  constructor(
    private http: HttpClient,
    public configSvc: ConfigurationsService,
  ) { }

  resolve(
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): Observable<IResolveResponse<any>> {
    const pageDataKey = _route.data.pageKey
    const pageType = _route.data.pageType || 'feature'
    return this.configSvc.getFormData(pageDataKey).pipe(
      map((rData: any) => {
        return ({ data: rData, error: null })
      }),
      catchError((_error: any) => {
        const baseUrl = this.configSvc.sitePath
        return this.http.get(`${baseUrl}/${pageType}/${pageDataKey}.json`).pipe(
          map(data => ({ data, error: null })),
          catchError(err => of({ data: null, error: err })),
        )
      }
      ),
    )
  }
}
