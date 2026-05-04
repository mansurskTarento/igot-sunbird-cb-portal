import { Injectable } from '@angular/core'
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router'
import { ConfigurationsService, IResolveResponse } from '@sunbird-cb/utils-v2'
import { Observable, of } from 'rxjs'
import { catchError, map } from 'rxjs/operators'
// import { FormExtService } from './form-ext.service'
import { HttpClient } from '@angular/common/http'

@Injectable({
  providedIn: 'root',
})
export class AppEventPageResolverService implements
  Resolve<Observable<IResolveResponse<any>> | IResolveResponse<any>> {
  constructor(
    private http: HttpClient,
    public configSvc: ConfigurationsService,
    // private formSvc: FormExtService
  ) { }

  resolve(
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): Observable<IResolveResponse<any>> {
    const formSubType = 'events'
    return this.configSvc.getFormData(formSubType).pipe(
      map((rData: any) => {
        const finalData = rData
        return ({ data: finalData, error: null })
      }),
      catchError((_error: any) => {
        const baseUrl = this.configSvc.sitePath
        return this.http.get(`${baseUrl}/feature/event.json`).pipe(
          map(data => ({ data, error: null })),
          catchError(err => of({ data: null, error: err })),
        )
      }
      ),
    )
  }
}
