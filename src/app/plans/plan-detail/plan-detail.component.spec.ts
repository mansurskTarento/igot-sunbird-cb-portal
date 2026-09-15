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
}), { virtual: true })

import { WidgetEnrollService } from '@sunbird-cb/utils-v2'
import { CardTransformerService, CommonMethodsService, ContentDictionaryService } from '@sunbird-cb/consumption'
import { PlansService } from '../services/plans.service'
import { PlanDetailComponent } from './plan-detail.component'

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

const courseCard = (identifier: string, over: any = {}) => ({
  identifier, title: `Course ${identifier}`, metadata: {}, ...over,
})

describe('PlanDetailComponent', () => {
  let component: PlanDetailComponent
  let paramMap: BehaviorSubject<any>
  let plansSvc: any
  let dictionarySvc: any
  let transformer: any
  let enrollSvc: any
  let translate: any

  const build = () => {
    paramMap = new BehaviorSubject({ get: (_k: string) => 'plan-1' })

    plansSvc = {
      readPlan: jest.fn().mockReturnValue(of(rawPlan())),
      getCurrentFinancialYear: jest.fn().mockReturnValue('2026-27'),
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
        { provide: ActivatedRoute, useValue: { paramMap } },
        { provide: PlansService, useValue: plansSvc },
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
  it('resolves every content id through the dictionary in ONE bulk call', () => {
    component.ngOnInit()

    expect(dictionarySvc.getContents).toHaveBeenCalledTimes(1)
    expect(dictionarySvc.getContents).toHaveBeenCalledWith(['do_1', 'do_2'])
    expect(component.courses().length).toBe(2)
    expect(component.loading()).toBe(false)
  })

  it('includes the comprehensive assessment id in the same dictionary call', () => {
    plansSvc.readPlan.mockReturnValue(of(rawPlan({ comprehensiveAssessment: 'do_ca' })))
    component.ngOnInit()

    expect(dictionarySvc.getContents).toHaveBeenCalledWith(['do_1', 'do_2', 'do_ca'])
    expect(component.assessment()).toBeTruthy()
  })

  it('stops loading when the plan cannot be read', () => {
    plansSvc.readPlan.mockReturnValue(of(null))
    component.ngOnInit()

    expect(component.loading()).toBe(false)
    expect(component.courses()).toEqual([])
  })

  // ── Status map — the bug this page had ─────────────────────────────────────
  describe('cbPlanMapData', () => {
    // Regression: this used to come from the global CBP cache, which collapses each course to
    // ONE plan (MAX endDate wins) and omits courses the user has no association for — so one
    // card showed another plan's "Upcoming" and its neighbour showed nothing at all.
    it('badges every course in the plan from THIS plan endDate', () => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 8, 12))
      component.ngOnInit()

      const map = component.cbPlanMapData()
      expect(Object.keys(map).sort()).toEqual(['do_1', 'do_2'])
      expect(map['do_1'].planDuration).toBe('overdue')
      expect(map['do_2'].planDuration).toBe('overdue')
      expect(map['do_1'].endDate).toBe('2026-09-09T18:29:59Z')
      jest.useRealTimers()
    })

    it('marks a completed course so the card reads Completed', () => {
      enrollSvc.fetchEnrollContentData.mockReturnValue(
        of({ result: { courses: [{ collectionId: 'do_1', completionPercentage: 100 }] } }))
      component.ngOnInit()

      expect(component.cbPlanMapData()['do_1'].contentStatus).toBe(2)
      expect(component.cbPlanMapData()['do_2'].contentStatus).toBe(0)
    })

    it('is empty when the plan has no end date to measure against', () => {
      plansSvc.readPlan.mockReturnValue(of(rawPlan({ endDate: undefined })))
      component.ngOnInit()

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
    it('counts a course complete on 100% or status 2', () => {
      enrollSvc.fetchEnrollContentData.mockReturnValue(of({
        result: { courses: [{ collectionId: 'do_1', completionPercentage: 100 }, { collectionId: 'do_2', status: 2 }] },
      }))
      component.ngOnInit()

      expect(component.totalCourses()).toBe(2)
      expect(component.completedCourses()).toBe(2)
    })

    it('counts nothing complete when the enrolment call fails', () => {
      enrollSvc.fetchEnrollContentData.mockReturnValue(of(null))
      component.ngOnInit()

      expect(component.totalCourses()).toBe(2)
      expect(component.completedCourses()).toBe(0)
    })

    it('keys enrolments by courseId when collectionId is absent', () => {
      enrollSvc.fetchEnrollContentData.mockReturnValue(
        of({ result: { courses: [{ courseId: 'do_1', completionPercentage: 100 }] } }))
      component.ngOnInit()

      expect(component.completedCourses()).toBe(1)
    })
  })

  describe('assessment state', () => {
    const withAssessment = () =>
      plansSvc.readPlan.mockReturnValue(of(rawPlan({ comprehensiveAssessment: 'do_ca' })))

    it('stays locked while any course is outstanding', () => {
      withAssessment()
      component.ngOnInit()

      expect(component.assessmentState()).toBe('locked')
    })

    it('unlocks once every course is complete', () => {
      withAssessment()
      enrollSvc.fetchEnrollContentData.mockReturnValue(of({
        result: { courses: [{ collectionId: 'do_1', status: 2 }, { collectionId: 'do_2', status: 2 }] },
      }))
      component.ngOnInit()

      expect(component.assessmentState()).toBe('available')
    })

    it('reports completed once the assessment itself is done', () => {
      withAssessment()
      enrollSvc.fetchEnrollContentData.mockReturnValue(of({
        result: { courses: [{ collectionId: 'do_ca', completionPercentage: 100 }] },
      }))
      component.ngOnInit()

      expect(component.assessmentState()).toBe('completed')
    })

    // An empty plan must not unlock on a vacuous "all zero courses are done".
    it('stays locked for a plan with no courses', () => {
      plansSvc.readPlan.mockReturnValue(of(rawPlan({ contentList: [], comprehensiveAssessment: 'do_ca' })))
      dictionarySvc.getContents.mockReturnValue(of({ do_ca: { identifier: 'do_ca' } }))
      component.ngOnInit()

      expect(component.assessmentState()).toBe('locked')
    })
  })

  // ── Plan type flags on the course cards ────────────────────────────────────
  // Regression: cards were built straight from content-dictionary metadata, which carries no
  // isApar / AI-CBP. The chip is a property of the PLAN, so an APAR plan's courses showed no
  // APAR tag at all.
  describe('plan type stamped onto each course', () => {
    it('marks every course of an APAR plan as APAR', () => {
      component.ngOnInit()

      expect(component.courses().length).toBe(2)
      component.courses().forEach(course => {
        expect((course as any).isApar).toBe(true)
        expect((course.metadata as any).isApar).toBe(true)
      })
    })

    it('marks an AI-CBP plan course with planTypeV2, not isApar', () => {
      plansSvc.readPlan.mockReturnValue(of(rawPlan({ isApar: false, planType: 'AICBP' })))
      component.ngOnInit()

      const metadata = component.courses()[0].metadata as any
      expect(metadata.planTypeV2).toBe('AICBP')
      expect(metadata.isApar).toBe(false)
    })

    it('leaves a plain CBP plan course with neither flag', () => {
      plansSvc.readPlan.mockReturnValue(of(rawPlan({ isApar: false })))
      component.ngOnInit()

      const metadata = component.courses()[0].metadata as any
      expect(metadata.isApar).toBe(false)
      expect(metadata.planTypeV2).toBeUndefined()
    })
  })

  // ── Reporting year ─────────────────────────────────────────────────────────
  describe('reportingYear', () => {
    it('prefers the year the plan declares', () => {
      component.ngOnInit()

      expect(component.reportingYear()).toBe('2026-27')
      expect(plansSvc.getCurrentFinancialYear).not.toHaveBeenCalled()
    })

    it('derives from the end date when the plan declares none', () => {
      plansSvc.readPlan.mockReturnValue(of(rawPlan({ planYear: undefined })))
      component.ngOnInit()

      expect(component.reportingYear()).toBe('2026-27')
      expect(plansSvc.getCurrentFinancialYear).toHaveBeenCalled()
    })

    it('is blank when there is neither', () => {
      plansSvc.readPlan.mockReturnValue(of(rawPlan({ planYear: undefined, endDate: undefined })))
      component.ngOnInit()

      expect(component.reportingYear()).toBe('')
    })
  })

  it('falls back to a dash when the plan names no creator', () => {
    component.ngOnInit()

    expect(component.createdBy()).toBe('—')
  })

  describe('breadcrumb', () => {
    it('trails Home > Plans > plan type > this plan', () => {
      component.ngOnInit()
      const crumbs = component.breadcrumbData()

      expect(crumbs.map(crumb => crumb.title)).toEqual([
        'plansShowAll.home', 'plansShowAll.plans', 'plansShowAll.aparPlan', 'plan ttitle',
      ])
      expect(crumbs[0].url).toBe('/page/home')
      expect(crumbs[1].url).toBe('/app/plans')
      expect(crumbs[3].url).toBeUndefined() // the current page is not a link
    })

    // /app/plans defaults to the APAR listing, so a CBP plan has to say which one it came from.
    it('points the plan-type crumb at the listing for THIS plan type', () => {
      plansSvc.readPlan.mockReturnValue(of(rawPlan({ isApar: false })))
      component.ngOnInit()
      const typeCrumb = component.breadcrumbData()[2]

      expect(typeCrumb.url).toBe('/app/plans')
      expect(typeCrumb.queryParams).toEqual({ planType: 'cbp' })
      expect(typeCrumb.title).toBe('plansShowAll.cbpPlan')
    })
  })
})
