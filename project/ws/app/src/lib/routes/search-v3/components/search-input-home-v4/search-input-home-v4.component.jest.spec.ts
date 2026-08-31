import { of, Subject } from 'rxjs'
import { ActivatedRoute, Router } from '@angular/router'
import { ElementRef, inject } from '@angular/core'
import { ConfigurationsService, DomainConfService } from '@sunbird-cb/utils-v2'
import { WidgetContentLibService } from '@sunbird-cb/consumption'
import { SearchServService } from '../../../search/services/search-serv.service'
import { GbSearchService } from '../../services/gb-search.service'
import { MobileAppsService } from './../../../services/mobile-apps.service'
import { SearchCategory } from '../../models/search-v3.model'

// `gb-search.service.ts` (and transitively this component) pulls in `@ws/author`, whose barrel
// drags in unrelated modules with broken non-relative imports Jest cannot resolve. Mocking the
// barrel keeps this spec isolated from that unrelated breakage.
jest.mock('@ws/author', () => ({
  SEARCH_SORT_DROPDOWN: [
    { name: 'Most Relevant', value: 'most_relevant' },
    { name: 'Recently Added (Newest)', value: 'recently_added_newest' },
  ],
}))

// The real `@sunbird-cb/consumption` package resolves (in this workspace) to a nested copy of
// `@sunbird-cb/utils-v2` that references `@project-sunbird/telemetry-sdk`, a module missing from
// that nested location. WidgetContentLibService is only ever used here as an inject() token, so a
// stub class keeps this spec isolated from that unrelated dependency breakage.
jest.mock('@sunbird-cb/consumption', () => ({
  WidgetContentLibService: class WidgetContentLibService { },
}))

// GbSearchService, SearchServService and MobileAppsService are exercised in full by their own
// dedicated spec files (gb-search.service.spec.ts, search-serv.service.spec.ts,
// mobile-apps.service.spec.ts). Here they are only ever used as inject() tokens, so stub classes
// keep Jest from loading (and coverage-instrumenting) their real implementations - and those of
// their own transitive dependencies (search-api.service.ts, navigation-external.service.ts) -
// against this unrelated component spec.
jest.mock('../../services/gb-search.service', () => ({
  GbSearchService: class GbSearchService { },
}))
jest.mock('../../../search/services/search-serv.service', () => ({
  SearchServService: class SearchServService { },
}))
jest.mock('./../../../services/mobile-apps.service', () => ({
  MobileAppsService: class MobileAppsService { },
}))

// The component uses inject() in field initializers and input()/output() signal APIs. None of
// these are usable outside an Angular injection context, so inject() is mocked to resolve mocks by
// token, and input()/output() are replaced with plain, framework-free equivalents. signal(),
// Component, ElementRef, HostListener, etc. are left untouched.
jest.mock('@angular/core', () => {
  const actual = jest.requireActual('@angular/core')
  return {
    ...actual,
    inject: jest.fn(),
    input: jest.fn((initialValue?: any) => {
      let value = initialValue
      const fn: any = () => value
      fn.set = (v: any) => { value = v }
      return fn
    }),
    output: jest.fn(() => ({ emit: jest.fn() })),
  }
})

import { SearchInputHomeV4Component } from './search-input-home-v4.component'

describe('SearchInputHomeV4Component (No TestBed)', () => {
  let component: SearchInputHomeV4Component
  let mockActivatedRoute: any
  let mockRouter: any
  let mockSearchServSvc: any
  let mockConfigSvc: any
  let mockElementRef: any
  let mockGbSearchSvc: any
  let mockContSvc: any
  let mockMobileAppsSvc: any
  let mockDomainConfSvc: any
  let queryParamMapSubject: Subject<any>

  const createComponent = () => new SearchInputHomeV4Component()

  beforeEach(() => {
    queryParamMapSubject = new Subject<any>()

    mockActivatedRoute = {
      snapshot: {
        queryParams: {},
        data: {},
      },
      queryParamMap: queryParamMapSubject.asObservable(),
      parent: {},
    }

    mockRouter = {
      navigate: jest.fn(),
    }

    mockSearchServSvc = {
      getSearchConfig: jest.fn().mockResolvedValue({ search: { isAutoCompleteAllowed: true } }),
    }

    mockConfigSvc = {
      unMappedUser: {
        profileDetails: {
          profileStatus: 'my-user',
          employmentDetails: { departmentName: 'other' },
        },
      },
      userProfileV2: { userRoles: [] },
      userRoles: new Set<string>(),
    }

    mockElementRef = {
      nativeElement: {
        contains: jest.fn().mockReturnValue(true),
      },
    }

    mockGbSearchSvc = {
      recentCreate: jest.fn().mockResolvedValue({}),
      recentRead: jest.fn().mockReturnValue(of({ result: { searchQueries: [] } })),
      recentDeleteByUser: jest.fn().mockReturnValue(of({ responseCode: 'OK' })),
      recentDeleteByTime: jest.fn().mockReturnValue(of({ responseCode: 'OK' })),
      fetchSearchDataByCategory: jest.fn().mockReturnValue(of({ result: { content: [] } })),
      searchConnections: jest.fn().mockResolvedValue({ result: { response: { content: [] } } }),
      searchCommunity: jest.fn().mockResolvedValue({ result: { search_results: { data: [] } } }),
      searchExternalContent: jest.fn().mockResolvedValue({ data: [] }),
      nlpSearch: jest.fn().mockResolvedValue({ data: { keywords: [] } }),
      searchCoursesv4: jest.fn().mockResolvedValue({ result: { content: [] } }),
      searchCoursesv5: jest.fn().mockResolvedValue({ result: { content: [] } }),
    }

    mockContSvc = {
      getResourseLink: jest.fn().mockResolvedValue({ url: '/content/1', queryParams: {} }),
    }

    mockMobileAppsSvc = {
      clearGlobalSearchForHomePage: new Subject<any>(),
    }

    mockDomainConfSvc = {
      isConfigEnabled: jest.fn().mockReturnValue(true),
      isApiEnabled: jest.fn().mockReturnValue(true),
      isSearchCategoriesEnabled: jest.fn().mockReturnValue(true),
      getSearchCategoriesConfig: jest.fn().mockReturnValue(null),
      isSearchCategoryEnabled: jest.fn().mockReturnValue(true),
    }

    ;(inject as unknown as jest.Mock).mockImplementation((token: any) => {
      if (token === ActivatedRoute) { return mockActivatedRoute }
      if (token === Router) { return mockRouter }
      if (token === SearchServService) { return mockSearchServSvc }
      if (token === ConfigurationsService) { return mockConfigSvc }
      if (token === ElementRef) { return mockElementRef }
      if (token === GbSearchService) { return mockGbSearchSvc }
      if (token === WidgetContentLibService) { return mockContSvc }
      if (token === MobileAppsService) { return mockMobileAppsSvc }
      if (token === DomainConfService) { return mockDomainConfSvc }
      return undefined
    })

    jest.spyOn(document, 'getElementById').mockReturnValue(null)
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { })

    component = createComponent()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should be created', () => {
    expect(component).toBeTruthy()
  })

  describe('onClickOutside', () => {
    it('closes the search template when the click is outside the host element', () => {
      mockElementRef.nativeElement.contains.mockReturnValue(false)
      component.openSearchTemplate.set(true)
      component.onClickOutside({ target: {} } as any)
      expect(component.openSearchTemplate()).toBe(false)
    })

    it('leaves the search template open when the click is inside the host element', () => {
      mockElementRef.nativeElement.contains.mockReturnValue(true)
      component.openSearchTemplate.set(true)
      component.onClickOutside({ target: {} } as any)
      expect(component.openSearchTemplate()).toBe(true)
    })
  })

  describe('ngOnInit', () => {
    it('initializes directly when searchPageData already exists', () => {
      mockActivatedRoute.snapshot.data = { searchPageData: { data: { search: {} } } }
      const initSpy = jest.spyOn(component, 'initialize')
      component.ngOnInit()
      expect(initSpy).toHaveBeenCalled()
      expect(mockSearchServSvc.getSearchConfig).not.toHaveBeenCalled()
    })

    it('fetches search config then initializes when searchPageData is missing', async () => {
      mockActivatedRoute.snapshot.data = {}
      const initSpy = jest.spyOn(component, 'initialize')
      component.ngOnInit()
      await Promise.resolve()
      await Promise.resolve()
      expect(mockSearchServSvc.getSearchConfig).toHaveBeenCalled()
      expect(initSpy).toHaveBeenCalled()
    })
  })

  describe('filterCategoriesByConfig', () => {
    it('reads enabled flags from DomainConfService', () => {
      mockDomainConfSvc.isConfigEnabled.mockImplementation((section: string) => section !== 'components.recentSearch')
      component.filterCategoriesByConfig()
      expect(component.allSearchResultsEnabled).toBe(true)
      expect(component.searchCategoriesEnabled).toBe(true)
    })

    it('filters categories using the search categories config when present', () => {
      mockDomainConfSvc.getSearchCategoriesConfig.mockReturnValue({ some: 'config' })
      mockDomainConfSvc.isSearchCategoryEnabled.mockImplementation((value: string) => value === SearchCategory.Courses)
      component.filterCategoriesByConfig()
      expect(component.categories.length).toBe(1)
      expect(component.categories[0].value).toBe(SearchCategory.Courses)
    })
  })

  describe('isCategoryEnabled', () => {
    it('delegates to DomainConfService', () => {
      mockDomainConfSvc.isSearchCategoryEnabled.mockReturnValue(false)
      expect(component.isCategoryEnabled(SearchCategory.Events)).toBe(false)
      expect(mockDomainConfSvc.isSearchCategoryEnabled).toHaveBeenCalledWith(SearchCategory.Events)
    })
  })

  describe('hasSearchPanelContent', () => {
    it('is true when categories are enabled and present', () => {
      component.searchCategoriesEnabled = true
      expect(component.hasSearchPanelContent).toBe(true)
    })

    it('is true when recent searches are enabled and present', () => {
      component.searchCategoriesEnabled = false
      component.categories = []
      component.recentSearchesEnabled = true
      component.recentSearches = [{ id: 1 }]
      expect(component.hasSearchPanelContent).toBe(true)
    })

    it('is true when all-search-results are enabled and present', () => {
      component.searchCategoriesEnabled = false
      component.categories = []
      component.recentSearchesEnabled = false
      component.allSearchResultsEnabled = true
      component.allSearchResults.set([{ id: 1 }])
      expect(component.hasSearchPanelContent).toBe(true)
    })

    it('is false when every section is disabled or empty', () => {
      component.searchCategoriesEnabled = false
      component.categories = []
      component.recentSearchesEnabled = false
      component.allSearchResultsEnabled = false
      component.allSearchResults.set([])
      expect(component.hasSearchPanelContent).toBe(false)
    })
  })

  describe('clearSearchTextElement', () => {
    it('resets the query control', () => {
      const setValueSpy = jest.spyOn(component.queryControl, 'setValue')
      component.clearSearchTextElement()
      expect(setValueSpy).toHaveBeenCalledWith('')
    })

    it('clears the native input value when present', () => {
      component.searchInput = { nativeElement: { value: 'abc' } } as any
      component.clearSearchTextElement()
      expect(component.searchInput.nativeElement.value).toBe('')
    })
  })

  describe('mobileAppsService integration', () => {
    it('clears the search text when the mobile clear signal fires', () => {
      const clearSpy = jest.spyOn(component, 'clearSearchTextElement')
      mockMobileAppsSvc.clearGlobalSearchForHomePage.next(true)
      expect(clearSpy).toHaveBeenCalled()
    })

    it('does nothing when the mobile clear signal is falsy', () => {
      const clearSpy = jest.spyOn(component, 'clearSearchTextElement')
      mockMobileAppsSvc.clearGlobalSearchForHomePage.next(false)
      expect(clearSpy).not.toHaveBeenCalled()
    })
  })

  describe('queryControl valueChanges pipeline', () => {
    it('searches and stops the loader for a non-empty value', async () => {
      const searchSpy = jest.spyOn(component, 'searchFromQuery').mockResolvedValue(undefined)
      component.loaderSearching.set(true)
      component.queryControl.setValue('angular')
      await new Promise(resolve => setTimeout(resolve, 600))
      expect(searchSpy).toHaveBeenCalledWith('angular')
      expect(component.loaderSearching()).toBe(false)
    })

    it('stops the loader without searching for an empty value', async () => {
      const searchSpy = jest.spyOn(component, 'searchFromQuery').mockResolvedValue(undefined)
      component.loaderSearching.set(true)
      component.queryControl.setValue('')
      await new Promise(resolve => setTimeout(resolve, 600))
      expect(searchSpy).not.toHaveBeenCalled()
      expect(component.loaderSearching()).toBe(false)
    })
  })

  describe('autoFilter', () => {
    it('subscribes to auto-complete search when allowed', async () => {
      mockActivatedRoute.snapshot.data = { searchPageData: { data: { search: { isAutoCompleteAllowed: true } } } }
      const searchSpy = jest.spyOn(component, 'searchFromQuery').mockResolvedValue(undefined)
      component.autoFilter()
      component.queryControl.setValue('a')
      await new Promise(resolve => setTimeout(resolve, 300))
      expect(searchSpy).toHaveBeenCalled()
    })

    it('does nothing when auto-complete is not a boolean', () => {
      mockActivatedRoute.snapshot.data = { searchPageData: { data: { search: { isAutoCompleteAllowed: 'yes' } } } }
      component.autoFilter()
      expect(component).toBeTruthy()
    })

    it('does nothing when there is no search page data', () => {
      mockActivatedRoute.snapshot.data = {}
      component.autoFilter()
      expect(component).toBeTruthy()
    })
  })

  describe('initialize', () => {
    it('disables the menu for a not-my-user in an igot org', () => {
      mockConfigSvc.unMappedUser = {
        profileDetails: {
          profileStatus: 'NOT-MY-USER',
          employmentDetails: { departmentName: 'IGOT' },
        },
      }
      component.initialize()
      expect(component.disableMenu()).toBe(true)
    })

    it('keeps the menu enabled otherwise', () => {
      component.initialize()
      expect(component.disableMenu()).toBe(false)
    })

    it('applies the query and category from the route params', () => {
      component.initialize()
      queryParamMapSubject.next({
        has: (key: string) => key === 'q' || key === 'category',
        get: (key: string) => (key === 'q' ? 'typescript' : SearchCategory.Events),
      })
      expect(component.queryControl.value).toBe('typescript')
      expect(component.selectedSearchCategory()).toBe(SearchCategory.Events)
    })

    it('defaults the category to Courses when absent from the route params', () => {
      component.initialize()
      queryParamMapSubject.next({
        has: () => false,
        get: () => null,
      })
      expect(component.selectedSearchCategory()).toBe(SearchCategory.Courses)
    })
  })

  describe('onSearchSubmit', () => {
    it('prevents the default event and updates the query', () => {
      const event = { preventDefault: jest.fn() } as any
      const updateSpy = jest.spyOn(component, 'updateQuery').mockResolvedValue(undefined)
      component.queryControl.setValue('react')
      component.onSearchSubmit(event)
      expect(event.preventDefault).toHaveBeenCalled()
      expect(updateSpy).toHaveBeenCalledWith('react')
    })
  })

  describe('updateQuery', () => {
    it('runs nlp search then processes the search text', async () => {
      const nlpSpy = jest.spyOn(component, 'searchInNLP').mockResolvedValue(undefined)
      const processSpy = jest.spyOn(component, 'processSearchText').mockImplementation(() => { })
      await component.updateQuery('angular')
      expect(nlpSpy).toHaveBeenCalledWith('angular')
      expect(processSpy).toHaveBeenCalledWith('angular')
    })

    it('still processes the search text when nlp search rejects', async () => {
      jest.spyOn(component, 'searchInNLP').mockRejectedValue(new Error('nlp failed'))
      const processSpy = jest.spyOn(component, 'processSearchText').mockImplementation(() => { })
      await component.updateQuery('angular')
      expect(processSpy).toHaveBeenCalledWith('angular')
    })

    it('processes an empty query without calling nlp search', async () => {
      const nlpSpy = jest.spyOn(component, 'searchInNLP')
      const processSpy = jest.spyOn(component, 'processSearchText').mockImplementation(() => { })
      await component.updateQuery('')
      expect(nlpSpy).not.toHaveBeenCalled()
      expect(processSpy).toHaveBeenCalledWith('')
    })
  })

  describe('updateRecentSearchQuery', () => {
    it('processes the recent search text directly when disabled', async () => {
      component.recentSearchesEnabled = false
      const processSpy = jest.spyOn(component, 'processRecentSearchText').mockImplementation(() => { })
      await component.updateRecentSearchQuery({ search_query: 'x' })
      expect(mockGbSearchSvc.recentCreate).not.toHaveBeenCalled()
      expect(processSpy).toHaveBeenCalled()
    })

    it('creates the recent search then processes it when a query is provided', async () => {
      const query = { nlp_search_query: 'a', search_query: 'a', search_category: ['courses'] }
      const processSpy = jest.spyOn(component, 'processRecentSearchText').mockImplementation(() => { })
      await component.updateRecentSearchQuery(query)
      expect(mockGbSearchSvc.recentCreate).toHaveBeenCalled()
      expect(processSpy).toHaveBeenCalledWith(query)
    })

    it('still processes the query when recentCreate rejects', async () => {
      mockGbSearchSvc.recentCreate.mockRejectedValue(new Error('failed'))
      const query = { nlp_search_query: 'a', search_query: 'a', search_category: ['courses'] }
      const processSpy = jest.spyOn(component, 'processRecentSearchText').mockImplementation(() => { })
      await component.updateRecentSearchQuery(query)
      expect(processSpy).toHaveBeenCalledWith(query)
    })

    it('processes a falsy query directly', async () => {
      const processSpy = jest.spyOn(component, 'processRecentSearchText').mockImplementation(() => { })
      await component.updateRecentSearchQuery(null)
      expect(mockGbSearchSvc.recentCreate).not.toHaveBeenCalled()
      expect(processSpy).toHaveBeenCalledWith(null)
    })
  })

  describe('createRecent', () => {
    it('does nothing when recent searches are disabled', async () => {
      component.recentSearchesEnabled = false
      await component.createRecent('kw')
      expect(mockGbSearchSvc.recentCreate).not.toHaveBeenCalled()
    })

    it('creates a recent search entry', async () => {
      component.queryControl.setValue('kw query')
      component.selectedSearchCategory.set(SearchCategory.Courses)
      await component.createRecent('kw')
      expect(mockGbSearchSvc.recentCreate).toHaveBeenCalledWith(expect.objectContaining({
        nlpSearchQuery: 'kw',
        searchQuery: 'kw query',
        searchCategory: SearchCategory.Courses,
      }))
    })
  })

  describe('readRecent', () => {
    it('does nothing when recent searches are disabled', () => {
      component.recentSearchesEnabled = false
      const result = component.readRecent()
      expect(result).toBeUndefined()
      expect(component.recentSearches).toBe('')
    })

    it('sets recentSearches from the response', () => {
      mockGbSearchSvc.recentRead.mockReturnValue(of({ result: { searchQueries: [{ id: 1 }] } }))
      component.readRecent()
      expect(component.recentSearches).toEqual([{ id: 1 }])
    })

    it('clears recentSearches when the response has no searchQueries', () => {
      mockGbSearchSvc.recentRead.mockReturnValue(of({ result: {} }))
      component.readRecent()
      expect(component.recentSearches).toBe('')
    })

    it('leaves recentSearches untouched for a falsy response', () => {
      mockGbSearchSvc.recentRead.mockReturnValue(of(null))
      component.recentSearches = 'previous'
      component.readRecent()
      expect(component.recentSearches).toBe('previous')
    })
  })

  describe('goToSearchItem', () => {
    it('dispatches to the matching category handler', () => {
      const query = { search_category: ['courses'], nlp_search_query: 'kw' }
      const searchCoursesSpy = jest.spyOn(component as any, 'searchCourses').mockImplementation(() => { })
      component.goToSearchItem(query)
      expect(searchCoursesSpy).toHaveBeenCalledWith('kw', query)
    })

    it('does nothing without a category or nlp query', () => {
      const searchCoursesSpy = jest.spyOn(component as any, 'searchCourses').mockImplementation(() => { })
      component.goToSearchItem({ search_category: [], nlp_search_query: '' })
      expect(searchCoursesSpy).not.toHaveBeenCalled()
    })
  })

  describe('category search helpers', () => {
    const query = { search_category: ['courses'], nlp_search_query: 'kw' }

    it('searchCourses fetches by category and updates the recent search', () => {
      const updateSpy = jest.spyOn(component, 'updateRecentSearchQuery').mockResolvedValue(undefined)
      ;(component as any).searchCourses('kw', query)
      expect(mockGbSearchSvc.fetchSearchDataByCategory).toHaveBeenCalled()
      expect(updateSpy).toHaveBeenCalledWith(query)
    })

    it('searchCourses does not update recent search when the response is empty', () => {
      mockGbSearchSvc.fetchSearchDataByCategory.mockReturnValue(of(null))
      const updateSpy = jest.spyOn(component, 'updateRecentSearchQuery').mockResolvedValue(undefined)
      ;(component as any).searchCourses('kw', query)
      expect(updateSpy).not.toHaveBeenCalled()
    })

    it('searchEvents fetches by category and updates the recent search', () => {
      const updateSpy = jest.spyOn(component, 'updateRecentSearchQuery').mockResolvedValue(undefined)
      ;(component as any).searchEvents('kw', query)
      expect(mockGbSearchSvc.fetchSearchDataByCategory).toHaveBeenCalled()
      expect(updateSpy).toHaveBeenCalledWith(query)
    })

    it('searchPeoples resolves and updates the recent search', async () => {
      const updateSpy = jest.spyOn(component, 'updateRecentSearchQuery').mockResolvedValue(undefined)
      ;(component as any).searchPeoples('kw', query)
      await Promise.resolve()
      await Promise.resolve()
      expect(mockGbSearchSvc.searchConnections).toHaveBeenCalled()
      expect(updateSpy).toHaveBeenCalledWith(query)
    })

    it('searchPeoples logs the error on rejection', async () => {
      mockGbSearchSvc.searchConnections.mockRejectedValue(new Error('boom'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { })
      ;(component as any).searchPeoples('kw', query)
      await Promise.resolve()
      await Promise.resolve()
      expect(consoleSpy).toHaveBeenCalled()
    })

    it('searchResources fetches by category and updates the recent search', () => {
      const updateSpy = jest.spyOn(component, 'updateRecentSearchQuery').mockResolvedValue(undefined)
      ;(component as any).searchResources('kw', query)
      expect(mockGbSearchSvc.fetchSearchDataByCategory).toHaveBeenCalled()
      expect(updateSpy).toHaveBeenCalledWith(query)
    })

    it('searchCommunities fetches by category and updates the recent search', () => {
      const updateSpy = jest.spyOn(component, 'updateRecentSearchQuery').mockResolvedValue(undefined)
      ;(component as any).searchCommunities('kw', query)
      expect(mockGbSearchSvc.fetchSearchDataByCategory).toHaveBeenCalled()
      expect(updateSpy).toHaveBeenCalledWith(query)
    })

    it('searchAll triggers every category search', () => {
      const coursesSpy = jest.spyOn(component as any, 'searchCourses').mockImplementation(() => { })
      const eventsSpy = jest.spyOn(component as any, 'searchEvents').mockImplementation(() => { })
      const peoplesSpy = jest.spyOn(component as any, 'searchPeoples').mockImplementation(() => { })
      const resourcesSpy = jest.spyOn(component as any, 'searchResources').mockImplementation(() => { })
      const communitiesSpy = jest.spyOn(component as any, 'searchCommunities').mockImplementation(() => { })
      ;(component as any).searchAll('kw', query)
      expect(coursesSpy).toHaveBeenCalled()
      expect(eventsSpy).toHaveBeenCalled()
      expect(peoplesSpy).toHaveBeenCalled()
      expect(resourcesSpy).toHaveBeenCalled()
      expect(communitiesSpy).toHaveBeenCalled()
    })
  })

  describe('processSearchByCategory', () => {
    const query = { some: 'query' }

    it.each([
      ['courses', 'searchCourses'],
      ['events', 'searchEvents'],
      ['peoples', 'searchPeoples'],
      ['resources', 'searchResources'],
      ['communities', 'searchCommunities'],
      ['all', 'searchAll'],
    ])('dispatches %s to %s', (category, method) => {
      const spy = jest.spyOn(component as any, method).mockImplementation(() => { })
      ;(component as any).processSearchByCategory(category, 'kw', query)
      expect(spy).toHaveBeenCalledWith('kw', query)
    })

    it('does nothing for an unknown category', () => {
      expect(() => (component as any).processSearchByCategory('unknown', 'kw', query)).not.toThrow()
    })
  })

  describe('recentDeleteByUserId', () => {
    it('does nothing when disabled', () => {
      component.recentSearchesEnabled = false
      const result = component.recentDeleteByUserId()
      expect(result).toBeUndefined()
      expect(mockGbSearchSvc.recentDeleteByUser).not.toHaveBeenCalled()
    })

    it('reloads recent searches on a successful delete', () => {
      const readSpy = jest.spyOn(component, 'readRecent').mockImplementation(() => undefined)
      component.recentDeleteByUserId()
      expect(readSpy).toHaveBeenCalled()
    })

    it('does not reload when the delete does not return OK', () => {
      mockGbSearchSvc.recentDeleteByUser.mockReturnValue(of({ responseCode: 'FAILED' }))
      const readSpy = jest.spyOn(component, 'readRecent').mockImplementation(() => undefined)
      component.recentDeleteByUserId()
      expect(readSpy).not.toHaveBeenCalled()
    })
  })

  describe('recentDeleteByTimeStamp', () => {
    it('does nothing when disabled', () => {
      component.recentSearchesEnabled = false
      const result = component.recentDeleteByTimeStamp('123')
      expect(result).toBeUndefined()
      expect(mockGbSearchSvc.recentDeleteByTime).not.toHaveBeenCalled()
    })

    it('reloads recent searches on success', () => {
      const readSpy = jest.spyOn(component, 'readRecent').mockImplementation(() => undefined)
      component.recentDeleteByTimeStamp('123')
      expect(mockGbSearchSvc.recentDeleteByTime).toHaveBeenCalledWith('123')
      expect(readSpy).toHaveBeenCalled()
    })
  })

  describe('processRecentSearchText', () => {
    it('navigates to the global search route for the home ref', () => {
      component.ref = (() => 'home') as any
      const query = { nlp_search_query: ' kw ', search_category: ['courses'] }
      component.processRecentSearchText(query)
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/app/globalsearch'],
        expect.objectContaining({ queryParams: expect.objectContaining({ q: 'kw', category: 'courses' }) })
      )
    })

    it('navigates relative to the parent route for a non-home ref', () => {
      component.ref = (() => 'panel') as any
      const query = { nlp_search_query: 'kw', search_category: ['courses'] }
      component.processRecentSearchText(query)
      expect(mockRouter.navigate).toHaveBeenCalledWith([], expect.objectContaining({ relativeTo: mockActivatedRoute.parent }))
    })
  })

  describe('processSearchText', () => {
    it('navigates to the volunteer-aware global search route', () => {
      mockConfigSvc.userRoles = new Set(['volunteer'])
      component.ref = (() => 'home') as any
      component.processSearchText('angular')
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/app/globalsearch/volunteer'],
        expect.objectContaining({ queryParams: expect.objectContaining({ q: 'angular' }) })
      )
    })

    it('navigates relative to the parent route for a non-home ref', () => {
      component.ref = (() => 'panel') as any
      component.processSearchText('angular')
      expect(mockRouter.navigate).toHaveBeenCalledWith([], expect.objectContaining({ relativeTo: mockActivatedRoute.parent }))
    })
  })

  describe('clearSearchText', () => {
    it('resets the query control and re-opens the search template', () => {
      jest.useFakeTimers()
      const updateSpy = jest.spyOn(component, 'updateQuery').mockResolvedValue(undefined)
      const resetSpy = jest.spyOn(component.queryControl, 'reset')
      component.clearSearchText()
      jest.runAllTimers()
      expect(resetSpy).toHaveBeenCalled()
      expect(updateSpy).toHaveBeenCalledWith('')
      expect(component.openSearchTemplate()).toBe(true)
      jest.useRealTimers()
    })
  })

  describe('selectSearchCategory', () => {
    it('sets the category and re-runs the query when one exists', async () => {
      component.queryControl.setValue('angular')
      const updateSpy = jest.spyOn(component, 'updateQuery').mockResolvedValue(undefined)
      await component.selectSearchCategory(SearchCategory.Events)
      expect(component.selectedSearchCategory()).toBe(SearchCategory.Events)
      expect(updateSpy).toHaveBeenCalledWith('angular')
    })

    it('does nothing without an existing query', async () => {
      component.queryControl.setValue('')
      const updateSpy = jest.spyOn(component, 'updateQuery')
      await component.selectSearchCategory(SearchCategory.Events)
      expect(updateSpy).not.toHaveBeenCalled()
    })
  })

  describe('searchFromQuery', () => {
    it('clears results and returns early when all-search-results is disabled', async () => {
      component.allSearchResultsEnabled = false
      await component.searchFromQuery('angular')
      expect(component.allSearchResults()).toEqual([])
      expect(mockGbSearchSvc.searchCoursesv5).not.toHaveBeenCalled()
    })

    it('uses the v5 course search for the Courses category', async () => {
      component.selectedSearchCategory.set(SearchCategory.Courses)
      mockGbSearchSvc.searchCoursesv5.mockResolvedValue({ result: { content: [{ id: 1 }] } })
      await component.searchFromQuery('angular')
      expect(mockGbSearchSvc.searchCoursesv5).toHaveBeenCalled()
      expect(mockGbSearchSvc.searchCoursesv4).not.toHaveBeenCalled()
      expect(component.allSearchResults()).toEqual([{ id: 1 }])
    })

    it('falls back to v4 course search for a non-Courses category', async () => {
      component.selectedSearchCategory.set(SearchCategory.All)
      mockGbSearchSvc.searchCoursesv4.mockResolvedValue({ result: { Event: [{ id: 2 }] } })
      await component.searchFromQuery('angular')
      expect(mockGbSearchSvc.searchCoursesv4).toHaveBeenCalled()
      expect(mockGbSearchSvc.searchCoursesv5).not.toHaveBeenCalled()
      expect(component.allSearchResults()).toEqual([{ id: 2 }])
    })

    it('sets empty results when the course search returns no matching keys', async () => {
      component.selectedSearchCategory.set(SearchCategory.Courses)
      mockGbSearchSvc.searchCoursesv5.mockResolvedValue({ result: {} })
      await component.searchFromQuery('angular')
      expect(component.allSearchResults()).toEqual([])
    })

    it('propagates the rejection when the course search rejects, since .catch() with no handler does not suppress it', async () => {
      component.selectedSearchCategory.set(SearchCategory.Courses)
      mockGbSearchSvc.searchCoursesv5.mockRejectedValue(new Error('fail'))
      await expect(component.searchFromQuery('angular')).rejects.toThrow('fail')
    })

    it('builds Programs, CaseStudy, Events and Resources filters', async () => {
      mockGbSearchSvc.searchCoursesv4.mockResolvedValue({ result: {} })
      component.selectedSearchCategory.set(SearchCategory.Programs)
      await component.searchFromQuery('angular')

      component.selectedSearchCategory.set(SearchCategory.CaseStudy)
      await component.searchFromQuery('angular')

      component.selectedSearchCategory.set(SearchCategory.Events)
      await component.searchFromQuery('angular')

      component.selectedSearchCategory.set(SearchCategory.Resources)
      await component.searchFromQuery('angular')

      expect(mockGbSearchSvc.searchCoursesv4).toHaveBeenCalledTimes(4)
    })

    it('searches people and stores the response content', async () => {
      component.selectedSearchCategory.set(SearchCategory.People)
      mockGbSearchSvc.searchConnections.mockResolvedValue({ result: { response: { content: [{ id: 3 }] } } })
      await component.searchFromQuery('angular')
      expect(mockGbSearchSvc.searchConnections).toHaveBeenCalled()
      expect(component.allSearchResults()).toEqual([{ id: 3 }])
    })

    it('clears results when the people search has no content', async () => {
      component.selectedSearchCategory.set(SearchCategory.People)
      mockGbSearchSvc.searchConnections.mockResolvedValue({ result: { response: { content: [] } } })
      await component.searchFromQuery('angular')
      expect(component.allSearchResults()).toEqual([])
    })

    it('clears results when the people search rejects', async () => {
      component.selectedSearchCategory.set(SearchCategory.People)
      mockGbSearchSvc.searchConnections.mockRejectedValue(new Error('fail'))
      await component.searchFromQuery('angular')
      expect(component.allSearchResults()).toEqual([])
    })

    it('searches communities and stores the response data', async () => {
      component.selectedSearchCategory.set(SearchCategory.Communities)
      mockGbSearchSvc.searchCommunity.mockResolvedValue({ result: { search_results: { data: [{ id: 4 }] } } })
      await component.searchFromQuery('angular')
      expect(mockGbSearchSvc.searchCommunity).toHaveBeenCalled()
      expect(component.allSearchResults()).toEqual([{ id: 4 }])
    })

    it('clears results when the community search has no data', async () => {
      component.selectedSearchCategory.set(SearchCategory.Communities)
      mockGbSearchSvc.searchCommunity.mockResolvedValue({ result: {} })
      await component.searchFromQuery('angular')
      expect(component.allSearchResults()).toEqual([])
    })

    it('clears results when the community search rejects', async () => {
      component.selectedSearchCategory.set(SearchCategory.Communities)
      mockGbSearchSvc.searchCommunity.mockRejectedValue(new Error('fail'))
      await component.searchFromQuery('angular')
      expect(component.allSearchResults()).toEqual([])
    })

    it('searches external content and stores the response data', async () => {
      component.selectedSearchCategory.set(SearchCategory.ExternalContents)
      mockGbSearchSvc.searchExternalContent.mockResolvedValue({ data: [{ id: 5 }] })
      await component.searchFromQuery('angular')
      expect(mockGbSearchSvc.searchExternalContent).toHaveBeenCalled()
      expect(component.allSearchResults()).toEqual([{ id: 5 }])
    })

    it('clears results when external content search has no data', async () => {
      component.selectedSearchCategory.set(SearchCategory.ExternalContents)
      mockGbSearchSvc.searchExternalContent.mockResolvedValue({ data: [] })
      await component.searchFromQuery('angular')
      expect(component.allSearchResults()).toEqual([])
    })

    it('clears results when external content search rejects', async () => {
      component.selectedSearchCategory.set(SearchCategory.ExternalContents)
      mockGbSearchSvc.searchExternalContent.mockRejectedValue(new Error('fail'))
      await component.searchFromQuery('angular')
      expect(component.allSearchResults()).toEqual([])
    })
  })

  describe('getResultName', () => {
    it('returns an empty string for a falsy result', () => {
      expect(component.getResultName(null)).toBe('')
    })

    it('returns the first name for a people result', () => {
      component.selectedSearchCategory.set(SearchCategory.People)
      expect(component.getResultName({ personalDetails: { firstname: 'Ann' } })).toBe('Ann')
      expect(component.getResultName({ firstName: 'Bob' })).toBe('Bob')
    })

    it('returns the community name for a communities result', () => {
      component.selectedSearchCategory.set(SearchCategory.Communities)
      expect(component.getResultName({ communityName: 'Devs' })).toBe('Devs')
    })

    it('returns the name for any other category', () => {
      component.selectedSearchCategory.set(SearchCategory.Courses)
      expect(component.getResultName({ name: 'Course 1' })).toBe('Course 1')
    })
  })

  describe('redirectToContent', () => {
    it('routes to the user profile for a people result', () => {
      component.selectedSearchCategory.set(SearchCategory.People)
      const profileSpy = jest.spyOn(component, 'goToUserProfile').mockImplementation(() => { })
      component.redirectToContent({ userId: '1' })
      expect(profileSpy).toHaveBeenCalled()
      expect(component.openSearchTemplate()).toBe(false)
    })

    it('does nothing extra for a communities result', () => {
      component.selectedSearchCategory.set(SearchCategory.Communities)
      const redirectSpy = jest.spyOn(component, 'getRedirectUrlData')
      component.redirectToContent({ communityName: 'Devs' })
      expect(redirectSpy).not.toHaveBeenCalled()
    })

    it('resolves the redirect url for any other category', () => {
      component.selectedSearchCategory.set(SearchCategory.Courses)
      const redirectSpy = jest.spyOn(component, 'getRedirectUrlData').mockResolvedValue(undefined)
      component.redirectToContent({ identifier: '1' })
      expect(redirectSpy).toHaveBeenCalled()
    })
  })

  describe('goToUserProfile', () => {
    it('navigates using the userId', () => {
      component.goToUserProfile({ userId: 'u1' })
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/person-profile', 'u1'], { fragment: 'profileInfo' })
    })

    it('falls back to id then wid', () => {
      component.goToUserProfile({ id: 'u2' })
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/person-profile', 'u2'], { fragment: 'profileInfo' })
      component.goToUserProfile({ wid: 'u3' })
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/person-profile', 'u3'], { fragment: 'profileInfo' })
    })
  })

  describe('getRedirectUrlData', () => {
    it('navigates to the event hub for an Event content', async () => {
      await component.getRedirectUrlData({ objectType: 'Event', identifier: 'ev1' })
      expect(mockRouter.navigate).toHaveBeenCalledWith(['app/event-hub/home/ev1'])
    })

    it('resolves the resource link and navigates for other content', async () => {
      mockContSvc.getResourseLink.mockResolvedValue({ url: '/content/2', queryParams: { a: 1 } })
      await component.getRedirectUrlData({ identifier: 'c1' })
      expect(mockContSvc.getResourseLink).toHaveBeenCalled()
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/content/2'], { queryParams: { a: 1 } })
    })
  })

  describe('searchInNLP', () => {
    it('sets the response query and creates+reads recent search when keywords exist', async () => {
      mockGbSearchSvc.nlpSearch.mockResolvedValue({ data: { keywords: [{ keyword: 'kw1' }] } })
      const createSpy = jest.spyOn(component, 'createRecent').mockResolvedValue(undefined)
      const readSpy = jest.spyOn(component, 'readRecent').mockImplementation(() => undefined)
      await component.searchInNLP('angular')
      expect(component.responseNlpQuery()).toBe('kw1')
      expect(createSpy).toHaveBeenCalledWith('kw1')
      expect(readSpy).toHaveBeenCalled()
    })

    it('clears the response query when there are no keywords', async () => {
      mockGbSearchSvc.nlpSearch.mockResolvedValue({ data: { keywords: [] } })
      await component.searchInNLP('angular')
      expect(component.responseNlpQuery()).toBe('')
    })

    it('clears the response query when there is no data', async () => {
      mockGbSearchSvc.nlpSearch.mockResolvedValue({})
      await component.searchInNLP('angular')
      expect(component.responseNlpQuery()).toBe('')
    })

    it('propagates the rejection when nlp search rejects, since .catch() with no handler does not suppress it', async () => {
      mockGbSearchSvc.nlpSearch.mockRejectedValue(new Error('fail'))
      await expect(component.searchInNLP('angular')).rejects.toThrow('fail')
    })
  })

  describe('openSearchTemplateF', () => {
    it('opens the template and reads recent searches once', () => {
      const readSpy = jest.spyOn(component, 'readRecent').mockImplementation(() => undefined)
      component.openSearchTemplateF()
      component.openSearchTemplateF()
      expect(component.openSearchTemplate()).toBe(true)
      expect(readSpy).toHaveBeenCalledTimes(1)
    })

    it('does not read recent searches when disabled', () => {
      component.recentSearchesEnabled = false
      const readSpy = jest.spyOn(component, 'readRecent')
      component.openSearchTemplateF()
      expect(readSpy).not.toHaveBeenCalled()
    })
  })

  describe('searchLanguage', () => {
    it('sets the search locale', () => {
      component.searchLanguage('fr')
      expect(component.searchLocale()).toBe('fr')
    })
  })

  describe('ngOnDestroy', () => {
    it('unsubscribes both subscriptions', () => {
      const searchSub = { unsubscribe: jest.fn() }
      const querySub = { unsubscribe: jest.fn() }
      ;(component as any).searchSubscription = searchSub
      ;(component as any).querySubscription = querySub
      component.ngOnDestroy()
      expect(searchSub.unsubscribe).toHaveBeenCalled()
      expect(querySub.unsubscribe).toHaveBeenCalled()
    })

    it('handles missing subscriptions gracefully', () => {
      ;(component as any).searchSubscription = undefined
      ;(component as any).querySubscription = undefined
      expect(() => component.ngOnDestroy()).not.toThrow()
    })
  })
})
