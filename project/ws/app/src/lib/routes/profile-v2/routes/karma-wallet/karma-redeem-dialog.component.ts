import { Component, Inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { EventService, WsEvents } from '@sunbird-cb/utils-v2'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import {
  EMPTY_KARMA_WALLET_SUMMARY,
  IKarmaRedeemDialogData,
  IKarmaRedeemStatusResult,
  IKarmaWalletSummary,
  KARMA_CONVERSION_RATE,
  KARMA_WALLET_ENV,
  KARMA_WALLET_PAGE_ID,
  newRequestId,
  readApiError,
} from './karma-wallet.model'
import { KarmaWalletService } from './karma-wallet.service'

const ICON_BASE = '/assets/icons/karmawallet-v2'
const GENERIC_REDEEM_ERROR = 'We could not convert your Karma Points. Please try again.'
const SUMMARY_ERROR = 'We could not load your conversion limit. Please try again.'
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

@Component({
  selector: 'ws-app-karma-redeem-dialog',
  templateUrl: './karma-redeem-dialog.component.html',
  styleUrls: ['./karma-redeem-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: false,
})
export class KarmaRedeemDialogComponent implements OnInit, OnDestroy {

  readonly icons = {
    karmaCoin: `${ICON_BASE}/karmacoin.svg`,
    convert: `${ICON_BASE}/convert.svg`,
    /* TODO: no karmawallet-v2 equivalent supplied yet, so this still resolves from home-v2 */
    karmaPoints: '/assets/icons/home-v2/karma-badge.svg',
  }

  summary: IKarmaWalletSummary = { ...EMPTY_KARMA_WALLET_SUMMARY }
  readonly conversionRate = KARMA_CONVERSION_RATE

  amount = 0
  convertAll = false
  loading = true
  referenceDate = new Date()
  submitState: 'idle' | 'submitting' | 'pending' = 'idle'

  private readonly destroy$ = new Subject<void>()
  private readonly stopPolling$ = new Subject<void>()

  constructor(
    private dialogRef: MatDialogRef<KarmaRedeemDialogComponent>,
    private karmaWalletSvc: KarmaWalletService,
    private snackBar: MatSnackBar,
    private events: EventService,
    @Inject(MAT_DIALOG_DATA) private data: IKarmaRedeemDialogData | null,
  ) { }

  private openSnackbar(primaryMsg: string, duration: number = 5000) {
    this.snackBar.open(primaryMsg, 'X', {
      duration,
    })
  }

  ngOnInit() {
    if (this.data && this.data.summary) {
      this.summary = this.data.summary
      this.loading = false
      return
    }
    this.karmaWalletSvc.getWalletSummary().pipe(
      takeUntil(this.destroy$),
    ).subscribe({
      next: summary => {
        this.summary = summary
        this.loading = false
      },
      error: err => {
        this.loading = false
        this.openSnackbar(readApiError(err) || SUMMARY_ERROR)
      },
    })
  }

  ngOnDestroy() {
    this.stopPolling$.next()
    this.stopPolling$.complete()
    this.destroy$.next()
    this.destroy$.complete()
  }

  /* Karma Coins the current amount would yield; coins are whole units */
  get willReceive(): number {
    const rate = this.conversionRate || 1
    return Math.floor(this.amount / rate)
  }

  get progressPercent(): number {
    if (!this.summary.monthlyCap) {
      return 0
    }
    const ratio = this.summary.convertedThisMonth / this.summary.monthlyCap
    return Math.max(0, Math.min(100, ratio * 100))
  }

  /* Month the cap applies to, e.g. 'August' - the summary's yearMonth, not the clock */
  get currentMonthLabel(): string {
    const parts = (this.summary.yearMonth || '').split('-')
    const month = Number(parts[1])
    const index = parts.length === 2 && month >= 1 && month <= 12
      ? month - 1
      : this.referenceDate.getMonth()
    return MONTH_NAMES[index]
  }

  get resetOnLabel(): string {
    const parts = (this.summary.capResetsOn || '').split('-')
    const month = Number(parts[1])
    const day = Number(parts[2])
    if (parts.length === 3 && month >= 1 && month <= 12 && day >= 1) {
      return `${day} ${MONTH_SHORT[month - 1]}`
    }
    const next = new Date(this.referenceDate.getFullYear(), this.referenceDate.getMonth() + 1, 1)
    return `1 ${MONTH_SHORT[next.getMonth()]}`
  }

  /* Two independent ceilings apply; the lower one is the real limit */
  get maxConvertible(): number {
    return Math.min(this.summary.convertibleThisMonth, this.summary.unredeemedKarmaPoints)
  }

  get blockedMessage(): string {
    if (!this.loading && !this.summary.redeemEnabled) {
      return 'Karma Point conversion is unavailable right now. Please try again later.'
    }
    if (this.summary.unredeemedKarmaPoints <= 0) {
      return 'You do not have any unconverted Karma Points right now. Keep learning to earn more.'
    }
    if (this.summary.convertibleThisMonth <= 0) {
      return `You have used your full ${this.summary.monthlyCap} Karma Point conversion limit`
        + ` for ${this.currentMonthLabel}. It resets on ${this.resetOnLabel}.`
    }
    return ''
  }

  get isBlocked(): boolean {
    return this.blockedMessage !== ''
  }

  /* True from the POST until the conversion is confirmed, failed, or given up on */
  get isSubmitting(): boolean {
    return this.submitState === 'submitting'
  }

  get errorMessage(): string {
    if (this.isBlocked) {
      return this.blockedMessage
    }
    if (this.amount > this.maxConvertible) {
      /* Report the ceiling that binds - the balance when it is the tighter of the two */
      if (this.summary.unredeemedKarmaPoints <= this.summary.convertibleThisMonth) {
        return `You have only ${this.summary.unredeemedKarmaPoints} unconverted Karma Points available.`
      }
      return `You can convert only ${this.summary.convertibleThisMonth} more Karma Points this month.`
        + ` The cap resets on ${this.resetOnLabel}.`
    }
    return ''
  }

  get canConvert(): boolean {
    return !this.isBlocked && !this.isSubmitting && this.submitState !== 'pending'
      && this.amount > 0 && this.amount <= this.maxConvertible
  }

  /* Shown once polling has given up: queued, and it will land on its own */
  get pendingNote(): string {
    return this.submitState === 'pending'
      ? 'Your conversion is still being processed. Your wallet will update once it completes.'
      : ''
  }

  onAmountChange(value: any) {
    const parsed = Math.floor(Number(value))
    const safe = isNaN(parsed) ? 0 : parsed
    /* Deliberately not clamped to the ceiling: an over-limit amount has to survive so the
       matching message can be shown. Only negatives are corrected. */
    this.amount = Math.max(0, safe)
    /* Typing anything short of the full allowance clears the shortcut */
    this.convertAll = this.amount === this.maxConvertible && this.amount > 0
  }

  toggleConvertAll(checked: boolean) {
    this.convertAll = checked
    this.amount = checked ? this.maxConvertible : 0
  }

  convert() {
    if (!this.canConvert) {
      return
    }
    this.raiseClick('convert-karma-points-convert', this.amount)
    this.submitState = 'submitting'
    /* Client-generated: it is what makes a retry idempotent and what the status poll asks for */
    const requestId = newRequestId()

    this.karmaWalletSvc.redeem({
      /* Shorthand first, to keep tslint's object-shorthand-properties-first happy */
      request: { requestId, pointsToConvert: this.amount },
    }).pipe(
      takeUntil(this.destroy$),
    ).subscribe({
      next: accepted => this.readRedeemStatus(accepted.requestId || requestId),
      /* A 400 from the pre-publish validation lands here, carrying the server's own wording */
      error: err => this.onRedeemFailed(readApiError(err)),
    })
  }

  cancel() {
    this.raiseClick('convert-karma-points-cancel', 0)
    this.stopPolling$.next()
    if (this.submitState === 'pending') {
      this.dialogRef.close({ pending: true })
      return
    }
    this.dialogRef.close()
  }
  private raiseClick(id: string, points: number) {
    this.events.dispatchEvent<WsEvents.IWsEventTelemetryInteract>({
      eventType: WsEvents.WsEventType.Telemetry,
      eventLogLevel: WsEvents.WsEventLogLevel.Info,
      data: {
        eventSubType: WsEvents.EnumTelemetrySubType.Interact,
        edata: {
          id,
          type: WsEvents.EnumInteractTypes.CLICK,
          subType: `${points}`,
        },
        object: {},
        pageContext: { pageId: KARMA_WALLET_PAGE_ID },
      },
      pageContext: { module: KARMA_WALLET_ENV },
      from: '',
      to: 'Telemetry',
    })
  }

  private readRedeemStatus(requestId: string) {
    this.karmaWalletSvc.getRedeemStatus(requestId).pipe(
      takeUntil(this.stopPolling$),
      takeUntil(this.destroy$),
    ).subscribe({
      next: status => this.onRedeemStatus(status),
      error: err => this.onStatusPollFailed(err),
    })
  }

  private onStatusPollFailed(err: any) {
    this.stopPolling$.next()
    const status = err && err.status
    if (status === 403 || status === 404 || status === 0) {
      this.submitState = 'pending'
      return
    }
    this.onRedeemFailed(readApiError(err))
  }

  private onRedeemStatus(status: IKarmaRedeemStatusResult) {
    if (status.status === 'SUCCESS') {
      this.stopPolling$.next()
      const converted = status.pointsConverted === undefined ? this.amount : status.pointsConverted
      this.dialogRef.close({
        redeemed: converted,
        received: Math.floor(converted / (this.conversionRate || 1)),
        transactionId: status.transactionId,
      })
      return
    }

    if (status.status === 'FAILED') {
      this.onRedeemFailed(status.errorMessage || '')
      return
    }
    this.stopPolling$.next()
    this.submitState = 'pending'
  }
  private onRedeemFailed(message: string) {
    this.stopPolling$.next()
    this.submitState = 'idle'
    this.openSnackbar(message || GENERIC_REDEEM_ERROR)
  }
}
