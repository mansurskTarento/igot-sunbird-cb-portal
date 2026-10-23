import { $t } from '@project-sunbird/telemetry-sdk'
import { AppTourVideoComponent } from './app-tour-video.component'

jest.mock('src/environments/environment', () => ({ environment: { sitePath: 'portal.example.org' } }))
jest.mock('@project-sunbird/telemetry-sdk', () => ({ $t: { impression: jest.fn() } }))

const SITE_VIDEO_URL = 'https://portal.example.org/assets/public/content/guide-videos/Website_Video_v1.mp4'
const WALLET_VIDEO_URL = 'https://portal.example.org/assets/public/content/guide-videos/Karma_Wallet_Intro.mp4'

describe('AppTourVideoComponent (No TestBed)', () => {
  let component: AppTourVideoComponent
  let mockEventService: any
  let mockTranslate: any
  let mockTelemetrySvc: any
  let mockCdr: any

  beforeEach(() => {
    mockEventService = { dispatchGetStartedEvent: jest.fn() }
    mockTranslate = {
      setDefaultLang: jest.fn(),
      use: jest.fn(),
      instant: jest.fn().mockImplementation((key: string) => key),
    }
    mockTelemetrySvc = { pData: { id: 'portal', ver: '1.0' } }
    mockCdr = { detectChanges: jest.fn() }

    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)

    component = new AppTourVideoComponent(mockEventService, mockTranslate, mockTelemetrySvc, mockCdr)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  describe('constructor', () => {
    it('leaves the language untouched when no website language is stored', () => {
      expect(mockTranslate.use).not.toHaveBeenCalled()
    })

    it('uses the stored website language', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('hi')
      component = new AppTourVideoComponent(mockEventService, mockTranslate, mockTelemetrySvc, mockCdr)

      expect(mockTranslate.setDefaultLang).toHaveBeenCalledWith('en')
      expect(mockTranslate.use).toHaveBeenCalledWith('hi')
    })
  })

  describe('ngOnInit', () => {
    it('builds the website video url from the site path', () => {
      component.ngOnInit()

      expect(component.videoUrl).toBe(SITE_VIDEO_URL)
    })

    it('builds the karma wallet video url from the site path', () => {
      component.ngOnInit()

      expect(component.videoUrl1).toBe(WALLET_VIDEO_URL)
    })

    it('starts on the website video by default', () => {
      component.ngOnInit()

      expect(component.activeVideoIndex).toBe(0)
      expect(component.currentVideoUrl).toBe(SITE_VIDEO_URL)
      expect($t.impression).not.toHaveBeenCalled()
    })

    it('starts on the karma wallet video when startVideoIndex is 1', () => {
      component.startVideoIndex = 1
      component.ngOnInit()

      expect(component.activeVideoIndex).toBe(1)
      expect(component.currentVideoUrl).toBe(WALLET_VIDEO_URL)
    })

    it('falls back to the website video for any other startVideoIndex', () => {
      component.startVideoIndex = 5
      component.ngOnInit()

      expect(component.activeVideoIndex).toBe(0)
      expect(component.currentVideoUrl).toBe(SITE_VIDEO_URL)
    })

    it('raises an impression for the wallet video when it is the first one shown', () => {
      component.startVideoIndex = 1
      component.ngOnInit()

      expect($t.impression).toHaveBeenCalledTimes(1)
      expect($t.impression).toHaveBeenCalledWith(
        { pageid: 'page/home', type: 'view', uri: 'page/home' },
        {
          context: { pdata: { id: 'portal', ver: '1.0' }, env: 'Karma Wallet' },
          object: {},
        },
      )
    })

    it('raises the get started telemetry event', () => {
      component.ngOnInit()

      expect(mockEventService.dispatchGetStartedEvent).toHaveBeenCalledTimes(1)
      const event = mockEventService.dispatchGetStartedEvent.mock.calls[0][0]
      expect(event.pageContext.pageId).toBe('/home')
      expect(event.to).toBe('Telemetry')
    })
  })

  describe('secondVideoTitle', () => {
    it('returns the translation when one exists', () => {
      mockTranslate.instant.mockReturnValue('कर्म वॉलेट क्या है?')

      expect(component.secondVideoTitle).toBe('कर्म वॉलेट क्या है?')
      expect(mockTranslate.instant).toHaveBeenCalledWith('tourvideo.whatIsKarmaWallet')
    })

    it('falls back to the english title when the key is missing', () => {
      expect(component.secondVideoTitle).toBe('What is Karma Wallet?')
    })

    it('falls back to the english title when the translation is empty', () => {
      mockTranslate.instant.mockReturnValue('')

      expect(component.secondVideoTitle).toBe('What is Karma Wallet?')
    })
  })

  describe('onVideoPlay', () => {
    it('does nothing while the website video is active', () => {
      const started = jest.fn()
      component.walletVideoStarted.subscribe(started)

      component.onVideoPlay()

      expect(started).not.toHaveBeenCalled()
    })

    it('reports the wallet video start once', () => {
      const started = jest.fn()
      component.walletVideoStarted.subscribe(started)
      component.activeVideoIndex = 1

      component.onVideoPlay()
      component.onVideoPlay()

      expect(started).toHaveBeenCalledTimes(1)
    })
  })

  describe('advanceToWalletVideo', () => {
    beforeEach(() => {
      component.ngOnInit()
    })

    it('returns false when the second video is not enabled', () => {
      component.secondVideoEnabled = false

      expect(component.advanceToWalletVideo()).toBe(false)
      expect(component.activeVideoIndex).toBe(0)
    })

    it('returns false when the wallet video is already active', () => {
      component.secondVideoEnabled = true
      component.activeVideoIndex = 1

      expect(component.advanceToWalletVideo()).toBe(false)
    })

    it('returns false when there is no wallet video url', () => {
      component.secondVideoEnabled = true
      component.videoUrl1 = ''

      expect(component.advanceToWalletVideo()).toBe(false)
      expect(component.activeVideoIndex).toBe(0)
    })

    it('switches to the wallet video and reloads the player', () => {
      const video = { ontimeupdate: jest.fn(), load: jest.fn() }
      component.tourVideoTag = { nativeElement: video } as any
      component.secondVideoEnabled = true

      expect(component.advanceToWalletVideo()).toBe(true)
      expect(component.activeVideoIndex).toBe(1)
      expect(component.currentVideoUrl).toBe(WALLET_VIDEO_URL)
      expect(video.ontimeupdate).toBeNull()
      expect(mockCdr.detectChanges).toHaveBeenCalled()
      expect(video.load).toHaveBeenCalled()
      expect($t.impression).toHaveBeenCalledTimes(1)
    })

    it('switches even when the video element is not rendered', () => {
      component.tourVideoTag = undefined as any
      component.secondVideoEnabled = true

      expect(component.advanceToWalletVideo()).toBe(true)
      expect(component.activeVideoIndex).toBe(1)
      expect(mockCdr.detectChanges).toHaveBeenCalled()
    })
  })

  describe('onVideoEnded', () => {
    beforeEach(() => {
      component.ngOnInit()
    })

    it('emits videosCompleted when the wallet video ends', () => {
      const completed = jest.fn()
      component.videosCompleted.subscribe(completed)
      component.activeVideoIndex = 1

      component.onVideoEnded()

      expect(completed).toHaveBeenCalledTimes(1)
    })

    it('stays on the website video when the second video is not enabled', () => {
      component.secondVideoEnabled = false

      component.onVideoEnded()

      expect(component.activeVideoIndex).toBe(0)
      expect(mockCdr.detectChanges).not.toHaveBeenCalled()
    })

    it('plays the wallet video after the website video when it is enabled', () => {
      component.secondVideoEnabled = true

      component.onVideoEnded()

      expect(component.activeVideoIndex).toBe(1)
      expect(component.currentVideoUrl).toBe(WALLET_VIDEO_URL)
    })

    it('does not advance when there is no wallet video url', () => {
      component.secondVideoEnabled = true
      component.videoUrl1 = undefined

      component.onVideoEnded()

      expect(component.activeVideoIndex).toBe(0)
    })
  })

  describe('buttons', () => {
    it('emits start on letsStart', () => {
      const emitted = jest.fn()
      component.emitedValue.subscribe(emitted)

      component.letsStart()

      expect(emitted).toHaveBeenCalledWith('start')
    })

    it('emits skip on letsSkip', () => {
      const emitted = jest.fn()
      component.emitedValue.subscribe(emitted)

      component.letsSkip()

      expect(emitted).toHaveBeenCalledWith('skip')
    })
  })

  describe('ngOnDestroy', () => {
    it('reports zero progress when the video element is gone', () => {
      component.ngOnDestroy()

      const event = mockEventService.dispatchGetStartedEvent.mock.calls[0][0]
      expect(event.data.object).toEqual({ duration: 0, total: 119 })
    })

    it('reports the current playback time of the video element', () => {
      component.tourVideoTag = { nativeElement: { currentTime: 42 } } as any

      component.ngOnDestroy()

      const event = mockEventService.dispatchGetStartedEvent.mock.calls[0][0]
      expect(event.data.object.duration).toBe(42)
    })
  })
})
