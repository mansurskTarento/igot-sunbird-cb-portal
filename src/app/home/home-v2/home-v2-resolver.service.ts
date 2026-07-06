import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Router } from '@angular/router'
import { ConfigurationsService, IResolveResponse } from '@sunbird-cb/utils-v2'
import { Observable, map, catchError, of } from 'rxjs'

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
    return this.http.get(`${baseUrl}/page/home-v2.json`).pipe(
      map(data => ({ data, error: null })),
      catchError(err => of({ data: null, error: err })),
    )
  }
}
