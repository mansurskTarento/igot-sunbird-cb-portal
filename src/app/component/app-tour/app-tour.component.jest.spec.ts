import { NavigationEnd } from '@angular/router'
import { Subject } from 'rxjs'
import { AppTourComponent } from './app-tour.component'

jest.mock('@ws/app', () => ({ UserProfileService: class { } }))

describe('AppTourComponent (No TestBed)', () => {
  let component: AppTourComponent
  let mockGuidedTourService: any
  let mockUtilitySvc: any
  let mockConfigSvc: any
  let mockEvents: any
  let mockUserProfileSvc: any
  let mockRouter: any
  let mockTranslate: any
  let mockDialog: { openDialogs: any[], afterOpened: Subject<any>, afterAllClosed: Subject<void> }

  beforeEach(() => {
    mockGuidedTourService = {
      startTour: jest.fn(),
      skipTour: jest.fn(),
    }

    mockUtilitySvc = {
      isMobile: false,
    }

    mockConfigSvc = {
      unMappedUser: { id: 'user-123' },
      updateTourGuideMethod: jest.fn(),
    }

    mockEvents = {
      dispatchGetStartedEvent: jest.fn(),
    }

    mockUserProfileSvc = {
      editProfileDetails: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
    }

    mockTranslate = {
      setDefaultLang: jest.fn(),
      use: jest.fn(),
      instant: jest.fn().mockImplementation((key: string) => key),
    }

    mockRouter = { navigate: jest.fn(), currentNavigation: jest.fn(() => null), events: new Subject<any>() }

    mockDialog = { openDialogs: [], afterOpened: new Subject<any>(), afterAllClosed: new Subject<void>() }

    // Mock localStorage
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { })

    component = new AppTourComponent(
      mockGuidedTourService,
      mockUtilitySvc,
      mockConfigSvc,
      mockEvents,
      mockUserProfileSvc,
      mockRouter,
      mockTranslate,
      mockDialog as any
    )
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.useRealTimers()
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should set isMobile from utilitySvc', () => {
    expect(component.isMobile).toBe(false)
  })

  it('should raise get started telemetry on construction', () => {
    expect(mockEvents.dispatchGetStartedEvent).toHaveBeenCalled()
  })

  describe('updateTourstatus', () => {
    it('should call editProfileDetails with correct payload', () => {
      const status = { visited: true, skipped: false }
      component.updateTourstatus(status)
      expect(mockUserProfileSvc.editProfileDetails).toHaveBeenCalledWith({
        request: {
          userId: 'user-123',
          profileDetails: { get_started_tour_v2: status },
        },
      })
    })
  })

  describe('emitFromVideo', () => {
    it('should call skipTour when event is skip', () => {
      jest.spyOn(component, 'skipTour').mockImplementation(() => { })
      component.emitFromVideo('skip')
      expect(component.skipTour).toHaveBeenCalledWith('video-skip', 'video')
    })

    it('should call startTour when event is not skip', () => {
      jest.spyOn(component, 'startTour').mockImplementation(() => { })
      component.emitFromVideo('start')
      expect(component.startTour).toHaveBeenCalledWith('welcome-start', 'welcome')
    })
  })

  describe('startTour', () => {
    it('should set showpopup and showVideoTour to false', () => {
      jest.useFakeTimers()
      component.startTour('screen', 'subType')
      expect(component.showpopup).toBe(false)
      expect(component.showVideoTour).toBe(false)
      jest.useRealTimers()
    })

    it('should call guidedTourService.startTour for desktop', () => {
      jest.useFakeTimers()
      jest.spyOn(document, 'getElementsByClassName').mockReturnValue([{ style: { left: '100px' } }] as any)
      component.isMobile = false
      component.startTour('screen', 'subType')
      expect(mockGuidedTourService.startTour).toHaveBeenCalled()
      jest.useRealTimers()
    })

    it('should call guidedTourService.startTour for mobile after timeout', () => {
      jest.useFakeTimers()
      component.isMobile = true
      component.startTour('screen', 'subType')
      jest.advanceTimersByTime(2000)
      expect(mockGuidedTourService.startTour).toHaveBeenCalled()
      jest.useRealTimers()
    })
  })

  describe('skipTour', () => {
    it('should update tour status and call configSvc.updateTourGuideMethod', () => {
      jest.useFakeTimers()
      component.skipTour('screen', 'subType')
      expect(mockConfigSvc.updateTourGuideMethod).toHaveBeenCalledWith(true)
      expect(component.noScroll).toBe(false)
      expect(component.showpopup).toBe(false)
      expect(component.showVideoTour).toBe(false)
      expect(component.showCompletePopup).toBe(false)
      jest.useRealTimers()
    })

    it('should raise telemetry from currentWindow when screen/subType are empty', () => {
      jest.useFakeTimers()
      component.currentWindow = { title: 'My Profile' }
      component.skipTour('', '')
      expect(mockEvents.dispatchGetStartedEvent).toHaveBeenCalled()
      jest.useRealTimers()
    })

    it('should raise telemetry with welcome-skip when no currentWindow and empty params', () => {
      jest.useFakeTimers()
      component.currentWindow = null
      component.skipTour('', '')
      expect(mockEvents.dispatchGetStartedEvent).toHaveBeenCalled()
      jest.useRealTimers()
    })
  })

  describe('completeTour', () => {
    it('should set showCompletePopup to true', () => {
      jest.useFakeTimers()
      component.completeTour()
      expect(component.showpopup).toBe(false)
      expect(component.showCompletePopup).toBe(true)
      expect(component.hideCloseBtn).toBe(false)
      jest.useRealTimers()
    })

    it('should call onCongrats after 3 seconds', () => {
      jest.useFakeTimers()
      jest.spyOn(component, 'onCongrats').mockImplementation(() => { })
      component.completeTour()
      jest.advanceTimersByTime(3000)
      expect(component.onCongrats).toHaveBeenCalled()
      jest.useRealTimers()
    })
  })

  describe('onCongrats', () => {
    it('should set showCompletePopup to false and save to localStorage', () => {
      component.onCongrats()
      expect(component.showCompletePopup).toBe(false)
      expect(Storage.prototype.setItem).toHaveBeenCalledWith('tourGuide', JSON.stringify({ disable: true }))
      expect(mockConfigSvc.updateTourGuideMethod).toHaveBeenCalledWith(true)
    })
  })

  describe('startApp', () => {
    it('should set showpopup to true', () => {
      component.showpopup = false
      component.startApp()
      expect(component.showpopup).toBe(true)
    })
  })

  describe('starVideoPlayer', () => {
    it('should hide popup and show video tour', () => {
      component.starVideoPlayer()
      expect(component.showpopup).toBe(false)
      expect(component.showVideoTour).toBe(true)
    })
  })

  describe('nextCb', () => {
    it('should set currentWindow and hideCloseBtn for My Profile', () => {
      const stepObject = { title: 'My Profile' }
      component.nextCb(1, stepObject)
      expect(component.hideCloseBtn).toBe(true)
      expect(component.currentWindow).toBe(stepObject)
    })

    it('should not set hideCloseBtn for other steps', () => {
      const stepObject = { title: 'Learn' }
      component.nextCb(1, stepObject)
      expect(component.hideCloseBtn).toBe(false)
      expect(component.currentWindow).toBe(stepObject)
    })
  })

  describe('prevCb', () => {
    it('should set hideCloseBtn to false and update currentWindow', () => {
      const stepObject = { title: 'Search' }
      component.prevCb(0, stepObject)
      expect(component.hideCloseBtn).toBe(false)
      expect(component.currentWindow).toBe(stepObject)
    })
  })

  describe('raiseGetStartedStartTelemetry', () => {
    it('should dispatch get started event', () => {
      mockEvents.dispatchGetStartedEvent.mockClear()
      component.raiseGetStartedStartTelemetry()
      expect(mockEvents.dispatchGetStartedEvent).toHaveBeenCalled()
    })
  })

  describe('raiseTemeletyInterat', () => {
    it('should dispatch interact event with correct data', () => {
      mockEvents.dispatchGetStartedEvent.mockClear()
      component.raiseTemeletyInterat('test-id', 'test-type')
      expect(mockEvents.dispatchGetStartedEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            edata: expect.objectContaining({ id: 'test-id', subType: 'test-type' }),
          }),
        })
      )
    })
  })

  describe('raiseGetStartedEndTelemetry', () => {
    it('should dispatch end telemetry event', () => {
      mockEvents.dispatchGetStartedEvent.mockClear()
      component.raiseGetStartedEndTelemetry()
      expect(mockEvents.dispatchGetStartedEvent).toHaveBeenCalled()
    })
  })

  describe('closeModal', () => {
    it('should call skipTour with empty strings', () => {
      jest.useFakeTimers()
      jest.spyOn(component, 'skipTour').mockImplementation(() => { })
      component.closeModal()
      expect(component.skipTour).toHaveBeenCalledWith('', '')
      jest.useRealTimers()
    })
  })

  describe('translateTo', () => {
    it('should call translate.instant with proper key', () => {
      const result = component.translateTo('stepLearn')
      expect(mockTranslate.instant).toHaveBeenCalledWith('tour.stepLearn')
      expect(result).toBe('tour.stepLearn')
    })
  })

  describe('onKeydownHandler', () => {
    it('should call skipTour on Escape key', () => {
      jest.spyOn(component, 'skipTour').mockImplementation(() => { })
      component.onKeydownHandler({ key: 'Escape' } as KeyboardEvent)
      expect(component.skipTour).toHaveBeenCalledWith('', '')
    })

    it('should not call skipTour on other keys', () => {
      jest.spyOn(component, 'skipTour').mockImplementation(() => { })
      component.onKeydownHandler({ key: 'Enter' } as KeyboardEvent)
      expect(component.skipTour).not.toHaveBeenCalled()
    })
  })

  describe('wallet coach mark with other dialogs on home', () => {
    let anchor: HTMLElement
    let closedSpy: jest.Mock

    const openDialog = () => {
      mockDialog.openDialogs = [{}]
      mockDialog.afterOpened.next({})
    }
    const closeDialogs = () => {
      mockDialog.openDialogs = []
      mockDialog.afterAllClosed.next()
    }
    const coachMarkShown = () => mockEvents.dispatchGetStartedEvent.mock.calls
      .filter((c: any[]) => c[0].data.edata.id === 'karma-wallet-coachmark').length

    beforeEach(() => {
      jest.useFakeTimers()
      anchor = document.createElement('button')
      anchor.className = 'karma-wallet-btn'
      document.body.appendChild(anchor)
      component.showOnlyIgotKarmayogi = true
      component.getStartedPending = false
      component.karmaWalletVideoPending = false
      component.karmaWalletTourPending = true
      closedSpy = jest.fn()
      component.closed.subscribe(closedSpy)
      mockEvents.dispatchGetStartedEvent.mockClear()
    })

    afterEach(() => {
      component.ngOnDestroy()
      anchor.remove()
    })

    it('should show the coach mark straight away when no dialog is open', () => {
      component.ngOnChanges()

      expect(component.showWalletCoachMark).toBe(true)
    })

    it('should wait for an open dialog to close, then show the coach mark', () => {
      openDialog()
      component.ngOnChanges()

      expect(component.showWalletCoachMark).toBe(false)

      closeDialogs()
      jest.advanceTimersByTime(999)
      expect(component.showWalletCoachMark).toBe(false)

      jest.advanceTimersByTime(1)
      expect(component.showWalletCoachMark).toBe(true)
      expect(coachMarkShown()).toBe(1)
    })

    it('should keep waiting when another dialog follows the first one', () => {
      openDialog()
      component.ngOnChanges()
      closeDialogs()
      jest.advanceTimersByTime(500)
      openDialog()
      jest.advanceTimersByTime(500)

      expect(component.showWalletCoachMark).toBe(false)

      closeDialogs()
      jest.advanceTimersByTime(1000)
      expect(component.showWalletCoachMark).toBe(true)
    })

    it('should step aside for a dialog that opens over it, saving nothing', () => {
      component.ngOnChanges()
      openDialog()

      expect(component.showWalletCoachMark).toBe(false)
      expect(mockUserProfileSvc.editProfileDetails).not.toHaveBeenCalled()
      expect(closedSpy).not.toHaveBeenCalled()

      closeDialogs()
      jest.advanceTimersByTime(1000)
      expect(component.showWalletCoachMark).toBe(true)
    })

    it('should leave Escape to the dialog while waiting', () => {
      openDialog()
      component.ngOnChanges()
      component.onKeydownHandler({ key: 'Escape' } as KeyboardEvent)

      expect(mockUserProfileSvc.editProfileDetails).not.toHaveBeenCalled()
      expect(mockConfigSvc.updateTourGuideMethod).not.toHaveBeenCalled()
      expect(closedSpy).not.toHaveBeenCalled()
    })

    it('should show nothing and save nothing when left before the dialog settles', () => {
      openDialog()
      component.ngOnChanges()
      closeDialogs()
      component.ngOnDestroy()
      jest.advanceTimersByTime(1000)

      expect(component.showWalletCoachMark).toBe(false)
      expect(coachMarkShown()).toBe(0)
      expect(mockUserProfileSvc.editProfileDetails).not.toHaveBeenCalled()
    })

    it('should not show the coach mark if it was snoozed while waiting', () => {
      openDialog()
      component.ngOnChanges()
      ; (Storage.prototype.getItem as jest.Mock).mockImplementation((key: string) =>
        key === 'karmaWalletTourSnoozed' ? 'user-123' : null)
      closeDialogs()
      jest.advanceTimersByTime(1000)

      expect(component.showWalletCoachMark).toBe(false)
      expect(component.karmaWalletTourPending).toBe(false)
      expect(closedSpy).toHaveBeenCalled()
      expect(mockUserProfileSvc.editProfileDetails).not.toHaveBeenCalled()
    })

    it('should hold the coach mark while the dialog is redirecting', () => {
      openDialog()
      component.ngOnChanges()
      mockRouter.currentNavigation.mockReturnValue({})
      closeDialogs()
      jest.advanceTimersByTime(5000)

      expect(component.showWalletCoachMark).toBe(false)

      mockRouter.currentNavigation.mockReturnValue(null)
      mockRouter.events.next(new NavigationEnd(1, '/page/home', '/page/home'))
      jest.advanceTimersByTime(999)
      expect(component.showWalletCoachMark).toBe(false)

      jest.advanceTimersByTime(1)
      expect(component.showWalletCoachMark).toBe(true)
    })

    it('should never show the coach mark when the redirect leaves home', () => {
      openDialog()
      component.ngOnChanges()
      mockRouter.currentNavigation.mockReturnValue({})
      closeDialogs()
      jest.advanceTimersByTime(1000)
      mockRouter.events.next(new NavigationEnd(1, '/app/person-profile/me', '/app/person-profile/me'))
      component.ngOnDestroy()
      jest.advanceTimersByTime(5000)

      expect(component.showWalletCoachMark).toBe(false)
      expect(coachMarkShown()).toBe(0)
    })
  })

  describe('karma wallet snooze in localStorage', () => {
    const newComponent = () => new AppTourComponent(
      mockGuidedTourService, mockUtilitySvc, mockConfigSvc, mockEvents,
      mockUserProfileSvc, mockRouter, mockTranslate, mockDialog as any
    )

    it('should treat the video and the coach mark as done when this user is snoozed', () => {
      ; (Storage.prototype.getItem as jest.Mock).mockImplementation((key: string) =>
        key === 'karmaWalletTourSnoozed' ? 'user-123' : null)

      const snoozed = newComponent()

      expect(snoozed.karmaWalletVideoPending).toBe(false)
      expect(snoozed.karmaWalletTourPending).toBe(false)
    })

    it('should ignore a snooze saved for another user', () => {
      ; (Storage.prototype.getItem as jest.Mock).mockImplementation((key: string) =>
        key === 'karmaWalletTourSnoozed' ? 'someone-else' : null)

      const other = newComponent()

      expect(other.karmaWalletVideoPending).toBe(true)
      expect(other.karmaWalletTourPending).toBe(true)
    })

    it('should snooze on Skip while the video is still pending', () => {
      component.karmaWalletVideoPending = true

      component.skipWalletTour()

      expect(Storage.prototype.setItem).toHaveBeenCalledWith('karmaWalletTourSnoozed', 'user-123')
    })

    it('should not snooze on Skip once the video was seen', () => {
      component.karmaWalletVideoPending = false

      component.skipWalletTour()

      expect(Storage.prototype.setItem).not.toHaveBeenCalledWith('karmaWalletTourSnoozed', expect.anything())
    })

    it('should save visited and skipped when the video was played, paused, closed and Skip clicked', () => {
      component.karmaWalletVideoPending = true
      component.onWalletVideoStarted()
      component.closeModal()

      component.skipWalletTour()

      expect(mockUserProfileSvc.editProfileDetails).toHaveBeenLastCalledWith({
        request: {
          userId: 'user-123',
          profileDetails: { karma_wallet_tour: { visited: true, skipped: true, video_visited: true } },
        },
      })
    })
  })

  describe('video popup finished earlier in this session', () => {
    let anchor: HTMLElement

    const homeVisit = (userId: string) => {
      mockConfigSvc.unMappedUser = { id: userId, profileDetails: { get_started_tour_v2: { visited: true } } }
      const tour = new AppTourComponent(
        mockGuidedTourService, mockUtilitySvc, mockConfigSvc, mockEvents,
        mockUserProfileSvc, mockRouter, mockTranslate, mockDialog as any
      )
      tour.showOnlyIgotKarmayogi = true
      tour.ngOnChanges()
      return tour
    }

    beforeEach(() => {
      jest.useFakeTimers()
      anchor = document.createElement('button')
      anchor.className = 'karma-wallet-btn'
      document.body.appendChild(anchor)
    })

    afterEach(() => anchor.remove())

    it('should go straight to the coach mark after the video was skipped and home was left', () => {
      const first = homeVisit('user-returning')
      expect(first.showVideoTour).toBe(true)
      mockDialog.openDialogs = [{}]
      first.emitFromVideo('skip')
      first.ngOnDestroy()
      mockDialog.openDialogs = []

      const back = homeVisit('user-returning')

      expect(back.showVideoTour).toBe(false)
      expect(back.showWalletCoachMark).toBe(true)
      back.ngOnDestroy()
    })

    it('should still snooze on the coach mark Skip after coming back', () => {
      const first = homeVisit('user-snoozing')
      first.emitFromVideo('skip')
      first.ngOnDestroy()
      const back = homeVisit('user-snoozing')

      back.skipWalletTour()

      expect(Storage.prototype.setItem).toHaveBeenCalledWith('karmaWalletTourSnoozed', 'user-snoozing')
      expect(mockUserProfileSvc.editProfileDetails).toHaveBeenCalledWith({
        request: {
          userId: 'user-snoozing',
          profileDetails: { karma_wallet_tour: { visited: false, skipped: true, video_visited: false } },
        },
      })
      back.ngOnDestroy()
    })

    it('should still show the video to a user who has not finished it', () => {
      const first = homeVisit('user-one')
      first.emitFromVideo('skip')
      first.ngOnDestroy()

      const other = homeVisit('user-two')

      expect(other.showVideoTour).toBe(true)
      expect(other.showWalletCoachMark).toBe(false)
      other.ngOnDestroy()
    })
  })
})
