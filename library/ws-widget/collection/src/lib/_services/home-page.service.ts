import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { EMPTY, Observable, Subject } from 'rxjs'
import { shareReplay } from 'rxjs/operators'
import { DomainConfService } from '@sunbird-cb/utils-v2'

@Injectable({
      providedIn: 'root',
})

export class HomePageService {
      closeDialogPop = new Subject()
      private leaderboardData$: Observable<any> | null = null

      constructor(
            private http: HttpClient,
            private domainConfSvc: DomainConfService
      ) { }

      getInsightsData(payload: any) {
            const url = this.domainConfSvc.getApiUrl('user', 'insights', '/apis/proxies/v8/read/user/insights')
            if (!url) {
                  console.warn('Insights API is disabled')
                  return EMPTY
            }
            return this.http.post(url, payload)
      }

      geteventsHoursData(): Observable<any> {
            const url = this.domainConfSvc.getApiUrl('user', 'eventEnroll', '/apis/proxies/v8/user/events/enroll/summary')
            if (!url) {
                  console.warn('Event enroll API is disabled')
                  return EMPTY
            }
            return this.http.get(url)
      }

      getDiscussionsData(username: string): Observable<any> {
            const baseUrl = this.domainConfSvc.getApiUrl('discussion', 'userDiscussions', '/apis/proxies/v8/discussion/user')
            if (!baseUrl) {
                  console.warn('User discussions API is disabled')
                  return EMPTY
            }
            return this.http.get(`${baseUrl}/${username}`)
      }

      getNetworkRecommendations(payload: any): Observable<any> {
            const url = this.domainConfSvc.getApiUrl('connections', 'recommendedUsers', '/apis/proxies/v8/connections/v3/connections/recommended')
            if (!url) {
                  console.warn('Network recommendations API is disabled')
                  return EMPTY
            }
            return this.http.post(url, payload)
      }

      connectToNetwork(payload: any): Observable<any> {
            const url = this.domainConfSvc.getApiUrl('connections', 'addConnection', '/apis/protected/v8/connections/v2/add/connection')
            if (!url) {
                  console.warn('Add connection API is disabled')
                  return EMPTY
            }
            return this.http.post(url, payload)
      }

      updateConnection(payload: any): Observable<any> {
            const url = this.domainConfSvc.getApiUrl('connections', 'updateConnection', '/apis/protected/v8/connections/v2/update/connection')
            if (!url) {
                  console.warn('Update connection API is disabled')
                  return EMPTY
            }
            return this.http.post(url, payload)
      }

      getRecentRequests(): Observable<any> {
            const url = this.domainConfSvc.getApiUrl('connections', 'requestsReceived', '/apis/protected/v8/connections/v2/connections/requests/received')
            if (!url) {
                  console.warn('Connection requests API is disabled')
                  return EMPTY
            }
            return this.http.get(url)
      }

      getTrendingDiscussions(): Observable<any> {
            const url = this.domainConfSvc.getApiUrl('discussion', 'trending', '/apis/proxies/v8/discussion/popular')
            if (!url) {
                  console.warn('Trending discussions API is disabled')
                  return EMPTY
            }
            return this.http.get(url)
      }

      getAssessmentinfo(): Observable<any> {
            const url = this.domainConfSvc.getApiUrl('assessment', 'wheebox', '/apis/proxies/v8/wheebox/read')
            if (!url) {
                  console.warn('Assessment API is disabled')
                  return EMPTY
            }
            return this.http.get(url)
      }

      getLearnerLeaderboard(): Observable<any> {
            const url = this.domainConfSvc.getApiUrl('leaderboard', 'learnerLeaderboard', '/apis/proxies/v8/halloffame/learnerleaderboard')
            if (!url) {
                  console.warn('Learner leaderboard API is disabled')
                  return EMPTY
            }
            return this.http.get(url)
      }

      getLearnerLeaderboardCached(): Observable<any> {
            if (!this.leaderboardData$) {
                  this.leaderboardData$ = this.getLearnerLeaderboard().pipe(shareReplay(1))
            }
            return this.leaderboardData$
      }

      getNwlConfigiration(url: any): Observable<any> {
            return this.http.get(`${url}/nlw.json`)
      }
}
