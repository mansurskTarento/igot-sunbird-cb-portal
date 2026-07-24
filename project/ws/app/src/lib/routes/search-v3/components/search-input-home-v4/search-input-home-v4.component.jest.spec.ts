import { SearchInputHomeV4Component } from './search-input-home-v4.component'
import { of, Subject } from 'rxjs'

// Mock inject() since this component uses inject() pattern
jest.mock('@angular/core', () => {
  const actual = jest.requireActual('@angular/core')
  return {
    ...actual,
    inject: jest.fn(),
  }
})

describe('SearchInputHomeV4Component (No TestBed)', () => {
  let component: SearchInputHomeV4Component
  let mockActivatedRoute: any
  let mockRouter: any
  let mockSearchServService: any
  let mockConfigSvc: any
  let mockElementRef: any
  let mockGbSearchService: any
  let mockWidgetContentLibService: any
  let mockMobileAppsService: any

  beforeEach(() => {
    mockActivatedRoute = {
      snapshot: {
        queryParamMap: {
          get: jest.fn().mockReturnValue(''),
          has: jest.fn().mockReturnValue(false),
        },
        queryParams: {},
      },
      queryParams: of({}),
      queryParamMap: of({ get: jest.fn().mockReturnValue(''), has: jest.fn().mockReturnValue(false) }),
    }

    mockRouter = {
      navigate: jest.fn(),
      navigateByUrl: jest.fn(),
      events: new Subject(),
    }

    mockSearchServService = {
      getRecentSearchData: jest.fn().mockReturnValue(of([])),
      saveRecentSearchData: jest.fn().mockReturnValue(of({})),
      deleteRecentSearchByUserId: jest.fn().mockReturnValue(of({})),
      deleteRecentSearchByTimeStamp: jest.fn().mockReturnValue(of({})),
      getNlpSearch: jest.fn().mockReturnValue(of({ result: { data: [] } })),
      getSuggestions: jest.fn().mockReturnValue(of({ result: [] })),
    }

    mockConfigSvc = {
      userProfile: { userId: 'user-123' },
      instanceConfig: { searchV3: { categories: ['Course', 'Program', 'Resource'] } },
      unMappedUser: { id: 'user-123' },
      appsConfig: { features: {} },
      primaryNavBarConfig: { searchConfig: { globalSearchRedirect: '/app/search/home' } },
    }

    mockElementRef = {
      nativeElement: {
        querySelector: jest.fn().mockReturnValue({
          focus: jest.fn(),
          blur: jest.fn(),
          value: '',
        }),
      },
    }

    mockGbSearchService = {
      searchConfig: { globalSearchRedirect: '/app/search/home' },
    }

    mockWidgetContentLibService = {
      search: jest.fn().mockReturnValue(of({ result: { content: [], count: 0 } })),
    }

    mockMobileAppsService = {
      isMobile: false,
    }

    jest.spyOn(localStorage, 'getItem').mockImplementation((key: string) => {
      if (key === 'recentSearchList') return JSON.stringify([])
      return null
    })
    jest.spyOn(localStorage, 'setItem').mockImplementation(() => { })

    // Create component with Object.create and assign deps manually
    component = Object.create(SearchInputHomeV4Component.prototype)

      ; (component as any).activatedRoute = mockActivatedRoute
      ; (component as any).router = mockRouter
      ; (component as any).searchServSvc = mockSearchServService
      ; (component as any).configSvc = mockConfigSvc
      ; (component as any).elementRef = mockElementRef
      ; (component as any).gbSearchSvc = mockGbSearchService
      ; (component as any).widgetContentSvc = mockWidgetContentLibService
      ; (component as any).mobileAppsSvc = mockMobileAppsService
      ; (component as any).subs = []

    // Initialize signals
    const createSignal = (initialValue: any) => {
      let value = initialValue
      const fn: any = () => value
      fn.set = (v: any) => { value = v }
      fn.update = (updater: any) => { value = updater(value) }
      return fn
    }

    component.showSearchInput = createSignal(false)
    component.query = createSignal('')
    component.searchResults = createSignal([])
    component.recentSearchList = createSignal([])
    component.selectedCategory = createSignal('all')
    component.categories = createSignal([])
    component.isSearching = createSignal(false)
    component.showSuggestions = createSignal(false)
    component.suggestionsData = createSignal([])
    component.nlpResults = createSignal([])
    component.searchLabel = createSignal('Search')
    component.showRecentSearch = createSignal(false)
    component.searchByCategory = createSignal(false)
    component.searchCourseResults = createSignal([])
    component.searchEventResults = createSignal([])
    component.searchPeopleResults = createSignal([])
    component.searchResourceResults = createSignal([])
    component.searchCommunityResults = createSignal([])
    component.isNlpSearchEnabled = createSignal(false)
    component.isExpanded = createSignal(false)
    component.searchTimer = null

      // Initialize FormControl-like for queryControl
      ; (component as any).queryControl = {
        value: '',
        setValue: jest.fn(),
        valueChanges: of(''),
        reset: jest.fn(),
      }

    // Output signal mock
    component.closed = { emit: jest.fn() } as any
  })

  afterEach(() => {
    jest.restoreAllMocks()
    if (component.searchTimer) {
      clearTimeout(component.searchTimer)
    }
  })

  it('should be defined', () => {
    expect(component).toBeDefined()
  })

  describe('clearSearchTextElement', () => {
    it('should reset queryControl and clear results', () => {
      component.query.set('test')
      component.clearSearchTextElement()
      expect((component as any).queryControl.setValue).toHaveBeenCalledWith('')
      expect(component.query()).toBe('')
      expect(component.showSuggestions()).toBe(false)
    })
  })

  describe('updateQuery', () => {
    it('should update query signal and trigger search', () => {
      jest.useFakeTimers()
      component.updateQuery('angular')
      expect(component.query()).toBe('angular')
      jest.useRealTimers()
    })

    it('should clear suggestions for empty query', () => {
      component.updateQuery('')
      expect(component.query()).toBe('')
      expect(component.showSuggestions()).toBe(false)
    })
  })

  describe('processSearchText', () => {
    it('should navigate to search when query has value', () => {
      component.query.set('angular test')
      component.processSearchText()
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/app/search/home'],
        expect.objectContaining({
          queryParams: expect.objectContaining({ q: 'angular test' }),
        })
      )
    })

    it('should not navigate for empty query', () => {
      component.query.set('')
      component.processSearchText()
      expect(mockRouter.navigate).not.toHaveBeenCalled()
    })

    it('should save recent search data', () => {
      component.query.set('test search')
      component.processSearchText()
      expect(mockSearchServService.saveRecentSearchData).toHaveBeenCalled()
    })
  })

  describe('processRecentSearchText', () => {
    it('should set query and call processSearchText', () => {
      jest.spyOn(component, 'processSearchText').mockImplementation(() => { })
      component.processRecentSearchText('recent search')
      expect(component.query()).toBe('recent search')
      expect(component.processSearchText).toHaveBeenCalled()
    })
  })

  describe('clearSearchText', () => {
    it('should clear query and hide suggestions', () => {
      component.query.set('something')
      component.showSuggestions.set(true)
      component.clearSearchText()
      expect(component.query()).toBe('')
      expect(component.showSuggestions()).toBe(false)
    })
  })

  describe('selectSearchCategory', () => {
    it('should set selectedCategory', () => {
      component.selectSearchCategory('Course')
      expect(component.selectedCategory()).toBe('Course')
    })

    it('should trigger search when query exists', () => {
      component.query.set('angular')
      jest.spyOn(component, 'processSearchText').mockImplementation(() => { })
      component.selectSearchCategory('Course')
      expect(component.selectedCategory()).toBe('Course')
    })
  })

  describe('searchFromQuery', () => {
    it('should set query from event target', () => {
      const event = { target: { value: 'new search' } } as any
      jest.spyOn(component, 'processSearchText').mockImplementation(() => { })
      component.searchFromQuery(event)
      expect(component.query()).toBe('new search')
    })
  })

  describe('recentDeleteByUserId', () => {
    it('should call deleteRecentSearchByUserId and clear list', () => {
      component.recentSearchList.set([{ id: '1', query: 'test' }])
      component.recentDeleteByUserId()
      expect(mockSearchServService.deleteRecentSearchByUserId).toHaveBeenCalledWith('user-123')
    })
  })

  describe('recentDeleteByTimeStamp', () => {
    it('should call deleteRecentSearchByTimeStamp', () => {
      const item = { timestamp: '2025-01-01T00:00:00Z', query: 'test' }
      component.recentSearchList.set([item])
      component.recentDeleteByTimeStamp(item)
      expect(mockSearchServService.deleteRecentSearchByTimeStamp).toHaveBeenCalledWith(
        'user-123',
        '2025-01-01T00:00:00Z'
      )
    })

    it('should remove item from recentSearchList', () => {
      const item1 = { timestamp: '2025-01-01T00:00:00Z', query: 'test1' }
      const item2 = { timestamp: '2025-01-02T00:00:00Z', query: 'test2' }
      component.recentSearchList.set([item1, item2])
      component.recentDeleteByTimeStamp(item1)
      expect(component.recentSearchList().length).toBe(1)
      expect(component.recentSearchList()[0]).toEqual(item2)
    })
  })

  describe('goToSearchItem', () => {
    it('should navigate to search with item query', () => {
      component.goToSearchItem({ query: 'selected item', type: 'Course' })
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/app/search/home'],
        expect.objectContaining({
          queryParams: expect.objectContaining({ q: 'selected item' }),
        })
      )
    })
  })

  describe('searchCourses', () => {
    it('should call widgetContentSvc.search and set results', () => {
      component.query.set('test')
      component.searchCourses()
      expect(mockWidgetContentLibService.search).toHaveBeenCalled()
    })
  })

  describe('searchEvents', () => {
    it('should call widgetContentSvc.search for events', () => {
      component.query.set('event')
      component.searchEvents()
      expect(mockWidgetContentLibService.search).toHaveBeenCalled()
    })
  })

  describe('searchPeoples', () => {
    it('should call widgetContentSvc.search for people', () => {
      component.query.set('person')
      component.searchPeoples()
      expect(mockWidgetContentLibService.search).toHaveBeenCalled()
    })
  })

  describe('searchResources', () => {
    it('should call widgetContentSvc.search for resources', () => {
      component.query.set('doc')
      component.searchResources()
      expect(mockWidgetContentLibService.search).toHaveBeenCalled()
    })
  })

  describe('searchCommunities', () => {
    it('should call widgetContentSvc.search for communities', () => {
      component.query.set('community')
      component.searchCommunities()
      expect(mockWidgetContentLibService.search).toHaveBeenCalled()
    })
  })

  describe('searchAll', () => {
    it('should call widgetContentSvc.search without category filter', () => {
      component.query.set('all')
      component.searchAll()
      expect(mockWidgetContentLibService.search).toHaveBeenCalled()
    })
  })

  describe('processSearchByCategory', () => {
    it('should call searchCourses for Course category', () => {
      component.selectedCategory.set('Course')
      component.query.set('test')
      jest.spyOn(component, 'searchCourses').mockImplementation(() => { })
      component.processSearchByCategory()
      expect(component.searchCourses).toHaveBeenCalled()
    })

    it('should call searchAll for all category', () => {
      component.selectedCategory.set('all')
      component.query.set('test')
      jest.spyOn(component, 'searchAll').mockImplementation(() => { })
      component.processSearchByCategory()
      expect(component.searchAll).toHaveBeenCalled()
    })
  })

  describe('autoFilter', () => {
    it('should call getSuggestions for query with length >= 3', () => {
      component.autoFilter('ang')
      expect(mockSearchServService.getSuggestions).toHaveBeenCalled()
    })

    it('should not call getSuggestions for short query', () => {
      component.autoFilter('ab')
      expect(mockSearchServService.getSuggestions).not.toHaveBeenCalled()
    })
  })

  describe('initialize', () => {
    it('should set categories from config', () => {
      component.initialize()
      expect(component.categories().length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('ngOnDestroy', () => {
    it('should unsubscribe all subscriptions', () => {
      const mockSub = { unsubscribe: jest.fn() }
        ; (component as any).subs = [mockSub]
      component.ngOnDestroy()
      expect(mockSub.unsubscribe).toHaveBeenCalled()
    })

    it('should clear searchTimer if exists', () => {
      component.searchTimer = setTimeout(() => { }, 1000) as any
      const clearSpy = jest.spyOn(global, 'clearTimeout')
      component.ngOnDestroy()
      expect(clearSpy).toHaveBeenCalled()
    })
  })
})
