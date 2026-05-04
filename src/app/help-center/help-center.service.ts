import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable, of } from 'rxjs'
import { catchError, map } from 'rxjs/operators'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'


// const API_END_POINTS = {
//   FORM_READ: `/apis/v1/form/read`,
// }

@Injectable({
  providedIn: 'root',
})
export class HelpCenterService {

  private helpCenterConfig: any = null

  constructor(
    private http: HttpClient,
    public configSvc: ConfigurationsService,
  ) { }

  fetchHelpCenterConfig(): Observable<any> {
    const subType = 'help-center'

    return this.configSvc.getFormData(subType).pipe(
      map((response: any) => {
        if (response) {
          this.helpCenterConfig = response
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
