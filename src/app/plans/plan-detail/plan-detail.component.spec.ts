import { TestBed } from '@angular/core/testing'
import { ActivatedRoute } from '@angular/router'
import { BehaviorSubject, Subject, of } from 'rxjs'

// The real library bundles pull @project-sunbird/telemetry-sdk, which jest cannot resolve
// under jsdom. Factory mocks keep them from ever being executed.
jest.mock('@sunbird-cb/utils-v2', () => ({ WidgetEnrollService: class { } }), { virtual: true })
jest.mock('@sunbird-cb/consumption', () => ({
  CardType: { CourseCard: 'courseCard', PlanCard: 'planCard' },
  CardTransformerService: class { },
  CommonMethodsService: class { },
  ContentDictionaryService: class { },
  UserCbpPlansService: class { },
}), { virtual: true })

import { WidgetEnrollService } from '@sunbird-cb/utils-v2'
import {
  CardTransformerService,
  CommonMethodsService,
  ContentDictionaryService,
  UserCbpPlansService,
} from '@sunbird-cb/consumption'
import { PlansService } from '../services/plans.service'
import { PlanDetailComponent } from './plan-detail.component'

/**
 * The plan is now resolved through an async IndexedDB read before anything else runs, so a
 * test has to let the microtask queue drain before asserting on what loaded.
 *
 * Microtasks rather than a timer: three of the tests below run under jest.useFakeTimers(),
 * where a setTimeout(0) would simply never fire. The loop covers the handful of awaits
 * between the cache read and the loaded page without having to count them.
 */
const settle = async () => {
  for (let i = 0; i < 10; i = i + 1) {
    await Promise.resolve()
  }
}

/** Minimal stand-ins for the plan the read endpoint returns. */
const rawPlan = (over: any = {}) => ({
  id: 'plan-1',
  name: 'plan ttitle',
  planYear: '2026-27',
  endDate: '2026-09-09T18:29:59Z',
  isApar: true,
  contentList: [{ identifier: 'do_1' }, { identifier: 'do_2' }],
  ...over,
})

/** One plan as UserCbpPlansService holds it in the V4 IndexedDB entry. */
const cachedPlan = (over: any = {}) => ({
  planId: 'plan-1',
  name: 'plan ttitle',
  planYear: '2026-27',
  endDate: '2026-09-09T18:29:59Z',
  isApar: true,
  planType: null,
  contentList: [{ identifier: 'do_1', mandatory: true }, { identifier: 'do_2', mandatory: false }],
  comprehensiveAssessment: null,
  createdByOrgId: 'org-1',
  createdByOrgName: 'Department of Testing',
  createdByOrgLogo: null,
  ...over,
})

const cacheEntry = (over: any = {}) => ({
  aparPlanList: [], cbpPlanList: [], aiCbpPlanList: [],
  aparPlan: 0, cbpPlan: 0, aiCbpPlan: 0,
  planYear: '2026-27', requestedPlanYear: '2026-27', cachedAt: Date.now(),
  ...over,
})

const courseCard = (identifier: string, over: any = {}) => ({
  identifier, title: `Course ${identifier}`, metadata: {}, ...over,
})

describe('PlanDetailComponent', () => {
  let component: PlanDetailComponent
  let paramMap: BehaviorSubject<any>
  let queryParamMap: BehaviorSubject<any>
  let plansSvc: any
  let userCbpPlansSvc: any
  let dictionarySvc: any
  let transformer: any
  let enrollSvc: any
  let translate: any

  const build = () => {
    paramMap = new BehaviorSubject({ get: (_k: string) => 'plan-1' })
    queryParamMap = new BehaviorSubject({ get: (_k: string) => null })

    plansSvc = {
      readPlan: jest.fn().mockReturnValue(of(rawPlan())),
      getCurrentFinancialYear: jest.fn().mockReturnValue('2026-27'),
    }
    // Default is a cache MISS, so every test below exercises the read-API path unless it
    // says otherwise — the behaviour the rest of this suite was written against.
    userCbpPlansSvc = {
      getCacheEntry: jest.fn().mockResolvedValue(undefined),
      isEntryValid: jest.fn().mockReturnValue(true),
      getCurrentPlanYear: jest.fn().mockReturnValue('2026-27'),
    }
    dictionarySvc = {
      // Answer for whatever ids are asked for, so the assessment id resolves too.
      getContents: jest.fn((ids: string[]) =>
        of(ids.reduce((acc: any, id) => ({ ...acc, [id]: { identifier: id, name: `Course ${id}` } }), {}))),
    }
    transformer = {
      // The component asks for a PlanCard for the plan itself and a CourseCard per content.
      transformCards: jest.fn((items: any[], cardType: string) => {
        if (cardType === 'planCard') {
          const plan = items[0]
          return [{
            identifier: plan.id, title: plan.name, planYear: plan.planYear, endDate: plan.endDate,
            createdByName: plan.createdByName ?? '',
            // Mirrors CardTransformerService.resolvePlanType: APAR wins, then AI-CBP, else CBP.
            planType: plan.isApar ? 'APAR' : (plan.planType === 'AICBP' ? 'AICBP' : 'CBP'),
            metadata: plan,
          }]
        }
        // The real transformer copies the raw item onto `metadata`; the card reads the type
        // flags from there, so the mock has to preserve them too.
        const item = items[0]
        return [courseCard(item.identifier, {
          isApar: item.isApar, metadata: { ...item },
        })]
      }),
    }
    enrollSvc = { fetchEnrollContentData: jest.fn().mockReturnValue(of({ result: { courses: [] } })) }
    translate = {
      onLangChange: new Subject(),
      setDefaultLang: jest.fn(),
      use: jest.fn().mockReturnValue(of({})),
      instant: jest.fn((key: string) => key),
    }

    TestBed.configureTestingModule({
      providers: [
        PlanDetailComponent,
        { provide: ActivatedRoute, useValue: { paramMap, queryParamMap } },
        { provide: PlansService, useValue: plansSvc },
        { provide: UserCbpPlansService, useValue: userCbpPlansSvc },
        { provide: ContentDictionaryService, useValue: dictionarySvc },
        { provide: CardTransformerService, useValue: transformer },
        { provide: WidgetEnrollService, useValue: enrollSvc },
        { provide: CommonMethodsService, useValue: { getCourseUnitIds: () => '[]' } },
        { provide: require('@ngx-translate/core').TranslateService, useValue: translate },
      ],
    })
    component = TestBed.inject(PlanDetailComponent)
  }

  beforeEach(() => build())

  // ── Loading ────────────────────────────────────────────────────────────────
  it('resolves every content id through the dictionary in ONE bulk call', async () => {
    component.ngOnInit()
    await settle()

    expect(dictionarySvc.getContents).toHaveBeenCalledTimes(1)
    expect(dictionarySvc.getContents).toHaveBeenCalledWith(['do_1', 'do_2'])
    expect(component.courses().length).toBe(2)
    expect(component.loading()).toBe(false)
  })

  it('includes the comprehensive assessment id in the same dictionary call', async () => {
    plansSvc.readPlan.mockReturnValue(of(rawPlan({ comprehensiveAssessment: 'do_ca' })))
    component.ngOnInit()
    await settle()

    expect(dictionarySvc.getContents).toHaveBeenCalledWith(['do_1', 'do_2', 'do_ca'])
    expect(component.assessment()).toBeTruthy()
  })

  it('stops loading when the plan cannot be read', async () => {
    plansSvc.readPlan.mockReturnValue(of(null))
    component.ngOnInit()
    await settle()

    expect(component.loading()).toBe(false)
    expect(component.courses()).toEqual([])
  })

  // ── Status map — the bug this page had ─────────────────────────────────────
  describe('cbPlanMapData', () => {
    // Regression: this used to come from the global CBP cache, which collapses each course to
    // ONE plan (MAX endDate wins) and omits courses the user has no association for — so one
    // card showed another plan's "Upcoming" and its neighbour showed nothing at all.
    it('badges every course in the plan from THIS plan endDate', async () => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 8, 12))
      component.ngOnInit()
      await settle()

      const map = component.cbPlanMapData()
      expect(Object.keys(map).sort()).toEqual(['do_1', 'do_2'])
      expect(map['do_1'].planDuration).toBe('overdue')
      expect(map['do_2'].planDuration).toBe('overdue')
      expect(map['do_1'].endDate).toBe('2026-09-09T18:29:59Z')
      jest.useRealTimers()
    })

    it('marks a completed course so the card reads Completed', async () => {
      enrollSvc.fetchEnrollContentData.mockReturnValue(
        of({ result: { courses: [{ collectionId: 'do_1', completionPercentage: 100 }] } }))
      component.ngOnInit()
      await settle()

      expect(component.cbPlanMapData()['do_1'].contentStatus).toBe(2)
      expect(component.cbPlanMapData()['do_2'].contentStatus).toBe(0)
    })

    it('is empty when the plan has no end date to measure against', async () => {
      plansSvc.readPlan.mockReturnValue(of(rawPlan({ endDate: undefined })))
      component.ngOnInit()
      await settle()

      expect(component.cbPlanMapData()).toEqual({})
    })
  })

  describe('planDurationFor', () => {
    const bucket = (endDate: string) => (component as any).planDurationFor(endDate)

    beforeEach(() => jest.useFakeTimers().setSystemTime(new Date(2026, 8, 12)))
    afterEach(() => jest.useRealTimers())

    it('buckets by days remaining, matching getPlanDuration', () => {
      expect(bucket('2026-09-09T18:29:59Z')).toBe('overdue')   // 3 days past
      expect(bucket('2026-09-12T18:29:59Z')).toBe('upcoming')  // due today
      expect(bucket('2026-10-11T18:29:59Z')).toBe('upcoming')  // 29 days out
      expect(bucket('2026-10-12T18:29:59Z')).toBe('success')   // 30 days out
    })

    it('treats an unparseable date as far-off rather than overdue', () => {
      expect(bucket('not-a-date')).toBe('success')
    })
  })

  // ── Progress ───────────────────────────────────────────────────────────────
  describe('progress counts', () => {
    it('counts a course complete on 100% or status 2', async () => {
      enrollSvc.fetchEnrollContentData.mockReturnValue(of({
        result: { courses: [{ collectionId: 'do_1', completionPercentage: 100 }, { collectionId: 'do_2', status: 2 }] },
      }))
      component.ngOnInit()
      await settle()

      expect(component.totalCourses()).toBe(2)
      expect(component.completedCourses()).toBe(2)
    })

    it('counts nothing complete when the enrolment call fails', async () => {
      enrollSvc.fetchEnrollContentData.mockReturnValue(of(null))
      component.ngOnInit()
      await settle()

      expect(component.totalCourses()).toBe(2)
      expect(component.completedCourses()).toBe(0)
    })

    it('keys enrolments by courseId when collectionId is absent', async () => {
      enrollSvc.fetchEnrollContentData.mockReturnValue(
        of({ result: { courses: [{ courseId: 'do_1', completionPercentage: 100 }] } }))
      component.ngOnInit()
      await settle()

      expect(component.completedCourses()).toBe(1)
    })
  })

  describe('assessment state', () => {
    const withAssessment = () =>
      plansSvc.readPlan.mockReturnValue(of(rawPlan({ comprehensiveAssessment: 'do_ca' })))

    it('stays locked while any course is outstanding', async () => {
      withAssessment()
      component.ngOnInit()
      await settle()

      expect(component.assessmentState()).toBe('locked')
    })

    it('unlocks once every course is complete', async () => {
      withAssessment()
      enrollSvc.fetchEnrollContentData.mockReturnValue(of({
        result: { courses: [{ collectionId: 'do_1', status: 2 }, { collectionId: 'do_2', status: 2 }] },
      }))
      component.ngOnInit()
      await settle()

      expect(component.assessmentState()).toBe('available')
    })

    it('reports completed once the assessment itself is done', async () => {
      withAssessment()
      enrollSvc.fetchEnrollContentData.mockReturnValue(of({
        result: { courses: [{ collectionId: 'do_ca', completionPercentage: 100 }] },
      }))
      component.ngOnInit()
      await settle()

      expect(component.assessmentState()).toBe('completed')
    })

    // An empty plan must not unlock on a vacuous "all zero courses are done".
    it('stays locked for a plan with no courses', async () => {
      plansSvc.readPlan.mockReturnValue(of(rawPlan({ contentList: [], comprehensiveAssessment: 'do_ca' })))
      dictionarySvc.getContents.mockReturnValue(of({ do_ca: { identifier: 'do_ca' } }))
      component.ngOnInit()
      await settle()

      expect(component.assessmentState()).toBe('locked')
    })
  })

  // ── Plan type flags on the course cards ────────────────────────────────────
  // Regression: cards were built straight from content-dictionary metadata, which carries no
  // isApar / AI-CBP. The chip is a property of the PLAN, so an APAR plan's courses showed no
  // APAR tag at all.
  describe('plan type stamped onto each course', () => {
    it('marks every course of an APAR plan as APAR', async () => {
      component.ngOnInit()
      await settle()

      expect(component.courses().length).toBe(2)
      component.courses().forEach(course => {
        expect((course as any).isApar).toBe(true)
        expect((course.metadata as any).isApar).toBe(true)
      })
    })

    it('marks an AI-CBP plan course with planTypeV2, not isApar', async () => {
      plansSvc.readPlan.mockReturnValue(of(rawPlan({ isApar: false, planType: 'AICBP' })))
      component.ngOnInit()
      await settle()

      const metadata = component.courses()[0].metadata as any
      expect(metadata.planTypeV2).toBe('AICBP')
      expect(metadata.isApar).toBe(false)
    })

    it('leaves a plain CBP plan course with neither flag', async () => {
      plansSvc.readPlan.mockReturnValue(of(rawPlan({ isApar: false })))
      component.ngOnInit()
      await settle()

      const metadata = component.courses()[0].metadata as any
      expect(metadata.isApar).toBe(false)
      expect(metadata.planTypeV2).toBeUndefined()
    })
  })

  // ── Reporting year ─────────────────────────────────────────────────────────
  describe('reportingYearLabel', () => {
    it('spaces the year for the panel without touching the raw value', async () => {
      component.ngOnInit()
      await settle()

      expect(component.reportingYear()).toBe('2026-27')
      expect(component.reportingYearLabel()).toBe('2026 - 27')
    })

    it('passes through anything that is not a YYYY-YY pair', async () => {
      plansSvc.readPlan.mockReturnValue(of(rawPlan({ planYear: undefined, endDate: undefined })))
      component.ngOnInit()
      await settle()

      expect(component.reportingYearLabel()).toBe('')
    })
  })

  describe('reportingYear', () => {
    it('prefers the year the plan declares', async () => {
      component.ngOnInit()
      await settle()

      expect(component.reportingYear()).toBe('2026-27')
      expect(plansSvc.getCurrentFinancialYear).not.toHaveBeenCalled()
    })

    it('derives from the end date when the plan declares none', async () => {
      plansSvc.readPlan.mockReturnValue(of(rawPlan({ planYear: undefined })))
      component.ngOnInit()
      await settle()

      expect(component.reportingYear()).toBe('2026-27')
      expect(plansSvc.getCurrentFinancialYear).toHaveBeenCalled()
    })

    it('is blank when there is neither', async () => {
      plansSvc.readPlan.mockReturnValue(of(rawPlan({ planYear: undefined, endDate: undefined })))
      component.ngOnInit()
      await settle()

      expect(component.reportingYear()).toBe('')
    })
  })

  it('falls back to a dash when the plan names no creator', async () => {
    component.ngOnInit()
    await settle()

    expect(component.createdBy()).toBe('—')
  })

  describe('breadcrumb', () => {
    it('trails Home > Plans > plan type > this plan', async () => {
      component.ngOnInit()
      await settle()
      const crumbs = component.breadcrumbData()

      expect(crumbs.map(crumb => crumb.title)).toEqual([
        'plansShowAll.home', 'plansShowAll.plans', 'plansShowAll.aparPlan', 'plan ttitle',
      ])
      expect(crumbs[0].url).toBe('/page/home')
      expect(crumbs[1].url).toBe('/app/plans')
      expect(crumbs[3].url).toBeUndefined() // the current page is not a link
    })

    // /app/plans defaults to the APAR listing, so a CBP plan has to say which one it came from.
    it('points the plan-type crumb at the listing for THIS plan type', async () => {
      plansSvc.readPlan.mockReturnValue(of(rawPlan({ isApar: false })))
      component.ngOnInit()
      await settle()
      const typeCrumb = component.breadcrumbData()[2]

      expect(typeCrumb.url).toBe('/app/plans')
      expect(typeCrumb.queryParams).toEqual({ planType: 'cbp' })
      expect(typeCrumb.title).toBe('plansShowAll.cbpPlan')
    })
  })

  // ── Resolving the plan without a request ───────────────────────────────────
  describe('plan source', () => {
    const fromUrl = (planYear: string | null, planType: string | null = null) =>
      queryParamMap.next({
        get: (key: string) => (key === 'planYear' ? planYear : key === 'planType' ? planType : null),
      })

    it('serves the plan out of the cached year instead of calling the read API', async () => {
      userCbpPlansSvc.getCacheEntry.mockResolvedValue(cacheEntry({ aparPlanList: [cachedPlan()] }))
      fromUrl('2026-27', 'apar')
      component.ngOnInit()
      await settle()

      expect(userCbpPlansSvc.getCacheEntry).toHaveBeenCalledWith('2026-27')
      expect(plansSvc.readPlan).not.toHaveBeenCalled()
      expect(component.courses().length).toBe(2)
      expect(component.plan()?.title).toBe('plan ttitle')
    })

    it('finds the plan whichever of the three lists it sits in', async () => {
      userCbpPlansSvc.getCacheEntry.mockResolvedValue(
        cacheEntry({ aiCbpPlanList: [cachedPlan({ isApar: false, planType: 'AICBP' })] }))
      fromUrl('2026-27')
      component.ngOnInit()
      await settle()

      expect(plansSvc.readPlan).not.toHaveBeenCalled()
      expect(component.plan()?.planType).toBe('AICBP')
    })

    it('falls back to the read API when that year holds no such plan', async () => {
      userCbpPlansSvc.getCacheEntry.mockResolvedValue(
        cacheEntry({ cbpPlanList: [cachedPlan({ planId: 'some-other-plan' })] }))
      fromUrl('2026-27')
      component.ngOnInit()
      await settle()

      expect(plansSvc.readPlan).toHaveBeenCalledWith('plan-1')
      expect(component.courses().length).toBe(2)
    })

    it('falls back to the read API when the cached year is past its TTL', async () => {
      userCbpPlansSvc.getCacheEntry.mockResolvedValue(cacheEntry({ aparPlanList: [cachedPlan()] }))
      userCbpPlansSvc.isEntryValid.mockReturnValue(false)
      fromUrl('2026-27')
      component.ngOnInit()
      await settle()

      expect(plansSvc.readPlan).toHaveBeenCalledWith('plan-1')
    })

    it('falls back to the read API when the database read throws', async () => {
      userCbpPlansSvc.getCacheEntry.mockRejectedValue(new Error('blocked'))
      fromUrl('2026-27')
      component.ngOnInit()
      await settle()

      expect(plansSvc.readPlan).toHaveBeenCalledWith('plan-1')
    })

    it('looks in the configured current year when the URL names none', async () => {
      userCbpPlansSvc.getCacheEntry.mockResolvedValue(cacheEntry({ aparPlanList: [cachedPlan()] }))
      component.ngOnInit()
      await settle()

      expect(userCbpPlansSvc.getCurrentPlanYear).toHaveBeenCalled()
      expect(userCbpPlansSvc.getCacheEntry).toHaveBeenCalledWith('2026-27')
      expect(plansSvc.readPlan).not.toHaveBeenCalled()
    })

    it('points the back link at the type in the URL before the plan has loaded', () => {
      fromUrl('2026-27', 'aicbp')
      component.ngOnInit()

      expect(component.listingQueryParams()).toEqual({ planType: 'aicbp' })
    })

    it('ignores a plan type the listing does not understand', () => {
      fromUrl('2026-27', 'not-a-plan-type')
      component.ngOnInit()

      expect(component.listingQueryParams()).toEqual({ planType: 'cbp' })
    })
  })

  it('asks for the comprehensive assessment enrolment alongside the courses', async () => {
    plansSvc.readPlan.mockReturnValue(of(rawPlan({ comprehensiveAssessment: 'do_ca' })))
    component.ngOnInit()
    await settle()

    expect(enrollSvc.fetchEnrollContentData)
      .toHaveBeenCalledWith({ request: { courseId: ['do_1', 'do_2', 'do_ca'] } })
  })

  // ── CA courses ─────────────────────────────────────────────────────────────
  describe('mandatory courses count as CA', () => {
    const withMandatory = () => plansSvc.readPlan.mockReturnValue(of(rawPlan({
      contentList: [{ identifier: 'do_1', mandatory: true }, { identifier: 'do_2', mandatory: false }],
    })))

    it('marks a mandatory course CA on the card itself, where the chip reads it', async () => {
      withMandatory()
      component.ngOnInit()
      await settle()

      expect((component.courses()[0] as any).isCA).toBe(true)
      expect((component.courses()[1] as any).isCA).toBeUndefined()
    })

    it('also passes it through the transformer, where the rail count reads it', async () => {
      withMandatory()
      component.ngOnInit()
      await settle()

      expect((component.courses()[0].metadata as any).isCA).toBe(true)
      expect((component.courses()[1].metadata as any).isCA).toBeUndefined()
    })

    it('counts mandatory courses in the rail, completed ones separately', async () => {
      withMandatory()
      enrollSvc.fetchEnrollContentData.mockReturnValue(
        of({ result: { courses: [{ collectionId: 'do_1', completionPercentage: 100 }] } }))
      component.ngOnInit()
      await settle()

      expect(component.caCourses().length).toBe(1)
      expect(component.completedCaCourses()).toBe(1)
    })

    it('leaves a plan with no mandatory course out of the CA count', async () => {
      component.ngOnInit()
      await settle()

      expect(component.caCourses()).toEqual([])
    })

    it('carries the flag through the cached path too', async () => {
      userCbpPlansSvc.getCacheEntry.mockResolvedValue(cacheEntry({ aparPlanList: [cachedPlan()] }))
      queryParamMap.next({ get: (key: string) => (key === 'planYear' ? '2026-27' : null) })
      component.ngOnInit()
      await settle()

      expect(plansSvc.readPlan).not.toHaveBeenCalled()
      // cachedPlan() marks do_1 mandatory and do_2 not.
      expect((component.courses()[0] as any).isCA).toBe(true)
      expect((component.courses()[1] as any).isCA).toBeUndefined()
    })
  })
})
