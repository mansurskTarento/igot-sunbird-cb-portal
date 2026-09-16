import { HomeV2ResolverService } from './home-v2-resolver.service'
import { of, throwError } from 'rxjs'

// This service uses inject() as field initializers, which requires an Angular
// injection context. We avoid TestBed entirely by creating the instance via
// Object.create (skipping the constructor/field initializers) and manually
// assigning the private fields the class relies on.
jest.mock('@angular/core', () => {
  const actual = jest.requireActual('@angular/core')
  return {
    ...actual,
    inject: jest.fn(),
  }
})

describe('HomeV2ResolverService (No TestBed)', () => {
  let resolver: HomeV2ResolverService
  let mockConfigSvc: any
  let mockRouter: any
  let mockHttp: any
  let mockFormSvc: any

  beforeEach(() => {
    mockConfigSvc = {
      unMappedUser: {
        profileDetails: {
          profileStatus: 'VERIFIED',
          employmentDetails: { departmentName: 'someDept' },
          additionalProperties: { isBharatKalpMember: false },
        },
      },
      sitePath: 'https://portal.test',
      globalConfig: { formClientVersion: { home: 2.0 } },
    }

    mockRouter = { navigateByUrl: jest.fn() }
    mockHttp = { get: jest.fn().mockReturnValue(of(null)) }
    mockFormSvc = { formConfigReadData: jest.fn().mockReturnValue(of(null)) }

    resolver = Object.create(HomeV2ResolverService.prototype)
    ; (resolver as any).configSvc = mockConfigSvc
    ; (resolver as any).router = mockRouter
    ; (resolver as any).http = mockHttp
    ; (resolver as any).formSvc = mockFormSvc
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should be defined', () => {
    expect(resolver).toBeDefined()
  })

  describe('resolve', () => {
    it('should redirect to profile page when user is not-my-user in an igot org', done => {
      mockConfigSvc.unMappedUser.profileDetails.profileStatus = 'not-my-user'
      mockConfigSvc.unMappedUser.profileDetails.employmentDetails.departmentName = 'igot'

      resolver.resolve().subscribe((result: any) => {
        expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('app/person-profile/me#profileInfo')
        expect(result.data).toEqual([])
        done()
      })
    })

    it('should not redirect when profile status is verified', done => {
      resolver.resolve().subscribe(() => {
        expect(mockRouter.navigateByUrl).not.toHaveBeenCalled()
        done()
      })
    })

    it('should not redirect when user is not-my-user but not an igot org', done => {
      mockConfigSvc.unMappedUser.profileDetails.profileStatus = 'not-my-user'
      mockConfigSvc.unMappedUser.profileDetails.employmentDetails.departmentName = 'otherDept'

      resolver.resolve().subscribe(() => {
        expect(mockRouter.navigateByUrl).not.toHaveBeenCalled()
        done()
      })
    })

    it('should use the form config data when available and mark the pills section loading', done => {
      const homeSection = [{ sectionKey: 'aparCourses', pills: [], visibilityMode: 'hidden' }]
      mockFormSvc.formConfigReadData.mockReturnValue(of({ result: { data: { homeSection } } }))

      resolver.resolve().subscribe((result: any) => {
        const pillsSection = result.data.homeSection.find((s: any) => s.sectionKey === 'aparCourses')
        expect(pillsSection.sectionLoading).toBe(true)
        // Only sectionLoading is forced here — visibility stays whatever the config already had,
        // since actual pill visibility is computed later in HomeV2Component.
        expect(pillsSection.visibilityMode).toBe('hidden')
        expect(result.error).toBeNull()
        done()
      })
    })

    it('should fall back to the home-v2.json config when form config has no data', done => {
      mockFormSvc.formConfigReadData.mockReturnValue(of({ result: { data: null } }))
      const homeSection = [{ sectionKey: 'aparCourses', pills: [] }]
      mockHttp.get.mockReturnValue(of({ homeSection }))

      resolver.resolve().subscribe((result: any) => {
        expect(mockHttp.get).toHaveBeenCalledWith('https://portal.test/page/home-v2.json')
        const pillsSection = result.data.homeSection.find((s: any) => s.sectionKey === 'aparCourses')
        expect(pillsSection.sectionLoading).toBe(true)
        done()
      })
    })

    it('should default to an empty array when both form config and home-v2.json are unavailable', done => {
      resolver.resolve().subscribe((result: any) => {
        expect(result.data).toEqual([])
        done()
      })
    })

    it('should leave configDetails without a homeSection array untouched', done => {
      mockFormSvc.formConfigReadData.mockReturnValue(of({ result: { data: { foo: 'bar' } } }))

      resolver.resolve().subscribe((result: any) => {
        expect(result.data).toEqual({ foo: 'bar' })
        expect(result.error).toBeNull()
        done()
      })
    })

    it('should leave the pills section untouched when it is not present', done => {
      const homeSection = [{ sectionKey: 'otherSection' }]
      mockFormSvc.formConfigReadData.mockReturnValue(of({ result: { data: { homeSection } } }))

      resolver.resolve().subscribe((result: any) => {
        expect(result.data.homeSection[0].sectionLoading).toBeUndefined()
        done()
      })
    })

    it('should filter out the bharat-kalp spotlight card for non bharat-kalp members', done => {
      mockConfigSvc.unMappedUser.profileDetails.additionalProperties.isBharatKalpMember = false
      const homeSection = [
        {
          sectionKey: 'spotlight',
          spotlightConfig: [
            { cardClickDetails: { id: 'bharat-kalp' } },
            { cardClickDetails: { id: 'other-card' } },
          ],
        },
      ]
      mockFormSvc.formConfigReadData.mockReturnValue(of({ result: { data: { homeSection } } }))

      resolver.resolve().subscribe((result: any) => {
        const spotlight = result.data.homeSection.find((s: any) => s.sectionKey === 'spotlight')
        expect(spotlight.spotlightConfig).toHaveLength(1)
        expect(spotlight.spotlightConfig[0].cardClickDetails.id).toBe('other-card')
        done()
      })
    })

    it('should keep the bharat-kalp spotlight card for bharat-kalp members (string flag)', done => {
      mockConfigSvc.unMappedUser.profileDetails.additionalProperties.isBharatKalpMember = 'true'
      const homeSection = [
        { sectionKey: 'spotlight', spotlightConfig: [{ cardClickDetails: { id: 'bharat-kalp' } }] },
      ]
      mockFormSvc.formConfigReadData.mockReturnValue(of({ result: { data: { homeSection } } }))

      resolver.resolve().subscribe((result: any) => {
        const spotlight = result.data.homeSection.find((s: any) => s.sectionKey === 'spotlight')
        expect(spotlight.spotlightConfig).toHaveLength(1)
        done()
      })
    })

    it('should leave configDetails untouched when there is no spotlight section', done => {
      const homeSection = [{ sectionKey: 'aparCourses', pills: [] }]
      mockFormSvc.formConfigReadData.mockReturnValue(of({ result: { data: { homeSection } } }))

      resolver.resolve().subscribe((result: any) => {
        expect(result.data.homeSection.find((s: any) => s.sectionKey === 'spotlight')).toBeUndefined()
        done()
      })
    })

    it('should recover with an error result when processing configDetails throws', done => {
      const throwingConfig: any = {}
      Object.defineProperty(throwingConfig, 'homeSection', {
        get() {
          throw new Error('boom')
        },
      })
      mockFormSvc.formConfigReadData.mockReturnValue(of({ result: { data: throwingConfig } }))

      resolver.resolve().subscribe((result: any) => {
        expect(result.data).toBeNull()
        expect(result.error).toBeInstanceOf(Error)
        done()
      })
    })

    it('should treat a failing form config call the same as an unavailable one', done => {
      mockFormSvc.formConfigReadData.mockReturnValue(throwError(() => new Error('network error')))

      resolver.resolve().subscribe((result: any) => {
        expect(result.data).toEqual([])
        expect(result.error).toBeNull()
        done()
      })
    })
  })
})
