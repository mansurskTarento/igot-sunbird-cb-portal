import { HttpErrorResponse, HttpRequest } from '@angular/common/http'
import { of, throwError } from 'rxjs'
import { AppInterceptorService } from './app-interceptor.service'
import { clearKarmaWalletTourSnooze } from '../component/app-tour/karma-wallet-tour-snooze'

jest.mock('../component/app-tour/karma-wallet-tour-snooze', () => ({ clearKarmaWalletTourSnooze: jest.fn() }))
jest.mock('@sunbird-cb/collection', () => ({ NOTIFICATION_TIME: 1000 }))
jest.mock('@sunbird-cb/utils-v2', () => ({ ConfigurationsService: class { }, AuthKeycloakService: class { } }))

describe('AppInterceptorService', () => {
  let configSvc: any
  let snackBar: any
  let authSvc: any
  let service: AppInterceptorService
  let next: { handle: jest.Mock }

  const buildService = (locale = 'en-US') =>
    new AppInterceptorService(configSvc, snackBar, authSvc, locale)

  const handledRequest = () => next.handle.mock.calls[next.handle.mock.calls.length - 1][0] as HttpRequest<any>

  afterEach(() => {
    jest.restoreAllMocks()
    ;(clearKarmaWalletTourSnooze as jest.Mock).mockClear()
  })

  beforeEach(() => {
    configSvc = {
      userPreference: undefined,
      activeOrg: 'org1',
      rootOrg: 'root1',
      userProfile: { userId: 'user-1' },
      cstoken: 'token-1',
      hostPath: '/host',
    }
    snackBar = { open: jest.fn() }
    authSvc = { force_logout: jest.fn() }
    next = { handle: jest.fn().mockReturnValue(of({})) }
    service = buildService()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('headers', () => {
    it('adds the org headers to the request', () => {
      const req = new HttpRequest('GET', '/api/test')
      service.intercept(req, next as any).subscribe()

      const sent = handledRequest()
      expect(sent.headers.get('org')).toBe('org1')
      expect(sent.headers.get('rootOrg')).toBe('root1')
      expect(sent.headers.get('wid')).toBe('user-1')
      expect(sent.headers.get('cstoken')).toBe('token-1')
      expect(sent.headers.get('hostPath')).toBe('/host')
      expect(sent.headers.get('Authorization')).toBe('')
    })

    it('maps en-US locale to en', () => {
      service.intercept(new HttpRequest('GET', '/api/test'), next as any).subscribe()
      expect(handledRequest().headers.get('locale')).toBe('en')
    })

    it('keeps a non en-US locale as is', () => {
      service = buildService('hi')
      service.intercept(new HttpRequest('GET', '/api/test'), next as any).subscribe()
      expect(handledRequest().headers.get('locale')).toBe('hi')
    })

    it('appends trimmed languages from user preference', () => {
      configSvc.userPreference = { selectedLangGroup: ' hi , ta ,, te' }
      service.intercept(new HttpRequest('GET', '/api/test'), next as any).subscribe()
      expect(handledRequest().headers.get('locale')).toBe('en,hi,ta,te')
    })

    it('does not duplicate languages already present', () => {
      configSvc.userPreference = { selectedLangGroup: 'en,hi,hi' }
      service.intercept(new HttpRequest('GET', '/api/test'), next as any).subscribe()
      expect(handledRequest().headers.get('locale')).toBe('en,hi')
    })

    it('handles a user preference without selectedLangGroup', () => {
      configSvc.userPreference = {}
      service.intercept(new HttpRequest('GET', '/api/test'), next as any).subscribe()
      expect(handledRequest().headers.get('locale')).toBe('en')
    })

    it('uses empty wid and cstoken when profile and token are missing', () => {
      configSvc.userProfile = undefined
      configSvc.cstoken = undefined
      service.intercept(new HttpRequest('GET', '/api/test'), next as any).subscribe()

      const sent = handledRequest()
      expect(sent.headers.get('wid')).toBe('')
      expect(sent.headers.get('cstoken')).toBe('')
    })

    it('passes the original request through when activeOrg is missing', () => {
      configSvc.activeOrg = undefined
      const req = new HttpRequest('GET', '/api/test')
      service.intercept(req, next as any).subscribe()
      expect(next.handle).toHaveBeenCalledWith(req)
    })

    it('passes the original request through when rootOrg is missing', () => {
      configSvc.rootOrg = undefined
      const req = new HttpRequest('GET', '/api/test')
      service.intercept(req, next as any).subscribe()
      expect(next.handle).toHaveBeenCalledWith(req)
    })
  })

  describe('error handling', () => {
    const failWith = (error: any) => {
      next.handle.mockReturnValue(throwError(error))
      let caught: any
      service.intercept(new HttpRequest('GET', '/api/test'), next as any).subscribe({
        error: e => (caught = e),
      })
      return caught
    }

    it('rethrows the original error', () => {
      const error = new HttpErrorResponse({ status: 500 })
      expect(failWith(error)).toBe(error)
      expect(snackBar.open).not.toHaveBeenCalled()
      expect(authSvc.force_logout).not.toHaveBeenCalled()
    })

    it('rethrows non-HttpErrorResponse errors untouched', () => {
      const error = new Error('boom')
      expect(failWith(error)).toBe(error)
      expect(snackBar.open).not.toHaveBeenCalled()
    })

    it('status 0 on localhost shows a snackbar and forces logout', () => {
      const error = new HttpErrorResponse({ status: 0 })
      expect(failWith(error)).toBe(error)

      if (location.origin.includes('localhost')) {
        expect(snackBar.open).toHaveBeenCalled()
        expect(authSvc.force_logout).toHaveBeenCalled()
      } else {
        expect(snackBar.open).not.toHaveBeenCalled()
        expect(authSvc.force_logout).not.toHaveBeenCalled()
      }
    })

    it('status 200 without a url does not redirect and rethrows', () => {
      const error = new HttpErrorResponse({ status: 200 })
      expect(failWith(error)).toBe(error)
    })

    it('status 419 removes telemetrySessionId when present and rethrows', () => {
      const removeSpy = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => undefined)
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('session-1')
      const error = new HttpErrorResponse({ status: 419 })
      expect(failWith(error)).toBe(error)
      expect(removeSpy).toHaveBeenCalledWith('telemetrySessionId')
    })

    it('status 419 leaves storage alone when telemetrySessionId is absent', () => {
      const removeSpy = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => undefined)
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
      failWith(new HttpErrorResponse({ status: 419 }))
      expect(removeSpy).not.toHaveBeenCalled()
    })

    it('status 419 clears the karma wallet tour snooze', () => {
      failWith(new HttpErrorResponse({ status: 419 }))
      expect(clearKarmaWalletTourSnooze).toHaveBeenCalled()
    })

    it('status 419 no longer wipes all of localStorage', () => {
      const clearSpy = jest.spyOn(Storage.prototype, 'clear').mockImplementation(() => undefined)
      failWith(new HttpErrorResponse({ status: 419 }))
      expect(clearSpy).not.toHaveBeenCalled()
    })

    it('status 419 does not redirect when already on the login path', () => {
      const error = new HttpErrorResponse({
        status: 419,
        error: { redirectUrl: location.pathname },
      })
      expect(failWith(error)).toBe(error)
    })
  })
})
