import { MobileAppsService } from './mobile-apps.service'
import {
  CHAT_BOT_VISIBILITY,
  DISPLAY_SETTING,
  DOWNLOAD_REQUESTED,
  GET_PLAYERCONTENT_JSON,
  GO_OFFLINE,
  IOS_OPEN_IN_BROWSER,
} from '../models/mobile-events.model'

describe('MobileAppsService (No TestBed)', () => {
  let service: MobileAppsService
  let mockNavigateSvc: any

  beforeEach(() => {
    mockNavigateSvc = { init: jest.fn() }
    service = new MobileAppsService(mockNavigateSvc)
    ;(window as any).appRef = undefined
    ;(window as any).webkit = undefined
    ;(window as any).dispatchEventFlag = undefined
  })

  afterEach(() => {
    ;(window as any).appRef = undefined
    ;(window as any).webkit = undefined
    ;(window as any).dispatchEventFlag = undefined
    jest.restoreAllMocks()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('init', () => {
    it('wires up the global navigateTo method and initializes the navigation service', () => {
      service.init()
      expect(typeof (window as any).navigateTo).toBe('function')
      expect(mockNavigateSvc.init).toHaveBeenCalled()
    })
  })

  describe('simulateMobile', () => {
    it('stubs android and ios app refs', () => {
      service.simulateMobile()
      expect((window as any).appRef).toEqual({})
      expect((window as any).webkit).toEqual({})
    })
  })

  describe('isAndroidApp / iOsAppRef / isMobile', () => {
    it('is false on a plain browser', () => {
      expect(service.isAndroidApp).toBe(false)
      expect(service.iOsAppRef).toBeNull()
      expect(service.isMobile).toBe(false)
    })

    it('is true when appRef is present', () => {
      (window as any).appRef = {}
      expect(service.isAndroidApp).toBe(true)
      expect(service.isMobile).toBe(true)
    })

    it('resolves the ios app ref from webkit message handlers', () => {
      const appRefHandler = { postMessage: jest.fn() };
      (window as any).webkit = { messageHandlers: { appRef: appRefHandler } }
      expect(service.iOsAppRef).toBe(appRefHandler)
      expect(service.isMobile).toBe(true)
    })

    it('returns null when webkit has no appRef handler', () => {
      (window as any).webkit = { messageHandlers: {} }
      expect(service.iOsAppRef).toBeNull()
    })
  })

  describe('canShowSettings', () => {
    it('is true when the android app exposes DISPLAY_SETTING', () => {
      (window as any).appRef = { [DISPLAY_SETTING]: jest.fn() }
      expect(service.canShowSettings).toBe(true)
    })

    it('is true when the ios app ref is present', () => {
      (window as any).webkit = { messageHandlers: { appRef: {} } }
      expect(service.canShowSettings).toBe(true)
    })

    it('is false on a plain browser', () => {
      expect(service.canShowSettings).toBe(false)
    })
  })

  describe('sendDataAppToClient (via the public wrappers)', () => {
    it('calls the android DISPLAY_SETTING handler with no arguments', () => {
      const displaySetting = jest.fn();
      (window as any).appRef = { [DISPLAY_SETTING]: displaySetting }
      service.viewSettings()
      expect(displaySetting).toHaveBeenCalledWith()
    })

    it('calls other android handlers with a JSON-stringified payload', () => {
      const goOffline = jest.fn();
      (window as any).appRef = { [GO_OFFLINE]: goOffline }
      service.goOffline()
      expect(goOffline).toHaveBeenCalledWith(JSON.stringify({}))
    })

    it('sends viewer data through the android handler', () => {
      const getPlayerContent = jest.fn();
      (window as any).appRef = { [GET_PLAYERCONTENT_JSON]: getPlayerContent }
      const viewerData = { identifier: 'c1' }
      service.sendViewerData(viewerData as any)
      expect(getPlayerContent).toHaveBeenCalledWith(JSON.stringify(viewerData))
    })

    it('sends a download request through the android handler', () => {
      const download = jest.fn();
      (window as any).appRef = { [DOWNLOAD_REQUESTED]: download }
      service.downloadResource('res-1')
      expect(download).toHaveBeenCalledWith(JSON.stringify('res-1'))
    })

    it('sends chatbot visibility through the android handler', () => {
      const chatbot = jest.fn();
      (window as any).appRef = { [CHAT_BOT_VISIBILITY]: chatbot }
      service.appChatbotVisibility('yes')
      expect(chatbot).toHaveBeenCalledWith(JSON.stringify('yes'))
    })

    it('posts a message to the ios app ref when there is no android handler', () => {
      const postMessage = jest.fn();
      (window as any).webkit = { messageHandlers: { appRef: { postMessage } } }
      service.iosOpenInBrowserRequest('https://example.com')
      expect(postMessage).toHaveBeenCalledWith(JSON.stringify({
        eventName: IOS_OPEN_IN_BROWSER,
        data: { url: 'https://example.com' },
      }))
    })

    it('dispatches a document event as a last resort when dispatchEventFlag is set', () => {
      (window as any).dispatchEventFlag = true
      const dispatchSpy = jest.spyOn(document, 'dispatchEvent')
      service.goOffline()
      expect(dispatchSpy).toHaveBeenCalled()
    })

    it('does nothing observable when no delivery channel is available', () => {
      const dispatchSpy = jest.spyOn(document, 'dispatchEvent')
      service.goOffline()
      expect(dispatchSpy).not.toHaveBeenCalled()
    })
  })

  describe('isFunctionAvailableInAndroid', () => {
    it('is true when the android function exists', () => {
      (window as any).appRef = { someFn: jest.fn() }
      expect(service.isFunctionAvailableInAndroid('someFn')).toBe(true)
    })

    it('is false when the android function is missing', () => {
      (window as any).appRef = {}
      expect(service.isFunctionAvailableInAndroid('missingFn')).toBe(false)
    })

    it('is false with no android app ref at all', () => {
      expect(service.isFunctionAvailableInAndroid('anyFn')).toBe(false)
    })
  })

  describe('setupGlobalMethods', () => {
    it('dispatches a NAVIGATION_DATA_INCOMING event when window.navigateTo is invoked', () => {
      service.setupGlobalMethods()
      const dispatchSpy = jest.spyOn(document, 'dispatchEvent')
      ;(window as any).navigateTo('/app/target', { ref: 'r1' })
      expect(dispatchSpy).toHaveBeenCalled()
    })
  })
})
