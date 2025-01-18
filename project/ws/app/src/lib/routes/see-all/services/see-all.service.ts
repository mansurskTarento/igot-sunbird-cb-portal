import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable, of, Subject, throwError } from 'rxjs'
import { NSSearch } from '@sunbird-cb/collection/src/lib/_services/widget-search.model'
import { catchError, map } from 'rxjs/operators';

// tslint:disable
import _ from 'lodash'
import { FormExtService } from 'src/app/services/form-ext.service'
// tslint:enable

const API_END_POINTS = {
  SEARCH_V6: `/apis/proxies/v8/sunbirdigot/search`,
  TRENDING_CONTENT_SEARCH: `apis/proxies/v8/trending/content/search`,
}

@Injectable({
  providedIn: 'root',
})
export class SeeAllService {
  private removeFilter = new Subject<any>()
  getSeeAllConfig: any = null
  /**
   * Observable string streams
   */
  notifyObservable$ = this.removeFilter.asObservable()
  constructor(
    private http: HttpClient,
    private formSvc: FormExtService,
  ) {

  }

  fetchSearchData(request: any): Observable<any> {
    return this.http.post<any>(API_END_POINTS.SEARCH_V6, request)
  }

  trendingContentSearch(req: any): Observable<any> {
    req.query = req.query || ''
    return this.http.post<any>(API_END_POINTS.TRENDING_CONTENT_SEARCH, req)
  }

  public notifyOther(data: any) {
    if (data) {
      this.removeFilter.next(data)
    }
  }

  async getSeeAllConfigJson(): Promise<any> {
    if (!this.getSeeAllConfig) {
      this.getSeeAllConfig = {}
      const requestData: any = {
        'request': {
            'type': 'page',
            'subType': 'home',
            'action': 'page-configuration',
            'component': 'portal',
            'rootOrgId': '*',
        },
      }
      this.getSeeAllConfig = await  this.formSvc.homeFormReadData(requestData).toPromise()
    }
    return of(this.getSeeAllConfig).toPromise()
  }

  searchV6(req: NSSearch.ISearchV6Request): Observable<NSSearch.ISearchV6ApiResultV2> {
    const apiPath = _.get(req, 'api.path')
    req.query = req.query || ''
    if (apiPath) {
      return this.http.get<NSSearch.ISearchV6ApiResultV2>(apiPath)
    }
    return this.http.post<NSSearch.ISearchV6ApiResultV2>(API_END_POINTS.SEARCH_V6, req)
  }

  fetchDesigantionsData(requestUrl: string) {
    const result: any = this.http.get(requestUrl).pipe(catchError(this.handleError), map(
      async (data: any) => {
        if(data.result && data.result.courseList) {
          return data.result && data.result.courseList
        }
        return ''
      })
    )
    return result
  }
  handleError(error: ErrorEvent) {
    let errorMessage = ''
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`
    }
    return throwError(errorMessage)
  }

}
