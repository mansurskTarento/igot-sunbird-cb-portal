import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable, Subject } from 'rxjs'
import { shareReplay } from 'rxjs/operators'

const API_END_POINTS = {
  INSIGHTS: 'apis/proxies/v8/read/user/insights',
  // NETWORK: `apis/protected/v8/connections/v2/connections/recommended`,
  GET_RECOMMENDED_USERS: '/apis/proxies/v8/connections/v3/connections/recommended',
  ADD_CONNECTION: 'apis/protected/v8/connections/v2/add/connection',
  UPDATE_CONNECTION: 'apis/protected/v8/connections/v2/update/connection',
  CONN_REQUESTED: 'apis/protected/v8/connections/v2/connections/requests/received',
  ASSESSMENT_DATA: 'apis/proxies/v8/wheebox/read',
  LEADER_BOARD: 'apis/proxies/v8/halloffame/learnerleaderboard',
  EVENT_ENROLL: 'apis/proxies/v8/user/events/enroll/summary',
}

@Injectable({
  providedIn: 'root',
})

export class HomePageService {
  closeDialogPop = new Subject()
  constructor(private http: HttpClient) { }
  private leaderboardData$: Observable<any> | null = null
  getInsightsData(payload: any) {
    const result = this.http.post(API_END_POINTS.INSIGHTS, payload)
    return result
  }
  geteventsHoursData(): Observable<any> {
    return this.http.get(API_END_POINTS.EVENT_ENROLL)
  }

  getNetworkRecommendations(payload: any): Observable<any> {
    // return this.http.post(API_END_POINTS.NETWORK, payload)
    return this.http.post(API_END_POINTS.GET_RECOMMENDED_USERS, payload)
  }

  connectToNetwork(payload: any): Observable<any> {
    return this.http.post(API_END_POINTS.ADD_CONNECTION, payload)
  }

  updateConnection(payload: any): Observable<any> {
    return this.http.post(API_END_POINTS.UPDATE_CONNECTION, payload)
  }

  getRecentRequests(): Observable<any> {
    return this.http.get(API_END_POINTS.CONN_REQUESTED)
  }

  getAssessmentinfo(): Observable<any> {
    return this.http.get(API_END_POINTS.ASSESSMENT_DATA)
  }

  getLearnerLeaderboard(): Observable<any> {
    return this.http.get(API_END_POINTS.LEADER_BOARD)
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
