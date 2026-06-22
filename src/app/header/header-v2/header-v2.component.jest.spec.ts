import { HeaderV2Component } from './header-v2.component'
import { of, BehaviorSubject } from 'rxjs'

describe('HeaderV2Component (No TestBed)', () => {
  let component: HeaderV2Component
  let mockValueSvc: any
  let mockMobileAppsService: any

  beforeEach(() => {
    mockValueSvc = {
      isXSmall$: of(false),
    }

    mockMobileAppsService = {
      mobileTopHeaderVisibilityStatus: new BehaviorSubject(true),
    }

    component = new HeaderV2Component(
      mockValueSvc,
      mockMobileAppsService
    )
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should have default leftNavBarOpen as false', () => {
    expect(component.leftNavBarOpen).toBe(false)
  })

  it('should have isXSmall$ from valueSvc', () => {
    component.isXSmall$.subscribe((val: any) => {
      expect(val).toBe(false)
    })
  })

  it('should have mobileTopHeaderVisibilityStatus signal as true', () => {
    expect(component.mobileTopHeaderVisibilityStatus()).toBe(true)
  })

  describe('downloadApp', () => {
    let windowOpenSpy: any

    beforeEach(() => {
      windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
    })

    afterEach(() => {
      windowOpenSpy.mockRestore()
    })

    it('should open Play Store link for Android user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10)',
        configurable: true,
      })
      component.downloadApp()
      expect(windowOpenSpy).toHaveBeenCalledWith(
        'https://play.google.com/store/apps/details?id=com.igot.karmayogibharat&hl=en&gl=US',
        '_blank'
      )
    })

    it('should open App Store link for iOS user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)',
        configurable: true,
      })
      component.downloadApp()
      expect(windowOpenSpy).toHaveBeenCalledWith(
        'https://apps.apple.com/in/app/igot-karmayogi/id6443949491',
        '_blank'
      )
    })

    it('should open Play Store link for Windows Phone user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows Phone 10.0)',
        configurable: true,
      })
      component.downloadApp()
      expect(windowOpenSpy).toHaveBeenCalledWith(
        'https://play.google.com/store/apps/details?id=com.igot.karmayogibharat&hl=en&gl=US',
        '_blank'
      )
    })

    it('should not open any link for desktop user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (X11; Linux x86_64)',
        configurable: true,
      })
      component.downloadApp()
      expect(windowOpenSpy).not.toHaveBeenCalled()
    })
  })

  describe('hideMobileTopHeader', () => {
    it('should set mobileTopHeaderVisibilityStatus signal to false', () => {
      component.hideMobileTopHeader()
      expect(component.mobileTopHeaderVisibilityStatus()).toBe(false)
    })

    it('should emit false to mobileAppsService', () => {
      component.hideMobileTopHeader()
      expect(mockMobileAppsService.mobileTopHeaderVisibilityStatus.value).toBe(false)
    })
  })
})
