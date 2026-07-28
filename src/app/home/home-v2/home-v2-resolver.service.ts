import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Router } from '@angular/router'
import { ConfigurationsService, IResolveResponse } from '@sunbird-cb/utils-v2'
import { Observable, forkJoin, map, catchError, of } from 'rxjs'
import { FormExtService } from '../../services/form-ext.service'

@Injectable({
  providedIn: 'root',
})
export class HomeV2ResolverService {
  private readonly configSvc = inject(ConfigurationsService)
  private readonly router = inject(Router)
  private readonly http = inject(HttpClient)
  private readonly formSvc = inject(FormExtService)

  constructor() { }

  resolve(): Observable<IResolveResponse<any>> {
    const profileDetails = this.configSvc?.unMappedUser?.profileDetails

    const isNotMyUser = profileDetails?.profileStatus?.toLowerCase() === 'not-my-user'
    const isIgotOrg = profileDetails?.employmentDetails?.departmentName?.toLowerCase() === 'igot'

    if (isNotMyUser && isIgotOrg) {
      this.router.navigateByUrl('app/person-profile/me#profileInfo')
    }
    const baseUrl = this.configSvc.sitePath
    const homeConfig = this.http.get<any>(`${baseUrl}/page/home-v2.json`).pipe(catchError(() => of(null)))
    const sectionRecordsCount = this.http.get<any>(`/apis/proxies/v8/user/content/info`).pipe(
      catchError(() => of(null)),
    )
    const request = {
      request: {
        type: 'page',
        subType: 'home',
        portal: 'portal',
        clientVersion: this.configSvc?.globalConfig?.formClientVersion?.['home'] || 1.0,
      },
    }
    const response$ = this.formSvc.formConfigReadData(request).pipe(catchError(() => of(null)))

    return forkJoin([response$, homeConfig, sectionRecordsCount]).pipe(
      map(([responseRes, homeConfigRes, sectionRecordsCountRes]) => {
        const configDetails = responseRes && responseRes.result && responseRes.result.data && responseRes.result.data.homeV2 ? responseRes.result.data.homeV2 : homeConfigRes ? homeConfigRes : []
        if (configDetails && configDetails.homeSection && sectionRecordsCountRes && sectionRecordsCountRes.result) {
          const pillsSection = configDetails.homeSection.find((section: any) => section.sectionKey === 'aparCourses')
          if (pillsSection && Array.isArray(pillsSection.pills)) {
            let visablePillsCount = 0
            pillsSection.pills.forEach((pill: any) => {
              if (pill.pillInfoCountKey && sectionRecordsCountRes.result[pill.pillInfoCountKey]) {
                pill.visibilityMode = 'visible'
                visablePillsCount = visablePillsCount + 1
              } else {
                pill.visibilityMode = 'hidden'
              }
            })
            if (visablePillsCount === 0) {
              pillsSection.visibilityMode = 'hidden'
            }
          }
        }
        return { data: configDetails, error: null }
      }),
      catchError(err => of({ data: null, error: err })),
    )
  }
}
