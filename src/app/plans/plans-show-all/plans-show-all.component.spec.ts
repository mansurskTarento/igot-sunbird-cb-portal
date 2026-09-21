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
  UserCbpPlansService: class { },
}), { virtual: true })

import { ValueService } from '@sunbird-cb/utils-v2'
import { CardTransformerService, UserCbpPlansService } from '@sunbird-cb/consumption'
import { PlansService } from '../services/plans.service'
import { PlansShowAllComponent } from './plans-show-all.component'

/** A plan as CBPlan V4 hands it over, once UserCbpPlansService has stamped it. */
const plan = (planId: string, over: Record<string, any> = {}) => ({
  planId,
  name: `Plan ${planId}`,
  endDate: '2026-10-31T18:29:59Z',
  planYear: '2026-27',
  planType: null,
  isApar: false,
  contentList: [],
  comprehensiveAssessment: null,
  createdByOrgId: '013',
  createdByOrgName: 'BIHAR',
  createdByOrgLogo: null,
  ...over,
})

/** The V4 cache entry shape the service resolves with. */
const entry = (over: Record<string, any> = {}) => {
  const data = { aparPlanList: [], cbpPlanList: [], aiCbpPlanList: [], ...over }
  return {
    ...data,
    aparPlan: data.aparPlanList.length,
    cbpPlan: data.cbpPlanList.length,
    aiCbpPlan: data.aiCbpPlanList.length,
    planYear: '2026-27',
    requestedPlanYear: '2026-27',
    cachedAt: Date.now(),
  }
}

describe('PlansShowAllComponent', () => {
  let component: PlansShowAllComponent
  let queryParamMap: BehaviorSubject<any>
  let plansSvc: any
  let cbpSvc: any
  let transformer: any
  let router: any
  let translate: any

  /** Query params the component reads; anything unset resolves to null, as a real map does. */
  const params = (values: Record<string, string>) => ({ get: (key: string) => values[key] ?? null })

  /** The component resolves its data from a promise, so let the microtask queue drain. */
  const flush = () => new Promise(resolve => setTimeout(resolve, 0))

  const build = (initialParams: Record<string, string> = {}, resolved = entry()) => {
    // Tests that need different query params rebuild the component; TestBed refuses to be
    // reconfigured once it has been used, so reset it first.
    TestBed.resetTestingModule()
    queryParamMap = new BehaviorSubject(params(initialParams))

    plansSvc = {
      getCurrentFinancialYear: jest.fn().mockReturnValue('2026-27'),
      getPlanYearOptions: jest.fn().mockReturnValue([
        { value: '2027-28', isCurrent: false },
        { value: '2026-27', isCurrent: true },
        { value: '2025-26', isCurrent: false },
      ]),
    }
    cbpSvc = {
      getUserCbpPlansAsync: jest.fn().mockResolvedValue(resolved),
      getCurrentPlanYear: jest.fn().mockReturnValue('2026-27'),
      getPlanYearList: jest.fn().mockReturnValue([
        { label: '2027-28', value: '2027-28' },
        { label: '2026-27 (Current A.Y.)', value: '2026-27', current: true },
        { label: '2025-26', value: '2025-26' },
      ]),
    }
    // Mirrors CardTransformerService.toPlanCard for the fields this page reads.
    transformer = {
      transformCards: jest.fn((plans: any[]) => (plans || []).map(p => ({
        identifier: p.planId,
        title: p.name,
        endDate: p.endDate,
        planYear: p.planYear,
        createdByName: p.createdByOrgName,
        planType: p.isApar ? 'APAR' : (p.planType === 'AICBP' ? 'AICBP' : 'CBP'),
        contentCount: (p.contentList || []).length,
        metadata: p,
      }))),
    }
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
        { provide: UserCbpPlansService, useValue: cbpSvc },
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
    it('defaults to the APAR listing, page 1, current plan year', () => {
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
  })

  // ── One request per year, and only for the year ────────────────────────────
  describe('loading', () => {
    it('asks UserCbpPlansService for the plan year, cache-first', () => {
      component.ngOnInit()

      expect(cbpSvc.getUserCbpPlansAsync).toHaveBeenCalledTimes(1)
      expect(cbpSvc.getUserCbpPlansAsync).toHaveBeenCalledWith(false, { planYear: '2026-27' })
    })

    it('does NOT refetch when only the plan type changes', () => {
      component.ngOnInit()
      expect(cbpSvc.getUserCbpPlansAsync).toHaveBeenCalledTimes(1)

      queryParamMap.next(params({ planType: 'cbp' }))

      expect(cbpSvc.getUserCbpPlansAsync).toHaveBeenCalledTimes(1)
      expect(component.planTypeKey()).toBe('cbp')
    })

    it('does NOT refetch when only the page changes', () => {
      component.ngOnInit()
      queryParamMap.next(params({ page: '2' }))

      expect(cbpSvc.getUserCbpPlansAsync).toHaveBeenCalledTimes(1)
      expect(component.currentPage()).toBe(2)
    })

    it('refetches when the plan year changes', () => {
      component.ngOnInit()
      queryParamMap.next(params({ planYear: '2025-26' }))

      expect(cbpSvc.getUserCbpPlansAsync).toHaveBeenCalledTimes(2)
      expect(cbpSvc.getUserCbpPlansAsync).toHaveBeenLastCalledWith(false, { planYear: '2025-26' })
    })

    it('forces the network on an explicit refresh', () => {
      component.ngOnInit()
      component.refresh()

      expect(cbpSvc.getUserCbpPlansAsync).toHaveBeenLastCalledWith(true, { planYear: '2026-27' })
    })

    it('clears the loading flag once the plans land', async () => {
      component.ngOnInit()
      await flush()

      expect(component.loading()).toBe(false)
    })
  })

  // ── The three lists come pre-split; picking one IS the plan-type filter ────
  describe('plan type', () => {
    const populated = entry({
      aparPlanList: [plan('a1', { isApar: true })],
      cbpPlanList: [plan('c1'), plan('c2')],
      aiCbpPlanList: [plan('d1', { planType: 'AICBP' })],
    })

    it('renders the APAR list for the APAR tab', async () => {
      build({}, populated)
      component.ngOnInit()
      await flush()

      expect(component.cards().map(c => c.identifier)).toEqual(['a1'])
    })

    it('renders the CBP list for the CBP tab', async () => {
      build({ planType: 'cbp' }, populated)
      component.ngOnInit()
      await flush()

      expect(component.cards().map(c => c.identifier)).toEqual(['c1', 'c2'])
    })

    it('renders the AI-CBP list for the draft tab', async () => {
      build({ planType: 'aicbp' }, populated)
      component.ngOnInit()
      await flush()

      expect(component.cards().map(c => c.identifier)).toEqual(['d1'])
    })

    it('switches list without a request', async () => {
      build({}, populated)
      component.ngOnInit()
      await flush()
      expect(component.cards().map(c => c.identifier)).toEqual(['a1'])

      queryParamMap.next(params({ planType: 'cbp' }))

      expect(cbpSvc.getUserCbpPlansAsync).toHaveBeenCalledTimes(1)
      expect(component.cards().map(c => c.identifier)).toEqual(['c1', 'c2'])
    })
  })

  // ── Filtering, sorting and paging all happen in memory ─────────────────────
  describe('local filtering', () => {
    const mixed = entry({
      cbpPlanList: [
        plan('a', { createdByOrgName: 'BIHAR' }),
        plan('b', { createdByOrgName: 'ASSAM' }),
        plan('c', { createdByOrgName: 'BIHAR' }),
      ],
    })

    it('derives the Created By facet, with counts, from the loaded plans', async () => {
      build({ planType: 'cbp' }, mixed)
      component.ngOnInit()
      await flush()

      const createdBy = component.filterConfig().find(s => s.key === 'createdByName')!
      expect(createdBy.options.map(o => ({ name: o.name, count: o.count })))
        .toEqual([{ name: 'ASSAM', count: 1 }, { name: 'BIHAR', count: 2 }])
    })

    it('filters without a request', async () => {
      build({ planType: 'cbp' }, mixed)
      component.ngOnInit()
      await flush()

      component.onFilterApplied({ createdByName: ['BIHAR'] })

      expect(cbpSvc.getUserCbpPlansAsync).toHaveBeenCalledTimes(1)
      expect(component.cards().map(c => c.identifier)).toEqual(['a', 'c'])
      expect(component.totalCount()).toBe(2)
    })

    it('clears back to an unfiltered first page', async () => {
      build({ planType: 'cbp' }, mixed)
      component.ngOnInit()
      await flush()
      component.onFilterApplied({ createdByName: ['BIHAR'] })

      component.onFilterCleared()

      expect(component.currentPage()).toBe(1)
      expect(component.totalCount()).toBe(3)
      // Clear All drops the plan type to All too, via the URL.
      expect(router.navigate).toHaveBeenCalledWith([], expect.objectContaining({
        queryParams: { planType: 'all', page: 1 },
        queryParamsHandling: 'merge',
      }))
    })

    it('omits the Created By section when nothing is loaded', () => {
      component.ngOnInit()

      expect(component.filterConfig().map(s => s.key)).toEqual(['planTypeKey'])
    })

    it('counts the plan type and every facet value for the toolbar badge', () => {
      component.ngOnInit()
      component.onFilterApplied({ createdByName: ['A', 'B'] })

      // APAR (1) + two Created By values
      expect(component.appliedFilterCount()).toBe(3)
    })

    it('routes a plan-type change through the URL', async () => {
      component.ngOnInit()
      await flush()

      component.onFilterApplied({ planTypeKey: ['cbp'] })

      expect(router.navigate).toHaveBeenCalled()
    })
  })

  // ── The Filter button's badge ──────────────────────────────────────────────
  describe('applied filter count', () => {
    it('counts a plan type chosen from the URL, before the panel is ever opened', () => {
      build({ planType: 'cbp' })
      component.ngOnInit()

      expect(component.appliedFilterCount()).toBe(1)
    })

    it('counts nothing when the type is All and no facet is selected', () => {
      build({ planType: 'all' })
      component.ngOnInit()

      expect(component.appliedFilterCount()).toBe(0)
    })

    it('counts facet values while the type is All', () => {
      build({ planType: 'all' })
      component.ngOnInit()
      component.onFilterApplied({ planTypeKey: ['all'], createdByName: ['BIHAR'] })

      expect(component.appliedFilterCount()).toBe(1)
    })

    it('does not count All even once the panel has reported it', () => {
      build({ planType: 'all' })
      component.ngOnInit()
      component.onFilterApplied({ planTypeKey: ['all'] })

      expect(component.appliedFilterCount()).toBe(0)
    })

    it('drops back to the plan type alone when filters are cleared', () => {
      component.ngOnInit()
      component.onFilterApplied({ createdByName: ['BIHAR'] })
      expect(component.appliedFilterCount()).toBe(2)

      component.onFilterCleared()

      expect(component.appliedFilterCount()).toBe(1)
    })
  })

  // ── What the panels are told is selected ──────────────────────────────────
  describe('panel selections', () => {
    it('includes the plan type, so the panel can show its chip and Clear All', () => {
      build({ planType: 'cbp' })
      component.ngOnInit()

      expect(component.panelSelections()).toEqual({ planTypeKey: ['cbp'] })
    })

    it('includes All, which is still a checked radio in the panel', () => {
      build({ planType: 'all' })
      component.ngOnInit()

      expect(component.panelSelections()).toEqual({ planTypeKey: ['all'] })
    })

    it('carries facet selections alongside the plan type', () => {
      component.ngOnInit()
      component.onFilterApplied({ planTypeKey: ['apar'], createdByName: ['BIHAR'] })

      expect(component.panelSelections()).toEqual({
        planTypeKey: ['apar'],
        createdByName: ['BIHAR'],
      })
    })

    it('hands the mobile dialog the same payload', () => {
      build({ planType: 'cbp' })
      component.ngOnInit()
      const dialog = TestBed.inject(MatDialog) as any
      dialog.open.mockReturnValue({ afterClosed: () => of(undefined) })
      component.isLtMedium.set(true)

      component.toggleFilterPanel()

      expect(dialog.open.mock.calls[0][1].data.selectedFilters).toEqual({ planTypeKey: ['cbp'] })
    })
  })

  describe('clearing', () => {
    it('resets the plan type to All so Clear All actually clears', () => {
      build({ planType: 'apar' })
      component.ngOnInit()

      component.onFilterCleared()

      expect(router.navigate).toHaveBeenCalledWith([], expect.objectContaining({
        queryParams: { planType: 'all', page: 1 },
      }))
    })

    it('does not navigate when the type is already All', () => {
      build({ planType: 'all' })
      component.ngOnInit()
      router.navigate.mockClear()

      component.onFilterCleared()

      expect(router.navigate).not.toHaveBeenCalled()
      expect(component.appliedFilterCount()).toBe(0)
    })

    it('treats a removed plan-type chip as All rather than leaving the old type', () => {
      build({ planType: 'apar' })
      component.ngOnInit()
      router.navigate.mockClear()

      // The panel emits its selection without planTypeKey once that chip is removed.
      component.onFilterApplied({ createdByName: ['BIHAR'] })

      expect(router.navigate).toHaveBeenCalledWith([], expect.objectContaining({
        queryParams: { planType: 'all', page: 1 },
      }))
    })
  })

  describe('local sorting', () => {
    const byDate = entry({
      cbpPlanList: [
        plan('late', { name: 'zebra', endDate: '2026-12-31T00:00:00Z' }),
        plan('early', { name: 'alpha', endDate: '2026-01-31T00:00:00Z' }),
        plan('undated', { name: 'mango', endDate: undefined }),
      ],
    })

    it('sorts by due date ascending by default', async () => {
      build({ planType: 'cbp' }, byDate)
      component.ngOnInit()
      await flush()

      expect(component.cards().map(c => c.identifier)).toEqual(['early', 'late', 'undated'])
    })

    it('keeps undated plans last when sorting descending', async () => {
      build({ planType: 'cbp' }, byDate)
      component.ngOnInit()
      await flush()

      component.onSortChange(1)

      expect(component.cards().map(c => c.identifier)).toEqual(['late', 'early', 'undated'])
    })

    it('sorts by name without a request, returning to page one', async () => {
      build({ planType: 'cbp', page: '2' }, byDate)
      component.ngOnInit()
      await flush()

      component.onSortChange(2)

      expect(component.cards().map(c => c.title)).toEqual(['alpha', 'mango', 'zebra'])
      expect(component.currentPage()).toBe(1)
      expect(cbpSvc.getUserCbpPlansAsync).toHaveBeenCalledTimes(1)
      expect(router.navigate).not.toHaveBeenCalled()
    })
  })

  describe('local paging', () => {
    const many = entry({
      cbpPlanList: Array.from({ length: 5 }, (_, i) =>
        plan(`p${i}`, { name: `Plan ${i}`, endDate: `2026-0${i + 1}-01T00:00:00Z` })),
    })

    it('slices the page out of the loaded list', async () => {
      build({ planType: 'cbp', pageSize: '12' }, many)
      component.ngOnInit()
      await flush()
      component.pageSize.set(2)

      expect(component.cards().map(c => c.identifier)).toEqual(['p0', 'p1'])
      expect(component.totalCount()).toBe(5)
    })

    it('pages without a request', async () => {
      // 25 plans at the default page size of 12 makes a real third page, without leaning on
      // a page size the toolbar does not offer — the URL handler would reject that anyway.
      const lots = entry({
        cbpPlanList: Array.from({ length: 25 }, (_, i) =>
          plan(`p${i}`, { name: `Plan ${i}`, endDate: `2026-01-01T00:00:${`0${i}`.slice(-2)}Z` })),
      })
      build({ planType: 'cbp' }, lots)
      component.ngOnInit()
      await flush()
      expect(component.cards().length).toBe(12)

      queryParamMap.next(params({ planType: 'cbp', page: '3', pageSize: '12' }))

      expect(cbpSvc.getUserCbpPlansAsync).toHaveBeenCalledTimes(1)
      expect(component.currentPage()).toBe(3)
      expect(component.cards().map(c => c.identifier)).toEqual(['p24'])
    })

    it('clamps a page left past the end by a filter', async () => {
      build({ planType: 'cbp', page: '3' }, many)
      component.ngOnInit()
      await flush()
      component.pageSize.set(2)
      expect(component.cards().map(c => c.identifier)).toEqual(['p4'])

      // One plan left — page 3 no longer exists, so the last page is shown instead of nothing.
      component.onFilterApplied({ createdByName: ['BIHAR'] })
      component.pageSize.set(2)

      expect(component.cards().length).toBeGreaterThan(0)
    })

    it('puts page and size in the URL', () => {
      component.ngOnInit()
      component.onPageChange({ currentPage: 4, limit: 24 })

      expect(router.navigate).toHaveBeenCalledWith([], expect.objectContaining({
        queryParams: { page: 4, pageSize: 24 },
        queryParamsHandling: 'merge',
      }))
    })
  })

  // ── Panel and chrome ───────────────────────────────────────────────────────
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
  })

  // ── The "All" bucket, counts, and empty types ─────────────────────────────
  describe('plan type options', () => {
    const populated = entry({
      aparPlanList: [plan('a1', { isApar: true }), plan('a2', { isApar: true })],
      cbpPlanList: [plan('c1')],
      aiCbpPlanList: [],
    })

    const planTypeOptions = () =>
      component.filterConfig().find(section => section.key === 'planTypeKey')!.options

    it('offers All first, then the three types', () => {
      component.ngOnInit()

      expect(planTypeOptions().map(o => o.name)).toEqual(['all', 'apar', 'aicbp', 'cbp'])
    })

    it('counts each type off the loaded year', async () => {
      build({}, populated)
      component.ngOnInit()
      await flush()

      expect(planTypeOptions().map(o => ({ name: o.name, count: o.count })))
        .toEqual([
          { name: 'all', count: 3 },
          { name: 'apar', count: 2 },
          { name: 'aicbp', count: 0 },
          { name: 'cbp', count: 1 },
        ])
    })

    it('disables a type with no plans', async () => {
      build({}, populated)
      component.ngOnInit()
      await flush()

      expect(planTypeOptions().find(o => o.name === 'aicbp')!.disabled).toBe(true)
      expect(planTypeOptions().find(o => o.name === 'apar')!.disabled).toBe(false)
    })

    it('keeps the type being viewed selectable even when it is empty', async () => {
      build({ planType: 'aicbp' }, populated)
      component.ngOnInit()
      await flush()

      const aicbp = planTypeOptions().find(o => o.name === 'aicbp')!
      expect(aicbp.count).toBe(0)
      expect(aicbp.disabled).toBe(false)
      expect(aicbp.isChecked).toBe(true)
    })

    it('counts ignore the Created By selection, so a bucket size never moves', async () => {
      build({}, entry({
        aparPlanList: [
          plan('a1', { isApar: true, createdByOrgName: 'BIHAR' }),
          plan('a2', { isApar: true, createdByOrgName: 'ASSAM' }),
        ],
      }))
      component.ngOnInit()
      await flush()

      component.onFilterApplied({ createdByName: ['BIHAR'] })

      expect(component.totalCount()).toBe(1)
      expect(planTypeOptions().find(o => o.name === 'apar')!.count).toBe(2)
    })
  })

  describe('the All listing', () => {
    const populated = entry({
      aparPlanList: [plan('a1', { isApar: true })],
      aiCbpPlanList: [plan('d1', { planType: 'AICBP' })],
      cbpPlanList: [plan('c1')],
    })

    it('is accepted from the URL', () => {
      build({ planType: 'all' }, populated)
      component.ngOnInit()

      expect(component.planTypeKey()).toBe('all')
    })

    it('renders every plan type together', async () => {
      build({ planType: 'all', pageSize: '12' }, populated)
      component.ngOnInit()
      await flush()

      expect(component.cards().map(c => c.identifier).sort()).toEqual(['a1', 'c1', 'd1'])
      expect(component.totalCount()).toBe(3)
    })

    it('switches into All without a request', async () => {
      build({}, populated)
      component.ngOnInit()
      await flush()
      expect(component.cards().map(c => c.identifier)).toEqual(['a1'])

      queryParamMap.next(params({ planType: 'all' }))

      expect(cbpSvc.getUserCbpPlansAsync).toHaveBeenCalledTimes(1)
      expect(component.totalCount()).toBe(3)
    })

    it('titles the page and the breadcrumb All Plans', () => {
      build({ planType: 'all' }, populated)
      component.ngOnInit()

      expect(component.pageTitle()).toBe('plansShowAll.allPlans')
      expect(component.breadcrumbData()[2].title).toBe('plansShowAll.allPlans')
    })
  })

  describe('plan year options', () => {
    it('uses the labels instanceConfig.cbpPlanYear provides', () => {
      component.ngOnInit()

      expect(component.planYearOptions().map(o => o.label))
        .toEqual(['2027-28', '2026-27 (Current A.Y.)', '2025-26'])
    })

    it('falls back to derived years when the instance configures none', () => {
      build()
      cbpSvc.getPlanYearList.mockReturnValue([])
      component.ngOnInit()

      expect(component.planYearOptions().map(o => o.value)).toEqual(['2027-28', '2026-27', '2025-26'])
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
})
