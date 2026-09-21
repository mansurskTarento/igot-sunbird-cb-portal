import { of } from 'rxjs'
import { SearchV4Request, SearchPeoplesRequest, SearchCommunitiesRequest, SearchExternalRequest, SearchNLP } from '../models/search-v3.model'

// `gb-search.service.ts` pulls SEARCH_SORT_DROPDOWN in from the `@ws/author` barrel, which in turn
// drags in unrelated modules with broken non-relative imports that Jest cannot resolve. Mocking the
// barrel keeps this spec isolated from that unrelated breakage.
jest.mock('@ws/author', () => ({
  SEARCH_SORT_DROPDOWN: [
    { name: 'Most Relevant', value: 'most_relevant' },
    { name: 'Recently Added (Newest)', value: 'recently_added_newest' },
    { name: 'Highest Rated', value: 'highest_rated' },
    { name: 'A-Z', value: 'a-z' },
    { name: 'Z-A', value: 'z-a' },
  ],
}))

import { GbSearchService } from './gb-search.service'

describe('GbSearchService (No TestBed)', () => {
  let service: GbSearchService
  let mockHttp: any
  let mockConfigSrv: any
  let mockSearchApi: any
  let mockDomainConfSvc: any

  beforeEach(() => {
    mockHttp = {
      post: jest.fn().mockReturnValue(of({ result: 'post-ok' })),
      get: jest.fn().mockReturnValue(of({ result: 'get-ok' })),
      delete: jest.fn().mockReturnValue(of({ result: 'delete-ok' })),
    }

    mockConfigSrv = {
      sitePath: 'https://site.example.com',
      userProfile: { userRootOrg: 'org-1' },
    }

    mockSearchApi = {
      getSearchAutoCompleteResults: jest.fn().mockReturnValue(of([{ id: '1' }])),
    }

    mockDomainConfSvc = {
      getApiUrl: jest.fn().mockImplementation((_service: any, _apiKey: any, defaultUrl?: any) => defaultUrl || '/default'),
      isApiEnabled: jest.fn().mockReturnValue(true),
    }

    service = new GbSearchService(mockHttp, mockConfigSrv, mockSearchApi, mockDomainConfSvc)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('fetchSearchData', () => {
    it('should post when url is configured', () => {
      mockDomainConfSvc.getApiUrl.mockReturnValue('/search-url')
      service.fetchSearchData({ query: 'a' }).subscribe((res: any) => {
        expect(res).toEqual({ result: 'post-ok' })
      })
      expect(mockHttp.post).toHaveBeenCalledWith('/search-url', { query: 'a' })
    })

    it('should return of(null) when url is not configured', done => {
      mockDomainConfSvc.getApiUrl.mockReturnValue('')
      service.fetchSearchData({ query: 'a' }).subscribe((res: any) => {
        expect(res).toBeNull()
        expect(mockHttp.post).not.toHaveBeenCalled()
        done()
      })
    })
  })

  describe('fetchSearchDataByCategory', () => {
    it('should post the request', () => {
      service.fetchSearchDataByCategory({ query: 'course' }).subscribe()
      expect(mockHttp.post).toHaveBeenCalled()
    })
  })

  describe('fetchSearchDataforCios', () => {
    it('should post the request', () => {
      service.fetchSearchDataforCios({ query: 'cios' }).subscribe()
      expect(mockHttp.post).toHaveBeenCalled()
    })
  })

  describe('notifyOther / notifyObservable$', () => {
    it('should emit when data is truthy', () => {
      const spy = jest.fn()
      service.notifyObservable$.subscribe(spy)
      service.notifyOther({ some: 'data' })
      expect(spy).toHaveBeenCalledWith({ some: 'data' })
    })

    it('should not emit when data is falsy', () => {
      const spy = jest.fn()
      service.notifyObservable$.subscribe(spy)
      service.notifyOther(null)
      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('getSearchConfig', () => {
    it('should fetch and cache the config on first call', async () => {
      mockHttp.get.mockReturnValue({ toPromise: jest.fn().mockResolvedValue({ search: {} }) })
      const result = await service.getSearchConfig()
      expect(mockHttp.get).toHaveBeenCalledWith(`${mockConfigSrv.sitePath}/feature/search.json`)
      expect(result).toEqual({ search: {} })
    })

    it('should reuse cached config on subsequent calls', async () => {
      mockHttp.get.mockReturnValue({ toPromise: jest.fn().mockResolvedValue({ search: {} }) })
      await service.getSearchConfig()
      mockHttp.get.mockClear()
      const result = await service.getSearchConfig()
      expect(mockHttp.get).not.toHaveBeenCalled()
      expect(result).toEqual({ search: {} })
    })
  })

  describe('searchAutoComplete', () => {
    it('should call the api when a single non-all language is provided', async () => {
      const result = await service.searchAutoComplete({ q: 'ABC', l: 'en' } as any)
      expect(mockSearchApi.getSearchAutoCompleteResults).toHaveBeenCalled()
      expect(result).toEqual([{ id: '1' }])
    })

    it('should resolve to empty array for multiple languages', async () => {
      const result = await service.searchAutoComplete({ q: 'ABC', l: 'en,fr' } as any)
      expect(result).toEqual([])
    })

    it('should resolve to empty array when language is "all"', async () => {
      const result = await service.searchAutoComplete({ q: 'ABC', l: 'all' } as any)
      expect(result).toEqual([])
    })
  })

  describe('searchCoursesv4', () => {
    it('should post to the default v4 url', async () => {
      mockHttp.post.mockReturnValue({ toPromise: jest.fn().mockResolvedValue({ result: 'v4' }) })
      const req = new SearchV4Request([])
      const result = await service.searchCoursesv4(req)
      expect(mockDomainConfSvc.getApiUrl).toHaveBeenCalledWith('search', 'searchV4', expect.any(String))
      expect(result).toEqual({ result: 'v4' })
    })

    it('should post to the provided override url', async () => {
      mockHttp.post.mockReturnValue({ toPromise: jest.fn().mockResolvedValue({ result: 'v4-override' }) })
      const req = new SearchV4Request([])
      await service.searchCoursesv4(req, '/custom-v4')
      expect(mockHttp.post).toHaveBeenCalledWith('/custom-v4', req)
    })
  })

  describe('searchCoursesv5', () => {
    it('should post to the default v5 url', async () => {
      mockHttp.post.mockReturnValue({ toPromise: jest.fn().mockResolvedValue({ result: 'v5' }) })
      const req = new SearchV4Request([])
      const result = await service.searchCoursesv5(req)
      expect(mockDomainConfSvc.getApiUrl).toHaveBeenCalledWith('search', 'searchV5', expect.any(String))
      expect(result).toEqual({ result: 'v5' })
    })

    it('should post to the provided override url', async () => {
      mockHttp.post.mockReturnValue({ toPromise: jest.fn().mockResolvedValue({ result: 'v5-override' }) })
      const req = new SearchV4Request([])
      await service.searchCoursesv5(req, '/custom-v5')
      expect(mockHttp.post).toHaveBeenCalledWith('/custom-v5', req)
    })
  })

  describe('searchVolunteerCourses', () => {
    it('should post to the volunteer search url', async () => {
      mockHttp.post.mockReturnValue({ toPromise: jest.fn().mockResolvedValue({ result: 'vol' }) })
      const req = new SearchV4Request([])
      const result = await service.searchVolunteerCourses(req)
      expect(result).toEqual({ result: 'vol' })
    })
  })

  describe('searchVolunteerCoursesComposite', () => {
    it('should send the org id header when userRootOrg is a string', async () => {
      mockHttp.post.mockReturnValue({ toPromise: jest.fn().mockResolvedValue({ result: 'composite' }) })
      mockConfigSrv.userProfile = { userRootOrg: 'org-string' }
      await service.searchVolunteerCoursesComposite({ query: 'x' })
      expect(mockHttp.post).toHaveBeenCalledWith(
        expect.any(String),
        { query: 'x' },
        expect.objectContaining({ headers: expect.anything() })
      )
    })

    it('should send the org id header when userRootOrg is an object', async () => {
      mockHttp.post.mockReturnValue({ toPromise: jest.fn().mockResolvedValue({ result: 'composite' }) })
      mockConfigSrv.userProfile = { userRootOrg: { id: 'org-object' } }
      await service.searchVolunteerCoursesComposite({ query: 'x' })
      expect(mockHttp.post).toHaveBeenCalled()
    })

    it('should handle a missing userProfile', async () => {
      mockHttp.post.mockReturnValue({ toPromise: jest.fn().mockResolvedValue({ result: 'composite' }) })
      mockConfigSrv.userProfile = undefined
      const result = await service.searchVolunteerCoursesComposite({ query: 'x' })
      expect(result).toEqual({ result: 'composite' })
    })
  })

  describe('getApplicationsById', () => {
    it('should post when url is configured', () => {
      mockDomainConfSvc.getApiUrl.mockReturnValue('/applications-url')
      service.getApplicationsById({ ids: ['1'] }).subscribe()
      expect(mockHttp.post).toHaveBeenCalledWith('/applications-url', { ids: ['1'] })
    })

    it('should return of(null) when url is not configured', done => {
      mockDomainConfSvc.getApiUrl.mockReturnValue('')
      service.getApplicationsById({ ids: ['1'] }).subscribe((res: any) => {
        expect(res).toBeNull()
        done()
      })
    })
  })

  describe('searchConnections', () => {
    it('should wrap params in a request body', async () => {
      mockHttp.post.mockReturnValue({ toPromise: jest.fn().mockResolvedValue({ result: 'people' }) })
      const req = new SearchPeoplesRequest()
      const result = await service.searchConnections(req)
      expect(mockHttp.post).toHaveBeenCalledWith(expect.any(String), { request: req })
      expect(result).toEqual({ result: 'people' })
    })
  })

  describe('searchCommunity', () => {
    it('should post the community search request', async () => {
      mockHttp.post.mockReturnValue({ toPromise: jest.fn().mockResolvedValue({ result: 'community' }) })
      const req = new SearchCommunitiesRequest([])
      const result = await service.searchCommunity(req)
      expect(result).toEqual({ result: 'community' })
    })
  })

  describe('searchResource', () => {
    it('should post when url is configured', async () => {
      mockDomainConfSvc.getApiUrl.mockReturnValue('/resource-url')
      mockHttp.post.mockReturnValue({ toPromise: jest.fn().mockResolvedValue({ result: 'resource' }) })
      const req = new SearchV4Request([])
      const result = await service.searchResource(req)
      expect(result).toEqual({ result: 'resource' })
    })

    it('should resolve null when url is not configured', async () => {
      mockDomainConfSvc.getApiUrl.mockReturnValue('')
      const req = new SearchV4Request([])
      const result = await service.searchResource(req)
      expect(result).toBeNull()
    })
  })

  describe('nlpSearch', () => {
    it('should post when url is configured', async () => {
      mockDomainConfSvc.getApiUrl.mockReturnValue('/nlp-url')
      mockHttp.post.mockReturnValue({ toPromise: jest.fn().mockResolvedValue({ result: 'nlp' }) })
      const req = new SearchNLP()
      const result = await service.nlpSearch(req)
      expect(result).toEqual({ result: 'nlp' })
    })

    it('should resolve null when url is not configured', async () => {
      mockDomainConfSvc.getApiUrl.mockReturnValue('')
      const req = new SearchNLP()
      const result = await service.nlpSearch(req)
      expect(result).toBeNull()
    })
  })

  describe('recentCreate', () => {
    it('should post when url is configured', async () => {
      mockDomainConfSvc.getApiUrl.mockReturnValue('/recent-create-url')
      mockHttp.post.mockReturnValue({ toPromise: jest.fn().mockResolvedValue({ result: 'created' }) })
      const result = await service.recentCreate({ q: 'x' })
      expect(result).toEqual({ result: 'created' })
    })

    it('should resolve null when url is not configured', async () => {
      mockDomainConfSvc.getApiUrl.mockReturnValue('')
      const result = await service.recentCreate({ q: 'x' })
      expect(result).toBeNull()
    })
  })

  describe('recentRead', () => {
    it('should get when url is configured', done => {
      mockDomainConfSvc.getApiUrl.mockReturnValue('/recent-read-url')
      service.recentRead().subscribe((res: any) => {
        expect(res).toEqual({ result: 'get-ok' })
        done()
      })
    })

    it('should return of(null) when url is not configured', done => {
      mockDomainConfSvc.getApiUrl.mockReturnValue('')
      service.recentRead().subscribe((res: any) => {
        expect(res).toBeNull()
        done()
      })
    })
  })

  describe('recentDeleteByUser', () => {
    it('should delete when url is configured', done => {
      mockDomainConfSvc.getApiUrl.mockReturnValue('/recent-delete-url')
      service.recentDeleteByUser().subscribe((res: any) => {
        expect(res).toEqual({ result: 'delete-ok' })
        done()
      })
    })

    it('should return of(null) when url is not configured', done => {
      mockDomainConfSvc.getApiUrl.mockReturnValue('')
      service.recentDeleteByUser().subscribe((res: any) => {
        expect(res).toBeNull()
        done()
      })
    })
  })

  describe('recentDeleteByTime', () => {
    it('should delete by timestamp when the api is enabled', done => {
      mockDomainConfSvc.isApiEnabled.mockReturnValue(true)
      service.recentDeleteByTime('123').subscribe((res: any) => {
        expect(res).toEqual({ result: 'delete-ok' })
        done()
      })
    })

    it('should return of(null) when the api is disabled', done => {
      mockDomainConfSvc.isApiEnabled.mockReturnValue(false)
      service.recentDeleteByTime('123').subscribe((res: any) => {
        expect(res).toBeNull()
        done()
      })
    })
  })

  describe('enrollment', () => {
    it('should post the enrollment request', () => {
      service.enrollment({ courseId: '1' }, 'user-1')
      expect(mockHttp.post).toHaveBeenCalled()
    })
  })

  describe('searchExternalContent', () => {
    it('should post the external content request', async () => {
      mockHttp.post.mockReturnValue({ toPromise: jest.fn().mockResolvedValue({ result: 'external' }) })
      const req = new SearchExternalRequest([])
      const result = await service.searchExternalContent(req)
      expect(result).toEqual({ result: 'external' })
    })
  })

  describe('exploreContent', () => {
    it('should get the explore content url', () => {
      service.exploreContent()
      expect(mockHttp.get).toHaveBeenCalled()
    })
  })

  describe('getFirstSortOption', () => {
    it('should exclude the most-relevant option for the explore content tab', () => {
      const { options, selectedOption } = service.getFirstSortOption(true)
      expect(options.some((option: any) => option.value === 'most_relevant')).toBe(false)
      expect(selectedOption).toBe('recently_added_newest')
    })

    it('should keep all options for a regular search tab', () => {
      const { options, selectedOption } = service.getFirstSortOption(false)
      expect(options.some((option: any) => option.value === 'most_relevant')).toBe(true)
      expect(selectedOption).toBe('most_relevant')
    })
  })

  describe('microCredentialsSearch', () => {
    it('should get the micro credentials url', () => {
      service.microCredentialsSearch().subscribe()
      expect(mockHttp.get).toHaveBeenCalled()
    })
  })

  describe('enrollmentDictionary', () => {
    it('should get the enrollment dictionary url', () => {
      service.enrollmentDictionary().subscribe()
      expect(mockHttp.get).toHaveBeenCalled()
    })
  })
})
