import { Component, OnInit, OnDestroy } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { SeeAllService } from '../../services/see-all.service'
import { CommonMethodsService, WidgetContentLibService } from '@sunbird-cb/consumption'
import * as _ from 'lodash'
import { MultilingualTranslationsService, ValueService } from '@sunbird-cb/utils-v2'

const configMap: any = {
  extContent: {
    name: "Cohort Insights",
    url: '/apis/proxies/v8/cios/v1/search/content',
    request: {
      filterCriteriaMap: {
      },
      requestedFields: [],
      pageNumber: 0,
      pageSize: 10,
      facets: ['topic'],
      orderBy: 'createdOn',
      orderDirection: 'desc',
      searchString: ''
    }
  },
  extContentAssigned: {
    name: "Assigned Contents",
    url: 'apis/proxies/v8/user/v1/assigned/externalcourses',
    isGetApi: false,  // POST API but with local search (no pagination)
    isLocalSearch: true,  // Flag to indicate local search only
    request: {
      "partnerId": ""
    }
  }
}
@Component({
  selector: 'ws-app-see-all-dynamic',
  templateUrl: './see-all-dynamic.component.html',
  styleUrls: ['./see-all-dynamic.component.scss']
})
export class SeeAllDynamicComponent implements OnInit, OnDestroy {
  colors = [
    '#EF941D', '#F97440', '#35B5B0', '#9988FF', '#816FEC',
    '#254092', '#926525', '#4F72DF'
  ];
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
  isFilterSidebarOpen = false
  public screenSizeIsLtMedium = false
  isLtMedium$ = this.valueSvc.isLtMedium$
  titles: any[] = [
  ]

  private destroy$ = new Subject<void>()

  constructor(
    private activatedRoute: ActivatedRoute,
    private seeAllService: SeeAllService,
    private translateService: TranslateService,
    private langtranslations: MultilingualTranslationsService,
    private commonSvc: CommonMethodsService,
    private router: Router,
    private contSvc: WidgetContentLibService,
    private valueSvc: ValueService
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
    this.getRouterData()
    this.loadProviderDetails()
    this.setRandomColor()
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
      {
        title: 'All Providers', url: '/app/seeAll',
        queryParams: {
          key: 'ciosContent',
          tabSelected: 'Providers'
        }
      },
      { title: this.contentName, url: 'none', icon: '' }
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
            request.filterCriteriaMap[key] = values
          }
        })
      }
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

          this.applySort()
          this.loading = false
          this.isLoadingMore = false
        },
        (_err) => {
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
   * Only includes facets that have values (non-empty arrays)
   * Orders facets based on position in FilterConfig array from apiConfig
   */
  transformFacets(facets: any): any[] {
    if (!facets || typeof facets !== 'object') {
      return []
    }

    const transformedFacets: any[] = []
    const filterConfig = _.get(this.apiConfig, 'FilterConfig', [])

    // Iterate over FilterConfig to maintain order
    filterConfig.forEach((config: any, index: number) => {
      const key = config.key
      const values = facets[key]

      // Only include facets that have values (non-empty arrays)
      if (Array.isArray(values) && values.length > 0) {
        transformedFacets.push({
          name: key,  // This key will be used in filterCriteriaMap when filter is applied
          heading: config.heading,
          showSearch: config.showSearch,
          showClearAll: config.showClearAll,
          selectType: config.selectType,
          showCount: config.showCount,
          showSeeMore: config.showSeeMore,
          seeMoreLimit: config.seeMoreLimit,
          order: index,  // Use array index as order
          values: values.map((item: any) => ({
            name: _.get(item, 'value', ''),  // API returns 'value', component expects 'name'
            count: _.get(item, 'count', 0)
          }))
        })
      }
    })

    // Add any facets from API that are not in FilterConfig (at the end)
    Object.keys(facets).forEach((key: string) => {
      const values = facets[key]
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
            count: _.get(item, 'count', 0)
          }))
        })
      }
    })

    return transformedFacets
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
          '>=': '1'
        },
        isTrainingInstitution: false,
        providerType: ['external', 'internal'],
        id: this.filterProvider
      },
      pageNumber: 0,
      pageSize: 10,
      facets: ['contentPartnerName'],
      orderBy: 'createdOn',
      orderDirection: 'desc'
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
  async getRedirectUrlData(content: any) {
    if (content.externalId) {
      this.router.navigate(
        [`app/toc/ext/${content.contentId}`])
    } else {
      let urlData = await this.contSvc.getResourseLink(content)
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
