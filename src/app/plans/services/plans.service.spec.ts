import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'

// The real @sunbird-cb/utils-v2 bundle imports @project-sunbird/telemetry-sdk, which jest
// cannot resolve under jsdom. A factory mock keeps the module from ever being executed.
jest.mock('@sunbird-cb/utils-v2', () => ({ ConfigurationsService: class { userProfile: any = null } }), { virtual: true })

import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { IPlanReadResult, PlansService } from './plans.service'

const READ_URL = (id: string) => `/apis/proxies/v8/cbplan/v4/read/${id}`

describe('PlansService', () => {
  let service: PlansService
  let http: HttpTestingController
  let configSvc: { userProfile: any }

  beforeEach(() => {
    configSvc = { userProfile: { rootOrgId: 'org-1' } }
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PlansService, { provide: ConfigurationsService, useValue: configSvc }],
    })
    service = TestBed.inject(PlansService)
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  // ── Financial year ─────────────────────────────────────────────────────────
  describe('getCurrentFinancialYear', () => {
    it('starts the year in April', () => {
      expect(service.getCurrentFinancialYear(new Date(2026, 3, 1))).toBe('2026-27')
    })

    it('keeps January to March in the year that began the previous April', () => {
      expect(service.getCurrentFinancialYear(new Date(2027, 0, 15))).toBe('2026-27')
      expect(service.getCurrentFinancialYear(new Date(2027, 2, 31))).toBe('2026-27')
    })

    it('rolls over on 1 April', () => {
      expect(service.getCurrentFinancialYear(new Date(2027, 2, 31))).toBe('2026-27')
      expect(service.getCurrentFinancialYear(new Date(2027, 3, 1))).toBe('2027-28')
    })

    it('zero-pads the end year across a century boundary', () => {
      expect(service.getCurrentFinancialYear(new Date(2099, 5, 1))).toBe('2099-00')
    })
  })

  describe('getPlanYearOptions', () => {
    it('offers next, current and previous, flagging only the current one', () => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 8, 12))
      const options = service.getPlanYearOptions()

      expect(options.map(option => option.value)).toEqual(['2027-28', '2026-27', '2025-26'])
      expect(options.filter(option => option.isCurrent).map(o => o.value)).toEqual(['2026-27'])
      jest.useRealTimers()
    })
  })

  // ── readPlan ───────────────────────────────────────────────────────────────
  describe('readPlan', () => {
    const flush = (content: any): Promise<IPlanReadResult | null> => {
      const result = new Promise<IPlanReadResult | null>(resolve => {
        service.readPlan('plan-1').subscribe(resolve)
      })
      http.expectOne(READ_URL('plan-1')).flush({ result: { content } })
      return result
    }

    it('normalises a contentList of objects, keeping the mandatory flag', async () => {
      const plan = await flush({
        id: 'plan-1',
        name: 'APAR Plan',
        contentList: [{ identifier: 'do_1', mandatory: false }, { identifier: 'do_2', mandatory: true }],
      })

      expect(plan!.contentList).toEqual([
        { identifier: 'do_1', mandatory: false },
        { identifier: 'do_2', mandatory: true },
      ])
    })

    it('normalises a contentList of bare id strings', async () => {
      const plan = await flush({ id: 'plan-1', name: 'APAR Plan', contentList: ['do_1', 'do_2'] })

      expect(plan!.contentList).toEqual([{ identifier: 'do_1' }, { identifier: 'do_2' }])
    })

    it('normalises a mixed contentList', async () => {
      const plan = await flush({
        id: 'plan-1',
        name: 'APAR Plan',
        contentList: ['do_1', { identifier: 'do_2', mandatory: true }],
      })

      expect(plan!.contentList.map(item => item.identifier)).toEqual(['do_1', 'do_2'])
    })

    it('accepts contentId as an alias for identifier', async () => {
      const plan = await flush({ id: 'plan-1', name: 'P', contentList: [{ contentId: 'do_alias' }] })

      expect(plan!.contentList).toEqual([{ identifier: 'do_alias', mandatory: undefined }])
    })

    // A blank entry must not survive as { identifier: undefined }: it would reach the content
    // dictionary as a lookup for "undefined" and leave a hole in the rendered grid.
    it('drops entries with no usable id', async () => {
      const plan = await flush({
        id: 'plan-1',
        name: 'P',
        contentList: [null, undefined, '', '   ', {}, { mandatory: true }, 'do_ok'],
      })

      expect(plan!.contentList).toEqual([{ identifier: 'do_ok' }])
    })

    it('trims whitespace around ids', async () => {
      const plan = await flush({ id: 'plan-1', name: 'P', contentList: ['  do_1  '] })

      expect(plan!.contentList).toEqual([{ identifier: 'do_1' }])
    })

    it('returns an empty contentList when the field is missing or not an array', async () => {
      expect((await flush({ id: 'plan-1', name: 'P' }))!.contentList).toEqual([])
      expect((await flush({ id: 'plan-1', name: 'P', contentList: 'nope' }))!.contentList).toEqual([])
    })

    it('preserves the rest of the payload', async () => {
      const plan = await flush({
        id: 'plan-1', name: 'plan ttitle', planYear: '2026-27', isApar: true,
        endDate: '2026-09-09T18:29:59Z', comprehensiveAssessment: 'do_ca', contentList: ['do_1'],
      })

      expect(plan).toMatchObject({
        id: 'plan-1', name: 'plan ttitle', planYear: '2026-27', isApar: true,
        comprehensiveAssessment: 'do_ca',
      })
    })

    it('renames caLinkedId to the comprehensiveAssessment the cache and UI speak', async () => {
      const plan = await flush({
        id: 'fa138ed0-b2b0-11f1-a393-aba9d9498b1e',
        name: 'test training plan apar v2',
        isApar: true,
        contentList: [
          { identifier: 'do_114368437854142464153', mandatory: true },
          { identifier: 'do_114376977434968064182', mandatory: false },
        ],
        caLinkedId: 'do_11465935796996505611',
      })

      expect(plan!.comprehensiveAssessment).toBe('do_11465935796996505611')
      // `planId` too, so a read plan and a cached one are interchangeable.
      expect(plan!['planId']).toBe('fa138ed0-b2b0-11f1-a393-aba9d9498b1e')
      expect(plan!.contentList[0].mandatory).toBe(true)
    })

    it('leaves comprehensiveAssessment alone when the payload already uses that name', async () => {
      const plan = await flush({ id: 'plan-1', name: 'P', comprehensiveAssessment: 'do_ca' })

      expect(plan!.comprehensiveAssessment).toBe('do_ca')
    })

    it('returns null when the response carries no content', async () => {
      const result = new Promise(resolve => service.readPlan('plan-1').subscribe(resolve))
      http.expectOne(READ_URL('plan-1')).flush({ result: {} })

      await expect(result).resolves.toBeNull()
    })

    it('returns null rather than erroring when the request fails', async () => {
      const result = new Promise(resolve => service.readPlan('plan-1').subscribe(resolve))
      http.expectOne(READ_URL('plan-1')).error(new ProgressEvent('network error'))

      await expect(result).resolves.toBeNull()
    })
  })

})
