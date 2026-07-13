import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ConfigurationsService, DataTransferService, IResolveResponse } from '@sunbird-cb/utils-v2'
import { Observable, of } from 'rxjs'
import { catchError, map } from 'rxjs/operators'

const PROXIES_V8 = '/apis/proxies/v8'
const  ENROLL_CONTENT_DATA = `${PROXIES_V8}/learner/course/v4/user/enrollment/details`
@Injectable()
export class AppEnrollmentResolverService
     {
    constructor(private configSvc: ConfigurationsService,
                private http: HttpClient,
                private dataTransfer: DataTransferService,
                private router: Router,
                private matSnackBar: MatSnackBar,
        ) {}

    resolve(
        _route: ActivatedRouteSnapshot,
        _state: RouterStateSnapshot,
    ): Observable<IResolveResponse<any>> {
        let userId
        if (this.configSvc.userProfile) {
          userId = this.configSvc.userProfile.userId || ''
        }

        // public/preview/edit/pre-assessment flows don't need an enrollment
        const queryParams = _route.queryParams || {}
        if (window.location.href.includes('/public/')
            || queryParams.preview === 'true'
            || queryParams.editMode === 'true'
            || queryParams.isPreAssessment === 'true'
            || queryParams.preAssessment === 'true') {
            return of({ error: null, data: null })
        }
        const enrollData = this.dataTransfer.getEnrollData()
        if (enrollData && enrollData.length) {
            return of({ error: null, data: { courses: enrollData } })
        }
        const collectionId = queryParams.collectionId
        // standalone content without a parent collection has no enrollment to check
        if (!collectionId) {
            return of({ error: null, data: null })
        }
        const request: any = {
            'request': {
                'retiredCoursesEnabled': true,
                'courseId': [collectionId],
            },
          }
        return  this.http.post(`${ENROLL_CONTENT_DATA}/${userId}`, request).pipe(
            map((rData: any) =>
                {
                    const courses = rData && rData.result && rData.result.courses
                    if (courses && courses.length) {
                        this.dataTransfer.setEnrollData(courses)
                        return { data: rData.result, error: null }
                    }
                    // not enrolled — block the viewer and send the user to the TOC page
                    this.redirectToToc(collectionId)
                    return { data: null, error: null }
                }),
            catchError((error: any) => {
                this.redirectToToc(collectionId)
                return of({ error, data: null })
            }),
            )
    }

    private redirectToToc(collectionId: string) {
        this.matSnackBar.open('Please enroll before consuming this content', 'X', { duration: 5000 })
        this.router.navigate([`/app/toc/${collectionId}/overview`])
    }
}
