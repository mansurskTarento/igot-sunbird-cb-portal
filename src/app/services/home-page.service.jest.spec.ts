import { HomePageService } from './home-page.service'
import { of } from 'rxjs'

// HomePageService uses plain constructor injection, so it can be instantiated
// directly with mocked dependencies — no TestBed / injection context needed.
describe('HomePageService (No TestBed)', () => {
  let service: HomePageService
  let mockHttp: any
  let mockDomainConfSvc: any
  let warnSpy: jest.SpyInstance

  beforeEach(() => {
    mockHttp = {
      get: jest.fn().mockReturnValue(of({ result: 'get-response' })),
      post: jest.fn().mockReturnValue(of({ result: 'post-response' })),
    }
    // Defaults to the fallback (third) argument, mirroring an unconfigured
    // globalConfig.apis entry — the same behavior DomainConfService.getApiUrl documents.
    mockDomainConfSvc = {
      getApiUrl: jest.fn().mockImplementation((_service: any, _apiKey: any, defaultUrl: any) => defaultUrl),
    }
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

    service = new HomePageService(mockHttp, mockDomainConfSvc)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('getInsightsData', () => {
    it('should post to the resolved url when enabled', () => {
      const payload = { a: 1 }
      service.getInsightsData(payload)
      expect(mockDomainConfSvc.getApiUrl).toHaveBeenCalledWith('user', 'insights', '/apis/proxies/v8/read/user/insights')
      expect(mockHttp.post).toHaveBeenCalledWith('/apis/proxies/v8/read/user/insights', payload)
    })

    it('should warn and skip the http call when disabled', () => {
      mockDomainConfSvc.getApiUrl.mockReturnValue('')
      service.getInsightsData({})
      expect(warnSpy).toHaveBeenCalledWith('Insights API is disabled')
      expect(mockHttp.post).not.toHaveBeenCalled()
    })
  })

  describe('geteventsHoursData', () => {
    it('should get from the resolved url when enabled', () => {
      service.geteventsHoursData()
      expect(mockHttp.get).toHaveBeenCalledWith('/apis/proxies/v8/user/events/enroll/summary')
    })

    it('should warn and skip the http call when disabled', () => {
      mockDomainConfSvc.getApiUrl.mockReturnValue('')
      service.geteventsHoursData()
      expect(warnSpy).toHaveBeenCalledWith('Event enroll API is disabled')
      expect(mockHttp.get).not.toHaveBeenCalled()
    })
  })

  describe('getNetworkRecommendations', () => {
    it('should post to the resolved url when enabled', () => {
      const payload = { b: 2 }
      service.getNetworkRecommendations(payload)
      expect(mockHttp.post).toHaveBeenCalledWith('/apis/proxies/v8/connections/v3/connections/recommended', payload)
    })

    it('should warn and skip the http call when disabled', () => {
      mockDomainConfSvc.getApiUrl.mockReturnValue('')
      service.getNetworkRecommendations({})
      expect(warnSpy).toHaveBeenCalledWith('Network recommendations API is disabled')
      expect(mockHttp.post).not.toHaveBeenCalled()
    })
  })

  describe('connectToNetwork', () => {
    it('should post to the resolved url when enabled', () => {
      const payload = { c: 3 }
      service.connectToNetwork(payload)
      expect(mockHttp.post).toHaveBeenCalledWith('/apis/protected/v8/connections/v2/add/connection', payload)
    })

    it('should warn and skip the http call when disabled', () => {
      mockDomainConfSvc.getApiUrl.mockReturnValue('')
      service.connectToNetwork({})
      expect(warnSpy).toHaveBeenCalledWith('Add connection API is disabled')
      expect(mockHttp.post).not.toHaveBeenCalled()
    })
  })

  describe('updateConnection', () => {
    it('should post to the resolved url when enabled', () => {
      const payload = { d: 4 }
      service.updateConnection(payload)
      expect(mockHttp.post).toHaveBeenCalledWith('/apis/protected/v8/connections/v2/update/connection', payload)
    })

    it('should warn and skip the http call when disabled', () => {
      mockDomainConfSvc.getApiUrl.mockReturnValue('')
      service.updateConnection({})
      expect(warnSpy).toHaveBeenCalledWith('Update connection API is disabled')
      expect(mockHttp.post).not.toHaveBeenCalled()
    })
  })

  describe('getRecentRequests', () => {
    it('should get from the resolved url when enabled', () => {
      service.getRecentRequests()
      expect(mockHttp.get).toHaveBeenCalledWith('/apis/protected/v8/connections/v2/connections/requests/received')
    })

    it('should warn and skip the http call when disabled', () => {
      mockDomainConfSvc.getApiUrl.mockReturnValue('')
      service.getRecentRequests()
      expect(warnSpy).toHaveBeenCalledWith('Connection requests API is disabled')
      expect(mockHttp.get).not.toHaveBeenCalled()
    })
  })

  describe('getAssessmentinfo', () => {
    it('should get from the resolved url when enabled', () => {
      service.getAssessmentinfo()
      expect(mockHttp.get).toHaveBeenCalledWith('/apis/proxies/v8/wheebox/read')
    })

    it('should warn and skip the http call when disabled', () => {
      mockDomainConfSvc.getApiUrl.mockReturnValue('')
      service.getAssessmentinfo()
      expect(warnSpy).toHaveBeenCalledWith('Assessment API is disabled')
      expect(mockHttp.get).not.toHaveBeenCalled()
    })
  })

  describe('getLearnerLeaderboard', () => {
    it('should get from the resolved url when enabled', () => {
      service.getLearnerLeaderboard()
      expect(mockHttp.get).toHaveBeenCalledWith('/apis/proxies/v8/halloffame/learnerleaderboard')
    })

    it('should warn and return of(null) when disabled', done => {
      mockDomainConfSvc.getApiUrl.mockReturnValue('')
      service.getLearnerLeaderboard().subscribe((result: any) => {
        expect(result).toBeNull()
        expect(warnSpy).toHaveBeenCalledWith('Learner leaderboard API is disabled')
        expect(mockHttp.get).not.toHaveBeenCalled()
        done()
      })
    })
  })

  describe('getLearnerLeaderboardCached', () => {
    it('should fetch once and reuse the cached observable on subsequent calls', () => {
      const first$ = service.getLearnerLeaderboardCached()
      const second$ = service.getLearnerLeaderboardCached()

      expect(first$).toBe(second$)
      expect(mockHttp.get).toHaveBeenCalledTimes(1)
    })
  })

  describe('getNwlConfigiration', () => {
    it('should get the nlw.json from the given base url', () => {
      service.getNwlConfigiration('https://cdn.test')
      expect(mockHttp.get).toHaveBeenCalledWith('https://cdn.test/nlw.json')
    })
  })

  describe('getUserContentInfo', () => {
    it('should get from the resolved url when enabled', () => {
      service.getUserContentInfo()
      expect(mockDomainConfSvc.getApiUrl).toHaveBeenCalledWith('user', 'contentInfo', '/apis/proxies/v8/user/content/info')
      expect(mockHttp.get).toHaveBeenCalledWith('/apis/proxies/v8/user/content/info')
    })

    it('should warn and return of(null) when disabled', done => {
      mockDomainConfSvc.getApiUrl.mockReturnValue('')
      service.getUserContentInfo().subscribe((result: any) => {
        expect(result).toBeNull()
        expect(warnSpy).toHaveBeenCalledWith('User content info API is disabled')
        expect(mockHttp.get).not.toHaveBeenCalled()
        done()
      })
    })
  })
})
