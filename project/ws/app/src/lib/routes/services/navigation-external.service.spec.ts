import { NavigationExternalService } from './navigation-external.service'
import { NAVIGATION_DATA_INCOMING } from '../models/mobile-events.model'

describe('NavigationExternalService (No TestBed)', () => {
  let service: NavigationExternalService
  let mockRouter: any

  beforeEach(() => {
    mockRouter = {
      navigate: jest.fn(),
      url: '/app/home',
    }
    service = new NavigationExternalService(mockRouter)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('init', () => {
    it('increments the dummy counter', () => {
      const before = service.dummy
      service.init()
      expect(service.dummy).toBe(before + 1)
    })
  })

  describe('navigateTo', () => {
    it('navigates with the provided params, encoding a fallback ref from the router url', () => {
      mockRouter.url = '/app/globalsearch?ref=old&foo=bar'
      service.navigateTo('/app/target', {})
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/target'], {
        queryParams: { ref: encodeURIComponent('/app/globalsearch?foo=bar') },
      })
    })

    it('preserves an explicitly provided ref', () => {
      service.navigateTo('/app/target', { ref: 'explicit-ref', extra: '1' })
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/target'], {
        queryParams: { ref: encodeURIComponent('explicit-ref'), extra: '1' },
      })
    })

    it('defaults params to an empty object when none are provided', () => {
      service.navigateTo('/app/target')
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/target'], {
        queryParams: expect.objectContaining({ ref: expect.any(String) }),
      })
    })
  })

  describe('incoming navigation events', () => {
    it('navigates when a NAVIGATION_DATA_INCOMING custom event is dispatched', () => {
      const navigateSpy = jest.spyOn(service, 'navigateTo')
      document.dispatchEvent(new CustomEvent(NAVIGATION_DATA_INCOMING, {
        detail: { url: '/app/from-event', params: { ref: 'evt-ref' } },
      }))
      expect(navigateSpy).toHaveBeenCalledWith('/app/from-event', { ref: 'evt-ref' })
    })
  })
})
