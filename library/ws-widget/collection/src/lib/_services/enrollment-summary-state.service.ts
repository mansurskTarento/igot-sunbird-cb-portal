import { Injectable } from '@angular/core'
import { BehaviorSubject, Observable } from 'rxjs'
import { distinctUntilChanged, filter, map, take } from 'rxjs/operators'

/**
 * Tracks the enrolment summary call that InitService fires in the background at startup.
 * The summary is cached in localStorage under `userEnrollmentCount`, but that key survives a
 * refresh, so its mere presence does not mean the current load has finished.
 *
 * Widgets that display the summary subscribe to `loading$` for their whole lifetime: show a
 * skeleton while it is true, and (re-)read localStorage every time it turns false. A one-shot
 * check is not enough — the fetch may start after the widget has rendered, and it can be
 * re-run later to refresh the numbers.
 *
 * Starts as not-loading, so routes where the summary is never fetched (public, preview)
 * render straight away.
 */
@Injectable({
  providedIn: 'root',
})
export class EnrollmentSummaryStateService {
  private readonly loadingSubject = new BehaviorSubject<boolean>(false)

  /** current state on subscribe, then every change */
  readonly loading$: Observable<boolean> = this.loadingSubject.asObservable().pipe(distinctUntilChanged())

  /**
   * emits once (and completes) at the next moment no fetch is in flight — for code that
   * writes into `userEnrollmentCount` and must not be overwritten by an in-flight fetch
   */
  readonly ready$: Observable<void> = this.loading$.pipe(
    filter(loading => !loading),
    take(1),
    map(() => undefined),
  )

  get isLoading(): boolean {
    return this.loadingSubject.value
  }

  start() {
    this.loadingSubject.next(true)
  }

  done() {
    this.loadingSubject.next(false)
  }
}
