import { HttpErrorResponse, HttpRequest, HttpResponse } from '@angular/common/http'
import { fakeAsync, tick } from '@angular/core/testing'
import { defer, of, throwError } from 'rxjs'
import { AppRetryInterceptorService } from './app-retry-interceptor.service'

describe('AppRetryInterceptorService', () => {
  let interceptor: AppRetryInterceptorService

  // a handler whose observable fails with the given status every time it is subscribed
  const failingHandler = (status: number) => {
    const handler = {
      calls: 0,
      handle: jest.fn(() => defer(() => {
        handler.calls += 1
        return throwError(() => new HttpErrorResponse({ status, url: '/apis/some/api' }))
      })),
    }
    return handler
  }

  beforeEach(() => {
    interceptor = new AppRetryInterceptorService()
  })

  it('should not retry a failed POST — the error goes straight to the caller', () => {
    const handler = failingHandler(500)
    let error: any
    interceptor.intercept(new HttpRequest('POST', '/apis/some/api', {}), handler as any)
      .subscribe({ error: (err: any) => { error = err } })

    expect(handler.calls).toBe(1)
    expect(error.status).toBe(500)
  })

  it('should not retry a request that opts out with excludeRetry', () => {
    const handler = failingHandler(500)
    let error: any
    interceptor.intercept(new HttpRequest('PUT', '/apis/some/api', { excludeRetry: true }), handler as any)
      .subscribe({ error: (err: any) => { error = err } })

    expect(handler.calls).toBe(1)
    expect(error.status).toBe(500)
  })

  it('should retry a failed GET once on a 5xx', fakeAsync(() => {
    const handler = failingHandler(503)
    let error: any
    interceptor.intercept(new HttpRequest('GET', '/apis/some/api'), handler as any)
      .subscribe({ error: (err: any) => { error = err } })

    tick(5000)
    expect(handler.calls).toBe(2)
    expect(error.status).toBe(503)
  }))

  it('should not retry a GET on a 4xx', () => {
    const handler = failingHandler(404)
    interceptor.intercept(new HttpRequest('GET', '/apis/some/api'), handler as any).subscribe({ error: () => { } })

    expect(handler.calls).toBe(1)
  })

  it('should pass a successful response through', () => {
    const response = new HttpResponse({ status: 200, body: { ok: true } })
    const handler = { handle: jest.fn(() => of(response)) }
    let result: any
    interceptor.intercept(new HttpRequest('POST', '/apis/some/api', {}), handler as any)
      .subscribe(res => { result = res })

    expect(result).toBe(response)
  })
})
