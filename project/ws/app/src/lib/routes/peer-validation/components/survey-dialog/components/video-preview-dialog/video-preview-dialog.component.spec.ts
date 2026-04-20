/// <reference types="jest" />
import { VideoPreviewDialogComponent } from './video-preview-dialog.component'

const makeData = (overrides: { url?: string; name?: string; type?: string } = {}) => ({
  url: 'http://cdn.test/video.mp4',
  name: 'video.mp4',
  type: 'video/mp4',
  ...overrides,
})

// ─── minimal DomSanitizer mock ───────────────────────────────────────────────
const sanitizerMock = {
  bypassSecurityTrustResourceUrl: jest.fn((url: string) => `safe:${url}`),
}

describe('VideoPreviewDialogComponent', () => {
  let component: VideoPreviewDialogComponent
  let dialogRefMock: any

  beforeEach(() => {
    dialogRefMock = { close: jest.fn() }
    sanitizerMock.bypassSecurityTrustResourceUrl.mockClear()
    component = new VideoPreviewDialogComponent(
      dialogRefMock,
      makeData(),
      sanitizerMock as any
    )
  })

  // ─── ngOnInit — video ─────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('should set viewType to "video" for mp4 type', () => {
      component.ngOnInit()
      expect(component.viewType).toBe('video')
      expect(component.sanitizedPdfUrl).toBeNull()
    })

    it('should set viewType to "pdf" when type includes "pdf"', () => {
      component = new VideoPreviewDialogComponent(
        dialogRefMock,
        makeData({ url: 'http://cdn.test/doc.pdf', name: 'doc.pdf', type: 'application/pdf' }),
        sanitizerMock as any
      )
      component.ngOnInit()
      expect(component.viewType).toBe('pdf')
      expect(sanitizerMock.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith('http://cdn.test/doc.pdf')
    })

    it('should set viewType to "pdf" when name ends with .pdf (type is generic)', () => {
      component = new VideoPreviewDialogComponent(
        dialogRefMock,
        makeData({ url: 'http://cdn.test/doc.pdf', name: 'doc.pdf', type: 'application/octet-stream' }),
        sanitizerMock as any
      )
      component.ngOnInit()
      expect(component.viewType).toBe('pdf')
    })

    it('should not set viewType when url is empty', () => {
      component = new VideoPreviewDialogComponent(
        dialogRefMock,
        makeData({ url: '', name: 'file', type: 'video/mp4' }),
        sanitizerMock as any
      )
      component.ngOnInit()
      expect(component.viewType).toBeNull()
    })

    it('should not throw when data is minimal', () => {
      component = new VideoPreviewDialogComponent(
        dialogRefMock,
        { url: 'http://cdn.test/video.mp4', name: 'video.mp4', type: 'video/mp4' },
        sanitizerMock as any
      )
      expect(() => component.ngOnInit()).not.toThrow()
    })
  })

  // ─── formatTime ───────────────────────────────────────────────────────────

  describe('formatTime', () => {
    it('should return "0:00" for 0', () => {
      expect(component.formatTime(0)).toBe('0:00')
    })

    it('should return "0:00" for NaN', () => {
      expect(component.formatTime(NaN)).toBe('0:00')
    })

    it('should return "1:00" for 60 seconds', () => {
      expect(component.formatTime(60)).toBe('1:00')
    })

    it('should return "1:05" for 65 seconds', () => {
      expect(component.formatTime(65)).toBe('1:05')
    })

    it('should pad seconds with leading zero', () => {
      expect(component.formatTime(70)).toBe('1:10')
    })

    it('should handle large values like 3661 seconds (61 mins)', () => {
      expect(component.formatTime(3661)).toBe('61:01')
    })
  })

  // ─── getMimeType ──────────────────────────────────────────────────────────

  describe('getMimeType', () => {
    it('should return "video/mp4" for mp4 type', () => {
      expect(component.getMimeType()).toBe('video/mp4')
    })

    it('should return "video/mp4" for mp4 name', () => {
      component = new VideoPreviewDialogComponent(
        dialogRefMock,
        makeData({ name: 'file.mp4', type: '' }),
        sanitizerMock as any
      )
      expect(component.getMimeType()).toBe('video/mp4')
    })

    it('should return "video/webm" for webm type', () => {
      component = new VideoPreviewDialogComponent(
        dialogRefMock,
        makeData({ name: 'file.webm', type: 'video/webm' }),
        sanitizerMock as any
      )
      expect(component.getMimeType()).toBe('video/webm')
    })

    it('should return "video/ogg" for ogg type', () => {
      component = new VideoPreviewDialogComponent(
        dialogRefMock,
        makeData({ name: 'file.ogg', type: 'video/ogg' }),
        sanitizerMock as any
      )
      expect(component.getMimeType()).toBe('video/ogg')
    })

    it('should return default video/mp4 for unknown type and name', () => {
      component = new VideoPreviewDialogComponent(
        dialogRefMock,
        makeData({ name: 'file.xyz', type: '' }),
        sanitizerMock as any
      )
      // Implementation always defaults to 'video/mp4'
      expect(component.getMimeType()).toBe('video/mp4')
    })
  })

  // ─── initial state ────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('should start with isPlaying false', () => { expect(component.isPlaying).toBe(false) })
    it('should start with isMuted false', () => { expect(component.isMuted).toBe(false) })
    it('should start with volume 1', () => { expect(component.volume).toBe(1) })
    it('should start with playbackSpeed 1', () => { expect(component.playbackSpeed).toBe(1) })
    it('should start with currentTime 0', () => { expect(component.currentTime).toBe(0) })
    it('should start with duration 0', () => { expect(component.duration).toBe(0) })
    it('should start with showControls true', () => { expect(component.showControls).toBe(true) })
    it('should start with isFullscreen false', () => { expect(component.isFullscreen).toBe(false) })
    it('should start with viewType null', () => { expect(component.viewType).toBeNull() })
  })

  // ─── togglePlay (without DOM) ─────────────────────────────────────────────

  describe('togglePlay guard', () => {
    it('isPlaying starts as false', () => {
      expect(component.isPlaying).toBe(false)
    })
  })

  // ─── onVideoEnded ─────────────────────────────────────────────────────────

  describe('onVideoEnded', () => {
    it('should set isPlaying to false', () => {
      component.isPlaying = true
      component.onVideoEnded()
      expect(component.isPlaying).toBe(false)
    })
  })

  // ─── onTimeUpdate ─────────────────────────────────────────────────────────

  describe('onTimeUpdate', () => {
    it('should update currentTime from videoPlayer', () => {
      component.videoPlayer = { nativeElement: { currentTime: 42 } } as any
      component.onTimeUpdate()
      expect(component.currentTime).toBe(42)
    })

    it('should not throw when videoPlayer is not set', () => {
      expect(() => component.onTimeUpdate()).not.toThrow()
    })
  })

  // ─── onLoadedMetadata ─────────────────────────────────────────────────────

  describe('onLoadedMetadata', () => {
    it('should update duration from videoPlayer', () => {
      component.videoPlayer = { nativeElement: { duration: 120 } } as any
      component.onLoadedMetadata()
      expect(component.duration).toBe(120)
    })

    it('should not throw when videoPlayer is not set', () => {
      expect(() => component.onLoadedMetadata()).not.toThrow()
    })
  })

  // ─── toggleSpeed ──────────────────────────────────────────────────────────

  describe('toggleSpeed', () => {
    it('should switch from 1 to 1.5 and update videoPlayer playbackRate', () => {
      const videoEl = { playbackRate: 1 }
      component.videoPlayer = { nativeElement: videoEl } as any
      component.playbackSpeed = 1
      component.toggleSpeed()
      expect(component.playbackSpeed).toBe(1.5)
      expect(videoEl.playbackRate).toBe(1.5)
    })

    it('should switch from 1.5 back to 1 and update videoPlayer playbackRate', () => {
      const videoEl = { playbackRate: 1.5 }
      component.videoPlayer = { nativeElement: videoEl } as any
      component.playbackSpeed = 1.5
      component.toggleSpeed()
      expect(component.playbackSpeed).toBe(1)
      expect(videoEl.playbackRate).toBe(1)
    })
  })

  // ─── hideControlsDelayed ─────────────────────────────────────────────────

  describe('hideControlsDelayed', () => {
    it('should hide controls after 2s when playing', () => {
      jest.useFakeTimers()
      component.isPlaying = true
      component.showControls = true
      component.hideControlsDelayed()
      jest.advanceTimersByTime(2100)
      expect(component.showControls).toBe(false)
      jest.useRealTimers()
    })

    it('should NOT hide controls after 2s when paused', () => {
      jest.useFakeTimers()
      component.isPlaying = false
      component.showControls = true
      component.hideControlsDelayed()
      jest.advanceTimersByTime(2100)
      expect(component.showControls).toBe(true)
      jest.useRealTimers()
    })

    it('should clear existing timeout before setting a new one', () => {
      jest.useFakeTimers()
      component.isPlaying = true
      component.showControls = true
      component.hideControlsDelayed()
      component.hideControlsDelayed() // second call clears first
      jest.advanceTimersByTime(2100)
      expect(component.showControls).toBe(false)
      jest.useRealTimers()
    })
  })

  // ─── ngAfterViewInit ──────────────────────────────────────────────────────

  describe('ngAfterViewInit', () => {
    it('should set volume, playbackRate and auto-play when videoPlayer is present', async () => {
      const play = jest.fn().mockResolvedValue(undefined)
      const videoEl = { volume: 0, playbackRate: 0, play }
      component.videoPlayer = { nativeElement: videoEl } as any
      component.volume = 0.8
      component.playbackSpeed = 1.5
      await component.ngAfterViewInit()
      expect(videoEl.volume).toBe(0.8)
      expect(videoEl.playbackRate).toBe(1.5)
      expect(play).toHaveBeenCalled()
      expect(component.isPlaying).toBe(true)
    })

    it('should set isPlaying to false when auto-play is rejected', async () => {
      const play = jest.fn().mockRejectedValue(new Error('blocked'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { })
      component.videoPlayer = { nativeElement: { volume: 0, playbackRate: 0, play } } as any
      await component.ngAfterViewInit()
      expect(component.isPlaying).toBe(false)
      consoleSpy.mockRestore()
    })

    it('should not throw when videoPlayer is not set', () => {
      expect(() => component.ngAfterViewInit()).not.toThrow()
    })
  })

  // ─── togglePlay ───────────────────────────────────────────────────────────

  describe('togglePlay', () => {
    it('should play and set isPlaying=true when paused', () => {
      const play = jest.fn()
      const videoEl = { paused: true, play }
      component.videoPlayer = { nativeElement: videoEl } as any
      component.togglePlay()
      expect(play).toHaveBeenCalled()
      expect(component.isPlaying).toBe(true)
    })

    it('should pause and set isPlaying=false when playing', () => {
      const pause = jest.fn()
      const videoEl = { paused: false, pause }
      component.videoPlayer = { nativeElement: videoEl } as any
      component.togglePlay()
      expect(pause).toHaveBeenCalled()
      expect(component.isPlaying).toBe(false)
    })
  })

  // ─── seek ─────────────────────────────────────────────────────────────────

  describe('seek', () => {
    it('should set video currentTime proportionally to click position', () => {
      const videoEl = { currentTime: 0 }
      component.videoPlayer = { nativeElement: videoEl } as any
      component.duration = 100

      const progressBar = { getBoundingClientRect: () => ({ left: 0, width: 200 }) }
      const event = { clientX: 100, currentTarget: progressBar } as unknown as MouseEvent
      component.seek(event)

      expect(videoEl.currentTime).toBeCloseTo(50)
    })

    it('should handle click at start (0% position)', () => {
      const videoEl = { currentTime: 50 }
      component.videoPlayer = { nativeElement: videoEl } as any
      component.duration = 200

      const progressBar = { getBoundingClientRect: () => ({ left: 50, width: 100 }) }
      const event = { clientX: 50, currentTarget: progressBar } as unknown as MouseEvent
      component.seek(event)

      expect(videoEl.currentTime).toBe(0)
    })
  })

  // ─── adjustVolume ─────────────────────────────────────────────────────────

  describe('adjustVolume', () => {
    it('should set volume and update videoPlayer', () => {
      const videoEl = { volume: 1 }
      component.videoPlayer = { nativeElement: videoEl } as any
      const event = { target: { value: '75' } } as unknown as Event
      component.adjustVolume(event)
      expect(component.volume).toBeCloseTo(0.75)
      expect(videoEl.volume).toBeCloseTo(0.75)
      expect(component.isMuted).toBe(false)
    })

    it('should set isMuted=true when volume is 0', () => {
      const videoEl = { volume: 1 }
      component.videoPlayer = { nativeElement: videoEl } as any
      const event = { target: { value: '0' } } as unknown as Event
      component.adjustVolume(event)
      expect(component.isMuted).toBe(true)
    })
  })

  // ─── toggleMute ───────────────────────────────────────────────────────────

  describe('toggleMute', () => {
    it('should unmute and restore volume when currently muted', () => {
      const videoEl = { volume: 0 }
      component.videoPlayer = { nativeElement: videoEl } as any
      component.isMuted = true
      component.volume = 0.8
      component.toggleMute()
      expect(videoEl.volume).toBe(0.8)
      expect(component.isMuted).toBe(false)
    })

    it('should fallback to 0.5 when volume is 0 and unmuting', () => {
      const videoEl = { volume: 0 }
      component.videoPlayer = { nativeElement: videoEl } as any
      component.isMuted = true
      component.volume = 0
      component.toggleMute()
      expect(videoEl.volume).toBe(0.5)
    })

    it('should mute and set volume to 0 when currently unmuted', () => {
      const videoEl = { volume: 0.7 }
      component.videoPlayer = { nativeElement: videoEl } as any
      component.isMuted = false
      component.toggleMute()
      expect(videoEl.volume).toBe(0)
      expect(component.isMuted).toBe(true)
    })
  })

  // ─── togglePictureInPicture ───────────────────────────────────────────────

  describe('togglePictureInPicture', () => {
    it('should exit PiP when already in picture-in-picture mode', () => {
      const exitPip = jest.fn()
      Object.defineProperty(document, 'pictureInPictureElement', { value: {}, configurable: true })
      Object.defineProperty(document, 'exitPictureInPicture', { value: exitPip, configurable: true })
      const videoEl = { requestPictureInPicture: jest.fn() }
      component.videoPlayer = { nativeElement: videoEl } as any
      component.togglePictureInPicture()
      expect(exitPip).toHaveBeenCalled()
    })

    it('should request PiP when not in picture-in-picture mode', () => {
      Object.defineProperty(document, 'pictureInPictureElement', { value: null, configurable: true })
      const requestPip = jest.fn()
      const videoEl = { requestPictureInPicture: requestPip }
      component.videoPlayer = { nativeElement: videoEl } as any
      component.togglePictureInPicture()
      expect(requestPip).toHaveBeenCalled()
    })
  })

  // ─── toggleFullscreen ─────────────────────────────────────────────────────

  describe('toggleFullscreen', () => {
    it('should request fullscreen and set isFullscreen=true when not fullscreen', () => {
      Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true })
      const requestFullscreen = jest.fn()
      const container = { requestFullscreen }
      const videoEl = { parentElement: container }
      component.videoPlayer = { nativeElement: videoEl } as any
      component.toggleFullscreen()
      expect(requestFullscreen).toHaveBeenCalled()
      expect(component.isFullscreen).toBe(true)
    })

    it('should exit fullscreen and set isFullscreen=false when already fullscreen', () => {
      Object.defineProperty(document, 'fullscreenElement', { value: {}, configurable: true })
      const exitFullscreen = jest.fn()
      Object.defineProperty(document, 'exitFullscreen', { value: exitFullscreen, configurable: true })
      const videoEl = { parentElement: {} }
      component.videoPlayer = { nativeElement: videoEl } as any
      component.isFullscreen = true
      component.toggleFullscreen()
      expect(exitFullscreen).toHaveBeenCalled()
      expect(component.isFullscreen).toBe(false)
    })
  })

  // ─── close ────────────────────────────────────────────────────────────────

  describe('close', () => {
    it('should call dialogRef.close()', () => {
      component.close()
      expect(dialogRefMock.close).toHaveBeenCalled()
    })
  })
})
