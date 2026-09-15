import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Router } from '@angular/router'
import { EventService, TelemetryService } from '@sunbird-cb/utils-v2'
import { $t } from '@project-sunbird/telemetry-sdk'
import { Observable, of, throwError } from 'rxjs'
import { delay } from 'rxjs/operators'

import { KARMA_WALLET_DATE_FORMATS, KarmaWalletComponent } from './karma-wallet.component'
import {
  EMPTY_KARMA_WALLET_SUMMARY,
  IKarmaCoinTransaction,
  IKarmaCoinTransactionApi,
  IKarmaTransactionsRequest,
  IKarmaWalletSummary,
} from './karma-wallet.model'
import { KarmaWalletService, toCoinRow } from './karma-wallet.service'

/**
 * No TestBed and no shared mock module: the component is plain constructor injection, so it
 * is built directly and every collaborator is stubbed here in the spec.
 *
 * The fixtures below are all these tests need. Every acceptance criterion is written against
 * 26 Aug 2026, so the rows sit in Aug and Jul 2026 - the Recent window reaches the August
 * ones and not the July ones, which is what the period tests turn on.
 */
const SUMMARY: IKarmaWalletSummary = {
  ...EMPTY_KARMA_WALLET_SUMMARY,
  walletBalance: 472,
  totalRedeemed: 849,
  totalEarnedTillDate: 1321,
  totalKarmaPoints: 2662,
  unredeemedKarmaPoints: 1341,
  yearMonth: '2026-08',
  monthlyCap: 300,
  convertedThisMonth: 120,
  convertibleThisMonth: 180,
  capResetsOn: '2026-09-01',
  redeemEnabled: true,
}

const at = (year: number, month: number, day: number) => new Date(year, month, day).getTime()

const ROWS: IKarmaCoinTransactionApi[] = [
  {
    transactionId: 'TXN-000027', date: at(2026, 7, 26), type: 'CREDIT', amount: 40,
    balanceAfter: 472, actionType: 'EVENT_ATTENDANCE', contextType: 'EVENT',
    contextId: 'evt-1', addinfo: '{"eventName":"Karmayogi Talks — Evidence-based policy"}',
  },
  {
    transactionId: 'TXN-000026', date: at(2026, 7, 25), type: 'DEBIT', amount: 40,
    balanceAfter: 432, actionType: 'COURSE_ENROLLMENT', contextType: 'MARKETPLACE_COURSE',
    contextId: 'ext-1',
    addinfo: '{"courseName":"Understanding AI from MIT","providerName":"MIT OpenCourseWare"}',
  },
  {
    transactionId: 'TXN-000025', date: at(2026, 7, 24), type: 'CREDIT', amount: 40,
    balanceAfter: 472, actionType: 'EVENT_ATTENDANCE', contextType: 'EVENT',
    contextId: 'evt-2', addinfo: '{"eventName":"Karmayogi Talks — Evidence-based policy"}',
  },
  {
    transactionId: 'TXN-000024', date: at(2026, 6, 20), type: 'CREDIT', amount: 300,
    balanceAfter: 392, actionType: 'POINTS_REDEMPTION', contextType: 'POINTS_CONVERSION',
    contextId: 'req-abc123', addinfo: '{"pointsUsed":300,"ratio":"1:1"}',
  },
  {
    transactionId: 'TXN-000023', date: at(2026, 6, 15), type: 'DEBIT', amount: 40,
    balanceAfter: 92, actionType: 'COURSE_ENROLLMENT', contextType: 'MARKETPLACE_COURSE',
    contextId: 'ext-2',
    addinfo: '{"courseName":"Understanding AI from MIT","providerName":"MIT OpenCourseWare"}',
  },
]

const LOOKBACK_REFUSAL = {
  status: 400,
  error: {
    responseCode: 'CLIENT_ERROR',
    params: {
      err: 'HISTORY_RANGE_EXCEEDED',
      errmsg: 'You can view history for up to the last 1 year only.',
    },
  },
}

/* 'YYYY-MM-DD' to a local timestamp. Split rather than parsed, since a date-only ISO string
   parses as UTC and would move the boundary by the timezone offset. */
const boundary = (day: string, endOfDay: boolean) => {
  const [y, m, d] = day.split('-').map(Number)
  return endOfDay
    ? new Date(y, m - 1, d, 23, 59, 59, 999).getTime()
    : new Date(y, m - 1, d).getTime()
}

const oneYearBefore = (moment: number) => {
  const date = new Date(moment)
  return new Date(date.getFullYear() - 1, date.getMonth(), date.getDate()).getTime()
}

/* Stands in for the endpoint: filters on the request's type and window, and refuses a window
   that reaches past the one-year lookback exactly as the server does. */
const transactionsFor = (
  request: IKarmaTransactionsRequest): Observable<IKarmaCoinTransaction[]> => {
  const body = request.request
  const from = boundary(body.startDate, false)
  const to = boundary(body.endDate, true)

  if (from < oneYearBefore(to) || from < oneYearBefore(Date.now())) {
    return throwError(() => LOOKBACK_REFUSAL)
  }

  const rows = ROWS.filter(row =>
    (body.type === 'ALL' || row.type === body.type) && row.date >= from && row.date <= to)
  return of(rows.map(toCoinRow))
}

describe('KarmaWalletComponent', () => {
  let component: KarmaWalletComponent
  let routerStub: { navigate: jest.Mock }
  let eventsStub: { dispatchEvent: jest.Mock }
  let snackBarStub: { open: jest.Mock }
  let dialogStub: { open: jest.Mock }
  let serviceStub: { getWalletSummary: jest.Mock, getTransactions: jest.Mock }
  /* What the redeem dialog closes with, per test */
  let dialogResult: any

  const telemetryStub = {
    pData: { id: 'prod.sunbird-cb-portal', ver: '4.8.10', pid: 'sunbird-cb-portal' },
  }
  const impressionSpy = jest.spyOn($t, 'impression').mockImplementation(() => { })

  const build = () => new KarmaWalletComponent(
    routerStub as unknown as Router,
    dialogStub as unknown as MatDialog,
    telemetryStub as unknown as TelemetryService,
    eventsStub as unknown as EventService,
    serviceStub as unknown as KarmaWalletService,
    snackBarStub as unknown as MatSnackBar,
  )

  /* A component already loaded against the 26 Aug 2026 anchor */
  const load = () => {
    const built = build()
    built.referenceDate = new Date(2026, 7, 26)
    built.ngOnInit()
    return built
  }

  beforeEach(() => {
    routerStub = { navigate: jest.fn() }
    eventsStub = { dispatchEvent: jest.fn() }
    snackBarStub = { open: jest.fn() }
    dialogResult = undefined
    dialogStub = { open: jest.fn(() => ({ afterClosed: () => of(dialogResult) })) }
    serviceStub = {
      getWalletSummary: jest.fn(() => of(SUMMARY)),
      getTransactions: jest.fn(transactionsFor),
    }
    impressionSpy.mockClear()
    component = load()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should default to the All tab over the Recent period', () => {
    expect(component.activeTab).toBe('all')
    expect(component.activePeriod).toBe('recent')
    expect(component.activePeriodLabel).toBe('Recent')
  })

  it('should offer the six documented period options', () => {
    expect(component.periodOptions.map(o => o.label)).toEqual([
      'Recent', 'Current Month', 'Last Month', 'Last 3 Months', 'Last 6 Months', 'Custom Date',
    ])
  })

  it('should open on the Recent window, which is the last 30 days', () => {
    /* 27 Jul - 26 Aug 2026 takes in the August rows but not the July ones */
    expect(component.groups.map(g => g.label)).toEqual(['AUG 2026'])
    expect(component.hasTransactions).toBe(true)
  })

  it('should keep only credits when the Earned tab is selected', () => {
    component.selectTab('earned')

    const shown = component.groups.reduce<number>((n, g) => n + g.transactions.length, 0)
    expect(shown).toBeGreaterThan(0)
    component.groups.forEach(group => {
      group.transactions.forEach(txn => expect(txn.type).toBe('earned'))
    })
  })

  it('should render an API row as title, description and a credit/debit split', () => {
    /* Newest row: an event attendance credit, its balanceAfter the summary's walletBalance */
    const credit = component.groups[0].transactions[0]
    expect(credit.transactionId).toBe('TXN-000027')
    expect(credit.title).toBe('Event Attendance')
    expect(credit.description).toBe('Karmayogi Talks — Evidence-based policy')
    expect(credit.credit).toBe(40)
    expect(credit.debit).toBe(0)
    expect(credit.balance).toBe(472)

    /* The row below it is a marketplace debit, described from its addinfo */
    const debit = component.groups[0].transactions[1]
    expect(debit.title).toBe('Marketplace Course Purchase')
    expect(debit.description).toBe('Understanding AI from MIT — Provider: MIT OpenCourseWare')
    expect(debit.credit).toBe(0)
    expect(debit.debit).toBe(40)
  })

  it('should spell out a points conversion from its addinfo', () => {
    /* The conversion sits in July, which the Recent window does not reach */
    component.selectPeriod('lastMonth')

    const conversion = component.groups[0].transactions
      .find(txn => txn.title === 'Karma Points Redemption')
    expect(conversion).toBeTruthy()
    expect(conversion && conversion.description)
      .toBe('Converted 300 Karma Points to Karma Coins')
  })

  it('should keep only the current month when Current Month is picked', () => {
    component.selectPeriod('currentMonth')
    expect(component.groups.map(g => g.label)).toEqual(['AUG 2026'])
  })

  it('should keep only the previous month when Last Month is picked', () => {
    component.selectPeriod('lastMonth')
    expect(component.groups.map(g => g.label)).toEqual(['JUL 2026'])
  })

  it('should stop before the current month over Last 3 Months', () => {
    /* AC-05.8: 1 May - 31 Jul 2026, so August is out entirely */
    component.selectPeriod('last3Months')
    expect(component.groups.map(g => g.label)).toEqual(['JUL 2026'])
  })

  it('should stop before the current month over Last 6 Months', () => {
    /* AC-05.9: 1 Feb - 31 Jul 2026 */
    component.selectPeriod('last6Months')
    expect(component.groups.map(g => g.label)).toEqual(['JUL 2026'])
  })

  it('should drop everything older than the window', () => {
    /* Nudge the anchor forward so the fixture history falls out of the current month */
    component.referenceDate = new Date(2026, 9, 20)
    component.selectPeriod('currentMonth')
    expect(component.groups.map(g => g.label)).toEqual([])
  })

  it('should send the tab filter and the period window in the request body', () => {
    const lastBody = () => serviceStub.getTransactions.mock.calls.slice(-1)[0][0]

    /* AC-05.5: Recent is the last 30 days through today */
    component.selectTab('redeemed')
    expect(lastBody()).toEqual({
      request: { startDate: '2026-07-27', endDate: '2026-08-26', type: 'DEBIT' },
    })

    /* AC-05.7: the whole previous month */
    component.selectPeriod('lastMonth')
    expect(lastBody()).toEqual({
      request: { startDate: '2026-07-01', endDate: '2026-07-31', type: 'DEBIT' },
    })

    /* AC-05.6: the 1st of this month through today */
    component.selectPeriod('currentMonth')
    expect(lastBody()).toEqual({
      request: { startDate: '2026-08-01', endDate: '2026-08-26', type: 'DEBIT' },
    })

    /* AC-05.8 and AC-05.9: whole months, both stopping before the current one */
    component.selectPeriod('last3Months')
    expect(lastBody()).toEqual({
      request: { startDate: '2026-05-01', endDate: '2026-07-31', type: 'DEBIT' },
    })

    component.selectPeriod('last6Months')
    expect(lastBody()).toEqual({
      request: { startDate: '2026-02-01', endDate: '2026-07-31', type: 'DEBIT' },
    })
  })

  /* AC-05.10: month ends come from day 0 of the next month, which the calendar resolves */
  it('should resolve every month-end length, leap February included', () => {
    const endAfter = (anchor: Date) => {
      component.referenceDate = anchor
      /* Bounce off another period so each selection is a change */
      component.selectPeriod('recent')
      component.selectPeriod('lastMonth')
      return serviceStub.getTransactions.mock.calls.slice(-1)[0][0].request.endDate
    }

    /* 29 days: February 2024 is a leap year */
    expect(endAfter(new Date(2024, 2, 10))).toBe('2024-02-29')
    /* 28 days: February 2026 is not */
    expect(endAfter(new Date(2026, 2, 10))).toBe('2026-02-28')
    /* 30 and 31 day months */
    expect(endAfter(new Date(2026, 4, 10))).toBe('2026-04-30')
    expect(endAfter(new Date(2026, 5, 10))).toBe('2026-05-31')
    /* December of the year before, when the anchor is in January */
    expect(endAfter(new Date(2026, 0, 10))).toBe('2025-12-31')
  })

  it('should keep a month collapsed across a tab change', () => {
    const group = component.groups[0]
    component.toggleGroup(group)
    expect(group.expanded).toBe(false)

    component.selectTab('earned')
    expect(component.groups[0].expanded).toBe(false)
  })

  it('should ignore a response that its own filter change has already superseded', done => {
    /* The first answer is held back, so switchMap has something to cancel */
    serviceStub.getTransactions.mockImplementation((request: IKarmaTransactionsRequest) =>
      request.request.type === 'CREDIT'
        ? transactionsFor(request).pipe(delay(40))
        : transactionsFor(request))

    component.selectTab('earned')
    component.selectTab('redeemed')

    setTimeout(() => {
      /* Only the last one may reach the table */
      component.groups.forEach(group => {
        group.transactions.forEach(txn => expect(txn.type).toBe('redeemed'))
      })
      done()
    }, 80)
  })

  it('should fill the conversion bar from the share of the cap already converted', () => {
    /* summary: 120 of a 300 cap converted */
    expect(component.conversionProgress).toBe(40)
    expect(component.summary.convertibleThisMonth).toBe(180)
  })

  it('should report zero progress rather than NaN when no cap is set', () => {
    component.summary = { ...component.summary, monthlyCap: 0, convertedThisMonth: 10 }
    expect(component.conversionProgress).toBe(0)
  })

  it('should hold the four cards in a skeleton until the summary resolves', () => {
    /* Held back, so the in-flight state can be observed at all */
    serviceStub.getWalletSummary.mockReturnValue(of(SUMMARY).pipe(delay(1)))

    const pending = build()
    pending.referenceDate = new Date(2026, 7, 26)
    pending.ngOnInit()

    /* The template renders a .kw-stat--skeleton per skeletonSlots entry off this flag */
    expect(pending.summaryLoading).toBe(true)
    expect(pending.skeletonSlots.length).toBe(4)
  })

  it('should clear the skeleton once the summary arrives', () => {
    expect(component.summaryLoading).toBe(false)
  })

  it('should clear the skeleton when the summary call fails', () => {
    serviceStub.getWalletSummary.mockReturnValue(throwError(() => ({ status: 500, error: {} })))

    const failing = load()

    /* Otherwise the placeholder would sit there for good */
    expect(failing.summaryLoading).toBe(false)
  })

  it('should surface the server wording when the summary call fails', () => {
    serviceStub.getWalletSummary.mockReturnValue(throwError(
      () => ({ status: 400, error: { params: { errmsg: 'Wallet is not enabled' } } })))

    load()

    /* The response's own message, in preference to our fallback copy */
    expect(snackBarStub.open).toHaveBeenCalledWith(
      'Wallet is not enabled', 'X', { duration: 5000 })
  })

  it('should report a failed summary call in the snackbar', () => {
    serviceStub.getWalletSummary.mockReturnValue(throwError(() => ({ status: 500, error: {} })))

    load()

    expect(snackBarStub.open).toHaveBeenCalledWith(
      'We could not load your Karma Coin Wallet. Please try again.', 'X', { duration: 5000 })
  })

  it('should stand a retry where the cards would be when the summary call fails', () => {
    serviceStub.getWalletSummary.mockReturnValue(throwError(
      () => ({ status: 400, error: { params: { errmsg: 'Wallet is not enabled' } } })))

    const failing = load()

    /* The template swaps the four cards for the error panel off this, and shows the server's
       own wording under the "Something went wrong" heading */
    expect(failing.summaryError).toBe('Wallet is not enabled')
  })

  it('should leave no error behind when the summary resolves', () => {
    expect(component.summaryError).toBe('')
  })

  it('should refill the cards when Retry succeeds', () => {
    serviceStub.getWalletSummary.mockReturnValueOnce(throwError(() => ({ status: 500, error: {} })))

    const failing = load()
    expect(failing.summaryError).not.toBe('')

    /* The stub is back to the good response for the second call */
    failing.retrySummary()

    expect(failing.summaryError).toBe('')
    expect(failing.summaryLoading).toBe(false)
    expect(failing.summary.walletBalance).toBe(472)
  })

  it('should retry only the summary, leaving the history table alone', () => {
    serviceStub.getWalletSummary.mockReturnValueOnce(throwError(() => ({ status: 500, error: {} })))

    const failing = load()
    /* Counted from here, not from zero: beforeEach has already loaded a component off the
       same stubs */
    const summaryCalls = serviceStub.getWalletSummary.mock.calls.length
    const historyCalls = serviceStub.getTransactions.mock.calls.length

    failing.retrySummary()

    expect(serviceStub.getWalletSummary.mock.calls.length).toBe(summaryCalls + 1)
    expect(serviceStub.getTransactions.mock.calls.length).toBe(historyCalls)
  })

  it('should map the summary response onto the four cards', () => {
    expect(component.summary.walletBalance).toBe(472)
    /* The Total Redeemed card counts points converted into coins, not coins spent */
    expect(component.summary.totalEarnedTillDate).toBe(1321)
    expect(component.summary.unredeemedKarmaPoints).toBe(1341)
  })

  it('should label the conversion month from the summary, not the clock', () => {
    /* summary yearMonth is 2026-08 whatever today happens to be */
    component.referenceDate = new Date(2027, 2, 9)
    expect(component.currentMonthLabel).toBe('August')
  })

  it('should fall back to the anchor month before the summary loads', () => {
    component.referenceDate = new Date(2026, 10, 4)
    component.summary = { ...component.summary, yearMonth: '' }
    expect(component.currentMonthLabel).toBe('November')
  })

  /* What the page does with each way the redeem dialog can close */
  describe('after the redeem dialog closes', () => {

    const closeWith = (result: any) => {
      dialogResult = result
      serviceStub.getWalletSummary.mockClear()
      serviceStub.getTransactions.mockClear()

      component.redeemKarmaPoints()

      const expected = result && (result.redeemed || result.pending) ? 1 : 0
      expect(serviceStub.getWalletSummary.mock.calls.length).toBe(expected)
      expect(serviceStub.getTransactions.mock.calls.length).toBe(expected)
    }

    it('should refetch the wallet once a conversion is confirmed', () => {
      closeWith({ redeemed: 50, received: 50, transactionId: 'TXN-000028' })
    })

    it('should refetch the wallet for a conversion that is still queued', () => {
      closeWith({ pending: true })
    })

    it('should leave the wallet alone when the dialog was simply dismissed', () => {
      closeWith(undefined)
    })

    it('should hand the dialog the summary it has already loaded', () => {
      component.redeemKarmaPoints()

      const config = dialogStub.open.mock.calls[0][1]
      /* So the dialog does not fetch the summary a second time */
      expect(config.data).toEqual({ summary: component.summary })
    })
  })

  /* Custom Date, against AC-05.11 to AC-05.16 */
  describe('custom date range', () => {

    const lastBody = () => serviceStub.getTransactions.mock.calls.slice(-1)[0][0].request

    it('should seed the range and open the calendar when Custom Date is picked', done => {
      /* The picker is a ViewChild off a template that is not rendered here */
      const picker = { open: jest.fn() }
      component.customStartPicker = picker as any

      component.selectPeriod('custom')

      /* Seeded with the Recent window rather than two empty fields */
      expect(component.customStart).toEqual(new Date(2026, 6, 27))
      expect(component.customEnd).toEqual(new Date(2026, 7, 26))

      /* The component opens the calendar a tick later, once those fields exist */
      setTimeout(() => {
        expect(picker.open).toHaveBeenCalled()
        done()
      }, 10)
    })

    it('should limit the calendar to the last year, ending today', () => {
      /* AC-05.12 and AC-05.13 */
      expect(component.minSelectableDate).toEqual(new Date(2025, 7, 26))
      expect(component.maxSelectableDate).toEqual(new Date(2026, 7, 26))
    })

    it('should refuse an end date earlier than the start date', () => {
      component.selectPeriod('custom')

      component.onCustomStartChange(new Date(2026, 7, 20))
      /* That start still pairs with the seeded end, so it queries; the inversion is next */
      const callsBefore = serviceStub.getTransactions.mock.calls.length
      component.onCustomEndChange(new Date(2026, 7, 10))

      /* AC-05.14, to the letter */
      expect(component.customError).toBe('The end date cannot be earlier than the start date.')
      expect(component.hasTransactions).toBe(false)
      /* An inverted pair is never sent */
      expect(serviceStub.getTransactions.mock.calls.length).toBe(callsBefore)
    })

    it('should accept the same date at both ends as a one-day range', () => {
      component.selectPeriod('custom')

      /* AC-05.16 */
      component.onCustomStartChange(new Date(2026, 7, 20))
      component.onCustomEndChange(new Date(2026, 7, 20))

      expect(component.customError).toBe('')
      expect(lastBody()).toEqual({
        startDate: '2026-08-20', endDate: '2026-08-20', type: 'ALL',
      })
    })

    it('should clear the ordering complaint once the range is put right', () => {
      component.selectPeriod('custom')
      component.onCustomStartChange(new Date(2026, 7, 20))
      component.onCustomEndChange(new Date(2026, 7, 10))
      expect(component.customError).not.toBe('')

      component.onCustomEndChange(new Date(2026, 7, 25))
      expect(component.customError).toBe('')
    })

    it('should surface the server refusing a range beyond the one-year lookback', () => {
      component.selectPeriod('custom')
      /* AC-05.15: the calendar's bounds rule this out, so it is reached by submitting
         directly - and the server, not the client, is what refuses it */
      component.customStart = new Date(2024, 0, 1)
      component.onCustomEndChange(new Date(2026, 7, 26))

      /* The refusal is reported in the snackbar and nowhere else */
      expect(snackBarStub.open).toHaveBeenCalledWith(
        'You can view history for up to the last 1 year only.', 'X', { duration: 5000 })
      expect(component.hasTransactions).toBe(false)
    })

    it('should keep answering later filter changes after a refused range', () => {
      component.selectPeriod('custom')
      component.customStart = new Date(2024, 0, 1)
      component.onCustomEndChange(new Date(2026, 7, 26))
      expect(snackBarStub.open).toHaveBeenCalled()

      /* The refusal must not have taken the request stream down with it */
      component.selectPeriod('lastMonth')
      expect(component.groups.map(g => g.label)).toEqual(['JUL 2026'])
    })
  })

  it('should refuse to open the redeem dialog while redemption is switched off', () => {
    component.summary = { ...component.summary, redeemEnabled: false }
    expect(component.canRedeem).toBe(false)

    component.redeemKarmaPoints()
    expect(dialogStub.open).not.toHaveBeenCalled()
  })

  it('should raise a view impression when the walkthrough starts', () => {
    ;(component as any).tour = { start: jest.fn() }
    component.startWalkthrough()

    /* Not calls[0] - ngOnInit has already raised the page-load impression */
    const [edata, options] = impressionSpy.mock.calls.slice(-1)[0] as any[]
    /* type is the reason this goes straight to the SDK - the platform service would emit the
       first URL segment here instead */
    expect(edata.type).toBe('view')
    expect(edata.pageid).toBe(edata.uri.split('?')[0])
    expect(options.context.env).toBe('Karma Wallet')
    expect(options.object).toEqual({})
    expect(options.context.pdata.id).toBe('prod.sunbird-cb-portal')
  })

  it('should raise a what-is-karma-coins click when the walkthrough starts', () => {
    ;(component as any).tour = { start: jest.fn() }
    component.startWalkthrough()

    const event = eventsStub.dispatchEvent.mock.calls[0][0]
    /* The entry point carries its own subType; only the tour's step controls are guided-tour */
    expect(event.data.edata).toEqual({
      id: 'start-walkthrough', type: 'click', subType: 'what-is-karma-coins',
    })
    expect(event.data.object).toEqual({})
    expect(event.data.pageContext.pageId).toBe('app/person-profile/karma-wallet')
    /* The listener reads env off the top-level pageContext, not data.pageContext - the
       helper only fills the latter, which is why this is dispatched by hand */
    expect(event.pageContext.module).toBe('Karma Wallet')
  })

  it('should report every walkthrough control as step-<n>-<action>', () => {
    const ids = () => eventsStub.dispatchEvent.mock.calls.map((c: any[]) => c[0].data.edata.id)

    component.onTourAction({ step: 1, action: 'skip' })
    component.onTourAction({ step: 1, action: 'next' })
    component.onTourAction({ step: 2, action: 'back' })
    component.onTourAction({ step: 6, action: 'ok' })

    expect(ids()).toEqual(['step-1-skip', 'step-1-next', 'step-2-back', 'step-6-ok'])
  })

  it('should give a tour control the same env, pageid and subtype as the start click', () => {
    component.onTourAction({ step: 3, action: 'back' })

    const event = eventsStub.dispatchEvent.mock.calls[0][0]
    expect(event.data.edata.type).toBe('click')
    expect(event.data.edata.subType).toBe('guided-tour')
    expect(event.data.object).toEqual({})
    expect(event.data.pageContext.pageId).toBe('app/person-profile/karma-wallet')
    expect(event.pageContext.module).toBe('Karma Wallet')
  })

  it('should raise nothing beyond the page impression for the untracked controls', () => {
    /* The page-load impression from ngOnInit is expected; the tabs are not tracked */
    impressionSpy.mockClear()

    component.selectTab('earned')
    component.selectPeriod('lastMonth')

    expect(impressionSpy).not.toHaveBeenCalled()
    expect(eventsStub.dispatchEvent).not.toHaveBeenCalled()
  })

  it('should raise a click for View More on unredeemed Karma Points', () => {
    component.viewUnredeemedKarmaPoints()

    const event = eventsStub.dispatchEvent.mock.calls[0][0]
    expect(event.data.edata).toEqual({
      id: 'view-more', type: 'click', subType: 'unconverted-karma',
    })
    expect(event.data.pageContext.pageId).toBe('app/person-profile/karma-wallet')
    expect(event.pageContext.module).toBe('Karma Wallet')
    expect(event.data.object).toEqual({})
  })

  it('should raise a click for Convert Karma Points', () => {
    component.redeemKarmaPoints()

    const event = eventsStub.dispatchEvent.mock.calls[0][0]
    expect(event.data.edata).toEqual({ id: 'convert-karma-points', type: 'click' })
    expect(event.data.pageContext.pageId).toBe('app/person-profile/karma-wallet')
    expect(event.pageContext.module).toBe('Karma Wallet')
    expect(event.data.object).toEqual({})
  })

  it('should raise no click for Convert Karma Points while conversion is switched off', () => {
    component.summary = { ...component.summary, redeemEnabled: false }

    component.redeemKarmaPoints()

    expect(eventsStub.dispatchEvent).not.toHaveBeenCalled()
  })

  it('should raise a click for Redeem Karma Coins', () => {
    component.useKarmaCoins()

    const event = eventsStub.dispatchEvent.mock.calls[0][0]
    expect(event.data.edata).toEqual({ id: 'redeem-karma-coins', type: 'click' })
    expect(event.data.pageContext.pageId).toBe('app/person-profile/karma-wallet')
    expect(event.pageContext.module).toBe('Karma Wallet')
  })

  it('should raise no button click when the walkthrough opens the convert dialog', () => {
    ;(component as any).tour = { start: jest.fn() }
    dialogStub.open.mockClear()

    /* Step 5 of the tour opens the same dialog as the button; only guided-tour ids should
       come out of it */
    component.onTourAction({ step: 5, action: 'next' })

    const ids = eventsStub.dispatchEvent.mock.calls.map((c: any[]) => c[0].data.edata.id)
    expect(ids).not.toContain('convert-karma-points')
  })

  it('should raise a page impression on load', () => {
    const [edata, options] = impressionSpy.mock.calls[0] as any[]

    expect(edata).toEqual({
      pageid: 'app/person-profile/karma-wallet',
      type: 'page',
      uri: 'app/person-profile/karma-wallet',
    })
    expect(options.context.env).toBe('Karma Wallet')
    expect(options.context.pdata.id).toBe('prod.sunbird-cb-portal')
    expect(options.object).toEqual({})
  })

  it('should load the page even when the impression throws', () => {
    impressionSpy.mockImplementationOnce(() => { throw new Error('sdk not initialised') })

    expect(() => load()).not.toThrow()
  })

  it('should not let a telemetry failure take the page down', () => {
    ;(component as any).tour = { start: jest.fn() }
    impressionSpy.mockImplementationOnce(() => { throw new Error('sdk not initialised') })

    expect(() => component.startWalkthrough()).not.toThrow()
  })

  it('should source the coin icon from the karmawallet-v2 asset folder', () => {
    expect(component.icons.karmaCoin).toBe('/assets/icons/karmawallet-v2/karmacoin.svg')
  })

  it('should route to Karma Tracks providers from Redeem Karma Coins', () => {
    component.useKarmaCoins()
    expect(routerStub.navigate).toHaveBeenCalledWith(['/app/seeAll'], {
      queryParams: { key: 'karmaTracks', tabSelected: 'Providers' },
    })
  })

  it('should route to karma points from View More, flagging where it came from', () => {
    component.viewUnredeemedKarmaPoints()
    expect(routerStub.navigate).toHaveBeenCalledWith(['/app/person-profile/karma-points'], {
      queryParams: { from: 'karma-wallet' },
    })
  })

  /*
   * The component pins MAT_DATE_LOCALE to en-GB and MAT_DATE_FORMATS to these options, and the
   * native date adapter formats the picker input through Intl with exactly that pair. Asserting
   * the pair here catches a drift back to the en-US M/D/YYYY default without a TestBed.
   */
  it('should render the coin history range inputs as DD/MM/YYYY', () => {
    const options = KARMA_WALLET_DATE_FORMATS.display.dateInput as Intl.DateTimeFormatOptions
    const formatted = new Intl.DateTimeFormat('en-GB', options).format(new Date(2026, 7, 8))

    expect(formatted).toBe('08/08/2026')
  })
})
