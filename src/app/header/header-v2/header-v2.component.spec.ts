import { ComponentFixture, TestBed } from '@angular/core/testing'
import { Router, NavigationEnd } from '@angular/router'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { DomSanitizer } from '@angular/platform-browser'
import { of, Subject } from 'rxjs'

import { HeaderV2Component } from './header-v2.component'
import { ConfigurationsService, DomainConfService, MultilingualTranslationsService } from '@sunbird-cb/utils-v2'
import { MobileAppsService } from '../../services/mobile-apps.service'

describe('HeaderV2Component', () => {
  let component: HeaderV2Component
  let fixture: ComponentFixture<HeaderV2Component>
  let mockRouter: jasmine.SpyObj<Router>
  let mockConfigSvc: jasmine.SpyObj<ConfigurationsService>
  let mockDomainConfSvc: jasmine.SpyObj<DomainConfService>
  let mockMobileAppsSvc: jasmine.SpyObj<MobileAppsService>
  let mockTranslateService: jasmine.SpyObj<TranslateService>
  let mockLangTranslations: jasmine.SpyObj<MultilingualTranslationsService>
  let routerEventsSubject: Subject<any>

  beforeEach(async () => {
    routerEventsSubject = new Subject()

    mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl'], {
      events: routerEventsSubject.asObservable()
    })

    mockConfigSvc = jasmine.createSpyObj('ConfigurationsService', [], {
      instanceConfig: {
        websitelanguages: [
          { key: 'en', value: 'English', active: true },
          { key: 'hi', value: 'Hindi', active: true }
        ],
        isMultilingualEnabled: true
      },
      userProfile: { userId: 'test-user' },
      unMappedUser: { id: 'test-id' },
      languageTranslationFlag: new Subject()
    })

    mockDomainConfSvc = jasmine.createSpyObj('DomainConfService', [
      'getDomainAppLogo',
      'getDomainRedirectPath'
    ])
    mockDomainConfSvc.getDomainAppLogo.and.returnValue('/assets/logo.png')
    mockDomainConfSvc.getDomainRedirectPath.and.returnValue('/page/home')

    mockMobileAppsSvc = jasmine.createSpyObj('MobileAppsService', [], {
      mobileTopHeaderVisibilityStatus: new Subject()
    })

    mockTranslateService = jasmine.createSpyObj('TranslateService', [
      'setDefaultLang',
      'use'
    ])

    mockLangTranslations = jasmine.createSpyObj('MultilingualTranslationsService', [
      'updatelanguageSelected'
    ], {
      languageSelectedObservable: of(true)
    })

    await TestBed.configureTestingModule({
      imports: [
        HeaderV2Component,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ConfigurationsService, useValue: mockConfigSvc },
        { provide: DomainConfService, useValue: mockDomainConfSvc },
        { provide: MobileAppsService, useValue: mockMobileAppsSvc },
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: MultilingualTranslationsService, useValue: mockLangTranslations },
        DomSanitizer
      ]
    })
      .compileComponents()

    fixture = TestBed.createComponent(HeaderV2Component)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.mobileTopHeaderVisible()).toBe(true)
      expect(component.showHeader()).toBe(true)
      expect(component.notificationsCount()).toBe(0)
      expect(component.selectedLanguage()).toBe('en')
    })

    it('should load app icon on init', () => {
      expect(mockDomainConfSvc.getDomainAppLogo).toHaveBeenCalled()
      expect(component.appIcon).toBeTruthy()
    })

    it('should set isLoggedIn when user profile exists', () => {
      expect(component.isLoggedIn).toBe(true)
    })

    it('should initialize languages', () => {
      expect(component.multiLang.length).toBe(2)
      expect(component.isMultiLangEnabled).toBe(true)
    })
  })

  describe('Logo Visibility', () => {
    it('should show logo when leftNavBarOpen is false', () => {
      fixture.componentRef.setInput('leftNavBarOpen', false)
      fixture.detectChanges()
      expect(component.shouldShowLogo()).toBe(true)
    })

    it('should hide logo when leftNavBarOpen is true', () => {
      fixture.componentRef.setInput('leftNavBarOpen', true)
      fixture.detectChanges()
      expect(component.shouldShowLogo()).toBe(false)
    })
  })

  describe('Mobile Header', () => {
    it('should hide mobile top header when hideMobileTopHeader is called', () => {
      component.hideMobileTopHeader()
      expect(component.mobileTopHeaderVisible()).toBe(false)
    })

    it('should emit event to mobile apps service when hiding banner', () => {
      spyOn(mockMobileAppsSvc.mobileTopHeaderVisibilityStatus, 'next')
      component.hideMobileTopHeader()
      expect(mockMobileAppsSvc.mobileTopHeaderVisibilityStatus.next).toHaveBeenCalledWith(false)
    })
  })

  describe('Download App', () => {
    it('should open Android app store on Android devices', () => {
      spyOn(window, 'open')
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Android',
        configurable: true
      })

      component.downloadApp()
      expect(window.open).toHaveBeenCalledWith(
        jasmine.stringContaining('play.google.com'),
        '_blank'
      )
    })
  })

  describe('Language Selection', () => {
    it('should update selected language', () => {
      component.selectLanguage('hi')
      expect(component.selectedLanguage()).toBe('hi')
    })

    it('should save language to localStorage', () => {
      spyOn(localStorage, 'setItem')
      component.selectLanguage('hi')
      expect(localStorage.setItem).toHaveBeenCalledWith('websiteLanguage', 'hi')
    })

    it('should call translation service', () => {
      component.selectLanguage('hi')
      expect(mockTranslateService.use).toHaveBeenCalledWith('hi')
      expect(mockLangTranslations.updatelanguageSelected).toHaveBeenCalled()
    })
  })

  describe('Navigation', () => {
    it('should hide header on logout route', () => {
      component.handleRouteChange('/public/logout')
      expect(component.showHeader()).toBe(false)
    })

    it('should hide header on viewer route', () => {
      component.handleRouteChange('/viewer/course/123')
      expect(component.showHeader()).toBe(false)
    })

    it('should show header on home route', () => {
      component.handleRouteChange('/page/home')
      expect(component.showHeader()).toBe(true)
    })

    it('should navigate to search on search focus', () => {
      component.onSearchFocus()
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/search/home')
    })

    it('should navigate to help centre on support form click', () => {
      component.openSupportForm()
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('igot/help-centre')
    })
  })

  describe('Route Change Subscription', () => {
    it('should update header visibility on route change', (done) => {
      component.showHeader.set(true)

      routerEventsSubject.next(new NavigationEnd(1, '/public/logout', '/public/logout'))

      setTimeout(() => {
        expect(component.showHeader()).toBe(false)
        done()
      }, 100)
    })
  })
});

