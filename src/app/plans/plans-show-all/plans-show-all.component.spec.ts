import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { MatDialog } from '@angular/material/dialog'
import { BehaviorSubject, Subject, of } from 'rxjs'

// The real library bundles pull @project-sunbird/telemetry-sdk, which jest cannot resolve
// under jsdom. Factory mocks keep them from ever being executed.
jest.mock('@sunbird-cb/utils-v2', () => ({ ValueService: class { } }), { virtual: true })
jest.mock('@sunbird-cb/consumption', () => ({
  CardType: { CourseCard: 'courseCard', PlanCard: 'planCard' },
  CardTransformerService: class { },
}), { virtual: true })

import { ValueService } from '@sunbird-cb/utils-v2'
import { CardTransformerService } from '@sunbird-cb/consumption'
import { PlansService } from '../services/plans.service'
import { PlansShowAllComponent } from './plans-show-all.component'

const planCard = (identifier: string, planType: 'APAR' | 'AICBP' | 'CBP') =>
  ({ identifier, title: `Plan ${identifier}`, planType, planYear: '2026-27', metadata: {} })

describe('PlansShowAllComponent', () => {
  let component: PlansShowAllComponent
  let queryParamMap: BehaviorSubject<any>
  let plansSvc: any
  let transformer: any
  let router: any
  let translate: any

  /** Query params the component reads; anything unset resolves to null, as a real map does. */
  const params = (values: Record<string, string>) => ({ get: (key: string) => values[key] ?? null })

  const build = (initialParams: Record<string, string> = {}) => {
    // Tests that need different query params rebuild the component; TestBed refuses to be
    // reconfigured once it has been used, so reset it first.
    TestBed.resetTestingModule()
    queryParamMap = new BehaviorSubject(params(initialParams))

    plansSvc = {
      search: jest.fn().mockReturnValue(of({ data: [], totalCount: 0, facets: {} })),
      getCurrentFinancialYear: jest.fn().mockReturnValue('2026-27'),
      getPlanYearOptions: jest.fn().mockReturnValue([
        { value: '2027-28', isCurrent: false },
        { value: '2026-27', isCurrent: true },
        { value: '2025-26', isCurrent: false },
      ]),
    }
    transformer = { transformCards: jest.fn().mockReturnValue([]) }
    router = { navigate: jest.fn() }
    translate = {
      onLangChange: new Subject(),
      setDefaultLang: jest.fn(),
      use: jest.fn().mockReturnValue(of({})),
      instant: jest.fn((key: string) => key),
    }

    TestBed.configureTestingModule({
      providers: [
        PlansShowAllComponent,
        { provide: ActivatedRoute, useValue: { queryParamMap } },
        { provide: Router, useValue: router },
        { provide: PlansService, useValue: plansSvc },
        { provide: CardTransformerService, useValue: transformer },
        { provide: ValueService, useValue: { isLtMedium$: of(false) } },
        { provide: MatDialog, useValue: { open: jest.fn() } },
        { provide: require('@ngx-translate/core').TranslateService, useValue: translate },
      ],
    })
    component = TestBed.inject(PlansShowAllComponent)
  }

  beforeEach(() => build())

  // ── URL is the source of truth ─────────────────────────────────────────────
  describe('query params', () => {
    it('defaults to the APAR listing, page 1, current financial year', () => {
      component.ngOnInit()

      expect(component.planTypeKey()).toBe('apar')
      expect(component.currentPage()).toBe(1)
      expect(component.planYear()).toBe('2026-27')
    })

    it('reads plan type, year, page and size from the URL', () => {
      build({ planType: 'cbp', planYear: '2025-26', page: '3', pageSize: '50' })
      component.ngOnInit()

      expect(component.planTypeKey()).toBe('cbp')
      expect(component.planYear()).toBe('2025-26')
      expect(component.currentPage()).toBe(3)
      expect(component.pageSize()).toBe(50)
    })

    it('falls back rather than trusting junk in the URL', () => {
      build({ planType: 'nonsense', planYear: '1999-00', page: '-2', pageSize: '7' })
      component.ngOnInit()

      expect(component.planTypeKey()).toBe('apar')
      expect(component.planYear()).toBe('2026-27')
      expect(component.currentPage()).toBe(1)
      expect(component.pageSize()).toBe(12)
    })

    it('re-fetches when the URL changes', () => {
      component.ngOnInit()
      expect(plansSvc.search).toHaveBeenCalledTimes(1)

      queryParamMap.next(params({ planType: 'cbp' }))
      expect(plansSvc.search).toHaveBeenCalledTimes(2)
    })
  })

  // ── Request shape ──────────────────────────────────────────────────────────
  describe('search request', () => {
    it('sends the plan year and the plan-type narrowing', () => {
      component.ngOnInit()
      const body = plansSvc.search.mock.calls[0][0]

      expect(body.filter.planYear).toBe('2026-27')
      expect(body.filter.isApar).toBe(true)
      expect(body.pageNumber).toBe(0) // API pages from zero; the UI counts from one
      expect(body.pageSize).toBe(12)
    })

    it('asks AI-CBP and CBP apart by planType, both being non-APAR', () => {
      build({ planType: 'aicbp' })
      component.ngOnInit()
      expect(plansSvc.search.mock.calls[0][0].filter).toMatchObject({ isApar: false, planType: 'AICBP' })

      build({ planType: 'cbp' })
      component.ngOnInit()
      expect(plansSvc.search.mock.calls[0][0].filter.isApar).toBe(false)
      expect(plansSvc.search.mock.calls[0][0].filter.planType).toBeUndefined()
    })

    it('forwards facet selections but not the plan-type section', () => {
      component.ngOnInit()
      component.onFilterApplied({ planTypeKey: ['apar'], createdByName: ['Mdo Admin'] })
      const body = plansSvc.search.mock.calls[plansSvc.search.mock.calls.length - 1][0]

      expect(body.filter.createdByName).toEqual(['Mdo Admin'])
      expect(body.filter.planTypeKey).toBeUndefined()
    })
  })

  // ── Client-side narrowing ──────────────────────────────────────────────────
  // CBP and AI-CBP plans are both isApar:false, so a server that ignores the planType filter
  // returns them together. The page must still render only the type being viewed.
  describe('plan-type narrowing', () => {
    it('drops rows of the wrong plan type', () => {
      plansSvc.search.mockReturnValue(of({ data: [{ id: 'a' }, { id: 'b' }], totalCount: 2, facets: {} }))
      transformer.transformCards.mockReturnValue([planCard('a', 'CBP'), planCard('b', 'AICBP')])

      build({ planType: 'cbp' })
      plansSvc.search.mockReturnValue(of({ data: [{ id: 'a' }, { id: 'b' }], totalCount: 2, facets: {} }))
      transformer.transformCards.mockReturnValue([planCard('a', 'CBP'), planCard('b', 'AICBP')])
      component.ngOnInit()

      expect(component.cards().map(card => card.identifier)).toEqual(['a'])
    })
  })

  // ── Filter panel ───────────────────────────────────────────────────────────
  describe('filterConfig', () => {
    it('offers Plan Type, and no Reporting Year (the toolbar owns that)', () => {
      component.ngOnInit()
      const keys = component.filterConfig().map(section => section.key)

      expect(keys).toContain('planTypeKey')
      expect(keys).not.toContain('planYear')
    })

    it('marks the plan type currently being viewed', () => {
      build({ planType: 'aicbp' })
      component.ngOnInit()
      const planType = component.filterConfig().find(section => section.key === 'planTypeKey')!

      expect(planType.options.find(option => option.isChecked)!.name).toBe('aicbp')
    })

    it('builds a section per API facet', () => {
      plansSvc.search.mockReturnValue(of({
        data: [], totalCount: 0,
        facets: { createdByName: [{ value: 'Mdo Admin', count: 3 }] },
      }))
      component.ngOnInit()
      const createdBy = component.filterConfig().find(section => section.key === 'createdByName')

      expect(createdBy).toBeTruthy()
      expect(createdBy!.options.map(option => option.name)).toEqual(['Mdo Admin'])
    })

    // These were removed from the design; FilterByComponent renders ANY facet handed to it,
    // so they have to be suppressed explicitly rather than just dropped from the meta map.
    it('suppresses facets the page does not render', () => {
      plansSvc.search.mockReturnValue(of({
        data: [], totalCount: 0,
        facets: {
          status: [{ value: 'Live', count: 1 }],
          contentType: [{ value: 'Course', count: 1 }],
          isApar: [{ value: 'true', count: 1 }],
          planYear: [{ value: '2026-27', count: 1 }],
        },
      }))
      component.ngOnInit()
      const keys = component.filterConfig().map(section => section.key)

      expect(keys).toEqual(['planTypeKey'])
    })

    it('skips facets the API answered with no values', () => {
      plansSvc.search.mockReturnValue(of({ data: [], totalCount: 0, facets: { orgName: [] } }))
      component.ngOnInit()

      expect(component.filterConfig().map(s => s.key)).not.toContain('orgName')
    })
  })

  describe('applying filters', () => {
    it('routes a plan-type change through the URL instead of fetching twice', () => {
      component.ngOnInit()
      plansSvc.search.mockClear()

      component.onFilterApplied({ planTypeKey: ['cbp'] })

      expect(router.navigate).toHaveBeenCalled()
      expect(plansSvc.search).not.toHaveBeenCalled()
    })

    it('fetches directly for a facet-only change', () => {
      component.ngOnInit()
      plansSvc.search.mockClear()

      component.onFilterApplied({ createdByName: ['Mdo Admin'] })

      expect(plansSvc.search).toHaveBeenCalledTimes(1)
      expect(component.currentPage()).toBe(1)
    })

    it('clears back to an unfiltered first page', () => {
      component.ngOnInit()
      component.onFilterApplied({ createdByName: ['Mdo Admin'] })
      component.onFilterCleared()

      expect(component.appliedFilterCount()).toBe(0)
      expect(component.currentPage()).toBe(1)
    })

    it('counts every applied value for the toolbar badge', () => {
      component.ngOnInit()
      component.onFilterApplied({ createdByName: ['A', 'B'], orgName: ['C'] })

      expect(component.appliedFilterCount()).toBe(3)
    })
  })

  describe('paging and sorting', () => {
    it('puts page and size in the URL', () => {
      component.ngOnInit()
      component.onPageChange({ currentPage: 4, limit: 24 })

      expect(router.navigate).toHaveBeenCalledWith([], expect.objectContaining({
        queryParams: { page: 4, pageSize: 24 },
        queryParamsHandling: 'merge',
      }))
    })

    it('sorts without a navigation, returning to page one', () => {
      build({ page: '5' })
      component.ngOnInit()
      router.navigate.mockClear()

      component.onSortChange(2)

      expect(component.currentPage()).toBe(1)
      expect(router.navigate).not.toHaveBeenCalled()
      expect(plansSvc.search.mock.calls.pop()[0].orderBy).toBe('createdAt')
    })
  })

  describe('breadcrumb', () => {
    it('trails Home > Plans > plan type, with the plan type as the current page', () => {
      component.ngOnInit()
      const crumbs = component.breadcrumbData()

      expect(crumbs.map(crumb => crumb.title)).toEqual([
        'plansShowAll.home', 'plansShowAll.plans', 'plansShowAll.aparPlan',
      ])
      expect(crumbs[1].url).toBe('/app/plans')
      expect(crumbs[2].url).toBeUndefined()
    })

    it('names the plan type being viewed', () => {
      build({ planType: 'aicbp' })
      component.ngOnInit()

      expect(component.breadcrumbData()[2].title).toBe('plansShowAll.aiCbpDraftPlan')
    })
  })

  it('labels the current reporting year on the toolbar control', () => {
    component.ngOnInit()

    expect(translate.instant).toHaveBeenCalledWith('plansShowAll.currentReportingYear', { year: '2026-27' })
    expect(component.planYearLabel()).toBeTruthy()
  })
})
