import { Component, OnInit, OnDestroy, AfterViewChecked, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { Subject } from 'rxjs'
import { debounceTime, takeUntil } from 'rxjs/operators'
import { SeeAllService } from '../../services/see-all.service'
import { CommonMethodsService, WidgetContentLibService } from '@sunbird-cb/consumption'
import * as _ from 'lodash'
import { EventService, MultilingualTranslationsService, ValueService, WidgetEnrollService, WsEvents } from '@sunbird-cb/utils-v2'

const configMap: any = {
  extContent: {
    name: 'Cohort Insights',
    url: '/apis/proxies/v8/cios/v1/search/content',
    request: {
      filterCriteriaMap: {
      },
      requestedFields: [],
      pageNumber: 0,
      pageSize: 10,
      facets: ['topic', 'courseType'],
      orderBy: 'createdOn',
      orderDirection: 'desc',
      searchString: '',
    },
  },
  extContentAssigned: {
    name: 'Assigned Contents',
    url: 'apis/proxies/v8/user/v1/assigned/externalcourses',
    isGetApi: false,  // POST API but with local search (no pagination)
    isLocalSearch: true,  // Flag to indicate local search only
    request: {
      'partnerId': '',
    },
  },
}
const COURSE_TYPE_FACET_KEY = 'courseType'
const CONTENT_TABS = [
  { key: 'allContent', label: 'All Content', telemetrySubType: 'card-content-all-content' },
  { key: 'completed', label: 'Completed', telemetrySubType: 'card-content-completed' },
  { key: 'inProgress', label: 'In Progress', telemetrySubType: 'card-content-inprogress' },
]
const ENROLMENT_STATUS_COMPLETED = 2
const ENROLMENT_STATUS_ALL = 'All'
const TELEMETRY_PAGE_ID = '/app/seeAll/content'
const TELEMETRY_ENV = 'Marketplace'
const TELEMETRY_OBJECT_TYPE = 'Course'
@Component({
  selector: 'ws-app-see-all-dynamic',
  templateUrl: './see-all-dynamic.component.html',
  styleUrls: ['./see-all-dynamic.component.scss'],
  standalone: false
})
export class SeeAllDynamicComponent implements OnInit, OnDestroy, AfterViewChecked {
  colors = [
    '#EF941D', '#F97440', '#35B5B0', '#9988FF', '#816FEC',
    '#254092', '#926525', '#4F72DF',
  ]
  headerBgColor = '#1a4ca1'
  contentItems: any[] = []
  originalContentItems: any[] = []
  scrollDistance = 2  // Distance from bottom to trigger load
  throttle = 300  // Throttle scroll events
  pageSize = 10  // Items per page
  currentPageNumber = 0  // For server-side pagination
  totalCount = 0  // Server-provided total count
  pageSizeOptions = [10, 20, 50, 100]
  sortKey = 'name'
  sortOrder: 'asc' | 'desc' = 'asc'
  loading = false
  isLoadingMore = false  // Track infinite scroll loading state
  customOptions: any[] = []
  contentName: string = ''
  searchString: string = ''
  configKey: string = ''
  filterProvider: string = ''
  apiConfig: any = null
  isGetApi = false
  providerDetails: any = null
  apiFacets: any[] = []  // Raw API facets for filter component
  appliedFilters: any = {}  // Filters applied from filter component
  facetValuesByLabel: any = {}
  isFilterSidebarOpen = false
  public screenSizeIsLtMedium = false
  isLtMedium$ = this.valueSvc.isLtMedium$
  isDescriptionExpanded = false
  showDescriptionToggle = false
  contentTabs = CONTENT_TABS
  selectedTab = CONTENT_TABS[0].key
  enrolledContent: any = { completed: [], inProgress: [] }
  enrolmentStatusById: { [id: string]: number } = {}
  isEnrolmentLoading = false
  @ViewChild('descriptionEl') descriptionEl!: ElementRef<HTMLParagraphElement>
  private hasCheckedDescriptionOverflow = false
  titles: any[] = [
  ]

  private destroy$ = new Subject<void>()
  private searchStringChange$ = new Subject<string>()

  constructor(
    private activatedRoute: ActivatedRoute,
    private seeAllService: SeeAllService,
    private translateService: TranslateService,
    private langtranslations: MultilingualTranslationsService,
    private commonSvc: CommonMethodsService,
    private router: Router,
    private contSvc: WidgetContentLibService,
    private valueSvc: ValueService,
    private cdr: ChangeDetectorRef,
    private enrollSvc: WidgetEnrollService,
    private eventSvc: EventService
  ) {
    this.langtranslations.languageSelectedObservable.subscribe(() => {
      if (localStorage.getItem('websiteLanguage')) {
        this.translateService.setDefaultLang('en')
        const lang = localStorage.getItem('websiteLanguage')!
        this.translateService.use(lang)
      }
    })
  }

  ngOnInit() {
    if (localStorage.getItem('websiteLanguage')) {
      this.translateService.setDefaultLang('en')
      const lang = localStorage.getItem('websiteLanguage')!
      this.translateService.use(lang)
    }
    this.isLtMedium$.pipe(takeUntil(this.destroy$)).subscribe(isLtMedium => {
      this.screenSizeIsLtMedium = isLtMedium
    })
    this.searchStringChange$
      .pipe(debounceTime(500), takeUntil(this.destroy$))
      .subscribe(() => this.onSearch())
    this.getRouterData()
    this.loadProviderDetails()
    this.loadEnrolments()
    this.setRandomColor()
  }

  ngAfterViewChecked() {
    this.checkDescriptionOverflow()
  }

  checkDescriptionOverflow() {
    if (this.descriptionEl && this.providerDetails?.description && !this.hasCheckedDescriptionOverflow) {
      const el = this.descriptionEl.nativeElement
      // Check if content is overflowing (scrollHeight > clientHeight means text is clamped)
      this.showDescriptionToggle = el.scrollHeight > el.clientHeight
      this.hasCheckedDescriptionOverflow = true
      this.cdr.detectChanges()
    }
  }

  getRouterData() {
    const providerName = _.get(this.activatedRoute, 'snapshot.queryParams.providerName', '')
    this.contentName = providerName ? `${providerName}` : 'Explore all the contents'
    this.configKey = _.get(this.activatedRoute, 'snapshot.queryParams.key', 'extContent')
    this.filterProvider = _.get(this.activatedRoute, 'snapshot.queryParams.provider', 'PEDGOG')
    this.loadConfiguration()
    this.initializeTitles()
  }

  initializeTitles() {
    this.titles = [
      // AFTER NLW NEED TO ENABLE
      // {
      //   title: 'All Providers', url: '/app/seeAll',
      //   queryParams: {
      //     key: 'ciosContent',
      //     tabSelected: 'Providers'
      //   }
      // },
      {
        title: 'All Providers', url: 'none',
      },
      { title: this.contentName, url: 'none', icon: '' },
    ]
  }

  setRandomColor() {
    if (this.filterProvider) {
      const randomIndex1 = Math.floor(Math.random() * Math.floor(this.colors.length))
      this.headerBgColor = this.colors[randomIndex1]
    }
  }

  loadConfiguration() {
    // Get config from local configMap
    const getConfigData = _.get(this.activatedRoute, 'snapshot.data.pageData.data', configMap)
    this.apiConfig = getConfigData[this.configKey]

    if (!this.apiConfig) {
      return
    }

    // Clone the config to avoid mutating the original
    this.apiConfig = JSON.parse(JSON.stringify(this.apiConfig))
    this.customOptions = _.get(this.apiConfig, 'sortOptions', [])

    // Update the filter criteria with the provider from URL if present (only for POST APIs with request object)
    if (this.filterProvider && this.apiConfig.request && this.apiConfig.request.filterCriteriaMap) {
      this.apiConfig.request.filterCriteriaMap['contentPartner.id'] = this.filterProvider
    }
    this.getCourses()
    // this.fetchContent()
  }

  getCourses(isLoadMore = false) {
    // Deep copy request from apiConfig to avoid mutating original
    const request: any = JSON.parse(JSON.stringify(_.get(this.apiConfig, 'request', {})))

    // Update filterCriteriaMap if present
    if (_.has(request, 'filterCriteriaMap')) {
      request.filterCriteriaMap['contentPartner.id'] = this.filterProvider

      // Add user-selected filters from appliedFilters
      if (this.appliedFilters && Object.keys(this.appliedFilters).length > 0) {
        Object.keys(this.appliedFilters).forEach((key: string) => {
          const values = this.appliedFilters[key]
          if (values && values.length > 0) {
            request.filterCriteriaMap[key] = this.toFilterValues(key, values)
          }
        })
      }
    }

    if (Array.isArray(request.facets) && !request.facets.includes(COURSE_TYPE_FACET_KEY)) {
      request.facets = [...request.facets, COURSE_TYPE_FACET_KEY]
    }

    // Update pageNumber if present
    if (_.has(request, 'pageNumber')) {
      request.pageNumber = this.currentPageNumber
    }

    // Update pageSize if present
    if (_.has(request, 'pageSize')) {
      request.pageSize = this.pageSize
    }

    // Update searchString if present
    if (_.has(request, 'searchString')) {
      request.searchString = this.searchString
    }

    if (_.has(request, 'orderBy') && this.sortKey) {
      request.orderBy = this.sortKey
    }
    if (_.has(request, 'orderDirection') && this.sortOrder) {
      request.orderDirection = this.sortOrder
    }
    this.seeAllService
      .getCourses(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (res: any) => {
          // Handle different response formats
          const data = _.get(res, 'data', []) || []
          const transformed = this.commonSvc.transformContentsToWidgetsWithoutStrip(data)

          // Capture server-provided total count
          this.totalCount = _.get(res, 'totalCount', 0)

          // Capture facets for filters (only on first load)
          if (!isLoadMore) {
            const resultFacets = _.get(res, 'facets', null)
            this.apiFacets = this.transformFacets(resultFacets)
          }

          if (isLoadMore) {
            // Append new items for infinite scroll
            this.contentItems = [...this.contentItems, ...transformed]
          } else {
            // Replace all items on first load
            this.originalContentItems = [...transformed]
            this.contentItems = [...transformed]
          }

          this.applyEnrolmentStatus()
          this.applySort()
          this.loading = false
          this.isLoadingMore = false
        }, _err => {
          if (!isLoadMore) {
            this.contentItems = []
            this.originalContentItems = []
          }
          this.totalCount = 0
          this.loading = false
          this.isLoadingMore = false
        }
      )
  }

  /**
   * Transform API facets response to the format expected by reusable-filters component
   * Input format: { "topic": [{ value: "val1", count: 5 }], "courseProvider": [] }
   * Output format: [{ name: 'topic', heading: 'Topic', values: [...], showSearch: true, ... }]
   * Only includes facets the API returned values for - a config's own `options` are used solely to
   * relabel those values, unless that entry sets `showOptionsWhenEmpty`
   * Ordered by each FilterConfig entry's `order`, falling back to its position in the array
   */
  transformFacets(facets: any): any[] {
    if (!facets || typeof facets !== 'object') {
      return []
    }
    const facetsMap = (facets && typeof facets === 'object') ? facets : {}
    const transformedFacets: any[] = []
    const filterConfig = _.get(this.apiConfig, 'FilterConfig', [])
    this.facetValuesByLabel = {}  // rebuilt from this response, so stale values are never sent

    const hasFiltersApplied = !!this.appliedFilters && Object.keys(this.appliedFilters)
      .some((key: string) => (this.appliedFilters[key] || []).length > 0)
    const allowConfigValues = this.totalCount > 0 || hasFiltersApplied

    // Iterate over FilterConfig to maintain order
    filterConfig.forEach((config: any, index: number) => {
      const key = config.key
      const values = this.getFacetValues(config, facetsMap[key], allowConfigValues)

      // Only include facets that have values (non-empty arrays)
      if (values.length > 0) {
        transformedFacets.push({
          name: key,  // This key will be used in filterCriteriaMap when filter is applied
          heading: config.heading,
          showSearch: config.showSearch,
          showClearAll: config.showClearAll,
          selectType: config.selectType,
          showCount: config.showCount,
          showSeeMore: config.showSeeMore,
          seeMoreLimit: config.seeMoreLimit,
          order: _.isNumber(config.order) ? config.order : index,  // config wins, else array position
          values,
        })
      }
    })

    // Add any facets from API that are not in FilterConfig (at the end)
    Object.keys(facetsMap).forEach((key: string) => {
      const values = facetsMap[key]
      const isConfigured = filterConfig.some((config: any) => config.key === key)

      if (!isConfigured && Array.isArray(values) && values.length > 0) {
        transformedFacets.push({
          name: key,
          heading: this.formatHeading(key),
          showSearch: true,
          showClearAll: true,
          selectType: 'checkbox',
          showCount: true,
          showSeeMore: true,
          seeMoreLimit: 4,
          order: filterConfig.length + transformedFacets.length,
          values: values.map((item: any) => ({
            name: _.get(item, 'value', ''),
            count: _.get(item, 'count', 0),
          })),
        })
      }
    })

    return this.sortFacets(transformedFacets)
  }
  getFacetValues(config: any, apiValues: any, allowConfigValues = true): any[] {
    const key = _.get(config, 'key', '')
    const { valueToLabel } = this.getOptionAliases(key)

    if (Array.isArray(apiValues) && apiValues.length > 0) {
      return apiValues.map((item: any) => {
        const value = _.get(item, 'value', '')  // API returns 'value', component expects 'name'
        // Show the form's label for it, when it gives one. Array path, so a facet value with a
        // dot in it ("Dr. Ambedkar…") is read as one key instead of a nested lookup.
        const name = _.get(valueToLabel, [_.toLower(value)], value)
        // Remember what the API called it, so applying this option sends that string back verbatim
        _.set(this.facetValuesByLabel, [key, name], value)
        return {
          name,
          count: _.get(item, 'count', 0),
        }
      })
    }

    // The config's own options are placeholders for a facet the API returned nothing for, so they
    // are off unless the form opts in with `showOptionsWhenEmpty`. An empty facet now means this
    // provider genuinely has no content of that type, and offering the boxes anyway only leads to
    // a filter that returns 0 results.
    if (!allowConfigValues || !_.get(config, 'showOptionsWhenEmpty', false)) {
      return []
    }

    const configValues = _.get(config, 'values', _.get(config, 'options', [])) || []
    return configValues.map((option: any) => (
      _.isString(option) ? { name: option } : { name: _.get(option, 'name', _.get(option, 'value', '')) }
    ))
  }

  /**
   * Label/value pairs for one filter section, from the form's `options`.
   *
   * An option written as `{ "name": "Open", "value": "Free" }` shows "Open" in the sidebar but
   * filters on the "Free" the search index actually stores - the two vocabularies differ for
   * courseType and the backend keeps its own. Plain string options need no aliasing: they are
   * their own label and value, so they are skipped and everything falls through unchanged.
   */
  getOptionAliases(key: string): { labelToValue: any, valueToLabel: any } {
    const filterConfig = _.get(this.apiConfig, 'FilterConfig', [])
    const config = _.find(filterConfig, (entry: any) => entry.key === key)
    const options = _.get(config, 'values', _.get(config, 'options', [])) || []
    const labelToValue: any = {}
    const valueToLabel: any = {}

    options.forEach((option: any) => {
      if (_.isString(option)) {
        return
      }
      const label = _.get(option, 'name', '')
      const value = _.get(option, 'value', '')
      // Keyed lower case: the index spells courseType "paid" while the form writes it "Paid", and
      // the sidebar capitalises whatever it is handed, so casing cannot be relied on to match.
      if (label && value && _.toLower(label) !== _.toLower(value)) {
        labelToValue[_.toLower(label)] = value
        valueToLabel[_.toLower(value)] = label
      }
    })

    return { labelToValue, valueToLabel }
  }

  /**
   * sb-uic-filter-by emits the label it displayed (`option.name`), so selections are translated
   * back to the values the search API expects before they go out in filterCriteriaMap.
   */
  toFilterValues(key: string, labels: any[]): any[] {
    const { labelToValue } = this.getOptionAliases(key)
    return (labels || []).map((label: any) => {
      // What the facet response called this option wins - it is the exact string the index holds.
      // The form's `value` is the fallback, for options only shown from config (empty facet).
      const fromApi = _.get(this.facetValuesByLabel, [key, label])
      return fromApi !== undefined ? fromApi : _.get(labelToValue, [_.toLower(label)], label)
    })
  }

  sortFacets(facets: any[]): any[] {
    return [...facets]
      .sort((a: any, b: any) => a.order - b.order)
      .map((facet: any, index: number) => ({ ...facet, order: index + 1 }))
  }

  /**
   * Format filter key to readable heading
   * e.g., 'competencies_v6.competencyAreaName' -> 'Competency Area Name'
   */
  formatHeading(key: string): string {
    const lastPart = key.split('.').pop() || key
    return lastPart
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim()
  }
  onTabChange(tabKey: string) {
    this.selectedTab = tabKey
  }

  get isAllContentTab(): boolean {
    return this.selectedTab === CONTENT_TABS[0].key
  }

  get displayedItems(): any[] {
    return this.isAllContentTab ? this.contentItems : (this.enrolledContent[this.selectedTab] || [])
  }

  get isListLoading(): boolean {
    return this.isAllContentTab ? this.loading : this.isEnrolmentLoading
  }

  loadEnrolments() {
    this.isEnrolmentLoading = true
    this.enrollSvc
      .fetchExternalEnrollmentSearch({ partnerId: this.filterProvider, status: ENROLMENT_STATUS_ALL })
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (res: any) => {
          const courses = _.get(res, 'result.courses', null) || _.get(res, 'courses', null) || []
          this.splitEnrolmentsByStatus(courses)
          this.isEnrolmentLoading = false
        },
        () => {
          this.enrolledContent = { completed: [], inProgress: [] }
          this.enrolmentStatusById = {}
          this.isEnrolmentLoading = false
        }
      )
  }

  splitEnrolmentsByStatus(courses: any[]) {
    const completed: any[] = []
    const inProgress: any[] = []
    const statusById: { [id: string]: number } = {}

    courses.forEach((course: any) => {
      const content = this.toEnrolledContent(course)
      const status = this.getEnrolmentStatus(course)
      const contentId = this.getContentKey(content)
      if (contentId) {
        statusById[contentId] = status
      }
      if (status === ENROLMENT_STATUS_COMPLETED) {
        completed.push(content)
      } else {
        inProgress.push(content)
      }
    })

    this.enrolmentStatusById = statusById
    this.enrolledContent = {
      completed: this.commonSvc.transformContentsToWidgetsWithoutStrip(completed),
      inProgress: this.commonSvc.transformContentsToWidgetsWithoutStrip(inProgress),
    }
    this.applyEnrolmentStatus()
  }

  /**
   * The enrolment and search responses do not agree on which key carries the content id, so try
   * each one both are known to use. Returns '' when none of them is present.
   */
  getContentKey(content: any): string {
    return _.get(content, 'contentId', '')
      || _.get(content, 'identifier', '')
      || _.get(content, 'externalId', '')
      || ''
  }

  /**
   * The search behind 'All Content' knows nothing about enrolment, so copy the status onto each
   * card's content - that is the field sb-uic-card-landscape reads to draw its status pill.
   * Called from both loaders because the two run in parallel and either can land first.
   */
  applyEnrolmentStatus() {
    this.contentItems.forEach((item: any) => {
      const content = _.get(item, 'widgetData.content')
      if (!content) {
        return
      }
      const contentId = this.getContentKey(content)
      // Indexed lookup rather than _.get: a content id containing a dot would be read as a path.
      const status = contentId ? this.enrolmentStatusById[contentId] : undefined
      if (status !== undefined) {
        content.completionStatus = status
      }
    })
  }
  /**
   * The record's own `status` is the only thing the tabs split on - nothing else on the
   * enrolment record gets a say.
   */
  getEnrolmentStatus(course: any): number {
    return Number(_.get(course, 'status', 0)) || 0
  }
  toEnrolledContent(course: any): any {
    const content = _.get(course, 'content') || course || {}
    return {
      ...content,
      completionPercentage: course.completionPercentage || course.completionpercentage || 0,
      completionStatus: this.getEnrolmentStatus(course),
      issuedCertificates: course.issuedCertificates || course.issued_certificates || [],
      lastContentAccessTime: course.lastContentAccessTime || '',
      enrolledDate: course.enrolledDate || '',
      batchId: course.batchId || '',
    }
  }

  onFilterApplied(filters: any) {
    this.appliedFilters = filters
    // Apply filters and refresh content
    // this.fetchContent(false)
    this.getCourses(false)
  }

  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }

  loadProviderDetails() {
    if (!this.filterProvider) {
      return
    }

    const request = {
      filterCriteriaMap: {
        isActive: true,
        liveCoursesCount: {
          '>=': '1',
        },
        isTrainingInstitution: false,
        providerType: ['external', 'internal'],
        id: this.filterProvider,
      },
      pageNumber: 0,
      pageSize: 10,
      facets: ['contentPartnerName'],
      orderBy: 'createdOn',
      orderDirection: 'desc',
    }

    this.seeAllService
      .getProviderDetails(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (res: any) => {
          this.providerDetails = _.get(res, 'result.data[0]', null)
        },
        (error: any) => {
          console.error('Error fetching provider details:', error)
          this.providerDetails = null
        }
      )
  }

  applyLocalSearch() {
    // Filter content based on search string (local search)
    if (!this.searchString || this.searchString.trim() === '') {
      // Restore original data when search is empty
      this.contentItems = [...this.originalContentItems]
      return
    }

    const searchTerm = this.searchString.toLowerCase()
    this.contentItems = this.originalContentItems.filter((item: any) => {
      return (
        (item.name && item.name.toLowerCase().includes(searchTerm)) ||
        (item.title && item.title.toLowerCase().includes(searchTerm)) ||
        (item.description && item.description.toLowerCase().includes(searchTerm)) ||
        (item.widgetData?.content?.name && item.widgetData.content.name.toLowerCase().includes(searchTerm))
      )
    })
  }

  applySort() {
    this.contentItems.sort((a, b) => {
      let valA = a[this.sortKey]
      let valB = b[this.sortKey]

      if (this.sortKey === 'avgRating') {
        valA = Number(valA) || 0
        valB = Number(valB) || 0
      } else if (this.sortKey === 'createdOn') {
        valA = new Date(valA).getTime() || 0
        valB = new Date(valB).getTime() || 0
      } else {
        valA = (valA || '').toString().toLowerCase()
        valB = (valB || '').toString().toLowerCase()
      }

      if (valA < valB) return this.sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return this.sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }

  setSort(key: string) {
    if (this.sortKey === key) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
    } else {
      this.sortKey = key
      this.sortOrder = 'asc'
    }
    this.applySort()
  }

  onChangeSortSearch(event: any) {
    switch (event) {
      case 'recently_added_newest':
        this.sortKey = 'createdOn'
        this.sortOrder = 'desc'
        break
      case 'a-z':
        this.sortKey = 'name'
        this.sortOrder = 'asc'
        break
      case 'z-a':
        this.sortKey = 'name'
        this.sortOrder = 'desc'
        break
      default:
        // Handle other cases or do nothing
        break
    }

    this.getCourses(false)
  }

  onSearchKeyChange() {
    this.searchStringChange$.next(this.searchString)
  }

  onSearch() {
    const isLocalSearchApi = _.get(this.apiConfig, 'isLocalSearch', false)

    if (this.isGetApi || isLocalSearchApi) {
      // For GET APIs and Local Search APIs - apply local search on already fetched data
      this.applyLocalSearch()
      this.applySort()
    } else {
      this.getCourses(false)
    }
  }

  clearSearch() {
    this.searchString = ''
    const isLocalSearchApi = _.get(this.apiConfig, 'isLocalSearch', false)

    if (this.isGetApi || isLocalSearchApi) {
      // For GET APIs and Local Search APIs - restore full data
      this.applyLocalSearch()
      this.applySort()
    } else {
      // For POST APIs - fetch all data from first page
      // this.fetchContent(false)
      this.getCourses(false)
    }
  }

  raiseTelemetryInteratEvent(content: any) {
    const tab = _.find(CONTENT_TABS, (entry: any) => entry.key === this.selectedTab)
    const pageContext: WsEvents.ITelemetryPageContext = {
      pageId: TELEMETRY_PAGE_ID,
      module: TELEMETRY_ENV,  // the listener sends this out as the event's `env`
    }
    this.eventSvc.dispatchEvent<WsEvents.IWsEventTelemetryInteract>({
      pageContext,
      eventType: WsEvents.WsEventType.Telemetry,
      eventLogLevel: WsEvents.WsEventLogLevel.Info,
      from: '',
      to: 'Telemetry',
      data: {
        pageContext,
        eventSubType: WsEvents.EnumTelemetrySubType.Interact,
        edata: {
          type: 'click',
          subType: _.get(tab, 'telemetrySubType', ''),
          id: this.filterProvider || _.get(this.providerDetails, 'id', ''),
          pageid: TELEMETRY_PAGE_ID,
        },
        object: {
          id: this.getContentKey(content),
          type: this.getContentCategory(content),
        },
      },
    })
  }

  getContentCategory(content: any): string {
    return _.get(content, 'primaryCategory', '')
      || _.get(content, 'contentType', '')
      || _.get(content, 'category', '')
      || TELEMETRY_OBJECT_TYPE
  }

  async getRedirectUrlData(content: any) {
    if (content.externalId) {
      this.router.navigate(
        [`app/toc/ext/${content.contentId}`])
    } else {
      const urlData = await this.contSvc.getResourseLink(content)
      const queryParams = {
        ...urlData.queryParams,
      }
      this.router.navigate(
        [urlData.url],
        // { queryParams: urlData.queryParams }
        { queryParams }
      )
    }

  }

  onPageChange(event: any) {
    this.currentPageNumber = event.currentPage - 1
    this.pageSize = event.limit
    this.getCourses(false)
  }
}
