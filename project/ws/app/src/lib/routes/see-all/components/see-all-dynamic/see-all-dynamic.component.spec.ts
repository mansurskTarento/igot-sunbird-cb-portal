import { of, throwError, Subject } from 'rxjs'

// The component pulls these packages in only for DI types; the real bundles drag in telemetry and
// editor deps that cannot resolve under jest, so they are replaced with empty classes.
jest.mock('@sunbird-cb/consumption', () => ({
  CommonMethodsService: class { },
  WidgetContentLibService: class { },
}))
jest.mock('@sunbird-cb/utils-v2', () => ({
  MultilingualTranslationsService: class { },
  ValueService: class { },
  WidgetEnrollService: class { },
}))

import { SeeAllDynamicComponent } from './see-all-dynamic.component'

describe('SeeAllDynamicComponent', () => {
  let component: any
  let mocks: any

  const buildMocks = (overrides: any = {}) => ({
    activatedRoute: {
      snapshot: {
        queryParams: { providerName: 'Test Partner', key: 'extContent', provider: 'prov-1' },
        data: {},
      },
    },
    seeAllService: {
      getCourses: jest.fn().mockReturnValue(of({ data: [], totalCount: 0, facets: {} })),
      getProviderDetails: jest.fn().mockReturnValue(of({ result: { data: [] } })),
    },
    translateService: { setDefaultLang: jest.fn(), use: jest.fn() },
    langtranslations: { languageSelectedObservable: new Subject() },
    commonSvc: { transformContentsToWidgetsWithoutStrip: jest.fn((items: any[]) => items) },
    router: { navigate: jest.fn() },
    contSvc: { getResourseLink: jest.fn() },
    valueSvc: { isLtMedium$: of(false) },
    cdr: { detectChanges: jest.fn() },
    enrollSvc: { fetchExternalEnrollmentSearch: jest.fn().mockReturnValue(of({ result: { courses: [] } })) },
    ...overrides,
  })

  const createComponent = (overrides: any = {}) => {
    mocks = buildMocks(overrides)
    component = new SeeAllDynamicComponent(
      mocks.activatedRoute,
      mocks.seeAllService,
      mocks.translateService,
      mocks.langtranslations,
      mocks.commonSvc,
      mocks.router,
      mocks.contSvc,
      mocks.valueSvc,
      mocks.cdr,
      mocks.enrollSvc,
    )
    return component
  }

  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
    createComponent()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(component.selectedTab).toBe('allContent')
  })

  describe('constructor language handling', () => {
    it('switches language when the selection emits and a language is stored', () => {
      localStorage.setItem('websiteLanguage', 'hi')
      mocks.langtranslations.languageSelectedObservable.next(true)

      expect(mocks.translateService.setDefaultLang).toHaveBeenCalledWith('en')
      expect(mocks.translateService.use).toHaveBeenCalledWith('hi')
    })

    it('does nothing when no language is stored', () => {
      mocks.langtranslations.languageSelectedObservable.next(true)

      expect(mocks.translateService.use).not.toHaveBeenCalled()
    })
  })

  describe('ngOnInit', () => {
    it('reads the route, loads content, provider and enrolments', () => {
      localStorage.setItem('websiteLanguage', 'en')
      component.ngOnInit()

      expect(mocks.translateService.use).toHaveBeenCalledWith('en')
      expect(component.contentName).toBe('Test Partner')
      expect(component.configKey).toBe('extContent')
      expect(component.filterProvider).toBe('prov-1')
      expect(component.screenSizeIsLtMedium).toBe(false)
      expect(mocks.seeAllService.getCourses).toHaveBeenCalled()
      expect(mocks.seeAllService.getProviderDetails).toHaveBeenCalled()
      expect(mocks.enrollSvc.fetchExternalEnrollmentSearch).toHaveBeenCalled()
    })

    it('tracks a small screen from the value service', () => {
      createComponent({ valueSvc: { isLtMedium$: of(true) } })
      component.ngOnInit()

      expect(component.screenSizeIsLtMedium).toBe(true)
    })
  })

  describe('getRouterData', () => {
    it('falls back to defaults when query params are missing', () => {
      createComponent({
        activatedRoute: { snapshot: { queryParams: {}, data: {} } },
      })
      component.getRouterData()

      expect(component.contentName).toBe('Explore all the contents')
      expect(component.configKey).toBe('extContent')
      expect(component.filterProvider).toBe('PEDGOG')
    })

    it('builds breadcrumb titles ending with the content name', () => {
      component.contentName = 'Partner X'
      component.initializeTitles()

      expect(component.titles.length).toBe(2)
      expect(component.titles[0].title).toBe('All Providers')
      expect(component.titles[1].title).toBe('Partner X')
    })
  })

  describe('setRandomColor', () => {
    it('picks a colour from the palette when a provider is set', () => {
      component.filterProvider = 'prov-1'
      component.setRandomColor()

      expect(component.colors).toContain(component.headerBgColor)
    })

    it('keeps the default colour without a provider', () => {
      component.filterProvider = ''
      component.setRandomColor()

      expect(component.headerBgColor).toBe('#1a4ca1')
    })
  })

  describe('loadConfiguration', () => {
    it('uses the resolved page config and stamps the provider into the request', () => {
      createComponent({
        activatedRoute: {
          snapshot: {
            queryParams: { key: 'extContent', provider: 'prov-9' },
            data: {
              pageData: {
                data: {
                  extContent: {
                    request: { filterCriteriaMap: {}, pageNumber: 0 },
                    sortOptions: [{ name: 'A-Z', value: 'a-z' }],
                  },
                },
              },
            },
          },
        },
      })
      component.configKey = 'extContent'
      component.filterProvider = 'prov-9'
      component.loadConfiguration()

      expect(component.apiConfig.request.filterCriteriaMap['contentPartner.id']).toBe('prov-9')
      expect(component.customOptions).toEqual([{ name: 'A-Z', value: 'a-z' }])
      expect(mocks.seeAllService.getCourses).toHaveBeenCalled()
    })

    it('bails out when the key has no config block', () => {
      component.configKey = 'unknownKey'
      component.loadConfiguration()

      expect(component.apiConfig).toBeUndefined()
      expect(mocks.seeAllService.getCourses).not.toHaveBeenCalled()
    })
  })

  describe('getCourses', () => {
    beforeEach(() => {
      component.apiConfig = {
        request: {
          filterCriteriaMap: {},
          pageNumber: 0,
          pageSize: 10,
          searchString: '',
          facets: ['topic'],
          orderBy: 'createdOn',
          orderDirection: 'desc',
        },
      }
      component.filterProvider = 'prov-1'
    })

    it('sends paging, sort, search and the provider', () => {
      component.currentPageNumber = 2
      component.pageSize = 20
      component.searchString = 'data'
      component.sortKey = 'name'
      component.sortOrder = 'asc'

      component.getCourses()

      const request = mocks.seeAllService.getCourses.mock.calls[0][0]
      expect(request.filterCriteriaMap['contentPartner.id']).toBe('prov-1')
      expect(request.pageNumber).toBe(2)
      expect(request.pageSize).toBe(20)
      expect(request.searchString).toBe('data')
      expect(request.orderBy).toBe('name')
      expect(request.orderDirection).toBe('asc')
      expect(request.facets).toContain('courseType')
    })

    it('does not duplicate courseType when the config already asks for it', () => {
      component.apiConfig.request.facets = ['topic', 'courseType']
      component.getCourses()

      const request = mocks.seeAllService.getCourses.mock.calls[0][0]
      expect(request.facets.filter((f: string) => f === 'courseType').length).toBe(1)
    })

    it('adds applied filters to the criteria map', () => {
      component.appliedFilters = { topic: ['Ethics'], empty: [] }
      component.getCourses()

      const request = mocks.seeAllService.getCourses.mock.calls[0][0]
      expect(request.filterCriteriaMap.topic).toEqual(['Ethics'])
      expect(request.filterCriteriaMap.empty).toBeUndefined()
    })

    it('replaces the list and captures count and facets on a first load', () => {
      mocks.seeAllService.getCourses.mockReturnValue(of({
        data: [{ id: 1 }],
        totalCount: 7,
        facets: { topic: [{ value: 'Ethics', count: 4 }] },
      }))

      component.getCourses()

      expect(component.contentItems).toEqual([{ id: 1 }])
      expect(component.originalContentItems).toEqual([{ id: 1 }])
      expect(component.totalCount).toBe(7)
      expect(component.apiFacets.length).toBe(1)
      expect(component.loading).toBe(false)
    })

    it('appends and keeps existing facets when loading more', () => {
      component.contentItems = [{ id: 1 }]
      component.apiFacets = [{ name: 'topic' }]
      mocks.seeAllService.getCourses.mockReturnValue(of({ data: [{ id: 2 }], totalCount: 2, facets: {} }))

      component.getCourses(true)

      expect(component.contentItems).toEqual([{ id: 1 }, { id: 2 }])
      expect(component.apiFacets).toEqual([{ name: 'topic' }])
      expect(component.isLoadingMore).toBe(false)
    })

    it('clears the list on error for a first load', () => {
      component.contentItems = [{ id: 1 }]
      component.originalContentItems = [{ id: 1 }]
      mocks.seeAllService.getCourses.mockReturnValue(throwError(() => new Error('boom')))

      component.getCourses()

      expect(component.contentItems).toEqual([])
      expect(component.originalContentItems).toEqual([])
      expect(component.totalCount).toBe(0)
      expect(component.loading).toBe(false)
    })

    it('keeps already loaded items when a load-more errors', () => {
      component.contentItems = [{ id: 1 }]
      mocks.seeAllService.getCourses.mockReturnValue(throwError(() => new Error('boom')))

      component.getCourses(true)

      expect(component.contentItems).toEqual([{ id: 1 }])
      expect(component.isLoadingMore).toBe(false)
    })
  })

  describe('transformFacets', () => {
    beforeEach(() => {
      component.totalCount = 5
      component.apiConfig = {
        FilterConfig: [
          {
            key: 'courseType', heading: 'Content Type', selectType: 'checkbox', showCount: true, order: -1,
            options: [{ name: 'Open', value: 'Free' }, { name: 'Restricted', value: 'Paid' }],
          },
          { key: 'topic', heading: 'Topic', showSearch: true, seeMoreLimit: 4 },
        ],
      }
    })

    it('returns nothing for a non-object response', () => {
      expect(component.transformFacets(null)).toEqual([])
      expect(component.transformFacets('nope')).toEqual([])
    })

    it('keeps configured order and renames values to the configured labels', () => {
      const facets = component.transformFacets({
        courseType: [{ value: 'paid', count: 3 }],
        topic: [{ value: 'Ethics', count: 2 }],
      })

      expect(facets[0].name).toBe('courseType')
      expect(facets[0].heading).toBe('Content Type')
      expect(facets[0].values).toEqual([{ name: 'Restricted', count: 3 }])
      expect(facets[1].name).toBe('topic')
      expect(facets.map((f: any) => f.order)).toEqual([1, 2])
    })

    it('drops a configured facet the API returned nothing for', () => {
      const facets = component.transformFacets({ courseType: [], topic: [{ value: 'Ethics', count: 2 }] })

      expect(facets.find((f: any) => f.name === 'courseType')).toBeUndefined()
      expect(facets.length).toBe(1)
    })

    it('shows config options only when the entry opts in', () => {
      component.apiConfig.FilterConfig[0].showOptionsWhenEmpty = true
      const facets = component.transformFacets({ courseType: [] })

      expect(facets[0].values).toEqual([{ name: 'Open' }, { name: 'Restricted' }])
    })

    it('appends unconfigured API facets with a derived heading', () => {
      const facets = component.transformFacets({
        'competencies_v6.competencyAreaName': [{ value: 'Functional', count: 1 }],
      })

      expect(facets[0].name).toBe('competencies_v6.competencyAreaName')
      expect(facets[0].heading).toBe('Competency Area Name')
      expect(facets[0].values).toEqual([{ name: 'Functional', count: 1 }])
    })

    it('allows config options while a filter is applied even with no results', () => {
      component.totalCount = 0
      component.appliedFilters = { courseType: ['Restricted'] }
      component.apiConfig.FilterConfig[0].showOptionsWhenEmpty = true

      const facets = component.transformFacets({ courseType: [] })

      expect(facets[0].values.length).toBe(2)
    })
  })

  describe('option aliases', () => {
    beforeEach(() => {
      component.apiConfig = {
        FilterConfig: [{
          key: 'courseType',
          options: [{ name: 'Open', value: 'Free' }, { name: 'Restricted', value: 'Paid' }, 'Plain'],
        }],
      }
    })

    it('builds both directions, keyed case-insensitively', () => {
      const { labelToValue, valueToLabel } = component.getOptionAliases('courseType')

      expect(labelToValue.restricted).toBe('Paid')
      expect(valueToLabel.paid).toBe('Restricted')
    })

    it('returns empty maps for an unknown key', () => {
      const { labelToValue, valueToLabel } = component.getOptionAliases('nope')

      expect(labelToValue).toEqual({})
      expect(valueToLabel).toEqual({})
    })

    it('sends back the exact value the facet response used', () => {
      component.totalCount = 1
      component.transformFacets({ courseType: [{ value: 'paid', count: 3 }] })

      expect(component.toFilterValues('courseType', ['Restricted'])).toEqual(['paid'])
    })

    it('falls back to the configured value when the facet was empty', () => {
      expect(component.toFilterValues('courseType', ['Restricted'])).toEqual(['Paid'])
    })

    it('passes through labels with no alias', () => {
      expect(component.toFilterValues('topic', ['Dr. Ambedkar Inst.'])).toEqual(['Dr. Ambedkar Inst.'])
      expect(component.toFilterValues('courseType', [])).toEqual([])
    })
  })

  describe('formatHeading', () => {
    it('reads the last path segment and title-cases it', () => {
      expect(component.formatHeading('competencies_v6.competencyThemeName')).toBe('Competency Theme Name')
      expect(component.formatHeading('topic')).toBe('Topic')
    })
  })

  describe('tabs', () => {
    it('switches the selected tab', () => {
      component.onTabChange('completed')

      expect(component.selectedTab).toBe('completed')
      expect(component.isAllContentTab).toBe(false)
    })

    it('shows search results on All Content and enrolments elsewhere', () => {
      component.contentItems = [{ id: 'search' }]
      component.enrolledContent = { completed: [{ id: 'done' }], inProgress: [] }

      expect(component.displayedItems).toEqual([{ id: 'search' }])

      component.onTabChange('completed')
      expect(component.displayedItems).toEqual([{ id: 'done' }])

      component.onTabChange('unknownTab')
      expect(component.displayedItems).toEqual([])
    })

    it('reports the loader of whichever list is on screen', () => {
      component.loading = true
      component.isEnrolmentLoading = false
      expect(component.isListLoading).toBe(true)

      component.onTabChange('inProgress')
      expect(component.isListLoading).toBe(false)
    })
  })

  describe('loadEnrolments', () => {
    it('asks for every enrolment once and splits the flat records by status', () => {
      mocks.enrollSvc.fetchExternalEnrollmentSearch.mockReturnValue(of({
        result: {
          courses: [
            { status: 2, contentId: 'c1', name: 'Done' },
            { status: 1, contentId: 'c2', name: 'Doing' },
            { status: 0, contentId: 'c3', name: 'Not started' },
          ],
        },
      }))

      component.loadEnrolments()

      expect(mocks.enrollSvc.fetchExternalEnrollmentSearch).toHaveBeenCalledTimes(1)
      expect(mocks.enrollSvc.fetchExternalEnrollmentSearch).toHaveBeenCalledWith({
        partnerId: component.filterProvider,
        status: 'All',
      })
      expect(component.enrolledContent.completed.length).toBe(1)
      expect(component.enrolledContent.inProgress.length).toBe(2)
      expect(component.enrolmentStatusById).toEqual({ c1: 2, c2: 1, c3: 0 })
      expect(component.isEnrolmentLoading).toBe(false)
    })

    it('still splits records that nest their content', () => {
      mocks.enrollSvc.fetchExternalEnrollmentSearch.mockReturnValue(of({
        result: {
          courses: [
            { status: 2, content: { contentId: 'c1' }, completionPercentage: 100 },
            { status: 1, content: { contentId: 'c2' }, completionpercentage: 40 },
          ],
        },
      }))

      component.loadEnrolments()

      expect(component.enrolledContent.completed.length).toBe(1)
      expect(component.enrolledContent.inProgress.length).toBe(1)
      expect(component.enrolmentStatusById).toEqual({ c1: 2, c2: 1 })
    })

    it('treats a response with no courses list as no enrolments', () => {
      mocks.enrollSvc.fetchExternalEnrollmentSearch.mockReturnValue(of({ result: {} }))

      component.loadEnrolments()

      expect(component.enrolledContent).toEqual({ completed: [], inProgress: [] })
      expect(component.enrolmentStatusById).toEqual({})
      expect(component.isEnrolmentLoading).toBe(false)
    })

    it('reads courses from the root of the response too', () => {
      mocks.enrollSvc.fetchExternalEnrollmentSearch.mockReturnValue(of({
        courses: [{ status: 0, identifier: 'c3' }],
      }))

      component.loadEnrolments()

      expect(component.enrolledContent.inProgress.length).toBe(1)
      expect(component.enrolmentStatusById).toEqual({ c3: 0 })
    })

    it('resets to empty lists on error', () => {
      component.enrolledContent = { completed: [{ id: 1 }], inProgress: [] }
      component.enrolmentStatusById = { c1: 2 }
      mocks.enrollSvc.fetchExternalEnrollmentSearch.mockReturnValue(throwError(() => new Error('boom')))

      component.loadEnrolments()

      expect(component.enrolledContent).toEqual({ completed: [], inProgress: [] })
      expect(component.enrolmentStatusById).toEqual({})
      expect(component.isEnrolmentLoading).toBe(false)
    })
  })

  describe('enrolment helpers', () => {
    it('reads whichever id key the record carries', () => {
      expect(component.getContentKey({ contentId: 'a' })).toBe('a')
      expect(component.getContentKey({ identifier: 'b' })).toBe('b')
      expect(component.getContentKey({ externalId: 'c' })).toBe('c')
      expect(component.getContentKey({})).toBe('')
    })

    it('treats a missing or unparsable status as 0', () => {
      expect(component.getEnrolmentStatus({ status: 2 })).toBe(2)
      expect(component.getEnrolmentStatus({ status: 'x' })).toBe(0)
      expect(component.getEnrolmentStatus({})).toBe(0)
    })

    it('flattens a nested enrolment record onto its content', () => {
      const result = component.toEnrolledContent({
        status: 2,
        completionpercentage: 55,
        issued_certificates: ['cert'],
        content: { contentId: 'c1', name: 'Course' },
      })

      expect(result.name).toBe('Course')
      expect(result.completionPercentage).toBe(55)
      expect(result.completionStatus).toBe(2)
      expect(result.issuedCertificates).toEqual(['cert'])
      expect(result.batchId).toBe('')
    })

    it('takes the record itself as the content when the search returns it flat', () => {
      const result = component.toEnrolledContent({
        contentId: 'c1',
        externalId: '91',
        name: 'Course',
        appIcon: 'icon.png',
        status: 0,
      })

      expect(result.name).toBe('Course')
      expect(result.contentId).toBe('c1')
      expect(result.externalId).toBe('91')
      expect(result.appIcon).toBe('icon.png')
      expect(result.completionStatus).toBe(0)
      expect(result.completionPercentage).toBe(0)
    })

    it('copies enrolment status onto matching search results only', () => {
      component.enrolmentStatusById = { 'c.1': 2 }
      component.contentItems = [
        { widgetData: { content: { contentId: 'c.1' } } },
        { widgetData: { content: { contentId: 'other' } } },
        { widgetData: {} },
      ]

      component.applyEnrolmentStatus()

      expect(component.contentItems[0].widgetData.content.completionStatus).toBe(2)
      expect(component.contentItems[1].widgetData.content.completionStatus).toBeUndefined()
    })
  })

  describe('loadProviderDetails', () => {
    it('does nothing without a provider', () => {
      component.filterProvider = ''
      component.loadProviderDetails()

      expect(mocks.seeAllService.getProviderDetails).not.toHaveBeenCalled()
    })

    it('stores the first provider record', () => {
      mocks.seeAllService.getProviderDetails.mockReturnValue(of({ result: { data: [{ id: 'p1' }] } }))
      component.filterProvider = 'p1'
      component.loadProviderDetails()

      const request = mocks.seeAllService.getProviderDetails.mock.calls[0][0]
      expect(request.filterCriteriaMap.id).toBe('p1')
      expect(component.providerDetails).toEqual({ id: 'p1' })
    })

    it('clears details on error', () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined)
      mocks.seeAllService.getProviderDetails.mockReturnValue(throwError(() => new Error('boom')))
      component.filterProvider = 'p1'
      component.providerDetails = { id: 'old' }

      component.loadProviderDetails()

      expect(component.providerDetails).toBeNull()
    })
  })

  describe('description overflow', () => {
    it('shows the toggle when the text is clamped, once', () => {
      component.providerDetails = { description: 'long text' }
      component.descriptionEl = { nativeElement: { scrollHeight: 120, clientHeight: 60 } }

      component.ngAfterViewChecked()
      component.ngAfterViewChecked()

      expect(component.showDescriptionToggle).toBe(true)
      expect(mocks.cdr.detectChanges).toHaveBeenCalledTimes(1)
    })

    it('does nothing without a description element', () => {
      component.providerDetails = { description: 'long text' }
      component.ngAfterViewChecked()

      expect(component.showDescriptionToggle).toBe(false)
      expect(mocks.cdr.detectChanges).not.toHaveBeenCalled()
    })
  })

  describe('search and sort', () => {
    beforeEach(() => {
      component.originalContentItems = [
        { name: 'Alpha', description: 'first' },
        { title: 'Beta', description: 'second' },
        { widgetData: { content: { name: 'Gamma' } } },
      ]
      component.contentItems = [...component.originalContentItems]
    })

    it('filters locally across name, title, description and card content', () => {
      component.searchString = 'alpha'
      component.applyLocalSearch()
      expect(component.contentItems.length).toBe(1)

      component.searchString = 'second'
      component.applyLocalSearch()
      expect(component.contentItems.length).toBe(1)

      component.searchString = 'gamma'
      component.applyLocalSearch()
      expect(component.contentItems.length).toBe(1)
    })

    it('restores everything when the search is cleared', () => {
      component.searchString = '   '
      component.applyLocalSearch()

      expect(component.contentItems.length).toBe(3)
    })

    it('sorts by name, rating and date in both directions', () => {
      component.contentItems = [
        { name: 'B', avgRating: 3, createdOn: '2024-01-02' },
        { name: 'A', avgRating: 5, createdOn: '2024-01-03' },
      ]

      component.sortKey = 'name'
      component.sortOrder = 'asc'
      component.applySort()
      expect(component.contentItems[0].name).toBe('A')

      component.sortOrder = 'desc'
      component.applySort()
      expect(component.contentItems[0].name).toBe('B')

      component.sortKey = 'avgRating'
      component.sortOrder = 'desc'
      component.applySort()
      expect(component.contentItems[0].avgRating).toBe(5)

      component.sortKey = 'createdOn'
      component.sortOrder = 'desc'
      component.applySort()
      expect(component.contentItems[0].createdOn).toBe('2024-01-03')
    })

    it('toggles direction for the same key and resets for a new one', () => {
      component.sortKey = 'name'
      component.sortOrder = 'asc'

      component.setSort('name')
      expect(component.sortOrder).toBe('desc')

      component.setSort('avgRating')
      expect(component.sortKey).toBe('avgRating')
      expect(component.sortOrder).toBe('asc')
    })

    it('maps sort options to key and direction, refetching each time', () => {
      component.apiConfig = { request: {} }

      component.onChangeSortSearch('recently_added_newest')
      expect([component.sortKey, component.sortOrder]).toEqual(['createdOn', 'desc'])

      component.onChangeSortSearch('a-z')
      expect([component.sortKey, component.sortOrder]).toEqual(['name', 'asc'])

      component.onChangeSortSearch('z-a')
      expect([component.sortKey, component.sortOrder]).toEqual(['name', 'desc'])

      component.onChangeSortSearch('unknown')
      expect([component.sortKey, component.sortOrder]).toEqual(['name', 'desc'])
      expect(mocks.seeAllService.getCourses).toHaveBeenCalledTimes(4)
    })

    it('searches server side for POST APIs', () => {
      component.apiConfig = { request: {} }
      component.isGetApi = false

      component.onSearch()

      expect(mocks.seeAllService.getCourses).toHaveBeenCalled()
    })

    it('searches locally for GET or local-search APIs', () => {
      component.apiConfig = { isLocalSearch: true }
      component.searchString = 'alpha'

      component.onSearch()

      expect(mocks.seeAllService.getCourses).not.toHaveBeenCalled()
      expect(component.contentItems.length).toBe(1)
    })

    it('clears the search locally', () => {
      component.isGetApi = true
      component.apiConfig = {}
      component.searchString = 'alpha'

      component.clearSearch()

      expect(component.searchString).toBe('')
      expect(component.contentItems.length).toBe(3)
      expect(mocks.seeAllService.getCourses).not.toHaveBeenCalled()
    })

    it('clears the search server side for POST APIs', () => {
      component.apiConfig = { request: {} }
      component.searchString = 'alpha'

      component.clearSearch()

      expect(component.searchString).toBe('')
      expect(mocks.seeAllService.getCourses).toHaveBeenCalled()
    })
  })

  describe('navigation and paging', () => {
    it('routes external content straight to its toc page', async () => {
      await component.getRedirectUrlData({ externalId: 'ext-1', contentId: 'c1' })

      expect(mocks.router.navigate).toHaveBeenCalledWith(['app/toc/ext/c1'])
      expect(mocks.contSvc.getResourseLink).not.toHaveBeenCalled()
    })

    it('resolves a link for internal content', async () => {
      mocks.contSvc.getResourseLink.mockResolvedValue({ url: '/app/toc/do_1', queryParams: { primaryCategory: 'Course' } })

      await component.getRedirectUrlData({ contentId: 'do_1' })

      expect(mocks.router.navigate).toHaveBeenCalledWith(['/app/toc/do_1'], { queryParams: { primaryCategory: 'Course' } })
    })

    it('refetches with the new page and size', () => {
      component.apiConfig = { request: { pageNumber: 0, pageSize: 10 } }

      component.onPageChange({ currentPage: 3, limit: 20 })

      expect(component.currentPageNumber).toBe(2)
      expect(component.pageSize).toBe(20)
      expect(mocks.seeAllService.getCourses).toHaveBeenCalled()
    })

    it('refetches when filters are applied', () => {
      component.apiConfig = { request: { filterCriteriaMap: {} } }

      component.onFilterApplied({ topic: ['Ethics'] })

      expect(component.appliedFilters).toEqual({ topic: ['Ethics'] })
      expect(mocks.seeAllService.getCourses).toHaveBeenCalled()
    })
  })

  describe('ngOnDestroy', () => {
    it('completes the teardown subject', () => {
      const next = jest.spyOn(component.destroy$, 'next')
      const complete = jest.spyOn(component.destroy$, 'complete')

      component.ngOnDestroy()

      expect(next).toHaveBeenCalled()
      expect(complete).toHaveBeenCalled()
    })
  })
})
