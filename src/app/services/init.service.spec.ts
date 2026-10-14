import { of, Subject, throwError } from 'rxjs'
import { InitService } from './init.service'

jest.mock('../../environments/environment', () => ({
  environment: { production: false, portalRoles: ['PUBLIC', 'MDO_ADMIN'] },
}))
jest.mock('@sunbird-cb/resolver', () => ({
  hasUnitPermission: jest.fn((permission: any) => !permission || !permission.includes('blocked')),
  WidgetResolverService: class { },
}))
jest.mock('@sunbird-cb/resolver-v2', () => ({ SbUiResolverService: class { } }))
jest.mock('@sunbird-cb/utils-v2', () => ({
  ConfigurationsService: class { },
  LoggerService: class { },
  UserPreferenceService: class { },
  WidgetEnrollService: class { },
  DomainConfService: class { },
}))
jest.mock('@sunbird-cb/collection', () => ({ NPSGridService: class { }, BtnSettingsService: class { } }))
jest.mock('@sunbird-cb/consumption', () => ({ ContentDictionaryService: class { } }))
jest.mock('./netcore.service', () => ({ NetCoreService: class { } }))
jest.mock('./common-data.service', () => ({ CommonDataService: class { } }))
jest.mock('./form-ext.service', () => ({ FormExtService: class { } }))
jest.mock('./form-env-config.service', () => ({ FormEnvConfigService: class { } }))

describe('InitService', () => {
  let service: InitService
  let logger: any
  let configSvc: any
  let domainConfSvc: any
  let widgetResolver: any
  let sbUiResolver: any
  let settingsSvc: any
  let userPreference: any
  let http: any
  let npsSvc: any
  let translate: any
  let enrollSvc: any
  let netCoreService: any
  let commonDataSvc: any
  let contentDictionarySvc: any
  let formSvc: any
  let formConfigService: any
  let domSanitizer: any
  let iconRegistry: any
  let routes: Record<string, any>
  let apiUrls: Record<string, string | null>
  let globalConfig: any
  let appConfig: any

  const makeProfile = (over: any = {}) => ({
    id: 'id1',
    roles: ['PUBLIC'],
    userId: 'u1',
    firstName: 'F',
    lastName: 'L',
    rootOrgId: 'r1',
    channel: 'ch',
    userName: 'un',
    thumbnail: 'th',
    email: 'e@x.com',
    promptTnC: false,
    isDeleted: false,
    ...over,
  })

  const fullProfile = () => makeProfile({
    profileDetails: {
      userId: 'pu1',
      photo: 'ph',
      mandatoryFieldsExists: true,
      personalDetails: { firstname: 'John', surname: 'Doe', middlename: 'M', countryCode: 'IN', officialEmail: 'o@x.com' },
      employmentDetails: { departmentName: 'Dept' },
      additionalProperties: { webPortalLang: 'hi' },
      competencies: [1],
      profileImageUrl: 'url',
      professionalDetails: [{ designation: 'dd' }],
    },
  })

  const setUrl = (path: string) => window.history.pushState({}, '', path)

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
    jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    jest.spyOn(console, 'log').mockImplementation(() => undefined)
    localStorage.clear()
    setUrl('/home')
    routes = {}
    apiUrls = { 'user.profile': '/profile', 'user.firstLogin': '/login' }
    globalConfig = { apis: { content: { dictionary: { enabled: true } }, user: {} }, formClientVersion: { 'application-config-web': 2 } }
    appConfig = {
      rootOrg: 'ro',
      org: ['o1', 'o2'],
      appSetup: { a: 1 },
      positions: [],
      compentency: [],
      portalUrls: {},
      completionSurvey: {},
      npsCategory: 'cat',
      overrideThemeChanges: true,
      profileTimelyNudges: {},
      headerFooterConfigData: {},
      netcoreConfig: { netcoreWebConfig: { isActive: false } },
      iGOTAI: { web: { w: 1 } },
      tourGuide: { t: 1 },
      groups: [{ id: 'g1', featureIds: ['f1', 'f2'] }, { id: 'g2', featureIds: ['f2'] }],
      features: { f1: { id: 'f1', permission: ['ok'] }, f2: { id: 'f2', permission: ['blocked'] } },
      telemetryConfig: { publicEndpoint: 'pub', protectedEndpoint: 'prot' },
      backgrounds: { primaryNavBar: 'pn', pageNavBar: 'pg' },
      primaryNavBarConfig: { c: 1 },
      details: { appName: 'My App' },
      indexHtmlMeta: { description: 'desc', webmanifest: 'wm', pngIcon: 'png', xIcon: 'x' },
    }
    routes['/base/application.config.json'] = appConfig
    routes['/profile'] = { result: { response: makeProfile() } }
    routes['/profile/id1'] = { result: { response: makeProfile() } }
    routes['/login'] = { result: { last_login: 1 } }

    logger = { warn: jest.fn(), info: jest.fn(), error: jest.fn() }
    configSvc = {
      baseUrl: '/base',
      updateProfileObservable: new Subject<boolean>(),
      restrictedWidgets: new Set(),
      userRoles: new Set(),
      userGroups: new Set(),
      restrictedFeatures: new Set(),
      globalConfig: {},
      unMappedUser: { id: 'id1' },
    }
    domainConfSvc = {
      getApiUrl: jest.fn((group: string, key: string) => apiUrls[`${group}.${key}`]),
      isConfigEnabled: jest.fn().mockReturnValue(false),
      isApiEnabled: jest.fn().mockReturnValue(true),
    }
    widgetResolver = { initialize: jest.fn() }
    sbUiResolver = { initialize: jest.fn() }
    settingsSvc = { initializePrefChanges: jest.fn() }
    userPreference = { initialize: jest.fn() }
    http = {
      get: jest.fn((url: string) => routes[url] instanceof Error ? throwError(() => routes[url]) : of(routes[url])),
    }
    npsSvc = { getFeedStatus: jest.fn().mockReturnValue(of({ result: { response: {} } })) }
    translate = { setDefaultLang: jest.fn(), use: jest.fn() }
    enrollSvc = { fetchEnrollStats: jest.fn().mockReturnValue(of(null)), fetchEventEnrollStats: jest.fn().mockReturnValue(of(null)) }
    netCoreService = {
      getOrgReadData: jest.fn().mockReturnValue(of({})),
      bootstrapNetcore: jest.fn(),
      netCoreUserLoginSetup: jest.fn(),
      trackEvent: jest.fn(),
    }
    commonDataSvc = { checkAndCacheNlw2026Eligibility: jest.fn() }
    contentDictionarySvc = { getDictionary: jest.fn().mockReturnValue(of({})) }
    formSvc = {
      formConfigReadData: jest.fn((req: any) => of({
        result: { data: req.request.subType === 'global-web' ? globalConfig : appConfig },
      })),
    }
    formConfigService = {
      loadEnvironmentConfig: jest.fn().mockResolvedValue(undefined),
      loadPublicEnvironmentConfig: jest.fn().mockResolvedValue(undefined),
    }
    domSanitizer = { bypassSecurityTrustResourceUrl: jest.fn((u: string) => u) }
    iconRegistry = { addSvgIcon: jest.fn() }
    service = new InitService(
      logger, configSvc, domainConfSvc, widgetResolver, sbUiResolver, settingsSvc, userPreference, http, npsSvc,
      translate, enrollSvc, netCoreService, commonDataSvc, contentDictionarySvc, formSvc, formConfigService,
      '/', domSanitizer, iconRegistry,
    )
  })

  afterEach(() => {
    jest.restoreAllMocks()
    setUrl('/')
  })

  describe('constructor and getters', () => {
    it('registers icons and sets production flag', () => {
      expect(configSvc.isProduction).toBe(false)
      expect(iconRegistry.addSvgIcon).toHaveBeenCalledTimes(22)
      expect(iconRegistry.addSvgIcon).toHaveBeenCalledWith('pin', 'fusion-assets/icons/pin.svg')
    })

    it('isAnonymousTelemetryRequired reflects the url', () => {
      expect(service.isAnonymousTelemetryRequired).toBe(false)
      setUrl('/public/x')
      expect(service.isAnonymousTelemetryRequired).toBe(true)
      setUrl('/helpcenter')
      expect(service.isAnonymousTelemetryRequired).toBe(true)
    })

    it('locale derives from baseHref', () => {
      expect(service.locale).toBe('en')
      ;(service as any).baseHref = '/hi/'
      expect(service.locale).toBe('hi')
      ;(service as any).baseHref = undefined
      expect(service.locale).toBe('en')
    })

    it('hasRole checks portal roles', () => {
      expect(service.hasRole(['PUBLIC'])).toBe(true)
      expect(service.hasRole(['OTHER'])).toBe(false)
    })

    it('toTitleCase capitalises words', () => {
      expect(service.toTitleCase('jOHN dOE')).toBe('John Doe')
    })
  })

  describe('init', () => {
    it('runs the full logged-in flow', async () => {
      routes['/profile'] = { result: { response: fullProfile() } }
      const result = await service.init()
      expect(result).toBe(true)
      expect(configSvc.globalConfig).toBe(globalConfig)
      expect(configSvc.userProfile.userId).toBe('u1')
      expect(configSvc.userProfileV2.firstName).toBe('John')
      expect(contentDictionarySvc.getDictionary).toHaveBeenCalled()
      expect(settingsSvc.initializePrefChanges).toHaveBeenCalled()
      expect(localStorage.getItem('firsLogin')).toBe('true')
      expect(configSvc.isNewUser).toBe(false)
      expect(localStorage.getItem('telemetrySessionId')).toBeTruthy()
    })

    it('logs a warning when dictionary preload fails and replaces previous subscription', async () => {
      contentDictionarySvc.getDictionary.mockReturnValue(throwError(() => new Error('x')))
      await service.init()
      expect(logger.warn).toHaveBeenCalledWith('InitService: Failed to pre-load content dictionary', expect.any(Error))
      const first = service.updateProfileSubscription
      const unsubSpy = jest.spyOn(first, 'unsubscribe')
      globalConfig.apis.content.dictionary.enabled = false
      await service.init()
      expect(unsubSpy).toHaveBeenCalled()
    })

    it('refetches user details when the profile observable emits true', async () => {
      await service.init()
      http.get.mockClear()
      configSvc.updateProfileObservable.next(false)
      expect(http.get).not.toHaveBeenCalled()
      configSvc.updateProfileObservable.next(true)
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(http.get).toHaveBeenCalledWith('/profile/id1')
    })

    it('skips the global config on public routes and loads the welcome page profile', async () => {
      setUrl('/public/welcome')
      await service.init()
      expect(formSvc.formConfigReadData).not.toHaveBeenCalled()
      expect(http.get).toHaveBeenCalledWith('/base/application.config.json')
      expect(http.get).toHaveBeenCalledWith('/profile')
    })

    it('loads profile for creator editMode routes', async () => {
      setUrl('/app?editMode=true&_rc=1')
      await service.init()
      expect(http.get).toHaveBeenCalledWith('/profile')
    })

    it('loads public environment for other public routes', async () => {
      setUrl('/public/other')
      const result = await service.init()
      expect(result).toBe(true)
      expect(formConfigService.loadPublicEnvironmentConfig).toHaveBeenCalled()
      expect(http.get).not.toHaveBeenCalledWith('/profile')
    })

    it('returns false when the user is not authenticated', async () => {
      apiUrls['user.profile'] = null
      const result = await service.init()
      expect(result).toBe(false)
      expect(logger.info).toHaveBeenCalledWith('Not Authenticated')
      expect(settingsSvc.initializePrefChanges).toHaveBeenCalled()
      expect(formConfigService.loadPublicEnvironmentConfig).toHaveBeenCalled()
    })

    it('survives initFeatured failure and skips first login on viewer routes', async () => {
      setUrl('/viewer/x')
      widgetResolver.initialize.mockImplementationOnce(() => { throw new Error('boom') })
      const result = await service.init()
      expect(result).toBe(true)
      expect(logger.warn).toHaveBeenCalledWith(
        'Initialization process encountered some error. Application may not work as expected',
        expect.any(Error),
      )
      expect(http.get).not.toHaveBeenCalledWith('/login')
    })
  })

  describe('initFeatured language handling', () => {
    beforeEach(() => {
      configSvc.instanceConfig = { isMultilingualEnabled: true }
    })

    it('initialises resolvers and preferences', async () => {
      await service.initFeatured()
      expect(widgetResolver.initialize).toHaveBeenCalled()
      expect(sbUiResolver.initialize).toHaveBeenCalled()
      expect(userPreference.initialize).toHaveBeenCalled()
      expect(translate.setDefaultLang).toHaveBeenCalledWith('en')
    })

    it('uses the profile web portal language', async () => {
      configSvc.unMappedUser = { profileDetails: { additionalProperties: { webPortalLang: 'hi' } } }
      await service.initFeatured()
      expect(translate.use).toHaveBeenCalledWith('hi')
      expect(localStorage.getItem('websiteLanguage')).toBe('hi')
    })

    it('uses the stored language for an unmapped user without a profile language', async () => {
      configSvc.unMappedUser = { profileDetails: {} }
      localStorage.setItem('websiteLanguage', 'ta')
      await service.initFeatured()
      expect(translate.use).toHaveBeenCalledWith('ta')
    })

    it('defaults to en for an unmapped user with nothing stored', async () => {
      configSvc.unMappedUser = {}
      await service.initFeatured()
      expect(localStorage.getItem('websiteLanguage')).toBe('en')
      expect(translate.use).not.toHaveBeenCalled()
    })

    it('uses the stored language without an unmapped user', async () => {
      configSvc.unMappedUser = undefined
      localStorage.setItem('websiteLanguage', 'te')
      await service.initFeatured()
      expect(translate.use).toHaveBeenCalledWith('te')
    })

    it('defaults to en without an unmapped user or stored language', async () => {
      configSvc.unMappedUser = undefined
      await service.initFeatured()
      expect(localStorage.getItem('websiteLanguage')).toBe('en')
    })

    it('defaults to en when multilingual is disabled', async () => {
      configSvc.instanceConfig = { isMultilingualEnabled: false }
      await service.initFeatured()
      expect(localStorage.getItem('websiteLanguage')).toBe('en')
    })
  })

  describe('fetchDefaultConfig', () => {
    beforeEach(() => {
      const wm = document.createElement('link')
      wm.id = 'id-app-webmanifest'
      const desc = document.createElement('meta')
      desc.id = 'id-app-description'
      const png = document.createElement('link')
      png.id = 'id-app-fav-icon'
      const x = document.createElement('link')
      x.id = 'id-app-x-icon'
      document.body.append(wm, desc, png, x)
    })

    afterEach(() => {
      document.body.innerHTML = ''
    })

    it('loads from the form api and applies the config', async () => {
      const result = await (service as any).fetchDefaultConfig()
      expect(result).toBe(appConfig)
      expect(formSvc.formConfigReadData).toHaveBeenCalledWith(expect.objectContaining({
        request: expect.objectContaining({ clientVersion: 1.0 }),
      }))
      expect(localStorage.getItem('npsCategory')).toBe('cat')
      expect(configSvc.activeOrg).toBe('o1')
      expect(configSvc.iGOTAIConfig).toEqual({ w: 1 })
      expect(configSvc.appsConfig.features).toEqual({ f1: appConfig.features.f1 })
      expect(configSvc.appsConfig.groups).toEqual([{ id: 'g1', featureIds: ['f1'] }])
      expect(configSvc.appsConfig.tourGuide).toEqual({ t: 1 })
      expect(configSvc.instanceConfig.telemetryConfig.endpoint).toBe('prot')
      expect(document.title).toBe('My App')
      expect(document.getElementById('id-app-description')!.getAttribute('content')).toBe('desc')
      expect(document.getElementById('id-app-webmanifest')!.getAttribute('href')).toBe('wm')
      expect((document.getElementById('id-app-fav-icon') as HTMLLinkElement).href).toContain('png')
      expect((document.getElementById('id-app-x-icon') as HTMLLinkElement).href).toContain('x')
    })

    it('uses the client version from global config and reads form.data variants', async () => {
      configSvc.globalConfig = globalConfig
      formSvc.formConfigReadData.mockReturnValue(of({ result: { form: { data: appConfig } } }))
      await (service as any).fetchDefaultConfig()
      expect(formSvc.formConfigReadData).toHaveBeenCalledWith(expect.objectContaining({
        request: expect.objectContaining({ clientVersion: 2 }),
      }))
      expect(configSvc.instanceConfig).toBe(appConfig)
    })

    it('loads the static file for public routes and skips optional parts', async () => {
      delete appConfig.npsCategory
      delete appConfig.iGOTAI
      delete appConfig.indexHtmlMeta.description
      delete appConfig.indexHtmlMeta.webmanifest
      delete appConfig.indexHtmlMeta.pngIcon
      delete appConfig.indexHtmlMeta.xIcon
      delete appConfig.details
      delete appConfig.telemetryConfig
      setUrl('/public/x')
      await (service as any).fetchDefaultConfig(true)
      expect(formSvc.formConfigReadData).not.toHaveBeenCalled()
      expect(localStorage.getItem('npsCategory')).toBeNull()
      expect(configSvc.iGOTAIConfig).toBeUndefined()
    })

    it('uses the public telemetry endpoint on anonymous routes', async () => {
      setUrl('/public/x')
      await (service as any).fetchDefaultConfig(true)
      expect(configSvc.instanceConfig.telemetryConfig.endpoint).toBe('pub')
    })

    it('falls back to the static file when the form api fails or is empty', async () => {
      formSvc.formConfigReadData.mockReturnValue(of(null))
      await (service as any).fetchDefaultConfig()
      expect(http.get).toHaveBeenCalledWith('/base/application.config.json')
      expect(configSvc.instanceConfig).toBe(appConfig)
    })

    it('logs an error when updating index html meta throws', async () => {
      delete appConfig.indexHtmlMeta
      await (service as any).fetchDefaultConfig()
      expect(logger.error).toHaveBeenCalledWith('Error updating index html meta >', expect.any(Error))
    })

    it('ignores missing dom elements', async () => {
      document.body.innerHTML = ''
      await (service as any).fetchDefaultConfig()
      expect(configSvc.instanceConfig).toBe(appConfig)
    })
  })

  describe('globalConfigData', () => {
    it('stores the global config', async () => {
      expect(await (service as any).globalConfigData()).toBe(globalConfig)
    })

    it('flags a load failure', async () => {
      formSvc.formConfigReadData.mockReturnValue(throwError(() => new Error('x')))
      expect(await (service as any).globalConfigData()).toEqual({})
      expect(configSvc.globalConfigLoadFailed).toBe(true)
    })
  })

  describe('fetchUserEnrollDetails', () => {
    const courseRes = () => ({
      result: {
        badgeCount: 2,
        userCourseEnrolmentInfo: {
          karmaPoints: 10, timeSpentOnCompletedCourses: 100, certificatesIssued: 1, coursesInProgress: 2,
          addinfo: { claimedNonACBPCourseKarmaQuota: 5 },
        },
        userExternalCourseEnrolmentInfo: {
          karmaPoints: 1, timeSpentOnCompletedCourses: 10, certificatesIssued: 1, coursesInProgress: 1,
          addinfo: { claimedNonACBPCourseKarmaQuota: 2 },
        },
      },
    })
    const eventRes = { result: { userEventEnrolmentInfo: { eventsAttended: 1, eventsEnrolled: 3, hoursSpentOnEvents: 2 } } }
    const stored = () => JSON.parse(localStorage.getItem('userEnrollmentCount') || '{}')

    beforeEach(() => {
      configSvc.globalConfig = {
        apis: { user: { userEnrollmentSummary: { enabled: true, url: 'cu' }, eventEnroll: { enabled: true, url: 'eu' } } },
      }
      configSvc.userProfile = { userId: 'u1' }
    })

    it('returns empty when disabled', async () => {
      configSvc.globalConfig = {}
      expect(await (service as any).fetchUserEnrollDetails()).toEqual({})
      expect(enrollSvc.fetchEnrollStats).not.toHaveBeenCalled()
    })

    it('merges course and event stats', async () => {
      enrollSvc.fetchEnrollStats.mockReturnValue(of(courseRes()))
      enrollSvc.fetchEventEnrollStats.mockReturnValue(of(eventRes))
      await (service as any).fetchUserEnrollDetails()
      expect(enrollSvc.fetchEnrollStats).toHaveBeenCalledWith('u1', 'cu')
      expect(enrollSvc.fetchEventEnrollStats).toHaveBeenCalledWith('eu')
      const data = stored()
      expect(data.userCourseEnrolmentInfo.karmaPoints).toBe(11)
      expect(data.userCourseEnrolmentInfo.certificatesIssued).toBe(3)
      expect(data.userCourseEnrolmentInfo.coursesInProgress).toBe(5)
      expect(data.userCourseEnrolmentInfo.addinfo.claimedNonACBPCourseKarmaQuota).toBe(7)
      expect(data.enrolledCourseCount).toBe(8)
      expect(data.eventEnrolmentCount).toEqual({ certificate: 1, inProgress: 2, learningHours: 2 })
    })

    it('handles missing addinfo and a disabled event api', async () => {
      configSvc.globalConfig.apis.user.eventEnroll = undefined
      const res: any = courseRes()
      res.result.userExternalCourseEnrolmentInfo = { karmaPoints: 0 }
      res.result.userCourseEnrolmentInfo.addinfo = {}
      enrollSvc.fetchEnrollStats.mockReturnValue(of(res))
      await (service as any).fetchUserEnrollDetails()
      expect(enrollSvc.fetchEventEnrollStats).not.toHaveBeenCalled()
      expect(stored().userCourseEnrolmentInfo.certificatesIssued).toBe(1)
    })

    it('handles external info without addinfo', async () => {
      const res: any = courseRes()
      delete res.result.userExternalCourseEnrolmentInfo.addinfo
      enrollSvc.fetchEnrollStats.mockReturnValue(of(res))
      await (service as any).fetchUserEnrollDetails()
      expect(stored().userCourseEnrolmentInfo.addinfo.claimedNonACBPCourseKarmaQuota).toBe(5)
    })

    it('stores event data when the course summary fails', async () => {
      enrollSvc.fetchEnrollStats.mockReturnValue(throwError(() => new Error('x')))
      enrollSvc.fetchEventEnrollStats.mockReturnValue(of(eventRes))
      await (service as any).fetchUserEnrollDetails()
      expect(stored().enrolledCourseCount).toBe(0)
      expect(stored().eventEnrolmentCount.certificate).toBe(1)
    })

    it('stores zeros when both apis fail', async () => {
      enrollSvc.fetchEnrollStats.mockReturnValue(throwError(() => new Error('x')))
      enrollSvc.fetchEventEnrollStats.mockReturnValue(throwError(() => new Error('y')))
      await (service as any).fetchUserEnrollDetails()
      expect(stored().mergedCountData).toEqual({ certificate: 0, inProgress: 0, learningHours: 0, karmaPoints: 0, badgeCount: 0 })
    })

    it('falls back when processing the response throws', async () => {
      const res: any = courseRes()
      delete res.result.userExternalCourseEnrolmentInfo
      enrollSvc.fetchEnrollStats.mockReturnValue(of(res))
      await (service as any).fetchUserEnrollDetails()
      expect(stored().enrolledCourseCount).toBe(0)
    })

    describe('netcore bootstrap', () => {
      beforeEach(() => {
        configSvc.userProfile = { userId: 'u1', rootOrgId: 'r1' }
        configSvc.netcoreConfig = { netcoreWebConfig: { isActive: true } }
        jest.spyOn(service, 'netCoreUserLoginSetup').mockResolvedValue(undefined)
      })

      it('bootstraps and sets up the netcore user', async () => {
        await (service as any).fetchUserEnrollDetails()
        expect(netCoreService.getOrgReadData).toHaveBeenCalledWith('r1')
        expect(netCoreService.bootstrapNetcore).toHaveBeenCalled()
        expect(service.netCoreUserLoginSetup).toHaveBeenCalled()
      })

      it('skips setup when already done', async () => {
        localStorage.setItem('netCoreUserSetup', 'true')
        await (service as any).fetchUserEnrollDetails()
        expect(service.netCoreUserLoginSetup).not.toHaveBeenCalled()
      })

      it('runs setup when the flag is the string false', async () => {
        localStorage.setItem('netCoreUserSetup', 'false')
        await (service as any).fetchUserEnrollDetails()
        expect(service.netCoreUserLoginSetup).toHaveBeenCalled()
      })

      it('skips when netcore is disabled for the org', async () => {
        netCoreService.getOrgReadData.mockReturnValue(of({ netcoreDisabled: true }))
        await (service as any).fetchUserEnrollDetails()
        expect(netCoreService.bootstrapNetcore).not.toHaveBeenCalled()
      })

      it('skips setup when the netcore config is inactive', async () => {
        configSvc.netcoreConfig = undefined
        netCoreService.getOrgReadData.mockReturnValue(of(null))
        await (service as any).fetchUserEnrollDetails()
        expect(netCoreService.bootstrapNetcore).toHaveBeenCalled()
        expect(service.netCoreUserLoginSetup).not.toHaveBeenCalled()
      })

      it('does nothing without a root org', async () => {
        configSvc.userProfile = { userId: 'u1' }
        await (service as any).fetchUserEnrollDetails()
        expect(netCoreService.getOrgReadData).not.toHaveBeenCalled()
      })

      it('does nothing without a user profile', async () => {
        configSvc.userProfile = undefined
        await (service as any).fetchUserEnrollDetails().catch(() => undefined)
        expect(netCoreService.getOrgReadData).not.toHaveBeenCalled()
      })
    })
  })

  describe('logFirstLogin', () => {
    it('warns when the api is disabled', async () => {
      apiUrls['user.firstLogin'] = null
      await (service as any).logFirstLogin()
      expect(console.warn).toHaveBeenCalledWith('First login API is disabled')
      expect(http.get).not.toHaveBeenCalled()
    })

    it('marks a first ever login with matching timestamps', async () => {
      routes['/login'] = { result: { first_login: 5, last_login: '5' } }
      await (service as any).logFirstLogin()
      expect(configSvc.isNewUser).toBe(true)
      expect(localStorage.getItem('firsLogin')).toBe('true')
    })

    it('does not update when not the first login or no result', async () => {
      localStorage.setItem('firsLogin', 'true')
      await (service as any).logFirstLogin()
      expect(configSvc.isNewUser).toBeUndefined()
      localStorage.clear()
      routes['/login'] = {}
      await (service as any).logFirstLogin()
      expect(configSvc.isNewUser).toBeUndefined()
    })

    it('swallows api errors', async () => {
      routes['/login'] = new Error('x')
      await expect((service as any).logFirstLogin()).resolves.toBeUndefined()
      expect(console.error).toHaveBeenCalled()
    })

    it('resolveIsNewUser covers all outcomes', () => {
      const r = (v: any) => (service as any).resolveIsNewUser(v)
      expect(r(undefined)).toBe(true)
      expect(r({ last_login: 1 })).toBe(false)
      expect(r({ last_login: 1, first_login: 1 })).toBe(true)
      expect(r({ last_login: 2, first_login: 1 })).toBe(false)
    })
  })

  describe('fetchStartUpDetails', () => {
    beforeEach(() => {
      configSvc.instanceConfig = { telemetryConfig: { publicEndpoint: 'pub', protectedEndpoint: 'prot' } }
    })

    it('returns public defaults without an instance config', async () => {
      configSvc.instanceConfig = undefined
      const details = await (service as any).fetchStartUpDetails()
      expect(details.isActive).toBe(true)
      expect(details.roles.has('Public')).toBe(true)
    })

    it('throws when the profile api is disabled', async () => {
      apiUrls['user.profile'] = null
      await expect((service as any).fetchStartUpDetails()).rejects.toThrow('Profile API disabled')
    })

    it('maps a minimal profile and keeps an existing nodebb profile', async () => {
      configSvc.nodebbUserProfile = { username: 'x' }
      const details = await (service as any).fetchStartUpDetails()
      expect(details.roles).toEqual(['public'])
      expect(details.tncStatus).toBe(true)
      expect(configSvc.userProfile.email).toBe('e@x.com')
      expect(configSvc.userProfileV2.userName).toBe('')
      expect(configSvc.nodebbUserProfile).toEqual({ username: 'x' })
      expect(commonDataSvc.checkAndCacheNlw2026Eligibility).toHaveBeenCalled()
      expect(configSvc.userRoles.has('public')).toBe(true)
    })

    it('maps a full profile', async () => {
      routes['/profile'] = { result: { response: fullProfile() } }
      await (service as any).fetchStartUpDetails()
      expect(configSvc.userProfileV2.userName).toBe('JohnDoe')
      expect(configSvc.userProfileV2.webPortalLang).toBe('hi')
      expect(configSvc.nodebbUserProfile.username).toBe('un')
      expect(configSvc.profileDetailsStatus).toBe(true)
    })

    it('redirects to the api provided url for users without a valid role', async () => {
      routes['/profile'] = { redirectUrl: 'http://redirect/', result: { response: makeProfile({ roles: ['NOPE'] }) } }
      await (service as any).fetchStartUpDetails()
      expect(configSvc.userProfile).toBeUndefined()
    })

    it('redirects to reset when no redirect url is given', async () => {
      routes['/profile'] = { result: { response: makeProfile({ roles: [] }) } }
      await (service as any).fetchStartUpDetails()
      expect(configSvc.userProfile).toBeUndefined()
    })

    it('throws Invalid user when the request fails', async () => {
      routes['/profile'] = new Error('x')
      await expect((service as any).fetchStartUpDetails()).rejects.toThrow('Invalid user')
      expect(configSvc.userProfile).toBeNull()
    })

    it('throws Invalid user when no profile is returned', async () => {
      routes['/profile'] = { result: {} }
      await expect((service as any).fetchStartUpDetails()).rejects.toThrow('Invalid user')
    })

    describe('nps check', () => {
      beforeEach(() => {
        domainConfSvc.isConfigEnabled.mockReturnValue(true)
        jest.spyOn(service as any, 'checkUserFeed').mockImplementation(() => undefined)
      })

      it('checks the feed when no rating time is stored', async () => {
        await (service as any).fetchStartUpDetails()
        expect((service as any).checkUserFeed).toHaveBeenCalledTimes(1)
      })

      it('checks the feed when the rating time is recent', async () => {
        localStorage.setItem('platformratingTime', new Date().toString())
        await (service as any).fetchStartUpDetails()
        expect((service as any).checkUserFeed).toHaveBeenCalledTimes(1)
      })

      it('skips the feed when the rating time is old', async () => {
        localStorage.setItem('platformratingTime', '2000-01-01')
        await (service as any).fetchStartUpDetails()
        expect((service as any).checkUserFeed).not.toHaveBeenCalled()
      })

      it('skips when the dialogs are disabled', async () => {
        domainConfSvc.isConfigEnabled.mockReturnValue(false)
        await (service as any).fetchStartUpDetails()
        expect((service as any).checkUserFeed).not.toHaveBeenCalled()
      })
    })
  })

  describe('checkUserFeed', () => {
    const feedResponse = (userFeed?: any[]) => of({ result: { response: { userFeed } } })

    it('warns when the feed api is disabled', () => {
      domainConfSvc.isApiEnabled.mockReturnValue(false)
      ;(service as any).checkUserFeed()
      expect(npsSvc.getFeedStatus).not.toHaveBeenCalled()
    })

    it('stores NPS and NPS2 feed data', () => {
      npsSvc.getFeedStatus.mockReturnValue(feedResponse([
        { id: 'a', category: 'NPS', data: { actionData: { formId: 'f1' } } },
        { id: 'b', category: 'NPS2', data: { actionData: { formId: 'f2' } } },
        { id: 'c', category: 'NPS' },
        { id: 'd', category: 'OTHER' },
      ]))
      ;(service as any).checkUserFeed()
      expect(npsSvc.getFeedStatus).toHaveBeenCalledWith('id1')
      expect(localStorage.getItem('ratingformID')).toBe('"f2"')
      expect(localStorage.getItem('ratingfeedID')).toBe('["a","b"]')
      expect(localStorage.getItem('surveyPopup')).toBe('true')
    })

    it('ignores empty feeds and keeps a disabled survey popup', () => {
      npsSvc.getFeedStatus.mockReturnValue(feedResponse([]))
      localStorage.setItem('surveyPopup', 'false')
      ;(service as any).checkUserFeed()
      expect(localStorage.getItem('surveyPopup')).toBe('false')
      expect(localStorage.getItem('ratingformID')).toBeNull()
      npsSvc.getFeedStatus.mockReturnValue(feedResponse(undefined))
      ;(service as any).checkUserFeed()
      expect(localStorage.getItem('ratingformID')).toBeNull()
    })
  })

  describe('fetchUserDetails', () => {
    beforeEach(() => {
      configSvc.instanceConfig = { telemetryConfig: { publicEndpoint: 'pub', protectedEndpoint: 'prot' } }
    })

    it('returns public defaults when there is no user id', async () => {
      configSvc.unMappedUser = {}
      const details = await (service as any).fetchUserDetails()
      expect(details.roles.has('Public')).toBe(true)
    })

    it('throws when the profile api is disabled', async () => {
      apiUrls['user.profile'] = null
      await expect((service as any).fetchUserDetails()).rejects.toThrow('Profile API disabled')
    })

    it('maps a minimal profile', async () => {
      configSvc.nodebbUserProfile = { username: 'x' }
      const details = await (service as any).fetchUserDetails()
      expect(details.tncStatus).toBe(true)
      expect(configSvc.userProfile.userId).toBe('u1')
      expect(localStorage.getItem('login')).toBe('true')
    })

    it('maps a full profile', async () => {
      routes['/profile/id1'] = { result: { response: fullProfile() } }
      await (service as any).fetchUserDetails()
      expect(configSvc.userProfileV2.firstName).toBe('John')
      expect(configSvc.nodebbUserProfile.username).toBe('un')
    })

    it('resets for an invalid role', async () => {
      routes['/profile/id1'] = { result: { response: makeProfile({ roles: [] }) } }
      await (service as any).fetchUserDetails()
      expect(configSvc.userRoles.has('public')).toBe(false)
    })

    it('throws Invalid user on failure', async () => {
      routes['/profile/id1'] = new Error('x')
      await expect((service as any).fetchUserDetails()).rejects.toThrow('Invalid user')
      expect(configSvc.userProfile).toBeNull()
    })
  })

  describe('misc private helpers', () => {
    it('updateNavConfig applies backgrounds and nav config', () => {
      configSvc.instanceConfig = { backgrounds: { primaryNavBar: 'p', pageNavBar: 'q' }, primaryNavBarConfig: { c: 1 } }
      ;(service as any).updateNavConfig()
      expect(configSvc.primaryNavBar).toBe('p')
      expect(configSvc.pageNavBar).toBe('q')
      expect(configSvc.primaryNavBarConfig).toEqual({ c: 1 })
    })

    it('updateNavConfig tolerates missing pieces', () => {
      configSvc.instanceConfig = { backgrounds: {} }
      ;(service as any).updateNavConfig()
      configSvc.instanceConfig = undefined
      ;(service as any).updateNavConfig()
      expect(configSvc.primaryNavBar).toBeUndefined()
    })

    it('updateTelemetryConfig ignores configs without telemetry', () => {
      configSvc.instanceConfig = {}
      ;(service as any).updateTelemetryConfig()
      expect(configSvc.instanceConfig.telemetryConfig).toBeUndefined()
    })

    it('defaultRedirectUrl falls back to the origin', () => {
      expect((service as any).defaultRedirectUrl).toBe(document.baseURI)
      jest.spyOn(document, 'baseURI', 'get').mockReturnValue('')
      expect((service as any).defaultRedirectUrl).toBe(location.origin)
      jest.spyOn(document, 'baseURI', 'get').mockImplementation(() => { throw new Error('x') })
      expect((service as any).defaultRedirectUrl).toBe(location.origin)
    })

    it('setTelemetrySessionId replaces an existing id', () => {
      localStorage.setItem('telemetrySessionId', 'old')
      ;(service as any).setTelemetrySessionId()
      expect(localStorage.getItem('telemetrySessionId')).not.toBe('old')
    })

    it('buildMergedCounts uses defaults', () => {
      expect((service as any).buildMergedCounts()).toEqual({
        certificate: 0, inProgress: 0, learningHours: 0, karmaPoints: 0, badgeCount: 0,
      })
    })
  })

  describe('netCoreUserLoginSetup', () => {
    it('builds the full payload and tracks sign in', async () => {
      localStorage.setItem('userEnrollmentCount', JSON.stringify({ a: 1 }))
      configSvc.unMappedUser = {
        identifier: ' ABC ',
        profileDetails: {
          profileStatus: ' VERIFIED ',
          personalDetails: { firstname: ' jOHN ', domicileMedium: ' hindi ', primaryEmail: ' a@b.com ', mobile: '999' },
          employmentDetails: { departmentName: ' dept one ' },
          professionalDetails: [{ designation: ' dev ops ', group: ' group a ' }],
        },
      }
      configSvc.netcoreConfig = { netcoreWebConfig: { isActive: true, events: { user_signin: { isActive: true } } } }
      await service.netCoreUserLoginSetup()
      expect(localStorage.getItem('netCoreUserSetup')).toBe('true')
      expect(netCoreService.netCoreUserLoginSetup).toHaveBeenCalledWith({
        TOTAL_EXPERIENCE: '',
        'pk^userid': 'abc',
        FULL_NAME: 'John',
        MOTHER_TONGUE: 'Hindi',
        email: 'a@b.com',
        mobile: '999',
        PROFILE_STATUS: 'VERIFIED',
        PROFILE_DESIGNATION: 'Dev Ops',
        ORGANISATION: 'Dept One',
        PROFILE_GROUP: 'Group A',
      })
      expect(netCoreService.trackEvent).toHaveBeenCalledWith('user_signin', 'abc')
    })

    it('handles a sparse profile and inactive netcore', async () => {
      configSvc.unMappedUser = {
        profileDetails: { personalDetails: {}, professionalDetails: [{}] },
      }
      configSvc.netcoreConfig = { netcoreWebConfig: { isActive: true, events: { user_signin: { isActive: false } } } }
      await service.netCoreUserLoginSetup()
      expect(netCoreService.netCoreUserLoginSetup).toHaveBeenCalledWith({ TOTAL_EXPERIENCE: '' })
      expect(netCoreService.trackEvent).not.toHaveBeenCalled()
    })

    it('does nothing for netcore when it is not configured', async () => {
      configSvc.unMappedUser = {}
      configSvc.netcoreConfig = undefined
      await service.netCoreUserLoginSetup()
      expect(netCoreService.netCoreUserLoginSetup).not.toHaveBeenCalled()
    })

    it('handles professional details without employment details', async () => {
      configSvc.unMappedUser = { profileDetails: { professionalDetails: [{ designation: 'x' }] } }
      configSvc.netcoreConfig = undefined
      await service.netCoreUserLoginSetup()
      expect(netCoreService.netCoreUserLoginSetup).not.toHaveBeenCalled()
    })
  })
})
