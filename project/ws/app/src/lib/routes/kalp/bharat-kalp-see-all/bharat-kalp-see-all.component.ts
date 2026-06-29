import { Component, HostListener, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { HttpClient } from '@angular/common/http'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { catchError } from 'rxjs/operators'
import { of } from 'rxjs'

const ALL_WEEKS = 0

@Component({
  selector: 'ws-app-bharat-kalp-see-all',
  templateUrl: './bharat-kalp-see-all.component.html',
  styleUrls: ['./bharat-kalp-see-all.component.scss'],
  standalone: false,
})
export class BharatKalpSeeAllComponent implements OnInit {
  readonly ALL_WEEKS = ALL_WEEKS

  /* Week filter */
  weeks: number[] = []
  currentWeek = 1
  selectedWeek: number = ALL_WEEKS
  weekDropdownOpen = false
  private _prevWeek = ALL_WEEKS

  /* Status pills */
  readonly statusPills = ['All', 'In Progress', 'Completed', 'Not Started']
  selectedStatus = 'All'

  /* Content type tabs */
  readonly contentTypeTabs = ['Courses', 'Programs', 'Events', 'Assessment']
  selectedContentType = 'Courses'
  activeTabIndex = 0

  /* Search */
  searchText = ''

  /* Pagination */
  itemsPerPage = 10
  currentPage = 0
  readonly itemsPerPageOptions = [10, 20, 50, 100]

  /* Data */
  loading = false
  allCards: any[] = []
  enrollmentMap: { [id: string]: number } = {}  /* courseId → completionPercentage */
  weekProgress: any = null
  weeksData: any[] = []
  bkConfig: any = {}

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private configSvc: ConfigurationsService,
  ) { }

  /* Status logic (same as portal's content-strip-with-tabs-pills):
     Not Started  = identifier NOT in enrollment
     In Progress  = in enrollment AND completionPercentage < 100
     Completed    = in enrollment AND completionPercentage >= 100              */
  private _getStatus(identifier: string): 'Not Started' | 'In Progress' | 'Completed' {
    if (!this.enrollmentMap.hasOwnProperty(identifier)) return 'Not Started'
    return this.enrollmentMap[identifier] >= 100 ? 'Completed' : 'In Progress'
  }

  private _loadEnrollment(allIds: string[]): void {
    const userId = (this.configSvc as any)?.userProfile?.userId
    if (!allIds.length || !userId) return
    this.http.post<any>(
      `/apis/proxies/v8/learner/course/v4/user/enrollment/details/${userId}`,
      { request: { courseId: allIds } }
    ).pipe(catchError(() => of(null)))
      .subscribe(res => {
        const map: { [id: string]: number } = {}
          ; (res?.result?.courses || []).forEach((c: any) => {
            const id = c.courseId || c.identifier || c.contentId
            if (id) map[id] = c.completionPercentage ?? 0
          })
        this.enrollmentMap = map
      })
  }

  ngOnInit(): void {
    const formData = this.route.snapshot.data?.['formData']?.data?.result?.form?.data
    if (formData) {
      this.weekProgress = formData.individualSection?.weekProgress
      this.bkConfig = formData.bkConfig || {}
      /* Extract weeks array from new Weeks[0].tabs format */
      const weeksConfig = this.weekProgress?.Weeks || []
      if (weeksConfig.length) {
        this.weeksData = weeksConfig[0].tabs || []
      }
    }

    const totalWeeks = this.weekProgress?.totalWeeks || 16
    this.weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1)
    this.currentWeek = this._computeCurrentWeek()

    const qWeek = this.route.snapshot.queryParams?.['week']
    const requestedWeek = qWeek ? +qWeek : ALL_WEEKS
    /* Validate: if requested week hasn't started, fall back to ALL_WEEKS */
    this.selectedWeek = (requestedWeek !== ALL_WEEKS && !this.isWeekStarted(requestedWeek))
      ? ALL_WEEKS : requestedWeek
    this._prevWeek = this.selectedWeek

    this._fetchContent()
  }

  private _computeCurrentWeek(): number {
    const startDate = this.bkConfig?.startDate
    if (!startDate) return 1
    const now = new Date()
    const parts = startDate.split('-')
    /* Detect DD-MM-YYYY: third segment is 4-digit year */
    const start = parts.length === 3 && parts[2].length === 4
      ? new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`)  /* DD-MM-YYYY → YYYY-MM-DD */
      : new Date(startDate)
    if (now < start) return 1
    const diff = Math.floor((now.getTime() - start.getTime()) / 86_400_000)
    return Math.min(Math.floor(diff / 7) + 1, this.weeks.length)
  }

  isWeekStarted(week: number): boolean { return week <= this.currentWeek }

  /* Get content_ids for current week + content type */
  private _getContentIds(): string[] {
    const typeKey = this.selectedContentType.toLowerCase()
    const typeMap: { [k: string]: string } = {
      courses: 'course', programs: 'program', events: 'event', assessment: 'assessment'
    }
    const key = typeMap[typeKey] || 'course'

    if (this.selectedWeek === ALL_WEEKS) {
      /* All weeks — only include started weeks (week number ≤ currentWeek) */
      const ids: string[] = []
      this.weeksData.forEach((wd: any) => {
        const weekNum = parseInt((wd?.id || '').replace('week_', ''), 10)
        if (isNaN(weekNum) || weekNum > this.currentWeek) return   /* skip locked weeks */
        ;((wd?.content_ids?.[key]) || []).forEach((id: string) => {
          if (id && !ids.includes(id)) ids.push(id)
        })
      })
      return ids
    }

    /* Specific week */
    const wd = this.weeksData.find((w: any) => w.id === `week_${this.selectedWeek}`)
    return wd?.content_ids?.[key] || []
  }

  _fetchContent(): void {
    /* Hard guard — never load content for a week that hasn't started */
    if (this.selectedWeek !== ALL_WEEKS && !this.isWeekStarted(this.selectedWeek)) {
      this.selectedWeek = this._prevWeek
      this.snackBar.open('This week not started', 'Dismiss', {
        duration: 3000,
        panelClass: ['wp-snack'],
      })
      return
    }

    this.currentPage = 0
    this.allCards = []
    const ids = this._getContentIds()
    if (!ids.length) return

    this.loading = true
    this.http.post<any>('/apis/proxies/v8/sunbirdigot/search', {
      locale: ['en'],
      request: {
        filters: { identifier: ids },
        limit: ids.length + 5,
      },
    }).pipe(catchError(() => of(null)))
      .subscribe(res => {
        const results: any[] = res?.result?.content || []
        this.allCards = results.map((c: any, i: number) => ({
          content: c,
          cardSubType: 'standard' as 'standard',
          context: { pageSection: 'bharat-kalp-see-all', position: i },
          stateData: {},
        }))
        this.loading = false
        /* Load enrollment data to enable status filtering */
        this._loadEnrollment(results.map((c: any) => c.identifier).filter(Boolean))
      })
  }

  onWeekChange(event: Event): void {
    const selectEl = event.target as HTMLSelectElement
    const week = +selectEl.value

    if (week !== ALL_WEEKS && !this.isWeekStarted(week)) {
      const prev = this._prevWeek
      /* Revert native DOM immediately */
      selectEl.value = String(prev)
      /* Revert again after Angular's change detection cycle to be safe */
      setTimeout(() => {
        selectEl.value = String(prev)
        this.selectedWeek = prev
      }, 0)

      this.snackBar.open('This week not started', 'Dismiss', {
        duration: 3000,
        panelClass: ['wp-snack'],
      })
      return
    }

    this._prevWeek = week
    this.selectedWeek = week
    this._fetchContent()
  }

  onStatusSelect(status: string): void { this.selectedStatus = status; this.currentPage = 0 }

  onTabChange(index: number): void {
    this.activeTabIndex = index
    this.selectedContentType = this.contentTypeTabs[index]
    this._fetchContent()
  }

  onSearch(): void { this.currentPage = 0 }

  onItemsPerPageChange(event: Event): void {
    this.itemsPerPage = +(event.target as HTMLSelectElement).value
    this.currentPage = 0
  }

  get filteredCards(): any[] {
    let cards = this.allCards

    /* Status pill filter using enrollment data */
    if (this.selectedStatus !== 'All') {
      cards = cards.filter(c => {
        const status = this._getStatus(c.content?.identifier)
        return status === this.selectedStatus
      })
    }

    /* Search filter */
    if (this.searchText.trim()) {
      const q = this.searchText.toLowerCase()
      cards = cards.filter(c => c.content?.name?.toLowerCase().includes(q))
    }
    return cards
  }

  get pagedCards(): any[] {
    const start = this.currentPage * this.itemsPerPage
    return this.filteredCards.slice(start, start + this.itemsPerPage)
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCards.length / this.itemsPerPage) || 1
  }

  get pageNumbers(): (number | string)[] {
    const total = this.totalPages
    const cur = this.currentPage
    if (total <= 1) return [0]
    if (total <= 7) return Array.from({ length: total }, (_, i) => i)
    const pages: (number | string)[] = [0]
    if (cur > 2) pages.push('...')
    for (let i = Math.max(1, cur - 1); i <= Math.min(total - 2, cur + 1); i++) pages.push(i)
    if (cur < total - 3) pages.push('...')
    if (total - 1 > 0) pages.push(total - 1)
    return pages
  }

  goToPage(page: number | string): void {
    if (typeof page === 'number') {
      this.currentPage = Math.max(0, Math.min(page, this.totalPages - 1))
    }
  }

  onCardNavigate(content: any): void {
    if (!content?.identifier) return
    const qp: any = {}
    if (content.batchId) qp['batchId'] = content.batchId
    this.router.navigate(
      ['/app/toc', content.identifier, 'overview'],
      { queryParams: qp, state: { sourceUrl: this.router.url } }
    )
  }

  goHome(): void { this.router.navigate(['/page/home']) }
  goBharatKalp(): void { this.router.navigate(['/app/learn/bharat-kalp']) }

  toggleWeekDropdown(): void { this.weekDropdownOpen = !this.weekDropdownOpen }

  selectWeekOption(week: number): void {
    if (week !== ALL_WEEKS && !this.isWeekStarted(week)) {
      this.snackBar.open('This week not started', 'Dismiss', { duration: 3000, panelClass: ['wp-snack'] })
      return
    }
    this._prevWeek = week
    this.selectedWeek = week
    this.weekDropdownOpen = false
    this._fetchContent()
  }

  get selectedWeekLabel(): string {
    if (this.selectedWeek === ALL_WEEKS) return 'All Weeks'
    return 'Week ' + this.selectedWeek
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    const target = event.target as HTMLElement
    if (!target.closest('.bk-see-all__week-wrap')) {
      this.weekDropdownOpen = false
    }
  }
}
