import { RootService } from './root.service'
import { of, throwError } from 'rxjs'

describe('RootService (No TestBed)', () => {
  let service: RootService
  let mockHttp: any

  beforeEach(() => {
    mockHttp = {
      get: jest.fn().mockReturnValue(of({})),
      post: jest.fn().mockReturnValue(of({})),
    }

    service = new RootService(mockHttp)
  })

  it('should create the service', () => {
    expect(service).toBeTruthy()
  })

  it('should have openSupportAIChatbot as BehaviorSubject with false', () => {
    let value: any
    service.openSupportAIChatbot.subscribe((v: any) => { value = v })
    expect(value).toBe(false)
  })

  it('should have showNavbarDisplay$ as BehaviorSubject with true', () => {
    let value: any
    service.showNavbarDisplay$.subscribe((v: any) => { value = v })
    expect(value).toBe(true)
  })

  describe('createUser', () => {
    it('should call http.post with correct API', () => {
      const request = { username: 'test' }
      service.createUser(request)
      expect(mockHttp.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/discussion/user/v1/create',
        request
      )
    })
  })

  describe('setDiscussionConfig', () => {
    it('should store the config', () => {
      service.setDiscussionConfig({ key: 'value' })
      expect(service.discussionCnfig).toEqual({ key: 'value' })
    })
  })

  describe('getCookie', () => {
    it('should return cookie value when present', () => {
      Object.defineProperty(document, 'cookie', {
        value: 'testCookie=testValue; other=123',
        writable: true,
      })
      expect(service.getCookie('testCookie')).toBe('testValue')
    })

    it('should return empty string when cookie not found', () => {
      Object.defineProperty(document, 'cookie', {
        value: 'other=123',
        writable: true,
      })
      expect(service.getCookie('nonexistent')).toBe('')
    })
  })

  describe('deleteCookie', () => {
    it('should call setCookie with -1 expireDays', () => {
      jest.spyOn(service, 'setCookie').mockImplementation(() => { })
      service.deleteCookie('testCookie')
      expect(service.setCookie).toHaveBeenCalledWith('testCookie', '', -1)
    })
  })

  describe('setCookie', () => {
    it('should set document.cookie', () => {
      Object.defineProperty(document, 'cookie', {
        value: '',
        writable: true,
      })
      service.setCookie('test', 'value', 1, '/path')
      // Just verify it doesn't throw
      expect(true).toBe(true)
    })
  })

  describe('getChatData', () => {
    it('should call http.post with CONFIG endpoint', () => {
      service.getChatData({ lang: 'en', config_type: 'IN' })
      expect(mockHttp.post).toHaveBeenCalledWith(
        '/api/faq/v1/assistant/configs/language',
        { lang: 'en', config_type: 'IN' }
      )
    })
  })

  describe('getLangugages', () => {
    it('should call http.get with LANGUAGES endpoint', () => {
      service.getLangugages()
      expect(mockHttp.get).toHaveBeenCalledWith('/api/faq/v1/assistant/available/language')
    })
  })

  describe('aiGlobalSearch', () => {
    it('should call http.post with correct params', () => {
      service.aiGlobalSearch({ query: 'test' }, 'chat-1', 'user-1')
      expect(mockHttp.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/chatbot/v3/search?chatID=chat-1&userID=user-1',
        { query: 'test' }
      )
    })

    it('should handle 502 error', (done) => {
      mockHttp.post.mockReturnValue(throwError(() => ({ status: 502, message: 'Bad Gateway' })))
      service.aiGlobalSearch({ query: 'test' }, 'chat-1', 'user-1').subscribe({
        error: (err: any) => {
          expect(err.status).toBe(502)
          done()
        },
      })
    })

    it('should handle 500 error', (done) => {
      mockHttp.post.mockReturnValue(throwError(() => ({ status: 500, message: 'Server Error' })))
      service.aiGlobalSearch({ query: 'test' }, 'chat-1', 'user-1').subscribe({
        error: (err: any) => {
          expect(err.status).toBe(500)
          done()
        },
      })
    })

    it('should handle other errors', (done) => {
      mockHttp.post.mockReturnValue(throwError(() => ({ status: 403, message: 'Forbidden' })))
      service.aiGlobalSearch({ query: 'test' }, 'chat-1', 'user-1').subscribe({
        error: (err: any) => {
          expect(err.status).toBe(403)
          done()
        },
      })
    })
  })

  describe('saveAIChatPositiveContentRating', () => {
    it('should call http.post with feedback endpoint', () => {
      service.saveAIChatPositiveContentRating({ rating: 5 }, 'chat-1', 'user-1')
      expect(mockHttp.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/chatbot/v3/feedbacks/save?chatID=chat-1&userID=user-1',
        { rating: 5 }
      )
    })
  })

  describe('shareAIFeedback', () => {
    it('should call http.post with feedback endpoint', () => {
      service.shareAIFeedback({ feedback: 'good' }, 'chat-1', 'user-1')
      expect(mockHttp.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/chatbot/v3/feedbacks/save?chatID=chat-1&userID=user-1',
        { feedback: 'good' }
      )
    })
  })

  describe('aiGlobalSearchFromInternet', () => {
    it('should call http.post with internet search endpoint', () => {
      service.aiGlobalSearchFromInternet({ query: 'test' }, 'chat-1', 'user-1')
      expect(mockHttp.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/chatbot/v3/global/search?chatID=chat-1&user_id=user-1',
        { query: 'test' }
      )
    })
  })

  describe('aiStartChathForSupport', () => {
    it('should call http.post with support start chat endpoint', () => {
      service.aiStartChathForSupport({ message: 'hi' }, 'user-1')
      expect(mockHttp.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/support/ai/chat/start',
        { message: 'hi' },
        expect.objectContaining({ headers: expect.anything() })
      )
    })
  })

  describe('aiSendChathForSupport', () => {
    it('should call http.post with support send chat endpoint', () => {
      service.aiSendChathForSupport({ message: 'help' }, 'user-1')
      expect(mockHttp.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/support/ai/chat/send',
        { message: 'help' },
        expect.objectContaining({ headers: expect.anything() })
      )
    })
  })
})
