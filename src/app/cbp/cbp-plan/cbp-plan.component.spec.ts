import { of, Subject } from 'rxjs'
import dayjs from 'dayjs'
import { CbpPlanComponent } from './cbp-plan.component'

jest.mock('@sunbird-cb/collection', () => ({
  NsContent: {},
  NsCardContent: { ACBPConst: { OVERDUE: 'overdue' } },
  stampContentType: (content: any) => content,
}))
jest.mock('@sunbird-cb/utils-v2', () => ({ MultilingualTranslationsService: class { }, IndexedDbService: class { } }))
jest.mock('@sunbird-cb/consumption', () => ({ EnrolementDictionaryService: class { }, WidgetUserServiceLib: class { } }))

describe('CbpPlanComponent', () => {
  let component: CbpPlanComponent
  let langSubject: Subject<any>
  let mockRoute: any
  let mockWidgetSvc: any
  let mockTranslate: any
  let mockLangSvc: any
  let mockIndexedDb: any
  let mockDictionarySvc: any
  let queryParams: Record<string, string | null>

  const stripConfig = { key: 'strip', customeClass: 'cls', viewMoreUrl: { stripConfig: { cardSubType: 'sub' }, loaderConfig: { cardSubType: 'loader' } } }
  const pageConfig: any = {
    cbpConfig: { a: 1 },
    cbpUpcomingStrips: { ...stripConfig, stripConfig: { intranetMode: 'i', deletedMode: 'd', contentTags: 't' } },
    cbpFeedStrip: { key: 'feed' },
    cbpFeedMobileStrip: { key: 'mobile' },
  }

  const emptyFilter = () => ({
    planYear: '', planType: '', primaryCategory: [], status: [], timeDuration: [],
    competencyArea: [], competencyTheme: [], competencySubTheme: [], providers: [],
  })

  const plan = (over: any = {}) => ({
    identifier: 'id1', name: 'Alpha', planDuration: 'upcoming', contentStatus: 0, primaryCategory: 'Course',
    competencyArea: ['A'], competencyTheme: ['T'], competencySubTheme: ['S'], organisation: ['Org'],
    endDate: dayjs().add(2, 'day').format(), ...over,
  })

  beforeEach(() => {
    langSubject = new Subject<any>()
    queryParams = {}
    mockRoute = {
      snapshot: {
        data: { pageData: { data: JSON.parse(JSON.stringify(pageConfig)) } },
        queryParamMap: { get: jest.fn((k: string) => queryParams[k] === undefined ? null : queryParams[k]) },
      },
    }
    mockWidgetSvc = {
      getCurrentFinancialYear: jest.fn().mockReturnValue('2026-27'),
      fetchCbpPlanListV3: jest.fn().mockReturnValue(of([])),
    }
    mockTranslate = { setDefaultLang: jest.fn(), use: jest.fn() }
    mockLangSvc = { languageSelectedObservable: langSubject.asObservable() }
    mockIndexedDb = { getEnrollmentDetails: jest.fn().mockResolvedValue(null) }
    mockDictionarySvc = { getEnrolementDictionary: jest.fn().mockResolvedValue({}) }
    localStorage.removeItem('websiteLanguage')
    component = new CbpPlanComponent(mockRoute, mockWidgetSvc, mockTranslate, mockLangSvc, mockIndexedDb, mockDictionarySvc)
  })

  const initConfig = () => {
    component.cbpAllConfig = mockRoute.snapshot.data.pageData.data
  }

  describe('constructor', () => {
    it('sets language when websiteLanguage exists', () => {
      localStorage.setItem('websiteLanguage', 'hi')
      langSubject.next('x')
      expect(mockTranslate.setDefaultLang).toHaveBeenCalledWith('en')
      expect(mockTranslate.use).toHaveBeenCalledWith('hi')
    })

    it('does nothing when no websiteLanguage', () => {
      langSubject.next('x')
      expect(mockTranslate.use).not.toHaveBeenCalled()
    })
  })

  describe('ngOnInit', () => {
    it('loads config, years, types and fetches plans', () => {
      const spy = jest.spyOn(component, 'getCbPlans').mockResolvedValue(undefined)
      component.ngOnInit()
      expect(component.cbpConfig).toEqual({ a: 1 })
      expect(component.planYearList).toEqual(['2027-28', '2026-27', '2025-26'])
      expect(component.currentPlanYear).toBe('2026-27')
      expect(component.planTypeList.length).toBe(3)
      expect(component.filterObjData.planYear).toBe('2026-27')
      expect(spy).toHaveBeenCalled()
    })

    it('handles missing pageData and honours query params', () => {
      mockRoute.snapshot.data = {}
      queryParams = { planYear: '2025-26', planType: 'APAR' }
      jest.spyOn(component, 'getCbPlans').mockResolvedValue(undefined)
      component.ngOnInit()
      expect(component.cbpConfig).toBeUndefined()
      expect(component.filterObjData.planYear).toBe('2025-26')
      expect(component.filterObjData.planType).toBe('apar')
    })

    it('uses configured years / types and falls back to first year', () => {
      mockRoute.snapshot.data.pageData.data.planYears = ['2020-21', '2021-22']
      mockRoute.snapshot.data.pageData.data.planTypes = [
        'Training Plan',
        { key: 'k1', label: 'L1' },
        { id: 'i2' },
        null,
        {},
      ]
      jest.spyOn(component, 'getCbPlans').mockResolvedValue(undefined)
      component.ngOnInit()
      expect(component.currentPlanYear).toBe('2020-21')
      expect(component.planTypeList).toEqual([
        { id: 'Training Plan', name: 'Training Plan' },
        { id: 'k1', name: 'L1' },
        { id: 'i2', name: 'i2' },
      ])
    })

    it('keeps current financial year when configured', () => {
      mockRoute.snapshot.data.pageData.data.planYears = ['2026-27', '2025-26']
      jest.spyOn(component, 'getCbPlans').mockResolvedValue(undefined)
      component.ngOnInit()
      expect(component.currentPlanYear).toBe('2026-27')
    })
  })

  describe('plan type resolution', () => {
    beforeEach(() => {
      initConfig()
      ;(component as any).resolvePlanTypes()
    })

    it('resolves from isApar and category hints', () => {
      queryParams = { isApar: 'true' }
      expect((component as any).resolvePlanTypeFromQuery()).toBe('apar')
      queryParams = { category: 'AI CBP' }
      expect((component as any).resolvePlanTypeFromQuery()).toBe('aicbp')
      queryParams = { tabSelected: 'nothing-known' }
      expect((component as any).resolvePlanTypeFromQuery()).toBe('')
      queryParams = {}
      expect((component as any).resolvePlanTypeFromQuery()).toBe('')
    })

    it('matchOfferedPlanType handles direct, alias, empty and unknown', () => {
      expect((component as any).matchOfferedPlanType('CBP Plan')).toBe('nonapar')
      expect((component as any).matchOfferedPlanType('training-plans')).toBe('nonapar')
      expect((component as any).matchOfferedPlanType('!!!')).toBe('')
      expect((component as any).matchOfferedPlanType('zzz')).toBe('')
      component.planTypeList = [{ id: 'x', name: 'y' }]
      expect((component as any).matchOfferedPlanType('apar')).toBe('')
      component.planTypeList = [{ id: 'cbp', name: 'Custom' }]
      expect((component as any).matchOfferedPlanType('trainingplan')).toBe('cbp')
      component.planTypeList = [{ id: 'zz', name: 'aiplan' }]
      expect((component as any).matchOfferedPlanType('aigenerated')).toBe('zz')
    })

    it('slugifyPlanType handles empty values', () => {
      expect((component as any).slugifyPlanType(undefined)).toBe('')
      expect((component as any).slugifyPlanType('Training-Plans')).toBe('trainingplan')
    })
  })

  describe('getCbPlans', () => {
    beforeEach(() => {
      initConfig()
      component.filterObjData = { ...emptyFilter(), planYear: '2026-27' }
    })

    it('populates lists and counts', async () => {
      const items = [
        plan({ identifier: 'a', planDuration: 'overdue', endDate: '2024-01-01', contentStatus: 2 }),
        plan({ identifier: 'b', planDuration: 'overdue', endDate: '2024-06-01', contentStatus: 0 }),
        plan({ identifier: 'c', isApar: true }),
        plan({ identifier: 'd', contentStatus: 3 }),
      ]
      mockWidgetSvc.fetchCbpPlanListV3.mockReturnValue(of(items))
      mockIndexedDb.getEnrollmentDetails.mockResolvedValue({ c: { status: 1, active: true } })
      await component.getCbPlans()
      expect(mockWidgetSvc.fetchCbpPlanListV3).toHaveBeenCalledWith('2026-27', true, true)
      expect(component.cbpOriginalData.length).toBe(4)
      expect(component.cbpOriginalData.find((x: any) => x.identifier === 'c').enrolmentStatus).toBe(1)
      expect(component.usersCbpCount.apar).toBe(1)
      expect(component.usersCbpCount.completed).toBe(1)
      expect(component.usersCbpCount.all).toBe(4)
      expect(component.overDueList.length).toBe(2)
      expect(component.overdueUncompleted.length).toBe(1)
      expect(component.upcomingUncompleted.length).toBe(1)
      expect(component.cbpLoader).toBe(false)
      expect(component.loadedPlanYear).toBe('2026-27')
    })

    it('applies filter when planType set and handles items without batch/strip config', async () => {
      component.filterObjData.planType = 'apar'
      mockWidgetSvc.fetchCbpPlanListV3.mockReturnValue(of([plan({ isApar: true, batch: { id: 'b' } })]))
      await component.getCbPlans()
      expect(component.contentFeedList.length).toBe(1)
      expect(component.contentFeedList[0].widgetData.batch).toEqual({ id: 'b' })
    })

    it('clears state for empty and null responses', async () => {
      mockWidgetSvc.fetchCbpPlanListV3.mockReturnValue(of(null))
      await component.getCbPlans()
      expect(component.cbpOriginalData).toEqual([])
      expect(component.usersCbpCount).toEqual({ upcoming: 0, overdue: 0, completed: 0, apar: 0, all: 0 })
    })

    it('shows skeletons while loading', async () => {
      const p = component.getCbPlans()
      expect(component.cbpLoader).toBe(true)
      expect(component.upcommingList.length).toBe(11)
      expect(component.usersCbpCount).toBeUndefined()
      await p
    })

    it('works without cbpAllConfig skeleton path', () => {
      component.cbpAllConfig = undefined
      ;(component as any).showPlanSkeletons()
      expect(component.upcommingList).toEqual([])
    })
  })

  describe('enrolment dictionary', () => {
    it('returns memoised value', async () => {
      ;(component as any).enrolmentDictionary = { a: 1 }
      expect(await (component as any).getEnrolmentDictionary()).toEqual({ a: 1 })
      expect(mockIndexedDb.getEnrollmentDetails).not.toHaveBeenCalled()
    })

    it('uses indexedDb cache', async () => {
      mockIndexedDb.getEnrollmentDetails.mockResolvedValue({ a: 1 })
      expect(await (component as any).getEnrolmentDictionary()).toEqual({ a: 1 })
    })

    it('fetches when cache is cold', async () => {
      mockDictionarySvc.getEnrolementDictionary.mockResolvedValue({ b: 2 })
      expect(await (component as any).getEnrolmentDictionary()).toEqual({ b: 2 })
      mockIndexedDb.getEnrollmentDetails.mockResolvedValue({})
      ;(component as any).enrolmentDictionary = undefined
      expect(await (component as any).getEnrolmentDictionary()).toEqual({ b: 2 })
    })

    it('returns {} on failure', async () => {
      mockIndexedDb.getEnrollmentDetails.mockRejectedValue(new Error('x'))
      expect(await (component as any).getEnrolmentDictionary()).toEqual({})
    })

    it('stampEnrolmentStatus handles empty input and unenrolled items', async () => {
      expect(await (component as any).stampEnrolmentStatus(null)).toBeNull()
      expect(await (component as any).stampEnrolmentStatus([])).toEqual([])
      const item = { identifier: 'zzz' }
      expect(await (component as any).stampEnrolmentStatus([item])).toEqual([item])
    })
  })

  describe('matchesPlanType / isOverduePlan', () => {
    it('matches all plan types', () => {
      const m = (d: any, t: string) => (component as any).matchesPlanType(d, t)
      expect(m({ isApar: true }, 'APAR')).toBe(true)
      expect(m({ planTypeV2: 'AICBP' }, 'aicbp')).toBe(true)
      expect(m({ isApar: true, planTypeV2: 'AICBP' }, 'aicbp')).toBe(false)
      expect(m({ metadata: { planTypeV2: 'aicbp' } }, 'aicbp')).toBe(true)
      expect(m({}, 'nonapar')).toBe(true)
      expect(m({ planTypeV2: 'aicbp' }, 'cbplan')).toBe(false)
      expect(m({ planTypeV2: 'custom' }, 'custom')).toBe(true)
    })

    it('isOverduePlan uses planDuration or end date', () => {
      const o = (d: any) => (component as any).isOverduePlan(d)
      expect(o({ planDuration: 'overdue' })).toBe(true)
      expect(o({ planDuration: 'upcoming' })).toBe(false)
      expect(o({ endDate: '2000-01-01' })).toBe(true)
      expect(o({ endDate: dayjs().add(5, 'day').format() })).toBe(false)
      expect(typeof o(undefined)).toBe('boolean')
    })
  })

  describe('feed strip and events', () => {
    beforeEach(() => initConfig())

    it('getFeedStrip depends on screen width', () => {
      const original = window.screen.width
      Object.defineProperty(window.screen, 'width', { value: 500, configurable: true })
      expect(component.getFeedStrip().key).toBe('mobile')
      Object.defineProperty(window.screen, 'width', { value: 1200, configurable: true })
      expect(component.getFeedStrip().key).toBe('feed')
      Object.defineProperty(window.screen, 'width', { value: original, configurable: true })
    })

    it('toggleFilterEvent sets flag', () => {
      component.toggleFilterEvent(true)
      expect(component.toggleFilter).toBe(true)
    })

    it('applyFilter refetches only when year changed', async () => {
      const fetchSpy = jest.spyOn(component, 'getCbPlans').mockResolvedValue(undefined)
      const filterSpy = jest.spyOn(component, 'filterData').mockImplementation(() => undefined)
      component.loadedPlanYear = '2026-27'
      await component.applyFilter({ ...emptyFilter(), planYear: '2026-27' })
      expect(fetchSpy).not.toHaveBeenCalled()
      await component.applyFilter({ ...emptyFilter(), planYear: '2025-26' })
      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(filterSpy).toHaveBeenCalledTimes(2)
      expect(component.toggleFilter).toBe(false)
    })

    it('clearFilterObj refetches only when year changed', async () => {
      const fetchSpy = jest.spyOn(component, 'getCbPlans').mockResolvedValue(undefined)
      jest.spyOn(component, 'filterData').mockImplementation(() => undefined)
      component.loadedPlanYear = '2026-27'
      await component.clearFilterObj({ ...emptyFilter() })
      expect(fetchSpy).not.toHaveBeenCalled()
      await component.clearFilterObj({ ...emptyFilter(), planYear: '2025-26' })
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it('closeFilterKey clears planType and array values', () => {
      const applySpy = jest.spyOn(component, 'applyFilter').mockResolvedValue(undefined)
      component.filterObjData = { ...emptyFilter(), planType: 'apar', status: ['1', '2'] }
      component.closeFilterKey({ key: 'planType', value: 'apar' })
      expect(component.filterObjData.planType).toBe('')
      component.closeFilterKey({ key: 'status', value: '1' })
      expect(component.filterObjData.status).toEqual(['2'])
      component.closeFilterKey({ key: 'status', value: 'missing' })
      expect(component.filterObjData.status).toEqual(['2'])
      expect(applySpy).toHaveBeenCalledTimes(3)
    })

    it('filterValueEmitMethod carries over the year', () => {
      const applySpy = jest.spyOn(component, 'applyFilter').mockResolvedValue(undefined)
      component.currentPlanYear = '2026-27'
      component.filterObjData = { ...emptyFilter(), planYear: '' }
      component.filterValueEmitMethod({ status: ['1'] })
      expect(component.filterObjData.planYear).toBe('2026-27')
      expect(applySpy).toHaveBeenCalledWith(component.filterObjData)
      component.filterObjData = { ...emptyFilter(), planYear: '2025-26' }
      component.filterValueEmitMethod({ status: [] })
      expect(component.filterObjData.planYear).toBe('2025-26')
    })
  })

  describe('searchData', () => {
    beforeEach(() => {
      initConfig()
      jest.spyOn(component, 'applyFilter').mockResolvedValue(undefined)
      component.cbpOriginalData = [plan({ name: 'Alpha' }), plan({ name: 'Beta' })]
    })

    it('filters by query', () => {
      component.filterObjData = { ...emptyFilter(), planYear: '2025-26' }
      component.searchData({ query: 'BET' })
      expect(component.contentFeedList.length).toBe(1)
      expect(component.filterObjData.planYear).toBe('2025-26')
    })

    it('returns all without query, defaulting to current year', () => {
      component.currentPlanYear = '2026-27'
      component.filterObjData = { ...emptyFilter() }
      component.searchData({})
      expect(component.contentFeedList.length).toBe(2)
      expect(component.filterObjData.planYear).toBe('2026-27')
    })
  })

  describe('filterData', () => {
    beforeEach(() => {
      initConfig()
      component.cbpOriginalData = [
        plan({ identifier: '1', primaryCategory: 'Course', contentStatus: 0, planDuration: 'overdue', endDate: '2000-01-01', isApar: true }),
        plan({ identifier: '2', primaryCategory: 'Moderated Courses', secureSettings: {}, contentStatus: 1, competencyArea: ['B'], organisation: ['Other'] }),
        plan({ identifier: '3', planTypeV2: 'aicbp', contentStatus: 2, competencyTheme: ['T2'], competencySubTheme: ['S2'] }),
      ]
    })

    const run = (over: any) => {
      component.filterData({ ...emptyFilter(), ...over })
      return component.contentFeedListCopy.map((x: any) => x.identifier)
    }

    it('returns everything when no filters', () => {
      expect(run({})).toEqual(['1', '2', '3'])
      expect(component.filterApplied).toBe(false)
    })

    it('handles null cbpOriginalData', () => {
      component.cbpOriginalData = undefined
      expect(run({})).toEqual([])
    })

    it('filters by plan type', () => {
      expect(run({ planType: 'apar' })).toEqual(['1'])
      expect(component.filterApplied).toBe(true)
    })

    it('filters by primary category (with and without moderated)', () => {
      expect(run({ primaryCategory: ['Moderated Courses'] })).toEqual(['2'])
      expect(run({ primaryCategory: ['Course'] })).toEqual(['1', '3'])
    })

    it('filters by status including all', () => {
      expect(run({ status: ['1'] })).toEqual(['2'])
      expect(run({ status: ['all'] })).toEqual(['1', '2', '3'])
    })

    it('filters by overdue / upcoming', () => {
      expect(run({ timeDuration: ['overdue'] })).toEqual(['1'])
      expect(run({ timeDuration: ['upcoming'] })).toEqual(['2', '3'])
    })

    it('filters by rolling windows', () => {
      component.cbpOriginalData = [
        plan({ identifier: 'past', endDate: dayjs().subtract(10, 'day').format() }),
        plan({ identifier: 'future', endDate: dayjs().add(10, 'day').format() }),
        plan({ identifier: 'old', endDate: dayjs().subtract(5, 'month').format() }),
      ]
      expect(run({ timeDuration: ['2sw'] })).toEqual(['past'])
      expect(run({ timeDuration: ['20ad'] })).toEqual(['future'])
      expect(run({ timeDuration: ['1sm'] })).toEqual(['past'])
      expect(run({ timeDuration: ['6sm'] })).toEqual(['past', 'old'])
      expect(run({ timeDuration: ['9xx'] })).toEqual(['past', 'future', 'old'])
    })

    it('filters by competency fields and providers', () => {
      expect(run({ competencyArea: ['B'] })).toEqual(['2'])
      expect(run({ competencyTheme: ['T2'] })).toEqual(['3'])
      expect(run({ competencySubTheme: ['S2'] })).toEqual(['3'])
      expect(run({ providers: ['Other'] })).toEqual(['2'])
    })

    it('chains multiple filters', () => {
      expect(run({
        planType: 'nonapar',
        primaryCategory: ['Moderated Courses', 'Course'],
        status: ['1', '2'],
        timeDuration: ['upcoming'],
        competencyArea: ['A', 'B'],
        competencyTheme: ['T', 'T2'],
        competencySubTheme: ['S', 'S2'],
        providers: ['Org', 'Other'],
      }).length).toBeGreaterThan(0)
    })
  })
})
