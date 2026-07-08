import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Router } from '@angular/router'
import { ConfigurationsService, IResolveResponse } from '@sunbird-cb/utils-v2'
import { Observable, forkJoin, map, catchError, of } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class HomeV2ResolverService {
  private readonly configSvc = inject(ConfigurationsService)
  private readonly router = inject(Router)
  private readonly http = inject(HttpClient)

  constructor() { }

  resolve(): Observable<IResolveResponse<any>> {
    const profileDetails = this.configSvc?.unMappedUser?.profileDetails

    const isNotMyUser = profileDetails?.profileStatus?.toLowerCase() === 'not-my-user'
    const isIgotOrg = profileDetails?.employmentDetails?.departmentName?.toLowerCase() === 'igot'

    if (isNotMyUser && isIgotOrg) {
      this.router.navigateByUrl('app/person-profile/me#profileInfo')
    }
    const baseUrl = this.configSvc.sitePath
    const homeConfig = this.http.get<any>(`${baseUrl}/page/home-v2.json`)
    const sectionRecordsCount = this.http.get<any>(`/apis/proxies/v8/content/user/info`).pipe(
      catchError(() => of(null)),
    )

    return forkJoin([homeConfig, sectionRecordsCount]).pipe(
      map(([homeConfigRes, sectionRecordsCountRes]) => {
        if (homeConfigRes && homeConfigRes.homeSection && sectionRecordsCountRes && sectionRecordsCountRes.result) {
          const pillsSection = homeConfigRes.homeSection.find((section: any) => section.sectionKey === 'aparCourses')
          if (pillsSection && Array.isArray(pillsSection.pills)) {
            pillsSection.pills.forEach((pill: any) => {
              if (pill.pillInfoCountKey && sectionRecordsCountRes.result[pill.pillInfoCountKey]) {
                pill.visibilityMode = 'visible'
              } else {
                pill.visibilityMode = 'hidden'
              }
            })
          }
        }
        return { data: homeConfigRes, error: null }
      }),
      catchError(err => of({ data: null, error: err })),
    )
  }
}
