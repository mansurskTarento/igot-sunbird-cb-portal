import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router'
import { ConfigurationsService, DataTransferService, IResolveResponse } from '@sunbird-cb/utils-v2'
import { WidgetContentService } from '@sunbird-cb/toc'
import { forkJoin, Observable, of, throwError } from 'rxjs'
import { catchError, map, mergeMap, switchMap } from 'rxjs/operators'

const PROXIES_V8 = '/apis/proxies/v8'
const ENROLL_CONTENT_DATA = `${PROXIES_V8}/learner/course/v4/user/enrollment/details`
@Injectable()
export class AppEnrollmentResolverService {
    constructor(private configSvc: ConfigurationsService,
        private http: HttpClient,
        private dataTransfer: DataTransferService,
        private widgetContentSvc: WidgetContentService,
    ) { }

    private reEnrollInactiveCourses(courses: any[], parentCourseId: string): Observable<any[]> {
        if (!courses || !courses.length) {
            return of(courses)
        }

        const inactiveCourses = courses.filter((entry: any) =>
            entry.courseId !== parentCourseId &&
            entry.content && entry.content.primaryCategory === 'Course' &&
            entry.active === false,
        )

        if (!inactiveCourses.length) {
            return of(courses)
        }

        const reEnrollCalls$ = inactiveCourses.map((entry: any) => {
            const req = {
                request: {
                    courseId: entry.courseId,
                    batchId: entry.batchId,
                    recent_language: entry.recent_language || '',
                },
            }
            return this.widgetContentSvc.reEnroll(req).pipe(
                mergeMap((res: any) => res === 'SUCCESS'
                    ? of(entry)
                    : throwError(() => new Error(`Re-enroll failed for courseId ${entry.courseId}`))),
            )
        })

        return forkJoin(reEnrollCalls$).pipe(
            map((succeededEntries: any[]) => {
                succeededEntries.forEach((entry: any) => { entry.active = true })
                return courses
            }),
        )
    }

    resolve(
        _route: ActivatedRouteSnapshot,
        _state: RouterStateSnapshot,
    ): Observable<IResolveResponse<any>> {
        let userId
        if (this.configSvc.userProfile) {
            userId = this.configSvc.userProfile.userId || ''
        }

        if (window.location.href.includes('/public/') || window.location.href.includes('&preview=true')) {
            return of({ error: null, data: null })
        }

        const parentCourseId = _route.queryParams.collectionId

        const enrollData = this.dataTransfer.getEnrollData()
        if (enrollData && enrollData.length) {
            return this.reEnrollInactiveCourses(enrollData, parentCourseId).pipe(
                map((courses: any[]) => {
                    this.dataTransfer.setEnrollData(courses)
                    return { data: { courses }, error: null }
                }),
                catchError((error: any) => {
                    console.error('AppEnrollmentResolverService: re-enroll failed (cache path)', error)
                    return of({ error, data: null })
                }),
            )
        } {
            const request: any = {
                'request': {
                    'retiredCoursesEnabled': true,
                    'courseId': [parentCourseId],
                },
            }
            return this.http.post(`${ENROLL_CONTENT_DATA}/${userId}`, request).pipe(
                switchMap((rData: any) => {
                    if (!(rData.result && rData.result.courses && rData.result.courses.length)) {
                        return of({ data: rData.result, error: null })
                    }
                    return this.reEnrollInactiveCourses(rData.result.courses, parentCourseId).pipe(
                        map((courses: any[]) => {
                            this.dataTransfer.setEnrollData(courses)
                            return { data: { ...rData.result, courses }, error: null }
                        }),
                    )
                }),
                catchError((error: any) => {
                    console.error('AppEnrollmentResolverService: re-enroll failed (fresh-fetch path)', error)
                    return of({ error, data: null })
                }),
            )
        }
    }
}