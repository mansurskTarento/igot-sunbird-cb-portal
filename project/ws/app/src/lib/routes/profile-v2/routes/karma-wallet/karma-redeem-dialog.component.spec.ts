import { MatDialogRef } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { EventService } from '@sunbird-cb/utils-v2'
import { Observable, Subject, of, throwError } from 'rxjs'

import { KarmaRedeemDialogComponent } from './karma-redeem-dialog.component'
import {
  EMPTY_KARMA_WALLET_SUMMARY,
  IKarmaRedeemStatusResult,
  IKarmaWalletSummary,
  newRequestId,
} from './karma-wallet.model'
import { KarmaWalletService } from './karma-wallet.service'

/**
 * No TestBed and no shared mock module: the component is plain constructor injection, so it
 * is built directly and every collaborator is stubbed here. The fixtures below are the only
 * data these tests need - 120 of a 300 cap converted, 1341 points still unconverted.
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

const ACCEPTED = { requestId: 'req-1', status: 'PROCESSING' as const }

describe('KarmaRedeemDialogComponent', () => {
  let component: KarmaRedeemDialogComponent
  let dialogRefStub: { close: jest.Mock }
  let snackBarStub: { open: jest.Mock }
  let eventsStub: { dispatchEvent: jest.Mock }
  let serviceStub: {
    getWalletSummary: jest.Mock
    redeem: jest.Mock
    getRedeemStatus: jest.Mock
  }

  /* Builds the dialog. `data` null takes the fallback fetch; a summary takes the hand-over. */
  const build = (data: { summary: IKarmaWalletSummary } | null = null) =>
    new KarmaRedeemDialogComponent(
      dialogRefStub as unknown as MatDialogRef<KarmaRedeemDialogComponent>,
      serviceStub as unknown as KarmaWalletService,
      snackBarStub as unknown as MatSnackBar,
      eventsStub as unknown as EventService,
      data,
    )

  beforeEach(() => {
    dialogRefStub = { close: jest.fn() }
    snackBarStub = { open: jest.fn() }
    eventsStub = { dispatchEvent: jest.fn() }
    serviceStub = {
      getWalletSummary: jest.fn(() => of(SUMMARY)),
      redeem: jest.fn(() => of(ACCEPTED)),
      getRedeemStatus: jest.fn((requestId: string) => of({ requestId, status: 'PROCESSING' })),
    }
    component = build()
    component.ngOnInit()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should use the summary handed over by the wallet page, without refetching', () => {
    serviceStub.getWalletSummary.mockClear()
    const handed = { ...SUMMARY, convertibleThisMonth: 204 }

    const withData = build({ summary: handed })
    withData.ngOnInit()

    expect(withData.summary).toBe(handed)
    expect(withData.loading).toBe(false)
    /* The wallet page has already loaded this; opening the dialog must not ask again */
    expect(serviceStub.getWalletSummary).not.toHaveBeenCalled()
  })

  it('should fall back to fetching when the opener hands over nothing', () => {
    expect(serviceStub.getWalletSummary).toHaveBeenCalledTimes(1)
    expect(component.summary.monthlyCap).toBe(300)
    expect(component.loading).toBe(false)
  })

  it('should mint a well-formed, unique request id for each attempt', () => {
    const first = newRequestId()
    const second = newRequestId()

    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(second).not.toBe(first)
  })

  it('should source the convert icon from the karmawallet-v2 asset folder', () => {
    expect(component.icons.convert).toBe('/assets/icons/karmawallet-v2/convert.svg')
  })

  it('should start with nothing to convert, so Convert is unavailable', () => {
    expect(component.amount).toBe(0)
    expect(component.willReceive).toBe(0)
    expect(component.canConvert).toBe(false)
  })

  it('should fill the bar from the share of the cap already converted', () => {
    /* 120 of a 300 cap */
    expect(component.progressPercent).toBe(40)
  })

  it('should show an empty bar when nothing has been converted this month', () => {
    component.summary = { ...component.summary, convertedThisMonth: 0, monthlyCap: 300 }
    /* Whatever is still convertible - the bar reports what has been used, not what is left */
    expect(component.progressPercent).toBe(0)
  })

  it('should report zero rather than NaN when no cap is set', () => {
    component.summary = { ...component.summary, monthlyCap: 0, convertedThisMonth: 10 }
    expect(component.progressPercent).toBe(0)
  })

  it('should take its cap, balance and reset date from the wallet summary', () => {
    expect(component.summary.monthlyCap).toBe(300)
    expect(component.summary.convertibleThisMonth).toBe(180)
    expect(component.summary.unredeemedKarmaPoints).toBe(1341)
    expect(component.currentMonthLabel).toBe('August')
    expect(component.resetOnLabel).toBe('1 Sep')
  })

  it('should keep an over-limit amount but refuse to convert it', () => {
    /* No upper clamp: the breach has to survive so the limit message can explain it */
    component.onAmountChange(5000)
    expect(component.amount).toBe(5000)
    expect(component.canConvert).toBe(false)
    expect(component.errorMessage).not.toBe('')
  })

  it('should still correct a negative amount to zero', () => {
    component.onAmountChange(-10)
    expect(component.amount).toBe(0)
  })

  it('should ignore a non-numeric amount rather than produce NaN', () => {
    component.onAmountChange('abc')
    expect(component.amount).toBe(0)
  })

  it('should fill and clear the amount with the convert-all shortcut', () => {
    component.toggleConvertAll(true)
    expect(component.amount).toBe(component.summary.convertibleThisMonth)
    expect(component.canConvert).toBe(true)

    component.toggleConvertAll(false)
    expect(component.amount).toBe(0)
    expect(component.canConvert).toBe(false)
  })

  it('should not close on the 202 alone, before the outcome is known', () => {
    /* A deferred POST, so the in-flight state can be observed at all */
    const accepted = new Subject<typeof ACCEPTED>()
    serviceStub.redeem.mockReturnValue(accepted as unknown as Observable<typeof ACCEPTED>)

    component.onAmountChange(50)
    component.convert()

    expect(component.isSubmitting).toBe(true)
    /* Nothing has been written at this point */
    expect(dialogRefStub.close).not.toHaveBeenCalled()
    expect(serviceStub.getRedeemStatus).not.toHaveBeenCalled()

    accepted.next(ACCEPTED)
    expect(serviceStub.getRedeemStatus).toHaveBeenCalledTimes(1)
  })

  it('should close with the converted totals once the conversion is confirmed', () => {
    serviceStub.getRedeemStatus.mockReturnValue(of({
      requestId: 'req-1',
      status: 'SUCCESS',
      transactionId: 'TXN-000028',
      pointsConverted: 50,
    } as IKarmaRedeemStatusResult))

    component.onAmountChange(50)
    component.convert()

    expect(dialogRefStub.close).toHaveBeenCalledWith({
      redeemed: 50,
      received: 50,
      transactionId: 'TXN-000028',
    })
  })

  it('should read the status exactly once, whatever it says', () => {
    component.onAmountChange(50)
    component.convert()

    /* A PROCESSING answer used to cost 12 requests over 18s and end in this same state */
    expect(serviceStub.getRedeemStatus).toHaveBeenCalledTimes(1)
    expect(component.submitState).toBe('pending')
  })

  it('should surface the rejection wording when the request is refused outright', () => {
    serviceStub.redeem.mockReturnValue(throwError(() => ({
      status: 400,
      error: {
        responseCode: 'CLIENT_ERROR',
        params: {
          err: 'MONTHLY_CAP_EXCEEDED',
          errmsg: 'Only 180 Karma Points can be converted this month',
        },
      },
    })))

    component.onAmountChange(50)
    component.convert()

    /* The server's wording goes to the snackbar, not into the form */
    expect(snackBarStub.open).toHaveBeenCalledWith(
      'Only 180 Karma Points can be converted this month', 'X', { duration: 5000 })
    expect(component.errorMessage).toBe('')
    /* And the form is editable again, so the amount can be corrected */
    expect(component.isSubmitting).toBe(false)
    expect(component.canConvert).toBe(true)
    expect(dialogRefStub.close).not.toHaveBeenCalled()
  })

  it('should hold a conversion as pending when the status endpoint is unreachable', () => {
    /* 403 is what the gateway answered while redeem/status was not whitelisted */
    serviceStub.getRedeemStatus.mockReturnValue(throwError(() => ({ status: 403, error: {} })))

    component.onAmountChange(50)
    component.convert()

    /* The POST was accepted, so the points may well have converted. Calling that a failure
       would tell the user it did not happen when it may have. */
    expect(component.submitState).toBe('pending')
    expect(snackBarStub.open).not.toHaveBeenCalled()
  })

  it('should still report a real status error as a failure', () => {
    serviceStub.getRedeemStatus.mockReturnValue(throwError(() => ({
      status: 500, error: { params: { errmsg: 'Conversion service is down' } },
    })))

    component.onAmountChange(50)
    component.convert()

    expect(snackBarStub.open).toHaveBeenCalledWith(
      'Conversion service is down', 'X', { duration: 5000 })
  })

  it('should surface the wording of a conversion that fails after it was accepted', () => {
    serviceStub.getRedeemStatus.mockReturnValue(of({
      requestId: 'req-1',
      status: 'FAILED',
      errorCode: 'MONTHLY_CAP_EXCEEDED',
      errorMessage: 'Only 180 Karma Points can be converted this month',
    } as IKarmaRedeemStatusResult))

    component.onAmountChange(50)
    component.convert()

    expect(snackBarStub.open).toHaveBeenCalledWith(
      'Only 180 Karma Points can be converted this month', 'X', { duration: 5000 })
    expect(component.isSubmitting).toBe(false)
    expect(dialogRefStub.close).not.toHaveBeenCalled()
  })

  it('should report a conversion still being processed as pending, on one read', () => {
    component.onAmountChange(50)
    component.convert()

    /* PROCESSING is not terminal, so the dialog settles as pending straight away */
    expect(component.submitState).toBe('pending')
    expect(component.pendingNote).not.toBe('')
    expect(component.canConvert).toBe(false)

    /* Closing a pending conversion tells the page behind to refresh anyway */
    component.cancel()
    expect(dialogRefStub.close).toHaveBeenCalledWith({ pending: true })
  })

  it('should fall back to its own wording when a failure carries none', () => {
    serviceStub.redeem.mockReturnValue(throwError(() => ({ status: 500, error: {} })))

    component.onAmountChange(50)
    component.convert()

    expect(snackBarStub.open).toHaveBeenCalledWith(
      'We could not convert your Karma Points. Please try again.', 'X', { duration: 5000 })
  })

  it('should report a failed summary call in the snackbar', () => {
    serviceStub.getWalletSummary.mockReturnValue(throwError(() => ({ status: 500, error: {} })))

    const failing = build()
    failing.ngOnInit()

    expect(snackBarStub.open).toHaveBeenCalledWith(
      'We could not load your conversion limit. Please try again.', 'X', { duration: 5000 })
    expect(failing.loading).toBe(false)
  })

  it('should not submit on Convert while the amount is zero', () => {
    serviceStub.redeem.mockClear()

    component.convert()

    expect(serviceStub.redeem).not.toHaveBeenCalled()
    expect(dialogRefStub.close).not.toHaveBeenCalled()
  })

  it('should close with no result on Cancel', () => {
    component.cancel()
    expect(dialogRefStub.close).toHaveBeenCalledWith()
  })

  /* The conversion-limit scenarios, asserted against the exact copy */
  describe('conversion limits', () => {

    const withSummary = (over: Partial<IKarmaWalletSummary>) => {
      component.summary = { ...SUMMARY, ...over }
      /* Labels fall back to the calendar only when the summary omits its dates */
      component.referenceDate = new Date(2026, 7, 15)
      component.loading = false
    }

    it('should block 400 when only 180 of the monthly cap is left', () => {
      withSummary({})
      component.onAmountChange(400)

      expect(component.amount).toBe(400)
      expect(component.canConvert).toBe(false)
      expect(component.errorMessage).toBe(
        'You can convert only 180 more Karma Points this month. The cap resets on 1 Sep.')
    })

    it('should block 200 when only 90 unconverted points are held', () => {
      withSummary({ unredeemedKarmaPoints: 90 })
      component.onAmountChange(200)

      expect(component.canConvert).toBe(false)
      expect(component.errorMessage).toBe('You have only 90 unconverted Karma Points available.')
    })

    it('should block everything once the full monthly cap is used', () => {
      withSummary({ convertedThisMonth: 300, convertibleThisMonth: 0 })

      expect(component.isBlocked).toBe(true)
      expect(component.canConvert).toBe(false)
      expect(component.errorMessage).toBe(
        'You have used your full 300 Karma Point conversion limit for August. It resets on 1 Sep.')
    })

    it('should block everything when no unconverted points are held', () => {
      withSummary({ unredeemedKarmaPoints: 0 })

      expect(component.isBlocked).toBe(true)
      expect(component.canConvert).toBe(false)
      expect(component.errorMessage).toBe(
        'You do not have any unconverted Karma Points right now. Keep learning to earn more.')
    })

    it('should report the balance, not the cap, when the balance is the tighter ceiling', () => {
      withSummary({ unredeemedKarmaPoints: 90 })
      expect(component.maxConvertible).toBe(90)
    })

    it('should allow an amount within both ceilings', () => {
      withSummary({ unredeemedKarmaPoints: 90 })
      component.onAmountChange(90)

      expect(component.errorMessage).toBe('')
      expect(component.canConvert).toBe(true)
    })

    it('should fill convert-all to the tighter of the two ceilings', () => {
      withSummary({ unredeemedKarmaPoints: 90 })
      component.toggleConvertAll(true)

      expect(component.amount).toBe(90)
      expect(component.canConvert).toBe(true)
    })

    it('should keep an over-limit amount rather than silently clamping it', () => {
      withSummary({})
      component.onAmountChange(400)
      /* Clamping would hide the breach and the message could never appear */
      expect(component.amount).toBe(400)
    })

    it('should derive the month labels from the summary', () => {
      withSummary({})
      expect(component.currentMonthLabel).toBe('August')
      expect(component.resetOnLabel).toBe('1 Sep')
    })

    it('should roll the reset into the next year from December', () => {
      withSummary({ convertibleThisMonth: 0, yearMonth: '2026-12', capResetsOn: '2027-01-01' })

      expect(component.currentMonthLabel).toBe('December')
      expect(component.resetOnLabel).toBe('1 Jan')
      expect(component.errorMessage).toBe(
        'You have used your full 300 Karma Point conversion limit for December. It resets on 1 Jan.')
    })

    it('should fall back to the calendar when the summary carries no dates', () => {
      withSummary({ convertibleThisMonth: 0, yearMonth: '', capResetsOn: '' })
      component.referenceDate = new Date(2026, 11, 20)

      expect(component.currentMonthLabel).toBe('December')
      expect(component.resetOnLabel).toBe('1 Jan')
    })

    it('should block everything when the server has switched redemption off', () => {
      withSummary({ redeemEnabled: false })

      expect(component.isBlocked).toBe(true)
      expect(component.canConvert).toBe(false)
      expect(component.errorMessage).toBe(
        'Karma Point conversion is unavailable right now. Please try again later.')
    })
  })

  describe('telemetry', () => {

    const lastEvent = () => eventsStub.dispatchEvent.mock.calls.slice(-1)[0][0]

    it('should report the points entered as the subType on Convert', () => {
      component.amount = 143

      component.convert()

      expect(lastEvent().data.edata).toEqual({
        id: 'convert-karma-points-convert',
        type: 'click',
        subType: '143',
      })
    })

    it('should report 0 as the subType on Cancel', () => {
      /* Whatever is sitting in the input, nothing was converted on this path */
      component.amount = 143

      component.cancel()

      expect(lastEvent().data.edata).toEqual({
        id: 'convert-karma-points-cancel',
        type: 'click',
        subType: '0',
      })
    })

    it('should report the wallet page id and env on both', () => {
      component.amount = 10
      component.convert()

      const event = lastEvent()
      expect(event.data.pageContext.pageId).toBe('app/person-profile/karma-wallet')
      /* The listener reads env off the top-level pageContext, not data.pageContext */
      expect(event.pageContext.module).toBe('Karma Wallet')
      expect(event.data.object).toEqual({})
      expect(event.data.eventSubType).toBe('Interact')
    })

    it('should raise no Convert click when the button is not actionable', () => {
      /* amount 0 - canConvert is false, and the button is disabled to match */
      component.amount = 0

      component.convert()

      expect(eventsStub.dispatchEvent).not.toHaveBeenCalled()
      expect(serviceStub.redeem).not.toHaveBeenCalled()
    })

    it('should still report the click when Cancel is really Close on a pending conversion', () => {
      component.amount = 50
      component.convert()
      serviceStub.getRedeemStatus.mockReturnValue(of({ requestId: 'req-1', status: 'PROCESSING' }))
      eventsStub.dispatchEvent.mockClear()

      component.cancel()

      expect(lastEvent().data.edata.id).toBe('convert-karma-points-cancel')
      expect(dialogRefStub.close).toHaveBeenCalledWith({ pending: true })
    })
  })
})
