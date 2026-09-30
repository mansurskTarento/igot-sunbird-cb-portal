import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { catchError, firstValueFrom, map, Observable, of, tap } from 'rxjs'

import { environment } from '../../../src/environments/environment'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
const API_END_POINTS = {
  FORM_READ: '/apis/proxies/v8/formsConfig/v1/read',
  PUBLIC_FORM_READ: '/apis/v1/form/read',
}
@Injectable({
  providedIn: 'root',
})
export class FormEnvConfigService {

  constructor(private http: HttpClient, private configSvc: ConfigurationsService) { }

  /**
   * Loads environment values from FormConfig API.
   *
   * Values already loaded from env.json remain untouched unless
   * they are explicitly included in API_ENVIRONMENT_KEYS.
   */
  async loadEnvironmentConfig(): Promise<void> {
    console.log('configSvc--', this.configSvc)
    try {
      let payload = {
        "request": {
          "name": "portal_global_env_config",
          "type": "page",
          "subType": "globalenv",
          "portal": "portal",
          "clientVersion": 1.0
        }
      }
      await this.globalEnvConfigReadData(payload).subscribe({
        next: (response) => {
          const formConfig = response?.data || response

          if (!formConfig) {
            return
          }

          this.setApiEnvironmentValues(formConfig)
        },
        error: (error) => {
          console.error('globalEnvConfigReadData error:', error)
        }
      })


    } catch (error) {
      console.error(
        'Error while loading environment configuration from FormConfig API',
        error
      )

      // Do not throw if application should continue with env.json values.
      // If API configuration is mandatory, change this to: throw error;
    }
  }



  /**
   * Loads environment values for a user without a session. The protected
   * formsConfig read returns 419 for them, so this uses the public form read.
   * Falls back to the static global.env.json, and keeps env.json values if both fail.
   */
  async loadPublicEnvironmentConfig(): Promise<void> {
    const payload = {
      request: {
        type: 'page',
        subType: 'globalenv',
        action: 'portal_global_env_config',
        component: 'portal',
        rootOrgId: '*',
      },
    }
    try {
      const formConfig = await firstValueFrom(
        this.http.post<any>(API_END_POINTS.PUBLIC_FORM_READ, payload).pipe(
          map((rData: any) => rData?.result?.form?.data),
          catchError(() => this.http.get<any>(`/assets/configurations/global.env.json`)),
        ),
      )
      if (formConfig) {
        this.setApiEnvironmentValues(formConfig)
      }
    } catch (error) {
      console.error('Error while loading public environment configuration', error)
    }
  }

  private setApiEnvironmentValues(formConfig: any): void {


    const windowEnv = this.getWindowEnv()

    Object.assign(windowEnv, formConfig)

    // ---------------------------------------
    // Update Angular environment
    // ---------------------------------------

    Object.assign(environment, formConfig)
  }

  globalEnvConfigReadData(payload: any): Observable<any> {

    return this.formReadData(payload).pipe(

      tap(),

      map((rData: any) => {

        const finalData = rData?.result?.data

        return finalData
      }),

      catchError(() => {

        return this.http
          .get(`/assets/configurations/global.env.json`)
          .pipe(
            tap(() => {
            }),

            map((data: any) => data),

            catchError((fallbackError) => {
              return of({
                data: null,
                error: fallbackError
              })
            })
          )
      })
    )
  }
  formReadData(request: any): Observable<any> {
    return this.http.post<any>(`${API_END_POINTS.FORM_READ}`, request)
  }

  private getWindowEnv(): { [key: string]: any } {
    return (window as { [key: string]: any })['env'] || {}
  }
}