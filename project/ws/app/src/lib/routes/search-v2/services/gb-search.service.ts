import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable, of, Subject } from 'rxjs'
import { ConfigurationsService, DomainConfService } from '@sunbird-cb/utils-v2'
import { ISearchAutoComplete, ISearchQuery } from '../../search/models/search.model'
import { SearchApiService } from '../../search/apis/search-api.service'

const API_END_POINTS = {
  SEARCH_V6: '/apis/proxies/v8/sunbirdigot/search',
  SEARCH_V4: '/apis/proxies/v8/sunbirdigot/v4/search',
  SEARCH_EXT_CONTENT: '/apis/proxies/v8/cios/v1/search/content',
}

@Injectable({
  providedIn: 'root',
})
export class GbSearchService {
  private removeFilter = new Subject<any>()
  searchConfig: any = null
  /**
   * Observable string streams
   */
  notifyObservable$ = this.removeFilter.asObservable()
  constructor(
    private http: HttpClient,
    private configSrv: ConfigurationsService,
    private searchApi: SearchApiService,
    private domainConfSvc: DomainConfService) {

  }

  fetchSearchData(request: any): Observable<any> {
    const url = this.domainConfSvc.getApiUrl('search', 'searchV6', API_END_POINTS.SEARCH_V6)
    return this.http.post<any>(url, request)
  }
  fetchSearchDataByCategory(request: any): Observable<any> {
    const url = this.domainConfSvc.getApiUrl('search', 'searchV4', API_END_POINTS.SEARCH_V4)
    return this.http.post<any>(url, request)
  }
  fetchSearchDataforCios(request: any): Observable<any> {
    const url = this.domainConfSvc.getApiUrl('search', 'externalContent', API_END_POINTS.SEARCH_EXT_CONTENT)
    return this.http.post<any>(url, request)
  }
  public notifyOther(data: any) {
    if (data) {
      this.removeFilter.next(data)
    }
  }

  async getSearchConfig(): Promise<any> {
    if (!this.searchConfig) {
      this.searchConfig = {}
      const baseUrl = this.configSrv.sitePath
      this.searchConfig = await this.http.get<any>(`${baseUrl}/feature/search.json`).toPromise()
    }
    return of(this.searchConfig).toPromise()
  }
  searchAutoComplete(params: ISearchQuery): Promise<ISearchAutoComplete[] | any> {
    params.q = params.q.toLowerCase()
    if (params.l.split(',').length === 1 && params.l.toLowerCase() !== 'all') {
      return this.searchApi.getSearchAutoCompleteResults(params).toPromise()
    }
    return Promise.resolve([])
  }
}
