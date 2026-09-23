import { MandatoryNotificationsService } from './mandatory-notifications.service'
import { of, throwError } from 'rxjs'

// MandatoryNotificationsService uses plain constructor injection, so it can be
// instantiated directly with mocked dependencies — no TestBed needed.
describe('MandatoryNotificationsService', () => {
  let service: MandatoryNotificationsService
  let mockHttp: any
  let mockConfigSvc: any

  beforeEach(() => {
    mockHttp = {
      get: jest.fn().mockReturnValue(of({ result: { notification: { id: 'n1' } } })),
      post: jest.fn().mockReturnValue(of({ result: 'post-response' })),
      patch: jest.fn().mockReturnValue(of({ responseCode: 'OK' })),
    }
    mockConfigSvc = {}

    service = new MandatoryNotificationsService(mockHttp, mockConfigSvc)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('formReadData', () => {
    it('should post the request to the form read endpoint', () => {
      const request = { formId: 'f1' }
      service.formReadData(request)
      expect(mockHttp.post).toHaveBeenCalledWith('/apis/v1/form/read', request)
    })
  })

  describe('getMandatoryNotification', () => {
    it('should extract the notification from the response', done => {
      service.getMandatoryNotification().subscribe((result: any) => {
        expect(mockHttp.get).toHaveBeenCalledWith('apis/proxies/v8/v1/notifications/mandatory')
        expect(result).toEqual({ id: 'n1' })
        done()
      })
    })

    it('should catch errors and return the error wrapped in a data object', done => {
      mockHttp.get.mockReturnValue(throwError(() => new Error('network error')))
      service.getMandatoryNotification().subscribe((result: any) => {
        expect(result.data).toBeNull()
        expect(result.error).toBeInstanceOf(Error)
        done()
      })
    })
  })

  describe('markMandatoryAsRead', () => {
    it('should patch the request to the mark-as-read endpoint', () => {
      const request = { request: { id: 'n1' } }
      service.markMandatoryAsRead(request)
      expect(mockHttp.patch).toHaveBeenCalledWith('apis/proxies/v8/v1/notifications/mandatory/read', request)
    })
  })
})
