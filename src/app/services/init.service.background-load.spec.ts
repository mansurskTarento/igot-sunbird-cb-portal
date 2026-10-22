import { of, throwError } from 'rxjs'
import { EnrollmentSummaryStateService } from '@sunbird-cb/collection/src/lib/_services/enrollment-summary-state.service'
import { InitService } from './init.service'

/**
 * InitService's constructor needs ~20 services, so these tests build the instance off the
 * prototype with only the collaborators the methods under test use.
 */
describe('InitService', () => {
  let service: any
  let summaryState: EnrollmentSummaryStateService
  let store: Record<string, string>

  beforeEach(() => {
    summaryState = new EnrollmentSummaryStateService()
    store = {}
    // jsdom's localStorage swallows property assignment, so spy on the prototype instead
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => store[key] ?? null)
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => { store[key] = value })

    service = Object.create(InitService.prototype)
    service.enrollmentSummaryState = summaryState
    service.logger = { warn: jest.fn() }
    service.configSvc = { userProfile: { userId: 'user-1' } }
    service.domainConfSvc = { getApiUrl: jest.fn(() => '/apis/proxies/v8/login/entry') }
    service.http = { get: jest.fn(() => of({ result: { first_login: 1, last_login: 1 } })) }
    jest.spyOn(console, 'warn').mockImplementation(() => { })
    jest.spyOn(console, 'error').mockImplementation(() => { })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('loadEnrollmentSummaryInBackground', () => {
    it('should flag the summary as loading until the fetch settles', async () => {
      let finish: () => void = () => { }
      service.fetchUserEnrollDetails = jest.fn(() => new Promise<void>(resolve => { finish = resolve }))

      const pending = service.loadEnrollmentSummaryInBackground()
      expect(summaryState.isLoading).toBe(true)

      finish()
      await pending
      expect(summaryState.isLoading).toBe(false)
    })

    it('should still clear the loading flag, and log, when the fetch fails', async () => {
      service.fetchUserEnrollDetails = jest.fn(() => Promise.reject(new Error('boom')))

      await service.loadEnrollmentSummaryInBackground()

      expect(summaryState.isLoading).toBe(false)
      expect(service.logger.warn).toHaveBeenCalledWith('InitService: Failed to load enrolment summary', expect.any(Error))
    })
  })

  describe('logFirstLogin', () => {
    it('should call login/entry on the first load after a login and remember it', async () => {
      await service.logFirstLogin()

      expect(service.http.get).toHaveBeenCalledTimes(1)
      expect(store['loginEntryLogged']).toBe('user-1')
    })

    it('should not call login/entry again on a refresh in the same login', async () => {
      store['loginEntryLogged'] = 'user-1'

      await service.logFirstLogin()

      expect(service.http.get).not.toHaveBeenCalled()
    })

    it('should call login/entry when a different user logs in', async () => {
      store['loginEntryLogged'] = 'someone-else'

      await service.logFirstLogin()

      expect(service.http.get).toHaveBeenCalledTimes(1)
      expect(store['loginEntryLogged']).toBe('user-1')
    })

    it('should mark a first-ever login as a new user', async () => {
      await service.logFirstLogin()

      expect(service.configSvc.isNewUser).toBe(true)
      expect(store['firsLogin']).toBe('true')
    })

    it('should not remember the call when login/entry fails, so the next load retries', async () => {
      service.http.get = jest.fn(() => throwError(() => new Error('down')))

      await service.logFirstLogin()

      expect(store['loginEntryLogged']).toBeUndefined()
    })

    it('should skip the call when the API is disabled in config', async () => {
      service.domainConfSvc.getApiUrl = jest.fn(() => '')

      await service.logFirstLogin()

      expect(service.http.get).not.toHaveBeenCalled()
    })
  })
})
