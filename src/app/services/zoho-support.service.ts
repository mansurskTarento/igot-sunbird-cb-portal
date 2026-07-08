import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { DomSanitizer, SafeHtml } from '@angular/platform-browser'
import { Observable, throwError } from 'rxjs'
import { catchError, map, shareReplay } from 'rxjs/operators'

const ZOHO_CODE_URL = '/assets/static-data/zoho-code.html'

/**
 * Loads the zoho support snippet once and shares the sanitized HTML
 * across all consumers (nav bar, chatbot, public pages). The nav bar
 * alone can be instantiated once per menu item, so without this cache
 * the same static file gets fetched on every instantiation.
 */
@Injectable({
  providedIn: 'root',
})
export class ZohoSupportService {
  private zohoHtml$: Observable<SafeHtml> | null = null

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
  ) { }

  getZohoHtml(): Observable<SafeHtml> {
    if (!this.zohoHtml$) {
      this.zohoHtml$ = this.http.get(ZOHO_CODE_URL, { responseType: 'text' }).pipe(
        map(res => this.sanitizer.bypassSecurityTrustHtml(res)),
        catchError((err: any) => {
          // drop the failed observable so the next caller can retry
          this.zohoHtml$ = null
          return throwError(err)
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      )
    }
    return this.zohoHtml$
  }
}
