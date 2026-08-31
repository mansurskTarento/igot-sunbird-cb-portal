import { of, throwError } from 'rxjs'

// `learn-search.component.ts` pulls in `GbSearchService`, which in turn pulls SEARCH_SORT_DROPDOWN
// in from the `@ws/author` barrel. That barrel drags in unrelated modules with broken non-relative
// imports that Jest cannot resolve. Mocking the barrel keeps this spec isolated from that breakage
// (see gb-search.service.spec.ts, which uses the same mock for the same reason).
jest.mock('@ws/author', () => ({
  SEARCH_SORT_DROPDOWN: [
    { name: 'Most Relevant', value: 'most_relevant' },
    { name: 'Recently Added (Newest)', value: 'recently_added_newest' },
    { name: 'Highest Rated', value: 'highest_rated' },
    { name: 'A-Z', value: 'a-z' },
    { name: 'Z-A', value: 'z-a' },
  ],
}))

// `@sunbird-cb/collection` is not published to node_modules in this workspace at all (only its
// sibling packages are). The component only uses `WidgetUserService` and `NsContent` as TS types,
// but ts-jest keeps the import statement at runtime, so it must be virtually mocked to resolve.
jest.mock('@sunbird-cb/collection', () => ({
  WidgetUserService: jest.fn(),
  NsContent: {},
}), { virtual: true })

import { LearnSearchComponent } from './learn-search.component'
import {
  SearchCategory,
  SortType,
  FacetType,
  SearchConstantLocalStorage,
} from '../../models/search-v3.model'

describe('LearnSearchComponent (No TestBed)', () => {
  let mockSearchV3Service: any
  let mockConfigSvc: any
  let mockEvents: any
  let mockActivated: any
  let mockValueSvc: any
  let mockTranslate: any
  let mockRouter: any
  let mockLangtranslations: any
  let mockUserService: any
  let mockNetworkV2Service: any
  let mockIndexedDbService: any
  let mockContentDictionarySvc: any

  const defaultCourseResult = { result: { content: [], count: 0, facets: [] } }
  const defaultEventResult = { result: { count: 0, facets: [], Event: [] } }
  const defaultPeopleResult = { result: { response: { content: [], count: 0, facets: [] } } }
  const defaultResourceResult = { result: { content: [], count: 0, facets: [] } }
  const defaultCommunityResult = { result: { search_results: { data: [], totalCount: 0, facets: {} } } }
  const defaultExternalResult = { data: [], totalCount: 0, facets: {} }

  const createComponent = (queryParams: any = {}): any => {
    mockActivated.queryParams = of(queryParams)
    return new LearnSearchComponent(
      mockSearchV3Service,
      mockConfigSvc,
      mockEvents,
      mockActivated,
      mockValueSvc,
      mockTranslate,
      mockRouter,
      mockLangtranslations,
      mockUserService,
      mockNetworkV2Service,
      mockIndexedDbService,
      mockContentDictionarySvc,
    )
  }

  beforeEach(() => {
    localStorage.clear()

    mockSearchV3Service = {
      searchCoursesv5: jest.fn().mockResolvedValue(defaultCourseResult),
      searchCoursesv4: jest.fn().mockResolvedValue(defaultEventResult),
      searchConnections: jest.fn().mockResolvedValue(defaultPeopleResult),
      searchResource: jest.fn().mockResolvedValue(defaultResourceResult),
      searchCommunity: jest.fn().mockReturnValue(Promise.resolve(defaultCommunityResult)),
      searchExternalContent: jest.fn().mockReturnValue(Promise.resolve(defaultExternalResult)),
      getApplicationsById: jest.fn().mockReturnValue({ toPromise: jest.fn().mockResolvedValue({ result: { response: [] } }) }),
      microCredentialsSearch: jest.fn().mockReturnValue(of({ result: { content: [] } })),
      enrollmentDictionary: jest.fn().mockReturnValue(of({})),
    }

    mockConfigSvc = {
      compentency: {
        '': {
          vKey: 'v4',
          vCompetencyArea: 'compArea',
          vCompetencyTheme: 'compTheme',
          vCompetencySubTheme: 'compSubTheme',
        },
      },
      userProfile: { departmentName: 'Dept', userId: 'user-1', userRootOrg: { id: 'org-1' } },
      unMappedUser: { profileDetails: { profileStatus: 'VERIFIED' } },
      instanceConfig: { logos: { defaultContent: 'thumb.png' } },
      globalConfig: { searchCategories: {} },
    }

    mockEvents = { raiseInteractTelemetry: jest.fn() }

    mockActivated = { queryParams: of({}), snapshot: { queryParams: {} } }

    mockValueSvc = { isLtMedium$: of(false) }

    mockTranslate = {
      setDefaultLang: jest.fn(),
      use: jest.fn(),
      get: jest.fn().mockReturnValue(of('No results found')),
    }

    mockRouter = { navigate: jest.fn() }

    mockLangtranslations = { translateLabel: jest.fn().mockReturnValue('translated-label') }

    mockUserService = { fetchCbpPlanList: jest.fn().mockReturnValue(of([])) }

    mockNetworkV2Service = { fetchAllConnectionRequests: jest.fn().mockReturnValue(of({ result: { data: [] } })) }

    mockIndexedDbService = {
      getEnrollmentDetails: jest.fn().mockResolvedValue(null),
      setEnrollmentDetails: jest.fn().mockResolvedValue(undefined),
    }

    mockContentDictionarySvc = { getContent: jest.fn((id: string) => of({ identifier: id, name: `content-${id}` })) }
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.useRealTimers()
  })

  // ---------------------------------------------------------------------
  // constructor
  // ---------------------------------------------------------------------
  describe('constructor', () => {
    it('creates the component with isExploreContentTab false when there is no tab query param', () => {
      const component = createComponent({})
      expect(component).toBeTruthy()
      expect(component.isExploreContentTab).toBe(false)
    })

    it('sets isExploreContentTab and RecentlyAdded sort when the tab query param is present', () => {
      const component = createComponent({ tab: 'explore' })
      expect(component.isExploreContentTab).toBe(true)
      expect(component.searchSortFilter).toBe(SortType.RecentlyAdded)
      expect(component.searchRequestCourse.request.sort_by.createdOn).toBe('desc')
    })

    it('sets the translate language from localStorage when websiteLanguage is present', () => {
      localStorage.setItem('websiteLanguage', 'fr')
      createComponent({})
      expect(mockTranslate.setDefaultLang).toHaveBeenCalledWith('en')
      expect(mockTranslate.use).toHaveBeenCalledWith('fr')
    })

    it('does not touch translate language when websiteLanguage is absent', () => {
      createComponent({})
      expect(mockTranslate.setDefaultLang).not.toHaveBeenCalled()
    })
  })

  // ---------------------------------------------------------------------
  // ngOnInit
  // ---------------------------------------------------------------------
  describe('ngOnInit', () => {
    it('sets currentUserDept, defaultThumbnail, statedata and triggers dependent calls', () => {
      const component = createComponent({})
      component.searchQuery = { query: 'abc', nlp: '', searchCategory: '' }
      component.ngOnInit()

      expect(component.currentUserDept).toBe('Dept')
      expect(component.defaultThumbnail).toBe('thumb.png')
      expect(component.statedata).toEqual({ param: 'abc', path: 'Search' })
      expect(mockUserService.fetchCbpPlanList).toHaveBeenCalled()
      expect(mockSearchV3Service.enrollmentDictionary).toHaveBeenCalled()
      expect(mockSearchV3Service.microCredentialsSearch).toHaveBeenCalled()
    })

    it('uses nlp value for statedata param when present', () => {
      const component = createComponent({})
      component.searchQuery = { query: 'abc', nlp: 'nlp-value', searchCategory: '' }
      component.ngOnInit()
      expect(component.statedata).toEqual({ param: 'nlp-value', path: 'Search' })
    })

    it('does not set currentUserDept when userProfile has no departmentName', () => {
      mockConfigSvc.userProfile = {}
      const component = createComponent({})
      component.searchQuery = { query: 'abc', nlp: '', searchCategory: '' }
      component.ngOnInit()
      expect(component.currentUserDept).toBe('')
    })

    it('leaves defaultThumbnail empty when instanceConfig is missing', () => {
      mockConfigSvc.instanceConfig = undefined
      const component = createComponent({})
      component.searchQuery = { query: 'abc', nlp: '', searchCategory: '' }
      component.ngOnInit()
      expect(component.defaultThumbnail).toBe('')
    })

    it('reflects isLtMedium$ into sideNavBarOpened and screenSizeIsLtMedium', () => {
      mockValueSvc.isLtMedium$ = of(true)
      const component = createComponent({})
      component.searchQuery = { query: 'abc', nlp: '', searchCategory: '' }
      component.ngOnInit()
      expect(component.screenSizeIsLtMedium).toBe(true)
      expect(component.sideNavBarOpened).toBe(false)
    })
  })

  // ---------------------------------------------------------------------
  // loadEnrollmentDetailsFromCache
  // ---------------------------------------------------------------------
  describe('loadEnrollmentDetailsFromCache', () => {
    it('sets enrollmentDetails when cached data exists', async () => {
      mockIndexedDbService.getEnrollmentDetails.mockResolvedValue({ a: 1 })
      const component = createComponent({})
      await component.loadEnrollmentDetailsFromCache()
      expect(component.enrollmentDetails).toEqual({ a: 1 })
    })

    it('logs an error and keeps enrollmentDetails when the cache read fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      mockIndexedDbService.getEnrollmentDetails.mockRejectedValue(new Error('fail'))
      const component = createComponent({})
      const before = component.enrollmentDetails
      await component.loadEnrollmentDetailsFromCache()
      expect(component.enrollmentDetails).toBe(before)
      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  // ---------------------------------------------------------------------
  // ngOnChanges
  // ---------------------------------------------------------------------
  describe('ngOnChanges', () => {
    it('sets veifiedKarmayogi true when profileStatus is VERIFIED', async () => {
      const component = createComponent({})
      component.searchQuery = { query: 'a', nlp: '', searchCategory: '' }
      await component.ngOnChanges({
        searchQuery: { currentValue: { query: 'a', searchCategory: '' }, previousValue: { query: 'a', searchCategory: '' } },
      } as any)
      expect(component.veifiedKarmayogi).toBe(true)
    })

    it('sets veifiedKarmayogi false when profileStatus is not VERIFIED', async () => {
      mockConfigSvc.unMappedUser.profileDetails.profileStatus = 'PENDING'
      const component = createComponent({})
      component.searchQuery = { query: 'a', nlp: '', searchCategory: '' }
      await component.ngOnChanges({
        searchQuery: { currentValue: { query: 'a', searchCategory: '' }, previousValue: { query: 'a', searchCategory: '' } },
      } as any)
      expect(component.veifiedKarmayogi).toBe(false)
    })

    it('handles the paramFilters change branch', async () => {
      const component = createComponent({})
      component.searchQuery = { query: 'a', nlp: '', searchCategory: '' }
      await component.ngOnChanges({
        paramFilters: { currentValue: [{ subType: ['cat1'] }] },
      } as any)

      expect(component.seeAllResult).toBe(SearchCategory.Courses)
      expect(mockSearchV3Service.searchCoursesv5).toHaveBeenCalled()
      expect(component.sideNavBarOpened).toBe(false)
      expect(component.searchContentLoader).toBe(false)
      expect(component.filtersChipFromLearn).toEqual(['cat1'])
    })

    it('does nothing when the searchQuery query and category are unchanged', async () => {
      const component = createComponent({})
      component.searchQuery = { query: 'same', nlp: '', searchCategory: '' }
      await component.ngOnChanges({
        searchQuery: { currentValue: { query: 'same', searchCategory: '' }, previousValue: { query: 'same', searchCategory: '' } },
      } as any)
      expect(mockSearchV3Service.searchCoursesv5).not.toHaveBeenCalled()
    })

    it('calls seeAllResults when searchCategory is provided', async () => {
      const component = createComponent({})
      component.searchQuery = { query: 'new', nlp: '', searchCategory: SearchCategory.Courses }
      await component.ngOnChanges({
        searchQuery: {
          currentValue: { query: 'new', searchCategory: SearchCategory.Courses },
          previousValue: { query: 'old', searchCategory: '' },
        },
      } as any)
      expect(mockSearchV3Service.searchCoursesv5).toHaveBeenCalled()
      expect(component.seeAllResult).toBe(SearchCategory.Courses)
    })

    it('calls each enabled category search when no searchCategory is provided', async () => {
      const component = createComponent({})
      component.searchQuery = { query: 'new', nlp: '', searchCategory: '' }
      await component.ngOnChanges({
        searchQuery: {
          currentValue: { query: 'new', searchCategory: '' },
          previousValue: { query: 'old', searchCategory: '' },
        },
      } as any)
      expect(mockSearchV3Service.searchCoursesv5).toHaveBeenCalled()
      expect(mockSearchV3Service.searchCoursesv4).toHaveBeenCalled()
      expect(mockSearchV3Service.searchConnections).toHaveBeenCalled()
      expect(mockSearchV3Service.searchCommunity).toHaveBeenCalled()
      expect(mockSearchV3Service.searchResource).toHaveBeenCalled()
      expect(mockSearchV3Service.searchExternalContent).toHaveBeenCalled()
      expect(component.searchContentLoader).toBe(false)
    })

    it('skips disabled categories', async () => {
      mockConfigSvc.globalConfig.searchCategories = { [SearchCategory.Courses]: false }
      const component = createComponent({})
      component.searchQuery = { query: 'new', nlp: '', searchCategory: '' }
      await component.ngOnChanges({
        searchQuery: {
          currentValue: { query: 'new', searchCategory: '' },
          previousValue: { query: 'old', searchCategory: '' },
        },
      } as any)
      expect(mockSearchV3Service.searchCoursesv5).not.toHaveBeenCalled()
    })

    it('opens the filters panel when filtersPanel change is "show"', async () => {
      const component = createComponent({})
      component.searchQuery = { query: 'new', nlp: '', searchCategory: '' }
      await component.ngOnChanges({
        searchQuery: {
          currentValue: { query: 'new', searchCategory: '' },
          previousValue: { query: 'old', searchCategory: '' },
        },
        filtersPanel: { currentValue: 'show' },
      } as any)
      expect(component.sideNavBarOpened).toBe(true)
      expect(component.filtersChipFromLearn).toEqual([])
    })

    it('does not reset search params when isExploreContentTab is true', async () => {
      const component = createComponent({ tab: 'explore' })
      component.searchQuery = { query: 'new', nlp: '', searchCategory: '' }
      component.courseSearchResults = [{ a: 1 }]
      await component.ngOnChanges({
        searchQuery: {
          currentValue: { query: 'new', searchCategory: '' },
          previousValue: { query: 'old', searchCategory: '' },
        },
      } as any)
      // resetAllSearchParams would have cleared combinedFacets to []; explore tab skips that reset
      expect(component.isExploreContentTab).toBe(true)
    })
  })

  // ---------------------------------------------------------------------
  // getName
  // ---------------------------------------------------------------------
  describe('getName', () => {
    it('returns firstName when present', () => {
      const component = createComponent({})
      expect(component.getName({ firstName: 'John' })).toBe('John')
    })

    it('falls back to firstname when firstName is absent', () => {
      const component = createComponent({})
      expect(component.getName({ firstname: 'jane' })).toBe('jane')
    })
  })

  // ---------------------------------------------------------------------
  // applyTelemetry / raiseTelemetry
  // ---------------------------------------------------------------------
  describe('applyTelemetry / raiseTelemetry', () => {
    it('raises interact telemetry when content is present', () => {
      const component = createComponent({})
      component.applyTelemetry({ identifier: 'c1', contentType: 'Course', version: 2 }, 0)
      expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalled()
    })

    it('does nothing when content is falsy', () => {
      const component = createComponent({})
      component.raiseTelemetry(null, 0)
      expect(mockEvents.raiseInteractTelemetry).not.toHaveBeenCalled()
    })
  })

  // ---------------------------------------------------------------------
  // ngOnDestroy
  // ---------------------------------------------------------------------
  describe('ngOnDestroy', () => {
    it('unsubscribes the side nav subscription and clears the sort type', () => {
      const component = createComponent({})
      component.searchQuery = { query: 'a', nlp: '', searchCategory: '' }
      component.ngOnInit()
      const unsubscribeSpy = jest.fn()
      component.defaultSideNavBarOpenedSubscription.unsubscribe = unsubscribeSpy
      localStorage.setItem(SearchConstantLocalStorage.SortType, 'x')
      component.ngOnDestroy()
      expect(unsubscribeSpy).toHaveBeenCalled()
      expect(localStorage.getItem(SearchConstantLocalStorage.SortType)).toBeNull()
    })

    it('does not throw when there is no side nav subscription', () => {
      const component = createComponent({})
      expect(() => component.ngOnDestroy()).not.toThrow()
    })
  })

  // ---------------------------------------------------------------------
  // translateLabels / updateNoResultMessage / navigateTo
  // ---------------------------------------------------------------------
  describe('translateLabels', () => {
    it('delegates to langtranslations.translateLabel', () => {
      const component = createComponent({})
      const result = component.translateLabels('label1', 'type1')
      expect(mockLangtranslations.translateLabel).toHaveBeenCalledWith('label1', 'type1', '')
      expect(result).toBe('translated-label')
    })
  })

  describe('updateNoResultMessage', () => {
    it('sets noResultMessage from the translated text', () => {
      const component = createComponent({})
      component.updateNoResultMessage('term')
      expect(component.noResultMessage).toBe('No results found')
    })
  })

  describe('navigateTo', () => {
    it('navigates to the given route', () => {
      const component = createComponent({})
      component.navigateTo('/app/home')
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home'])
    })
  })

  describe('connectionUpdatePeopleCard', () => {
    it('fetches connection requests when event is connection-updated', () => {
      const component = createComponent({})
      component.connectionUpdatePeopleCard('connection-updated')
      expect(mockNetworkV2Service.fetchAllConnectionRequests).toHaveBeenCalled()
    })

    it('does nothing for other events', () => {
      const component = createComponent({})
      component.connectionUpdatePeopleCard('other')
      expect(mockNetworkV2Service.fetchAllConnectionRequests).not.toHaveBeenCalled()
    })
  })

  // ---------------------------------------------------------------------
  // searchCourses - priority coverage
  // ---------------------------------------------------------------------
  describe('searchCourses', () => {
    it('replaces an empty courseCategory filter with the exclusion filter', async () => {
      const component = createComponent({})
      component.searchRequestCourse.request.filters.courseCategory = []
      await component.searchCourses()
      expect(component.searchRequestCourse.request.filters.courseCategory).toEqual({
        '!=': ['pre enrolment assessment'],
      })
    })

    it('dedupes facets before searching', async () => {
      const component = createComponent({})
      component.searchRequestCourse.request.facets = ['a', 'a', 'b']
      await component.searchCourses()
      expect(component.searchRequestCourse.request.facets).toEqual(['a', 'b'])
    })

    it('enriches content and sets courseSearchResults to the enriched array', async () => {
      mockSearchV3Service.searchCoursesv5.mockResolvedValue({
        result: { content: [{ identifier: 'c1' }, { identifier: 'c2' }], count: 2, facets: ['f1'] },
      })
      mockContentDictionarySvc.getContent = jest.fn((id: string) =>
        of({ identifier: id, name: `Course ${id}` }),
      )
      const component = createComponent({})
      await component.searchCourses()

      expect(mockContentDictionarySvc.getContent).toHaveBeenCalledWith('c1')
      expect(mockContentDictionarySvc.getContent).toHaveBeenCalledWith('c2')
      expect(component.courseSearchResults).toEqual([
        { identifier: 'c1', name: 'Course c1' },
        { identifier: 'c2', name: 'Course c2' },
      ])
      expect(component.courseSearchTotalCount).toBe(2)
      expect(component.coursesFacets).toEqual(['f1'])
      expect(component.combinedFacets).toEqual([['f1']])
    })

    it('filters out falsy identifiers before requesting content', async () => {
      mockSearchV3Service.searchCoursesv5.mockResolvedValue({
        result: { content: [{ identifier: 'c1' }, { identifier: null }], count: 1, facets: [] },
      })
      const component = createComponent({})
      await component.searchCourses()
      expect(mockContentDictionarySvc.getContent).toHaveBeenCalledTimes(1)
      expect(mockContentDictionarySvc.getContent).toHaveBeenCalledWith('c1')
    })

    it('filters out falsy enriched content', async () => {
      mockSearchV3Service.searchCoursesv5.mockResolvedValue({
        result: { content: [{ identifier: 'c1' }, { identifier: 'c2' }], count: 2, facets: [] },
      })
      mockContentDictionarySvc.getContent = jest.fn((id: string) =>
        id === 'c1' ? of(null) : of({ identifier: id }),
      )
      const component = createComponent({})
      await component.searchCourses()
      expect(component.courseSearchResults).toEqual([{ identifier: 'c2' }])
    })

    it('extracts formId from completionSurveyLink and applies survey completion status', async () => {
      mockSearchV3Service.searchCoursesv5.mockResolvedValue({
        result: { content: [{ identifier: 'c1' }], count: 1, facets: [] },
      })
      mockContentDictionarySvc.getContent = jest.fn(() =>
        of({ identifier: 'c1', completionSurveyLink: 'https://x/surveys/abc123' }),
      )
      mockSearchV3Service.getApplicationsById.mockReturnValue({
        toPromise: jest.fn().mockResolvedValue({ result: { response: [{ contextId: 'c1', submitted: true }] } }),
      })
      const component = createComponent({})
      await component.searchCourses()

      expect(mockSearchV3Service.getApplicationsById).toHaveBeenCalledWith({
        userId: 'user-1',
        formContextList: [{ formId: 'abc123', contextId: 'c1' }],
      })
      expect(component.courseSearchResults[0].surveyCompletionStatus).toBe(true)
    })

    it('does not call getApplicationsById when no content has a completionSurveyLink', async () => {
      mockSearchV3Service.searchCoursesv5.mockResolvedValue({
        result: { content: [{ identifier: 'c1' }], count: 1, facets: [] },
      })
      mockContentDictionarySvc.getContent = jest.fn(() => of({ identifier: 'c1' }))
      const component = createComponent({})
      await component.searchCourses()
      expect(mockSearchV3Service.getApplicationsById).not.toHaveBeenCalled()
    })

    it('resets results when result.result is missing entirely', async () => {
      mockSearchV3Service.searchCoursesv5.mockResolvedValue({})
      const component = createComponent({})
      await component.searchCourses()
      expect(component.courseSearchResults).toEqual([])
      expect(component.courseSearchTotalCount).toBe(0)
      expect(component.coursesFacets).toEqual([])
    })

    it('keeps facets from result.result even without content', async () => {
      mockSearchV3Service.searchCoursesv5.mockResolvedValue({ result: { facets: ['x'] } })
      const component = createComponent({})
      await component.searchCourses()
      expect(component.courseSearchResults).toEqual([])
      expect(component.coursesFacets).toEqual(['x'])
    })

    it('does not call getContent when content is an empty array', async () => {
      mockSearchV3Service.searchCoursesv5.mockResolvedValue({ result: { content: [], count: 0, facets: [] } })
      const component = createComponent({})
      await component.searchCourses()
      expect(mockContentDictionarySvc.getContent).not.toHaveBeenCalled()
      expect(component.courseSearchResults).toEqual([])
    })
  })

  // ---------------------------------------------------------------------
  // searchEvents
  // ---------------------------------------------------------------------
  describe('searchEvents', () => {
    it('sets events results when Event is present', async () => {
      mockSearchV3Service.searchCoursesv4.mockResolvedValue({ result: { Event: [{ identifier: 'e1' }], count: 1, facets: ['f'] } })
      const component = createComponent({})
      await component.searchEvents()
      expect(component.eventsSearchResults).toEqual([{ identifier: 'e1' }])
      expect(component.eventSearchTotalCount).toBe(1)
      expect(component.eventsFacets).toEqual(['f'])
    })

    it('resets events results when Event is absent', async () => {
      mockSearchV3Service.searchCoursesv4.mockResolvedValue({ result: {} })
      const component = createComponent({})
      await component.searchEvents()
      expect(component.eventsSearchResults).toEqual([])
      expect(component.eventSearchTotalCount).toBe(0)
    })
  })

  // ---------------------------------------------------------------------
  // searchPeople
  // ---------------------------------------------------------------------
  describe('searchPeople', () => {
    it('sets people results when content is present', async () => {
      mockSearchV3Service.searchConnections.mockResolvedValue({
        result: { response: { content: [{ id: 'p1' }], count: 1, facets: ['pf'] } },
      })
      const component = createComponent({})
      await component.searchPeople()
      expect(component.peoplesSearchResults).toEqual([{ id: 'p1' }])
      expect(component.peopleSearchTotalCount).toBe(1)
      expect(component.searchPeopleLoader).toBe(false)
    })

    it('resets people results when content is absent', async () => {
      mockSearchV3Service.searchConnections.mockResolvedValue({ result: {} })
      const component = createComponent({})
      await component.searchPeople()
      expect(component.peoplesSearchResults).toEqual([])
      expect(component.peopleSearchTotalCount).toBe(0)
    })
  })

  // ---------------------------------------------------------------------
  // searchResources
  // ---------------------------------------------------------------------
  describe('searchResources', () => {
    it('sets resources results when content is present', async () => {
      mockSearchV3Service.searchResource.mockResolvedValue({
        result: { content: [{ identifier: 'r1' }], count: 1, facets: ['rf'] },
      })
      const component = createComponent({})
      await component.searchResources()
      expect(component.resourcesSearchResults).toEqual([{ identifier: 'r1' }])
      expect(component.resourcesSearchTotalCount).toBe(1)
    })

    it('resets resources results when content is absent', async () => {
      mockSearchV3Service.searchResource.mockResolvedValue({ result: {} })
      const component = createComponent({})
      await component.searchResources()
      expect(component.resourcesSearchResults).toEqual([])
      expect(component.resourcesSearchTotalCount).toBe(0)
    })
  })

  // ---------------------------------------------------------------------
  // searchcommunities
  // ---------------------------------------------------------------------
  describe('searchcommunities', () => {
    it('sets communities results when data is present', async () => {
      mockSearchV3Service.searchCommunity.mockReturnValue(Promise.resolve({
        result: { search_results: { data: [{ id: 'c1' }], totalCount: 1, facets: { orgName: [{ value: 'Org', count: 1 }] } } },
      }))
      const component = createComponent({})
      await component.searchcommunities()
      expect(component.communitiesSearchResults).toEqual([{ id: 'c1' }])
      expect(component.communitiesSearchTotalCount).toBe(1)
      expect(component.communitiesFacets).toEqual([{ name: 'orgName', values: [{ name: 'Org', count: 1 }] }])
    })

    it('resets communities results when data is empty', async () => {
      mockSearchV3Service.searchCommunity.mockReturnValue(Promise.resolve(defaultCommunityResult))
      const component = createComponent({})
      await component.searchcommunities()
      expect(component.communitiesSearchResults).toEqual([])
      expect(component.communitiesSearchTotalCount).toBe(0)
    })

    it('falls back to an empty result when the search call rejects', async () => {
      mockSearchV3Service.searchCommunity.mockReturnValue(Promise.reject(new Error('fail')))
      const component = createComponent({})
      await component.searchcommunities()
      expect(component.communitiesSearchResults).toEqual([])
      expect(component.communitiesSearchTotalCount).toBe(0)
    })
  })

  // ---------------------------------------------------------------------
  // searchExternalContents
  // ---------------------------------------------------------------------
  describe('searchExternalContents', () => {
    it('sets external results when data is present', async () => {
      mockSearchV3Service.searchExternalContent.mockReturnValue(Promise.resolve({
        data: [{ id: 'ex1' }], totalCount: 1, facets: { topic: [{ value: 'T', count: 1 }] },
      }))
      const component = createComponent({})
      await component.searchExternalContents()
      expect(component.externalSearchResults).toEqual([{ id: 'ex1' }])
      expect(component.externalSearchTotalCount).toBe(1)
    })

    it('resets external results when data is empty', async () => {
      mockSearchV3Service.searchExternalContent.mockReturnValue(Promise.resolve(defaultExternalResult))
      const component = createComponent({})
      await component.searchExternalContents()
      expect(component.externalSearchResults).toEqual([])
      expect(component.externalSearchTotalCount).toBe(0)
    })

    it('falls back to an empty result when the search call rejects', async () => {
      mockSearchV3Service.searchExternalContent.mockReturnValue(Promise.reject(new Error('fail')))
      const component = createComponent({})
      await component.searchExternalContents()
      expect(component.externalSearchResults).toEqual([])
      expect(component.externalSearchTotalCount).toBe(0)
    })
  })

  // ---------------------------------------------------------------------
  // getCompetencyHierichy
  // ---------------------------------------------------------------------
  describe('getCompetencyHierichy', () => {
    const facetResult = {
      result: {
        count: 5,
        facets: [
          { name: 'v4.compTheme', values: [{ name: 'Theme1', count: 1 }] },
          { name: 'v4.compSubTheme', values: [{ value: 'SubTheme1', count: 2 }] },
        ],
      },
    }

    it('builds competencyFactet for Courses without filterFlag', async () => {
      mockSearchV3Service.searchCoursesv4.mockResolvedValue(facetResult)
      const component = createComponent({})
      component.seeAllResult = SearchCategory.Courses
      await component.getCompetencyHierichy()
      expect(component.competencyFactet.length).toBeGreaterThan(0)
    })

    it('builds competencyFactet for Courses with filterFlag', async () => {
      mockSearchV3Service.searchCoursesv4.mockResolvedValue(facetResult)
      const component = createComponent({})
      component.seeAllResult = SearchCategory.Courses
      await component.getCompetencyHierichy(true)
      expect(component.competencyFactet.length).toBeGreaterThan(0)
    })

    it('builds competencyFactet for Events', async () => {
      mockSearchV3Service.searchCoursesv4.mockResolvedValue(facetResult)
      const component = createComponent({})
      component.seeAllResult = SearchCategory.Events
      await component.getCompetencyHierichy()
      expect(component.competencyFactet.length).toBeGreaterThan(0)
    })

    it('builds competencyFactet for CaseStudy', async () => {
      mockSearchV3Service.searchCoursesv4.mockResolvedValue(facetResult)
      const component = createComponent({})
      component.seeAllResult = SearchCategory.CaseStudy
      await component.getCompetencyHierichy()
      expect(component.competencyFactet.length).toBeGreaterThan(0)
    })

    it('builds competencyFactet for Communities', async () => {
      mockSearchV3Service.searchCommunity.mockReturnValue(Promise.resolve({
        result: {
          search_results: {
            totalCount: 3,
            facets: {
              'v4.compTheme': [{ value: 'a', count: 1 }],
              'v4.compSubTheme': [],
            },
          },
        },
      }))
      const component = createComponent({})
      component.seeAllResult = SearchCategory.Communities
      await component.getCompetencyHierichy()
      expect(component.competencyFactet.length).toBeGreaterThan(0)
    })
  })

  // ---------------------------------------------------------------------
  // processCommunityFacets
  // ---------------------------------------------------------------------
  describe('processCommunityFacets', () => {
    it('maps facet records into name/value arrays', () => {
      const component = createComponent({})
      const result = component.processCommunityFacets({ orgName: [{ value: 'Org1', count: 2 }] })
      expect(result).toEqual([{ name: 'orgName', values: [{ name: 'Org1', count: 2 }] }])
    })
  })

  // ---------------------------------------------------------------------
  // isCategoryEnabled
  // ---------------------------------------------------------------------
  describe('isCategoryEnabled', () => {
    it('returns true when there is no searchCategories config', () => {
      mockConfigSvc.globalConfig = undefined
      const component = createComponent({})
      expect(component.isCategoryEnabled(SearchCategory.Courses)).toBe(true)
    })

    it('returns false when a category is explicitly disabled', () => {
      mockConfigSvc.globalConfig.searchCategories = { [SearchCategory.Courses]: false }
      const component = createComponent({})
      expect(component.isCategoryEnabled(SearchCategory.Courses)).toBe(false)
    })

    it('returns true when the category key is absent from the config', () => {
      mockConfigSvc.globalConfig.searchCategories = {}
      const component = createComponent({})
      expect(component.isCategoryEnabled(SearchCategory.Events)).toBe(true)
    })
  })

  // ---------------------------------------------------------------------
  // applyFilterFromLearn
  // ---------------------------------------------------------------------
  describe('applyFilterFromLearn', () => {
    it('logs the selected filters without throwing', async () => {
      const component = createComponent({})
      const logSpy = jest.spyOn(console, 'log').mockImplementation()
      await component.applyFilterFromLearn({ a: [1] })
      expect(logSpy).toHaveBeenCalled()
    })
  })

  // ---------------------------------------------------------------------
  // deleteFilterKeys
  // ---------------------------------------------------------------------
  describe('deleteFilterKeys', () => {
    it('removes empty filter keys from all search requests', () => {
      const component = createComponent({})
      component.searchRequestCourse.request.filters.language = []
      component.searchRequestCourse.request.filters.avgRating = {}
      component.searchRequestCommunities.filterCriteriaMap.orgName = []
      component.searchRequestPeoples.filters.rootOrgName = []
      component.searchRequestEvents.request.filters.sourceName = []
      component.searchRequestResources.request.filters[FacetType.sectorNameResource] = []
      component.searchRequestExternal.filterCriteriaMap[FacetType.topic] = []

      component.deleteFilterKeys()

      expect(component.searchRequestCourse.request.filters.language).toBeUndefined()
      expect(component.searchRequestCourse.request.filters.avgRating).toBeUndefined()
      expect(component.searchRequestCommunities.filterCriteriaMap.orgName).toBeUndefined()
      expect(component.searchRequestPeoples.filters.rootOrgName).toBeUndefined()
      expect(component.searchRequestEvents.request.filters.sourceName).toBeUndefined()
      expect(component.searchRequestResources.request.filters[FacetType.sectorNameResource]).toBeUndefined()
      expect(component.searchRequestExternal.filterCriteriaMap[FacetType.topic]).toBeUndefined()
    })
  })

  // ---------------------------------------------------------------------
  // seeAllResults
  // ---------------------------------------------------------------------
  describe('seeAllResults', () => {
    it('returns early when the category is disabled', async () => {
      mockConfigSvc.globalConfig.searchCategories = { [SearchCategory.Courses]: false }
      const component = createComponent({})
      await component.seeAllResults(SearchCategory.Courses)
      expect(component.searchContentLoader).toBe(false)
      expect(mockSearchV3Service.searchCoursesv5).not.toHaveBeenCalled()
    })

    it('handles the Courses category', async () => {
      const component = createComponent({})
      await component.seeAllResults(SearchCategory.Courses)
      expect(mockSearchV3Service.searchCoursesv5).toHaveBeenCalled()
      expect(component.seeAllResult).toBe(SearchCategory.Courses)
    })

    it('handles the CaseStudy category', async () => {
      const component = createComponent({})
      await component.seeAllResults(SearchCategory.CaseStudy)
      expect(mockSearchV3Service.searchCoursesv5).toHaveBeenCalled()
      expect(component.searchRequestCourse.request.filters.courseCategory).toEqual(['Case Study'])
    })

    it('handles the Events category', async () => {
      const component = createComponent({})
      await component.seeAllResults(SearchCategory.Events)
      expect(mockSearchV3Service.searchCoursesv4).toHaveBeenCalled()
      expect(component.typesOfEventsFilters).toBeDefined()
    })

    it('handles the People category', async () => {
      const component = createComponent({})
      await component.seeAllResults(SearchCategory.People)
      expect(mockSearchV3Service.searchConnections).toHaveBeenCalled()
    })

    it('handles the Communities category', async () => {
      const component = createComponent({})
      await component.seeAllResults(SearchCategory.Communities)
      expect(mockSearchV3Service.searchCommunity).toHaveBeenCalled()
    })

    it('handles the Resources category', async () => {
      const component = createComponent({})
      await component.seeAllResults(SearchCategory.Resources)
      expect(mockSearchV3Service.searchResource).toHaveBeenCalled()
    })

    it('handles the ExternalContents category', async () => {
      const component = createComponent({})
      await component.seeAllResults(SearchCategory.ExternalContents)
      expect(mockSearchV3Service.searchExternalContent).toHaveBeenCalled()
    })
  })

  // ---------------------------------------------------------------------
  // resetAllSearchParams
  // ---------------------------------------------------------------------
  describe('resetAllSearchParams', () => {
    it('resets all search state', () => {
      const component = createComponent({})
      component.courseSearchResults = [{ a: 1 }]
      component.courseSearchTotalCount = 5
      component.seeAllResult = SearchCategory.Courses
      component.resetAllSearchParams()
      expect(component.courseSearchResults).toEqual([])
      expect(component.courseSearchTotalCount).toBe(0)
      expect(component.seeAllResult).toBe('')
      expect(component.combinedFacets).toEqual([])
    })
  })

  // ---------------------------------------------------------------------
  // onPageChange
  // ---------------------------------------------------------------------
  describe('onPageChange', () => {
    const event = { currentPage: 2, previousPage: 1, limit: 10 }

    it('paginates Courses', async () => {
      const component = createComponent({})
      const scrollSpy = jest.spyOn(window, 'scrollTo').mockImplementation()
      component.seeAllResult = SearchCategory.Courses
      await component.onPageChange(event)
      expect(mockSearchV3Service.searchCoursesv5).toHaveBeenCalled()
      expect(scrollSpy).toHaveBeenCalled()
    })

    it('paginates Events', async () => {
      const component = createComponent({})
      jest.spyOn(window, 'scrollTo').mockImplementation()
      component.seeAllResult = SearchCategory.Events
      await component.onPageChange(event)
      expect(mockSearchV3Service.searchCoursesv4).toHaveBeenCalled()
    })

    it('paginates People', async () => {
      const component = createComponent({})
      jest.spyOn(window, 'scrollTo').mockImplementation()
      component.seeAllResult = SearchCategory.People
      await component.onPageChange(event)
      expect(mockSearchV3Service.searchConnections).toHaveBeenCalled()
    })

    it('paginates Resources', async () => {
      const component = createComponent({})
      jest.spyOn(window, 'scrollTo').mockImplementation()
      component.seeAllResult = SearchCategory.Resources
      await component.onPageChange(event)
      expect(mockSearchV3Service.searchResource).toHaveBeenCalled()
    })

    it('paginates ExternalContents', async () => {
      const component = createComponent({})
      jest.spyOn(window, 'scrollTo').mockImplementation()
      component.seeAllResult = SearchCategory.ExternalContents
      await component.onPageChange(event)
      expect(mockSearchV3Service.searchExternalContent).toHaveBeenCalled()
    })

    it('paginates Communities', async () => {
      const component = createComponent({})
      jest.spyOn(window, 'scrollTo').mockImplementation()
      component.seeAllResult = SearchCategory.Communities
      await component.onPageChange(event)
      expect(mockSearchV3Service.searchCommunity).toHaveBeenCalled()
    })
  })

  // ---------------------------------------------------------------------
  // onChangeSortSearch
  // ---------------------------------------------------------------------
  describe('onChangeSortSearch', () => {
    it('handles MostRelevent with no active category', async () => {
      jest.useFakeTimers()
      const component = createComponent({})
      const promise = component.onChangeSortSearch(SortType.MostRelevent)
      jest.runAllTimers()
      await promise
      expect(mockSearchV3Service.searchCoursesv5).toHaveBeenCalled()
      expect(localStorage.getItem(SearchConstantLocalStorage.SortType)).toBe(SortType.MostRelevent)
    })

    it('handles RecentlyAdded for Courses', async () => {
      jest.useFakeTimers()
      const component = createComponent({})
      component.seeAllResult = SearchCategory.Courses
      const promise = component.onChangeSortSearch(SortType.RecentlyAdded)
      jest.runAllTimers()
      await promise
      expect(component.searchRequestCourse.request.sort_by.createdOn).toBe('desc')
    })

    it('handles HighestRated for Events', async () => {
      jest.useFakeTimers()
      const component = createComponent({})
      component.seeAllResult = SearchCategory.Events
      const promise = component.onChangeSortSearch(SortType.HighestRated)
      jest.runAllTimers()
      await promise
      expect(mockSearchV3Service.searchCoursesv4).toHaveBeenCalled()
    })

    it('handles Ascending for People', async () => {
      jest.useFakeTimers()
      const component = createComponent({})
      const promise = component.onChangeSortSearch(SortType.Ascending)
      jest.runAllTimers()
      await promise
      expect(component.searchRequestPeoples.sort_by.firstName).toBe(SortType.Ascending)
    })

    it('handles Descending for People', async () => {
      jest.useFakeTimers()
      const component = createComponent({})
      const promise = component.onChangeSortSearch(SortType.Descending)
      jest.runAllTimers()
      await promise
      expect(component.searchRequestPeoples.sort_by.firstName).toBe(SortType.Descending)
    })

    it('handles AtoZ for Resources', async () => {
      jest.useFakeTimers()
      const component = createComponent({})
      component.seeAllResult = SearchCategory.Resources
      const promise = component.onChangeSortSearch(SortType.AtoZ)
      jest.runAllTimers()
      await promise
      expect(mockSearchV3Service.searchResource).toHaveBeenCalled()
    })

    it('handles ZtoA for ExternalContents', async () => {
      jest.useFakeTimers()
      const component = createComponent({})
      component.seeAllResult = SearchCategory.ExternalContents
      const promise = component.onChangeSortSearch(SortType.ZtoA)
      jest.runAllTimers()
      await promise
      expect(mockSearchV3Service.searchExternalContent).toHaveBeenCalled()
    })
  })

  // ---------------------------------------------------------------------
  // getFetchIgotSpecializationPrograms
  // ---------------------------------------------------------------------
  describe('getFetchIgotSpecializationPrograms', () => {
    it('sets igotSpecializationPrograms on success', () => {
      mockSearchV3Service.microCredentialsSearch.mockReturnValue(of({ result: { content: [{ id: 1 }] } }))
      const component = createComponent({})
      component.getFetchIgotSpecializationPrograms()
      expect(component.igotSpecializationPrograms).toEqual([{ id: 1 }])
    })

    it('logs an error when the call fails', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      mockSearchV3Service.microCredentialsSearch.mockReturnValue(throwError(() => new Error('fail')))
      const component = createComponent({})
      component.getFetchIgotSpecializationPrograms()
      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  // ---------------------------------------------------------------------
  // checkCourseEnrollmentAndCbpPlan
  // ---------------------------------------------------------------------
  describe('checkCourseEnrollmentAndCbpPlan', () => {
    it('stores enrollmentDetails in IndexedDB when a response is present', () => {
      mockSearchV3Service.enrollmentDictionary.mockReturnValue(of({ result: { response: { a: 1 } } }))
      const component = createComponent({})
      component.checkCourseEnrollmentAndCbpPlan()
      expect(mockIndexedDbService.setEnrollmentDetails).toHaveBeenCalledWith({ a: 1 })
    })

    it('does not touch IndexedDB when there is no response', () => {
      mockSearchV3Service.enrollmentDictionary.mockReturnValue(of({}))
      const component = createComponent({})
      component.checkCourseEnrollmentAndCbpPlan()
      expect(mockIndexedDbService.setEnrollmentDetails).not.toHaveBeenCalled()
    })

    it('logs an error when storing to IndexedDB fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      mockSearchV3Service.enrollmentDictionary.mockReturnValue(of({ result: { response: { a: 1 } } }))
      mockIndexedDbService.setEnrollmentDetails.mockRejectedValue(new Error('fail'))
      const component = createComponent({})
      component.checkCourseEnrollmentAndCbpPlan()
      await Promise.resolve()
      await Promise.resolve()
      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  // ---------------------------------------------------------------------
  // getAllConnectionRequests
  // ---------------------------------------------------------------------
  describe('getAllConnectionRequests', () => {
    it('marks matching people as requestSent', () => {
      mockNetworkV2Service.fetchAllConnectionRequests.mockReturnValue(of({ result: { data: [{ id: 'u1' }] } }))
      const component = createComponent({})
      component.peoplesSearchResults = [{ userId: 'u1' }, { userId: 'u2' }]
      component.getAllConnectionRequests()
      expect(component.peoplesSearchResults[0].requestSent).toBe(true)
      expect(component.peoplesSearchResults[1].requestSent).toBeUndefined()
    })

    it('does nothing when there are no people results', () => {
      mockNetworkV2Service.fetchAllConnectionRequests.mockReturnValue(of({ result: { data: [] } }))
      const component = createComponent({})
      component.peoplesSearchResults = []
      expect(() => component.getAllConnectionRequests()).not.toThrow()
    })
  })

  // ---------------------------------------------------------------------
  // scrollToTop
  // ---------------------------------------------------------------------
  describe('scrollToTop', () => {
    it('scrolls the window to the top', () => {
      const scrollSpy = jest.spyOn(window, 'scrollTo').mockImplementation()
      const component = createComponent({})
      component.scrollToTop()
      expect(scrollSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    })
  })

  // ---------------------------------------------------------------------
  // constructQueryParam
  // ---------------------------------------------------------------------
  describe('constructQueryParam', () => {
    it('emits query params including a trimmed q value', () => {
      mockActivated.snapshot = { queryParams: { q: '  hello  ', search: 'x' } }
      const component = createComponent({})
      const emitSpy = jest.spyOn(component.queryParamChange, 'emit')
      component.constructQueryParam('courses')
      expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ q: 'hello', category: 'courses' }))
    })

    it('omits q when it is absent from the snapshot', () => {
      mockActivated.snapshot = { queryParams: {} }
      const component = createComponent({})
      const emitSpy = jest.spyOn(component.queryParamChange, 'emit')
      component.constructQueryParam('events')
      expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ category: 'events', search: null }))
    })
  })

  // ---------------------------------------------------------------------
  // resetPagination
  // ---------------------------------------------------------------------
  describe('resetPagination', () => {
    it('sets the page to 2 then resets to 1 after the timer fires', () => {
      jest.useFakeTimers()
      const component = createComponent({})
      component.resetPagination()
      expect(component.initialPaginationPage).toBe(2)
      jest.runAllTimers()
      expect(component.initialPaginationPage).toBe(1)
    })
  })

  // ---------------------------------------------------------------------
  // processEventsResult
  // ---------------------------------------------------------------------
  describe('processEventsResult', () => {
    it('includes past events when the filter allows it', () => {
      const component = createComponent({})
      component.typesOfEventsFilters = ['past events']
      const events = [{ startDate: '2000-01-01', endDate: '2000-01-02', startTime: '00:00:00', endTime: '00:00:00' }]
      const result = component.processEventsResult(events)
      expect(result.length).toBe(1)
    })

    it('includes live events when the filter allows it', () => {
      const component = createComponent({})
      component.typesOfEventsFilters = ['live']
      const events: any[] = [{ startDate: '2000-01-01', endDate: '2099-01-01', startTime: '00:00:00', endTime: '00:00:00' }]
      const result = component.processEventsResult(events)
      expect(result.length).toBe(1)
      expect(events[0].showLive).toBe(true)
    })

    it('includes upcoming events when the filter allows it', () => {
      const component = createComponent({})
      component.typesOfEventsFilters = ['upcoming']
      const events = [{ startDate: '2099-01-01', endDate: '2099-01-02', startTime: '00:00:00', endTime: '00:00:00' }]
      const result = component.processEventsResult(events)
      expect(result.length).toBe(1)
    })

    it('excludes events whose type is not in the filter', () => {
      const component = createComponent({})
      component.typesOfEventsFilters = ['upcoming']
      const events = [{ startDate: '2000-01-01', endDate: '2000-01-02', startTime: '00:00:00', endTime: '00:00:00' }]
      const result = component.processEventsResult(events)
      expect(result.length).toBe(0)
    })

    it('skips events missing date/time fields', () => {
      const component = createComponent({})
      component.typesOfEventsFilters = ['past events', 'live', 'upcoming']
      const result = component.processEventsResult([{ startDate: '2000-01-01' }])
      expect(result.length).toBe(0)
    })
  })

  // ---------------------------------------------------------------------
  // removeFilterChip
  // ---------------------------------------------------------------------
  describe('removeFilterChip', () => {
    it('opens the side nav and calls seeAllResults when no chips remain', async () => {
      const component = createComponent({})
      component.filtersChipFromLearn = ['only-chip']
      await component.removeFilterChip('only-chip')
      expect(component.sideNavBarOpened).toBe(true)
      expect(mockSearchV3Service.searchCoursesv5).toHaveBeenCalled()
    })

    it('re-searches courses when chips remain', async () => {
      const component = createComponent({})
      component.filtersChipFromLearn = ['chip1', 'chip2']
      await component.removeFilterChip('chip1')
      expect(component.filtersChipFromLearn).toEqual(['chip2'])
      expect(mockSearchV3Service.searchCoursesv5).toHaveBeenCalled()
      expect(component.searchContentLoader).toBe(false)
    })
  })

  // ---------------------------------------------------------------------
  // processTypeOfEventsFilter / resetEventsTypesRequest
  // ---------------------------------------------------------------------
  describe('processTypeOfEventsFilter', () => {
    it('builds counts for live, upcoming and past events', async () => {
      mockSearchV3Service.searchCoursesv4.mockResolvedValue({ result: { count: 4 } })
      const component = createComponent({})
      await component.processTypeOfEventsFilter()
      expect(component.typesOfEventsFilters.length).toBe(3)
      expect(component.typesOfEventsFilters[0].count).toBe(4)
    })
  })

  describe('resetEventsTypesRequest', () => {
    it('deletes epoch filters when present', () => {
      const component = createComponent({})
      component.searchRequestEvents.request.filters.startDateTimeInEpoch = { '<=': 1 }
      component.searchRequestEvents.request.filters.endDateTimeInEpoch = { '>=': 1 }
      component.resetEventsTypesRequest()
      expect(component.searchRequestEvents.request.filters.startDateTimeInEpoch).toBeUndefined()
      expect(component.searchRequestEvents.request.filters.endDateTimeInEpoch).toBeUndefined()
    })

    it('does nothing when the epoch filters are absent', () => {
      const component = createComponent({})
      expect(() => component.resetEventsTypesRequest()).not.toThrow()
    })
  })

  // ---------------------------------------------------------------------
  // applyFilterToCaategoryType
  // ---------------------------------------------------------------------
  describe('applyFilterToCaategoryType', () => {
    it('re-searches the active category when exactly one filter matches the query category', async () => {
      mockActivated.snapshot = { queryParams: { category: SearchCategory.Courses } }
      const component = createComponent({})
      component.seeAllResult = SearchCategory.Courses
      component.applySelectedFilters = { courseCategory: ['x'] }
      await component.applyFilterToCaategoryType()
      expect(mockSearchV3Service.searchCoursesv5).toHaveBeenCalled()
    })

    it('does nothing when more than one filter is selected', async () => {
      mockActivated.snapshot = { queryParams: { category: SearchCategory.Courses } }
      const component = createComponent({})
      component.seeAllResult = SearchCategory.Courses
      component.applySelectedFilters = { a: ['x'], b: ['y'] }
      await component.applyFilterToCaategoryType()
      expect(mockSearchV3Service.searchCoursesv5).not.toHaveBeenCalled()
    })
  })

  // ---------------------------------------------------------------------
  // applySearchFilter - broad coverage
  // ---------------------------------------------------------------------
  describe('applySearchFilter', () => {
    it('applies MostRelevent sort for Courses', async () => {
      const component = createComponent({})
      component.searchSortFilter = SortType.MostRelevent
      component.seeAllResult = SearchCategory.Courses
      await component.applySearchFilter({ language: ['en'], organisation: ['org1'] })
      expect(component.searchRequestCourse.request.sort_by).toEqual({})
    })

    it('applies RecentlyAdded sort with no active category', async () => {
      const component = createComponent({})
      component.searchSortFilter = SortType.RecentlyAdded
      await component.applySearchFilter({ language: ['en'], organisation: ['org1'] })
      expect(component.searchRequestCourse.request.sort_by.createdOn).toBe('desc')
      expect(component.searchRequestEvents.request.sort_by.startDate).toBe('desc')
    })

    it('applies HighestRated sort for Events', async () => {
      const component = createComponent({})
      component.searchSortFilter = SortType.HighestRated
      component.seeAllResult = SearchCategory.Events
      await component.applySearchFilter({ language: ['en'], organisation: ['org1'] })
      expect(component.searchRequestEvents.request.sort_by.avgRating).toBe('desc')
    })

    it('applies Ascending/Descending sort for People', async () => {
      const component = createComponent({})
      component.searchSortFilter = SortType.Ascending
      await component.applySearchFilter({ language: ['en'], organisation: ['org1'] })
      expect(component.searchRequestPeoples.sort_by.firstName).toBe(SortType.Ascending)
    })

    it('applies AtoZ/ZtoA sort for Resources', async () => {
      const component = createComponent({})
      component.searchSortFilter = SortType.ZtoA
      component.seeAllResult = SearchCategory.Resources
      await component.applySearchFilter({ language: ['en'], organisation: ['org1'] })
      expect(component.searchRequestResources.request.sort_by.name).toBe(SortType.Descending)
    })

    it('applies the AvgRating filter using the minimum selected rating', async () => {
      const component = createComponent({})
      await component.applySearchFilter({ [FacetType.AvgRating]: ['4.5 stars', '3 stars'], organisation: ['org1'] })
      expect(component.searchRequestCourse.request.filters.avgRating).toEqual({ '>=': '3' })
    })

    it('applies the Language filter', async () => {
      const component = createComponent({})
      await component.applySearchFilter({ [FacetType.Language]: ['en'], organisation: ['org1'] })
      expect(component.searchRequestCourse.request.filters.language).toEqual(['en'])
    })

    it('applies competencyAreaNameKey filter across requests', async () => {
      const component = createComponent({})
      const key = component.competencyAreaNameKey
      await component.applySearchFilter({ [key]: ['Behavioural'], organisation: ['org1'] })
      expect(component.searchRequestCourse.request.filters[key]).toEqual(['Behavioural'])
      expect(component.compentencyKeyExist).toBe(true)
    })

    it('dispatches to searchEvents when the Events category key is selected', async () => {
      const component = createComponent({})
      await component.applySearchFilter({ [SearchCategory.Events]: ['x'], organisation: ['org1'] })
      expect(component.seeAllResult).toBe(SearchCategory.Events)
      expect(mockSearchV3Service.searchCoursesv4).toHaveBeenCalled()
    })

    it('dispatches to searchResources when the Resources category key is selected', async () => {
      const component = createComponent({})
      await component.applySearchFilter({ [SearchCategory.Resources]: ['x'], organisation: ['org1'] })
      expect(component.seeAllResult).toBe(SearchCategory.Resources)
      expect(mockSearchV3Service.searchResource).toHaveBeenCalled()
    })

    it('dispatches to searchPeople when the People category key is selected', async () => {
      const component = createComponent({})
      await component.applySearchFilter({ [SearchCategory.People]: ['x'], organisation: ['org1'] })
      expect(component.seeAllResult).toBe(SearchCategory.People)
      expect(mockSearchV3Service.searchConnections).toHaveBeenCalled()
    })

    it('dispatches to searchcommunities when the Communities category key is selected', async () => {
      const component = createComponent({})
      await component.applySearchFilter({ [SearchCategory.Communities]: ['x'], organisation: ['org1'] })
      expect(component.seeAllResult).toBe(SearchCategory.Communities)
      expect(mockSearchV3Service.searchCommunity).toHaveBeenCalled()
    })

    it('dispatches to searchExternalContents when the ExternalContents category key is selected', async () => {
      const component = createComponent({})
      await component.applySearchFilter({ [SearchCategory.ExternalContents]: ['x'], organisation: ['org1'] })
      expect(component.seeAllResult).toBe(SearchCategory.ExternalContents)
      expect(mockSearchV3Service.searchExternalContent).toHaveBeenCalled()
    })

    it('applies the live typeOfEvents filter', async () => {
      const component = createComponent({})
      await component.applySearchFilter({ typeOfEvents: ['live'], organisation: ['org1'] })
      expect(component.searchRequestEvents.request.filters.startDateTimeInEpoch).toBeDefined()
      expect(component.searchRequestEvents.request.filters.endDateTimeInEpoch).toBeDefined()
    })

    it('applies the upcoming typeOfEvents filter', async () => {
      const component = createComponent({})
      await component.applySearchFilter({ typeOfEvents: ['upcoming'], organisation: ['org1'] })
      expect(component.searchRequestEvents.request.filters.startDateTimeInEpoch).toBeDefined()
    })

    it('applies the past events typeOfEvents filter', async () => {
      const component = createComponent({})
      await component.applySearchFilter({ typeOfEvents: ['past events'], organisation: ['org1'] })
      expect(component.searchRequestEvents.request.filters.endDateTimeInEpoch).toBeDefined()
    })

    it('applies the resourceType filter and adds createdFor for samuhik charcha', async () => {
      const component = createComponent({})
      await component.applySearchFilter({ resourceType: ['samuhik charcha'], organisation: ['org1'] })
      expect(component.searchRequestEvents.request.filters.createdFor).toEqual(['org-1'])
    })

    it('applies sector/subSector filters for courses and resources', async () => {
      const component = createComponent({})
      await component.applySearchFilter({
        [FacetType.sectorNames_v1]: ['sec1'],
        [FacetType.subSectorNames_v1]: ['sub1'],
        organisation: ['org1'],
      })
      expect(component.searchRequestCourse.request.filters[FacetType.sectorNames_v1]).toEqual(['sec1'])
      expect(component.searchRequestResources.request.filters[FacetType.subSectorNames_v1]).toEqual(['sub1'])
    })

    it('applies resourceCategory and content-partner filters', async () => {
      const component = createComponent({})
      await component.applySearchFilter({
        [FacetType.resourceCategory]: ['cat1'],
        [FacetType.contentPartners]: ['partner1'],
        organisation: ['org1'],
      })
      expect(component.searchRequestResources.request.filters[FacetType.resourceCategory]).toEqual(['cat1'])
      expect(component.searchRequestExternal.filterCriteriaMap[FacetType.contentPartners]).toEqual(['partner1'])
    })

    it('pushes unmatched keys into courseCategory as a fallback', async () => {
      const component = createComponent({})
      await component.applySearchFilter({ someUnknownFacet: ['val1'], organisation: ['org1'] })
      expect(component.searchRequestCourse.request.filters.courseCategory).toEqual(
        expect.arrayContaining(['val1']),
      )
    })

    it('returns early without dispatching a search when only one filter is applied and not in explore mode', async () => {
      const component = createComponent({})
      await component.applySearchFilter({ someUnknownFacet: ['val1'] })
      expect(mockSearchV3Service.searchCoursesv5).not.toHaveBeenCalled()
    })

    it('triggers searchCourses immediately when in explore mode with a single filter', async () => {
      const component = createComponent({ tab: 'explore' })
      await component.applySearchFilter({ someUnknownFacet: ['val1'] })
      expect(mockSearchV3Service.searchCoursesv5).toHaveBeenCalledTimes(1)
    })

    it('dispatches the default course/event/people/community search when nothing else matched', async () => {
      const component = createComponent({})
      await component.applySearchFilter({ organisation: ['org1'], language: ['en'] })
      expect(mockSearchV3Service.searchCoursesv5).toHaveBeenCalled()
      expect(mockSearchV3Service.searchCoursesv4).toHaveBeenCalled()
      expect(mockSearchV3Service.searchConnections).toHaveBeenCalled()
      expect(mockSearchV3Service.searchCommunity).toHaveBeenCalled()
    })

    it('dispatches searchCourses for the CaseStudy category', async () => {
      const component = createComponent({})
      component.seeAllResult = SearchCategory.CaseStudy
      await component.applySearchFilter({ organisation: ['org1'], language: ['en'] })
      expect(mockSearchV3Service.searchCoursesv5).toHaveBeenCalled()
    })
  })
})
