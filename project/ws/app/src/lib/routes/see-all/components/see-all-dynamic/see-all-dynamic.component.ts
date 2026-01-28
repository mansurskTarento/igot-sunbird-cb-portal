import { Component, OnInit, OnDestroy } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { SeeAllService } from '../../services/see-all.service'
import { CommonMethodsService, WidgetContentLibService } from '@sunbird-cb/consumption'
import * as _ from 'lodash'

// Filter configuration - defines display settings for each filter
// Order in array determines display order (index 0 = first, index 1 = second, etc.)
// Keys must match the API facet keys exactly
const FILTER_CONFIG: Array<{
  key: string,
  heading: string,
  showSearch: boolean,
  showClearAll: boolean,
  selectType: 'checkbox' | 'radio',
  showCount: boolean,
  showSeeMore: boolean,
  seeMoreLimit: number
}> = [
    {
      key: 'contentPartner.contentPartnerName',
      heading: 'Content Provider',
      showSearch: true,
      showClearAll: true,
      selectType: 'checkbox',
      showCount: true,
      showSeeMore: true,
      seeMoreLimit: 4
    },
    {
      key: 'competencies_v6.competencyAreaName',
      heading: 'Competency Area',
      showSearch: true,
      showClearAll: true,
      selectType: 'checkbox',
      showCount: true,
      showSeeMore: true,
      seeMoreLimit: 4
    },
    {
      key: 'competencies_v6.competencyThemeName',
      heading: 'Competency Theme',
      showSearch: true,
      showClearAll: true,
      selectType: 'checkbox',
      showCount: true,
      showSeeMore: true,
      seeMoreLimit: 4
    },
    {
      key: 'competencies_v6.competencySubThemeName',
      heading: 'Competency Sub Theme',
      showSearch: true,
      showClearAll: true,
      selectType: 'checkbox',
      showCount: true,
      showSeeMore: true,
      seeMoreLimit: 4
    },
    {
      key: 'courseProvider',
      heading: 'Course Provider',
      showSearch: true,
      showClearAll: true,
      selectType: 'checkbox',
      showCount: true,
      showSeeMore: true,
      seeMoreLimit: 4
    },
    {
      key: 'topic',
      heading: 'Topic',
      showSearch: true,
      showClearAll: true,
      selectType: 'checkbox',
      showCount: true,
      showSeeMore: true,
      seeMoreLimit: 4
    }
  ]

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
  contentItems: any[] = []
  originalContentItems: any[] = []
  scrollDistance = 2  // Distance from bottom to trigger load
  throttle = 300  // Throttle scroll events
  pageSize = 10  // Items per page
  currentPageNumber = 0  // For server-side pagination
  totalCount = 0  // Server-provided total count
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

  private destroy$ = new Subject<void>()

  constructor(
    private activatedRoute: ActivatedRoute,
    private seeAllService: SeeAllService,
    private translate: TranslateService,
    private commonSvc: CommonMethodsService,
    private router: Router,
    private contSvc: WidgetContentLibService
  ) {
    if (localStorage.getItem('websiteLanguage')) {
      this.translate.setDefaultLang('en')
      const lang = localStorage.getItem('websiteLanguage')!
      this.translate.use(lang)
    }
    this.customOptions = [
      { name: 'Most Relevant', value: 'most_relevant' },
      { name: 'Recently Added (Newest)', value: 'recently_added_newest' },
      { name: 'Highest Rated', value: 'highest_rated' },
      { name: 'A-Z', value: 'a-z' },
      { name: 'Z-A', value: 'z-a' }
    ]
  }

  ngOnInit() {
    const providerName = _.get(this.activatedRoute, 'snapshot.queryParams.providerName', '')
    this.contentName = providerName ? `${providerName} Contents` : 'Explore all the contents'
    this.configKey = _.get(this.activatedRoute, 'snapshot.queryParams.key', 'extContent')
    this.filterProvider = _.get(this.activatedRoute, 'snapshot.queryParams.provider', 'PEDGOG')

    // Load configuration from service
    this.loadConfiguration()
    // this.fetchContent()
    this.getCourses()
    this.loadProviderDetails()
  }

  onFilterApplied(filters: any) {
    this.appliedFilters = filters
    console.log('Applied Filters:', this.appliedFilters)
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

  loadConfiguration() {
    // Get config from local configMap
    const getConfigData = _.get(this.activatedRoute, 'snapshot.data.pageData.data', configMap)
    this.apiConfig = getConfigData[this.configKey]

    if (!this.apiConfig) {
      return
    }

    // Clone the config to avoid mutating the original
    this.apiConfig = JSON.parse(JSON.stringify(this.apiConfig))

    // Update the filter criteria with the provider from URL if present (only for POST APIs with request object)
    if (this.filterProvider && this.apiConfig.request && this.apiConfig.request.filterCriteriaMap) {
      this.apiConfig.request.filterCriteriaMap['contentPartner.id'] = this.filterProvider
    }
    if (this.filterProvider && this.apiConfig.request) {
      this.apiConfig.request.partnerId = this.filterProvider
    }
  }

  // fetchContent(isLoadMore = false) {
  //   if (!this.apiConfig) {
  //     return
  //   }

  //   const isFirstLoad = !isLoadMore
  //   if (isFirstLoad) {
  //     this.loading = true
  //     this.currentPageNumber = 0
  //     this.contentItems = []
  //     this.originalContentItems = []
  //   } else {
  //     this.isLoadingMore = true
  //   }

  //   const url = this.apiConfig.url
  //   const request = this.apiConfig.request
  //   const isLocalSearchApi = this.apiConfig.isLocalSearch === true

  //   // Check if this is a GET API - first check explicit flag, then check if request is empty
  //   this.isGetApi = this.apiConfig.isGetApi === true || !request || Object.keys(request).length === 0

  //   if (this.isGetApi) {
  //     this.seeAllService
  //       .fetchDynamicContent(url, {}, true)
  //       .pipe(takeUntil(this.destroy$))
  //       .subscribe(
  //         (res: any) => {
  //           // Handle different response formats
  //           const data = _.get(res, 'result.content', null) || _.get(res, 'content', null) || _.get(res, 'data', null) || res || []
  //           const transformed = this.commonSvc.transformContentsToWidgetsWithoutStrip(data)
  //           // Store original data for search filtering
  //           this.originalContentItems = [...transformed]
  //           this.contentItems = [...transformed]
  //           // Capture server-provided total count
  //           this.totalCount = _.get(res, 'result.totalCount', null) || _.get(res, 'totalCount', null) || transformed.length
  //           // Capture facets for filters
  //           const resultFacets = _.get(res, 'result.facets', null)
  //           const facets = _.get(res, 'facets', null)
  //           debugger
  //           if (resultFacets || facets) {
  //             this.apiFacets = resultFacets || facets || []
  //           }
  //           this.applyLocalSearch()
  //           this.applySort()
  //           this.loading = false
  //           this.isLoadingMore = false
  //         },
  //         (_err) => {
  //           this.contentItems = []
  //           this.originalContentItems = []
  //           this.totalCount = 0
  //           this.loading = false
  //           this.isLoadingMore = false
  //         }
  //       )
  //   } else if (isLocalSearchApi) {
  //     const localSearchRequest = JSON.parse(JSON.stringify(request))
  //     // Don't add pageNumber, searchString, or pageSize for local search APIs

  //     this.seeAllService
  //       .fetchDynamicContent(url, localSearchRequest, false)
  //       .pipe(takeUntil(this.destroy$))
  //       .subscribe(
  //         (res: any) => {
  //           // Handle different response formats
  //           const data = _.get(res, 'result.content', null) || _.get(res, 'content', null) || _.get(res, 'data', [])
  //           const transformed = this.commonSvc.transformContentsToWidgetsWithoutStrip(data)
  //           // Store original data for search filtering
  //           this.originalContentItems = [...transformed]
  //           this.contentItems = [...transformed]
  //           // Capture server-provided total count
  //           this.totalCount = _.get(res, 'result.totalCount', null) || _.get(res, 'totalCount', null) || transformed.length
  //           // Capture facets for filters
  //           const resultFacets = _.get(res, 'result.facets', null)
  //           const facets = _.get(res, 'facets', null)
  //           if (resultFacets || facets) {
  //             this.apiFacets = resultFacets || facets || []
  //           }
  //           this.applyLocalSearch()
  //           this.applySort()
  //           this.loading = false
  //           this.isLoadingMore = false
  //         },
  //         (_err) => {
  //           this.contentItems = []
  //           this.originalContentItems = []
  //           this.totalCount = 0
  //           this.loading = false
  //           this.isLoadingMore = false
  //         }
  //       )
  //   } else {
  //     // For POST APIs with server-side pagination - use server-side pagination with infinite scroll
  //     const postRequest = JSON.parse(JSON.stringify(request))
  //     postRequest.searchString = this.searchString
  //     postRequest.pageNumber = this.currentPageNumber
  //     postRequest.pageSize = this.pageSize

  //     this.seeAllService
  //       .fetchDynamicContent(url, postRequest)
  //       .pipe(takeUntil(this.destroy$))
  //       .subscribe(
  //         (res: any) => {
  //           // Handle different response formats
  //           const data = _.get(res, 'result.content', null) || _.get(res, 'content', null) || _.get(res, 'data', [])
  //           const transformed = this.commonSvc.transformContentsToWidgetsWithoutStrip(data)
  //           // Capture server-provided total count
  //           const resultContent = _.get(res, 'result.content', [])
  //           this.totalCount = _.get(res, 'result.totalCount', null) || _.get(res, 'totalCount', null) || resultContent.length || 0

  //           // Capture facets for filters (only on first load)
  //           const resultFacets = _.get(res, 'result.facets', null)
  //           const facets = _.get(res, 'facets', null)
  //           if (!isLoadMore && (resultFacets || facets)) {
  //             this.apiFacets = resultFacets || facets || []
  //           }

  //           if (isLoadMore) {
  //             // Append new items for infinite scroll
  //             this.contentItems = [...this.contentItems, ...transformed]
  //           } else {
  //             // Replace all items on first load
  //             this.contentItems = transformed
  //           }

  //           this.applySort()
  //           this.loading = false
  //           this.isLoadingMore = false
  //         },
  //         (_err) => {
  //           if (!isLoadMore) {
  //             this.contentItems = []
  //           }
  //           this.totalCount = 0
  //           this.loading = false
  //           this.isLoadingMore = false
  //         }
  //       )
  //   }
  // }

  getCourses(isLoadMore = false) {
    const isFirstLoad = !isLoadMore
    if (isFirstLoad) {
      this.loading = true
      this.currentPageNumber = 0
      this.contentItems = []
      this.originalContentItems = []
    } else {
      this.isLoadingMore = true
    }

    // Build filterCriteriaMap with common filters + user-selected filters
    const filterCriteriaMap: any = {
      // 'contentPartner.isActive': true,
      'contentPartner.id': this.filterProvider
    }

    // Add user-selected filters from appliedFilters
    if (this.appliedFilters && Object.keys(this.appliedFilters).length > 0) {
      Object.keys(this.appliedFilters).forEach((key: string) => {
        const values = this.appliedFilters[key]
        if (values && values.length > 0) {
          filterCriteriaMap[key] = values
        }
      })
    }

    const request = {
      filterCriteriaMap: filterCriteriaMap,
      requestedFields: [],
      pageNumber: this.currentPageNumber,
      pageSize: this.pageSize,
      facets: [
        'courseProvider',
        'topic',
        'contentPartner.contentPartnerName',
        'competencies_v6.competencyAreaName',
        'competencies_v6.competencyThemeName',
        'competencies_v6.competencySubThemeName'
      ],
      orderBy: 'createdOn'
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
          this.totalCount = _.get(res, 'totalCount', null) || transformed.length || 0

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
   * Orders facets based on position in FILTER_CONFIG array
   */
  transformFacets(facets: any): any[] {
    if (!facets || typeof facets !== 'object') {
      return []
    }

    const transformedFacets: any[] = []

    // Iterate over FILTER_CONFIG to maintain order
    FILTER_CONFIG.forEach((config, index) => {
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

    // Add any facets from API that are not in FILTER_CONFIG (at the end)
    Object.keys(facets).forEach((key: string) => {
      const values = facets[key]
      const isConfigured = FILTER_CONFIG.some(config => config.key === key)

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
          order: FILTER_CONFIG.length + transformedFacets.length,
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

  onScrollEnd() {
    // Check if we have more items to load
    if (this.isLoadingMore || this.loading) {
      return  // Already loading
    }

    const totalLoaded = this.contentItems.length
    if (totalLoaded >= this.totalCount) {
      return  // All items loaded
    }

    // Load next page
    this.currentPageNumber += 1
    // this.fetchContent(true)  // Pass true to indicate this is a load-more request
    this.getCourses(true)  // Pass true to indicate this is a load-more request
  }

  onChangeSortSearch(event: any) {
    if (event === 'most_relevant') {
      // No specific sort for most relevant
    } else if (event === 'recently_added_newest') {
      this.sortKey = 'createdOn'
      this.sortOrder = 'desc'
    } else if (event === 'highest_rated') {
      this.sortKey = 'avgRating'
      this.sortOrder = 'desc'
    } else if (event === 'a-z') {
      this.sortKey = 'name'
      this.sortOrder = 'asc'
    } else if (event === 'z-a') {
      this.sortKey = 'name'
      this.sortOrder = 'desc'
    }
    this.applySort()
  }

  onSearch(searchValue: string) {
    this.searchString = searchValue
    const isLocalSearchApi = _.get(this.apiConfig, 'isLocalSearch', false)

    if (this.isGetApi || isLocalSearchApi) {
      // For GET APIs and Local Search APIs - apply local search on already fetched data
      this.applyLocalSearch()
      this.applySort()
    } else {
      // For POST APIs - fetch from API with search string (reset to first page)
      // this.fetchContent(false)
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
}
