import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { BehaviorSubject, Subject, Observable } from 'rxjs'
import { finalize } from 'rxjs/operators'
import { NsContent } from '@sunbird-cb/utils-v2'

const API_ENDPOINTS = {
  SEARCH_V6: `/apis/proxies/v8/sunbirdigot/search`,
  ALL_PROVIDERS: `/apis/proxies/v8/searchBy/provider`,
}

@Injectable({
  providedIn: 'root',
})
export class AllContentService {
  private removeFilter = new Subject<any>()
  private displayLoader$: Subject<boolean> = new BehaviorSubject<boolean>(false)
  /**
   * Observable string streams
   */
  notifyObservable$ = this.removeFilter.asObservable()
  constructor(private http: HttpClient) { }

  public isLoading(): Observable<boolean> {
    return this.displayLoader$
  }

  fetchSearchData(request: any): Observable<any> {
    this.displayLoader$.next(true)
    return this.http.post<any>(API_ENDPOINTS.SEARCH_V6, request)
    .pipe(finalize(() => this.displayLoader$.next(false)))
  }

  fetchAllProviders(_request: any): Observable<any> {
    this.displayLoader$.next(true)
    return this.http.get<any>(API_ENDPOINTS.ALL_PROVIDERS)
    .pipe(finalize(() => this.displayLoader$.next(false)))
  }

  public notifyOther(data: any) {
    if (data) {
      this.removeFilter.next(data)
    }
  }
  postApiMethod(apiUrl: any, req: any): Observable<NsContent.IContent> {
    req.query = req.query || ''
    return this.http.post<NsContent.IContent>(apiUrl, req)
  }

  getApiMethod(apiUrl: any): Observable<NsContent.IContent> {
    // req.query = req.query || '';
    return this.http.get<NsContent.IContent>(apiUrl)
  }

}