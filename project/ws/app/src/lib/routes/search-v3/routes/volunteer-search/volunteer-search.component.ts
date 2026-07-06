import {
  Component,
  OnInit,
  OnDestroy,
} from '@angular/core'
import { GbSearchService } from '../../services/gb-search.service'
import {
  ConfigurationsService,
  EventService,
  ValueService,
} from '@sunbird-cb/utils-v2'
import { ActivatedRoute, Router } from '@angular/router'
import _ from 'lodash'
import { TranslateService } from '@ngx-translate/core'
import { forkJoin, Subject } from 'rxjs'
import {
  FacetType,
  PageChangeEmitter,
  SearchCategory,
  SearchV4Request,
  SortType,
} from '../../models/search-v3.model'
import { NsContent } from '@sunbird-cb/collection'
import { ContentDictionaryService } from '@sunbird-cb/consumption'
import { environment } from '../../../../../../../../../src/environments/environment'

@Component({
  selector: 'ws-app-volunteer-search',
  templateUrl: './volunteer-search.component.html',
  styleUrls: ['./volunteer-search.component.scss'],
  standalone: false,
})
export class VolunteerSearchComponent implements OnInit, OnDestroy {
  searchQuery = ''
  defaultThumbnail = ''
  sideNavBarOpened = true
  private defaultSideNavBarOpenedSubscription: any
  private destroy$ = new Subject<void>()
  private isFirstLoad = true

  public screenSizeIsLtMedium = false
  isLtMedium$ = this.valueSvc.isLtMedium$

  noResultMessage = ''

  courseSearchTotalCount = 0
  courseSearchResults: any[] = []
  searchRequestCourse = new SearchV4Request([])
  searchContentLoader = true

  initialPaginationSize = 10
  initialPaginationSizeOptions = [10, 20, 50, 100]
  initialPaginationPage = 1

  coursesFacets: any[] = []
  combinedFacets: any[] = []
  compentencyKey!: NsContent.ICompentencyKeys
  enrollmentDetails: any = []

  competencyAreaNameKey!: string
  competencyThemeKey!: string
  competencySubThemeKey!: string

  searchSortFilter: string = SortType.RecentlyAdded
  filtersChipFromLearn: string[] = []

  constructor(
    private searchV3Service: GbSearchService,
    private configSvc: ConfigurationsService,
    private events: EventService,
    private activated: ActivatedRoute,
    private valueSvc: ValueService,
    private translate: TranslateService,
    private router: Router,
    private contentDictionarySvc: ContentDictionaryService,
  ) {
    if (localStorage.getItem('websiteLanguage')) {
      this.translate.setDefaultLang('en')
      const lang = localStorage.getItem('websiteLanguage')!
      this.translate.use(lang)
    }

    this.compentencyKey =
      this.configSvc.compentency[environment.compentencyVersionKey]
    this.competencyAreaNameKey = `${this.compentencyKey.vKey}.${this.compentencyKey.vCompetencyArea}`
    this.competencyThemeKey = `${this.compentencyKey.vKey}.${this.compentencyKey.vCompetencyTheme}`
    this.competencySubThemeKey = `${this.compentencyKey.vKey}.${this.compentencyKey.vCompetencySubTheme}`
  }

  ngOnInit() {
    const instanceConfig = this.configSvc.instanceConfig
    this.defaultSideNavBarOpenedSubscription = this.isLtMedium$.subscribe(
      (isLtMedium) => {
        this.sideNavBarOpened = !isLtMedium
        this.screenSizeIsLtMedium = isLtMedium
      }
    )

    if (instanceConfig) {
      this.defaultThumbnail = instanceConfig.logos.defaultContent || ''
    }

    this.activated.queryParamMap.subscribe((queryParams) => {
      const q = queryParams.get('q') || ''
      if (this.isFirstLoad || q !== this.searchQuery) {
        this.isFirstLoad = false
        this.searchQuery = q
        this.resetSearchParams()
        this.performSearch()
      }
    })

    this.checkCourseEnrollment()
  }

  ngOnDestroy() {
    if (this.defaultSideNavBarOpenedSubscription) {
      this.defaultSideNavBarOpenedSubscription.unsubscribe()
    }
    this.destroy$.next()
    this.destroy$.complete()
  }

  private resetSearchParams() {
    this.searchRequestCourse = new SearchV4Request([
      this.competencyAreaNameKey,
      this.competencyThemeKey,
      this.competencySubThemeKey,
    ])
    this.searchRequestCourse.request.limit = this.initialPaginationSize
    this.searchRequestCourse.request.filters.courseCategory = ['course']
    // Default sort for composite API: recently added maps to lastUpdatedOn desc
    this.searchRequestCourse.request.sort_by.createdOn = 'desc'
    this.courseSearchResults = []
    this.courseSearchTotalCount = 0
    this.combinedFacets = []
    this.initialPaginationPage = 1
    this.updateNoResultMessage(this.searchQuery)
  }

  private async performSearch() {
    this.searchContentLoader = true
    await this.searchCourses()
    this.searchContentLoader = false
  }

  /**
   * Builds the request body for /composite/v5/search.
   * Maps sort_by.createdOn → lastUpdatedOn since composite API uses lastUpdatedOn.
   * Strips contentType (not used by composite) and ensures courseCategory defaults to ['course'].
   */
  private buildCompositeRequest(): any {
    const src = this.searchRequestCourse.request
    const filters: any = { status: 'Live' }

    if (src.filters.courseCategory?.length > 0) {
      filters.courseCategory = src.filters.courseCategory
    } else {
      filters.courseCategory = ['course']
    }

    // Copy selective filters; skip contentType (irrelevant for composite endpoint)
    const filterKeys = [
      'language', 'organisation', 'avgRating',
      'sectorId', 'subSectorId',
      FacetType.sectorNames_v1, FacetType.subSectorNames_v1,
      this.competencyAreaNameKey,
      this.competencyThemeKey,
      this.competencySubThemeKey,
    ]
    filterKeys.forEach(key => {
      const val = src.filters[key]
      if (val === undefined || val === null) { return }
      if (Array.isArray(val) && val.length === 0) { return }
      if (!Array.isArray(val) && typeof val === 'object' && Object.keys(val).length === 0) { return }
      filters[key] = val
    })

    // Map sort_by: createdOn → lastUpdatedOn for composite API
    const sortBy: any = {}
    if (src.sort_by.createdOn) {
      sortBy.lastUpdatedOn = src.sort_by.createdOn
    } else if (src.sort_by.avgRating) {
      sortBy.avgRating = src.sort_by.avgRating
    } else if (src.sort_by.name) {
      sortBy.name = src.sort_by.name
    } else {
      sortBy.lastUpdatedOn = 'desc'
    }

    return {
      request: {
        filters,
        query: this.searchQuery,
        sort_by: sortBy,
        limit: src.limit,
        offset: src.offset,
        facets: _.uniq(src.facets),
      },
    }
  }

  async searchCourses() {
    const compositeRequest = this.buildCompositeRequest()
    const result = await this.searchV3Service.searchVolunteerCoursesComposite(compositeRequest)

    if (result?.result?.content?.length > 0) {
      const identifiers: string[] = result.result.content
        .map((c: any) => c.identifier)
        .filter(Boolean)

      const enriched = identifiers.length
        ? await forkJoin(identifiers.map((id: string) => this.contentDictionarySvc.getContent(id))).toPromise()
        : []

      this.courseSearchResults = (enriched || []).filter(Boolean)
      this.courseSearchTotalCount = result.result.count || this.courseSearchResults.length
      this.coursesFacets = result.result.facets || []
      this.combinedFacets = [this.coursesFacets]
    } else {
      this.courseSearchResults = []
      this.courseSearchTotalCount = 0
      this.coursesFacets = result?.result?.facets || []
      this.combinedFacets = this.coursesFacets.length ? [this.coursesFacets] : []
    }
  }

  async applySearchFilter(selectedFilters: { [key: string]: any }) {
    this.searchContentLoader = true
    this.searchRequestCourse = new SearchV4Request([
      this.competencyAreaNameKey,
      this.competencyThemeKey,
      this.competencySubThemeKey,
    ])
    this.searchRequestCourse.request.limit = this.initialPaginationSize
    this.searchRequestCourse.request.filters.courseCategory = []
    this.searchRequestCourse.request.filters.avgRating = {}
    this.initialPaginationPage = 1

    if (this.searchSortFilter === SortType.RecentlyAdded) {
      this.searchRequestCourse.request.sort_by.createdOn = 'desc'
    } else if (this.searchSortFilter === SortType.HighestRated) {
      this.searchRequestCourse.request.sort_by.avgRating = 'desc'
    } else if (this.searchSortFilter === SortType.AtoZ) {
      this.searchRequestCourse.request.sort_by.name = SortType.Ascending
    } else if (this.searchSortFilter === SortType.ZtoA) {
      this.searchRequestCourse.request.sort_by.name = SortType.Descending
    }

    Object.keys(selectedFilters).forEach((key) => {
      if (selectedFilters[key] && Array.isArray(selectedFilters[key])) {
        if (
          key === SearchCategory.Courses ||
          key === SearchCategory.Events ||
          key === SearchCategory.People ||
          key === SearchCategory.Communities ||
          key === SearchCategory.Resources ||
          key === SearchCategory.ExternalContents
        ) {
          // Category-type keys not applicable to volunteer search
        } else if (key === FacetType.AvgRating) {
          const ratings = selectedFilters[key]
            .map((val: string) => parseFloat(val.split(' ')[0]))
            .filter((num: any) => !isNaN(num))
          if (ratings.length > 0) {
            this.searchRequestCourse.request.filters.avgRating = {
              '>=': String(Math.min(...ratings)),
            }
          }
        } else if (key === FacetType.Language) {
          this.searchRequestCourse.request.filters.language = selectedFilters[key]
        } else if (key === FacetType.Organization) {
          this.searchRequestCourse.request.filters.organisation = selectedFilters[key]
        } else if (key === this.competencyAreaNameKey) {
          this.searchRequestCourse.request.filters[this.competencyAreaNameKey] = selectedFilters[key]
        } else if (key === this.competencyThemeKey) {
          this.searchRequestCourse.request.filters[this.competencyThemeKey] = selectedFilters[key]
        } else if (key === this.competencySubThemeKey) {
          this.searchRequestCourse.request.filters[this.competencySubThemeKey] = selectedFilters[key]
        } else if (key === FacetType.sectorNames_v1) {
          this.searchRequestCourse.request.filters[FacetType.sectorNames_v1] = selectedFilters[key]
        } else if (key === FacetType.subSectorNames_v1) {
          this.searchRequestCourse.request.filters[FacetType.subSectorNames_v1] = selectedFilters[key]
        } else if (key === FacetType.courseCategory) {
          if (selectedFilters[key].length > 0) {
            this.searchRequestCourse.request.filters.courseCategory = selectedFilters[key]
          }
        } else {
          this.searchRequestCourse.request.filters.courseCategory!.push(
            ...selectedFilters[key]
          )
        }
      }
    })

    this.deleteEmptyFilterKeys()
    await this.searchCourses()
    this.searchContentLoader = false
  }

  private deleteEmptyFilterKeys() {
    const courseFilters = this.searchRequestCourse?.request?.filters || {}
    const removeEmpty = (obj: any, keys: string[], isObjectCheck = false) => {
      keys.forEach((key) => {
        const value = obj[key]
        if (
          value &&
          ((isObjectCheck && Object.keys(value).length === 0) ||
            (!isObjectCheck && value.length === 0))
        ) {
          delete obj[key]
        }
      })
    }
    removeEmpty(courseFilters, [FacetType.Language, FacetType.Organization], false)
    removeEmpty(courseFilters, [FacetType.AvgRating], true)
    removeEmpty(
      courseFilters,
      [
        this.competencyAreaNameKey,
        this.competencyThemeKey,
        this.competencySubThemeKey,
        FacetType.sectorNames_v1,
        FacetType.subSectorNames_v1,
      ],
      false
    )
  }

  async onPageChange(event: PageChangeEmitter) {
    this.searchContentLoader = true
    this.scrollToTop()
    this.initialPaginationSize = event.limit
    this.initialPaginationPage = event.currentPage
    this.searchRequestCourse.request.limit = event.limit
    this.searchRequestCourse.request.offset = (event.currentPage - 1) * event.limit
    await this.searchCourses()
    this.searchContentLoader = false
  }

  async onChangeSortSearch(event: string) {
    this.searchContentLoader = true
    this.searchSortFilter = event
    this.searchRequestCourse.request.sort_by = {}
    this.searchRequestCourse.request.offset = 0
    this.searchRequestCourse.request.limit = this.initialPaginationSize
    this.initialPaginationPage = 1

    if (event === SortType.RecentlyAdded) {
      this.searchRequestCourse.request.sort_by.createdOn = 'desc'
    } else if (event === SortType.HighestRated) {
      this.searchRequestCourse.request.sort_by.avgRating = 'desc'
    } else if (event === SortType.AtoZ) {
      this.searchRequestCourse.request.sort_by.name = SortType.Ascending
    } else if (event === SortType.ZtoA) {
      this.searchRequestCourse.request.sort_by.name = SortType.Descending
    }
    // MostRelevent: empty sort_by — composite API uses its own relevance ranking

    await this.searchCourses()
    this.searchContentLoader = false
  }

  applyTelemetry(event: any, index: number) {
    if (event) {
      this.events.raiseInteractTelemetry(
        {
          type: 'click',
          subType: 'card-volunteerSearch',
          id: `volunteer-search-card-${index + 1}`,
          pageid: '/app/volunteer/search',
        },
        {
          id: event.identifier || '',
          type: event.contentType,
          rollup: {},
          ver: event.version ? `${event.version}` : '',
        },
        {}
      )
    }
  }

  updateNoResultMessage(searchTerm: string) {
    this.translate
      .get('learnsearch.noResultFound', { searchTerm })
      .subscribe((translatedText: string) => {
        this.noResultMessage = translatedText
      })
  }

  navigateTo(route: string) {
    this.router.navigate([route])
  }

  onConstructQueryParam(_category: string) {
    // Volunteer search only shows courses — no category switching needed
  }

  private scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  private checkCourseEnrollment() {
    if (this.configSvc.userProfile) {
      const userId = this.configSvc.userProfile.userId
      const request = {
        request: {
          retiredCoursesEnabled: true,
          limit: this.initialPaginationSize,
        },
      }
      forkJoin({
        inProgress: this.searchV3Service.enrollment(
          { request: { ...request.request, status: 'In-Progress' } },
          userId
        ),
        completed: this.searchV3Service.enrollment(
          { request: { ...request.request, status: 'Completed' } },
          userId
        ),
      }).subscribe((responses: any) => {
        const inProgressCourses = responses.inProgress?.result?.courses || []
        const completedCourses = responses.completed?.result?.courses || []
        this.enrollmentDetails = [...inProgressCourses, ...completedCourses]
      })
    }
  }
}
