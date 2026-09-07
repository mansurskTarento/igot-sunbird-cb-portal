import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core'
import { UntypedFormControl } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { PageChangeEmitter, PaginationComponent } from '@sunbird-cb/collection'
import { MultilingualTranslationsService } from '@sunbird-cb/utils-v2'
import { WidgetUserServiceLib } from '@sunbird-cb/consumption'
import { distinctUntilChanged } from 'rxjs/operators'

@Component({
    selector: 'ws-cbp-plan-feed',
    templateUrl: './cbp-plan-feed.component.html',
    styleUrls: ['./cbp-plan-feed.component.scss'],
    standalone: false
})
export class CbpPlanFeedComponent implements OnInit, OnChanges {

  searchControl = new UntypedFormControl('')
  toggleFilter = false
  contentDataList: any = []
  cbpConfig: any
  @Input()
  contenFeedList: any
  @Input()
  filterObject: any
  @Input() filterApplied = false
  @Output() toggleFilterEvent = new EventEmitter()
  @Output() searchRequest = new EventEmitter()
  @Output() closeFilterKey = new EventEmitter()

  @ViewChild(PaginationComponent) private paginator?: PaginationComponent
  pageSize = 10
  pageSizeOptions = [10, 20, 50, 100]
  currentPage = 1
  pagedFeedList: any[] = []
  /** Stands in for the year chip's value if the page ever hands over a filter object without one. */
  @Input() currentPlanYear = ''
  /** Configured plan types as {id, name} — the chip shows the name, filterObject holds the id. */
  @Input() planTypeList: any[] = []

  filterValuesBinding: any = {
    status: {
      0: 'Not started',
      1: 'In progress',
      2: 'Completed',
    },
    timeDuration: {
      '7ad': 'Upcoming 7 Days',
      '30ad': 'Upcoming 30 Days',
      '90ad': 'Upcoming 3 Months',
      '182ad': 'Upcoming 6 Months',
      '1sw': 'Last week',
      '1sm': 'Last month',
      '3sm': 'Last 3 month',
      '6sm': 'Last 6 month',
      '12sm': 'Last year',
    },
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private translate: TranslateService,
    private langtranslations: MultilingualTranslationsService,
    private widgetSvc: WidgetUserServiceLib) {
      this.langtranslations.languageSelectedObservable.subscribe(() => {
        if (localStorage.getItem('websiteLanguage')) {
          this.translate.setDefaultLang('en')
          const lang = localStorage.getItem('websiteLanguage')!
          this.translate.use(lang)
        }
      })
    }

  ngOnInit() {
    if (this.activatedRoute.snapshot.data.pageData) {
      this.cbpConfig = this.activatedRoute.snapshot.data.pageData.data
    }
    if (!this.currentPlanYear) {
      this.currentPlanYear = this.widgetSvc.getCurrentFinancialYear()
    }
    this.searchControl.valueChanges.pipe(
      distinctUntilChanged()
    ).subscribe(() => {
      this.emitSearchEvent()
    })
  }

  ngOnChanges(changes: SimpleChanges) {
    // a new list arrives on every search / filter change, so start again from the first page
    if (changes.contenFeedList) {
      this.currentPage = 1
      if (this.paginator) {
        this.paginator.currentPage = 1
      }
      this.updatePagedFeedList()
    }
  }

  onPageChange(event: PageChangeEmitter) {
    this.currentPage = event.currentPage
    this.pageSize = event.limit
    this.updatePagedFeedList()
    const listPage = document.getElementById('listPage')
    if (listPage) {
      listPage.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  private updatePagedFeedList() {
    const start = (this.currentPage - 1) * this.pageSize
    this.pagedFeedList = (this.contenFeedList || []).slice(start, start + this.pageSize)
  }

  /**
   * Chip text for a plan type id. Falls back to the raw id when the config has no entry for
   * it, and to the configured name when the instance has no `searchfilters` translation —
   * ngx-translate returns the key itself for a miss, which is what was rendering.
   */
  planTypeLabel(planType: any) {
    const match = (this.planTypeList || []).find((item: any) => item && item.id === planType)
    const name = match ? match.name : planType
    if (!name) {
      return ''
    }
    const translated = this.translateLabel(name, 'searchfilters')
    return translated && translated.indexOf('searchfilters.') === 0 ? name : translated
  }

  emitSearchEvent() {
    this.searchRequest.emit({ query: this.searchControl.value })
    // tslint:disable-next-line: whitespace
  }
  openFilter() {
      this.toggleFilter = true
      this.toggleFilterEvent.emit(this.toggleFilter)
  }
  // tslint: disable-next-line
  closeFilter(value: any, key: any) {
    this.closeFilterKey.emit({ value, key })
  }

  translateLabel(label: string, type: any) {
    return this.langtranslations.translateLabel(label, type, '')
  }
}
