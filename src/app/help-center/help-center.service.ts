import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable, of } from 'rxjs'
import { catchError, map } from 'rxjs/operators'

const API_END_POINTS = {
  FORM_READ: '/apis/v1/form/read',
}

@Injectable({
  providedIn: 'root',
})
export class HelpCenterService {

  private helpCenterConfig: any = null

  constructor(private http: HttpClient) {}

  fetchHelpCenterConfig(): Observable<any> {
    const body = {
      request: {
        type: 'page',
        subType: 'help-center',
        action: 'page-configuration',
        component: 'portal',
        rootOrgId: '*',
      },
    }

    return this.http.post<any>(API_END_POINTS.FORM_READ, body).pipe(
      map((response: any) => {
        if (response && response.result && response.result.form) {
          this.helpCenterConfig = response.result.form.data
          return this.helpCenterConfig
        }
        throw new Error('Invalid form read response')
      }),
      catchError((_error: any) => {
        console.warn('Form read failed for help-center, falling back to local JSON asset:', _error)
        return this.http.get<any>('/assets/configurations/feature/help-center.json').pipe(
          map((data: any) => {
            this.helpCenterConfig = data
            return this.helpCenterConfig
          }),
          catchError((jsonError: any) => {
            console.error('Fallback JSON also failed:', jsonError)
            return of(null)
          }),
        )
      }),
    )
  }

  getConfig(): any {
    return this.helpCenterConfig
  }
}
