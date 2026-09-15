import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { MatDatepicker } from '@angular/material/datepicker'
import {
  DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatDateFormats, NativeDateAdapter,
} from '@angular/material/core'
import { MatDialog, MatDialogRef } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { EventService, TelemetryService, WsEvents } from '@sunbird-cb/utils-v2'
import { $t } from '@project-sunbird/telemetry-sdk'
import { NoopScrollStrategy } from '@angular/cdk/overlay'
import { of, Subject } from 'rxjs'
import { catchError, switchMap, takeUntil } from 'rxjs/operators'
import { KarmaCoinsInfoDialogComponent } from './karma-coins-info-dialog.component'
import { KarmaRedeemDialogComponent } from './karma-redeem-dialog.component'
import {
  EMPTY_KARMA_WALLET_SUMMARY,
  IKarmaCoinTransaction,
  IKarmaCoinTxnGroup,
  IKarmaTransactionsRequest,
  IKarmaWalletPeriodOption,
  IKarmaWalletSummary,
  IKarmaWalletTab,
  KARMA_WALLET_ENV,
  KARMA_WALLET_PAGE_ID,
  readApiError,
  TKarmaWalletPeriod,
} from './karma-wallet.model'
import { KarmaWalletService } from './karma-wallet.service'
import { IKarmaTourAction, IKarmaTourStep } from './karma-wallet-tour.model'
import { KarmaWalletTourComponent } from './karma-wallet-tour.component'

const ICON_BASE = '/assets/icons/karmawallet-v2'
const MONTH_LABELS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const RECENT_DAYS = 30
const LOOKBACK_YEARS = 1
const END_BEFORE_START = 'The end date cannot be earlier than the start date.'
const HISTORY_ERROR = 'We could not load your coin history. Please try again.'
const SUMMARY_ERROR = 'We could not load your Karma Coin Wallet. Please try again.'
const TOUR_ANCHOR_RETRIES = 40
const TOUR_ANCHOR_INTERVAL = 100
/* the coin-history range pickers must read as DD/MM/YYYY, not the en-US M/D/YYYY default */
export const KARMA_WALLET_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: { day: '2-digit', month: '2-digit', year: 'numeric' },
  },
  display: {
    dateInput: { day: '2-digit', month: '2-digit', year: 'numeric' },
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

@Component({
  selector: 'ws-app-karma-wallet',
  templateUrl: './karma-wallet.component.html',
  styleUrls: ['./karma-wallet.component.scss'],
  standalone: false,
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: KARMA_WALLET_DATE_FORMATS },
  ],
})
export class KarmaWalletComponent implements OnInit, OnDestroy {
  readonly icons = {
    karmaCoin: `${ICON_BASE}/karmacoin.svg`,
    /* TODO: no karmawallet-v2 equivalent supplied yet, so this still resolves from home-v2 */
    karmaPoints: '/assets/icons/home-v2/karma-badge.svg',
  }

  @ViewChild('tour') private tour!: KarmaWalletTourComponent

  private tourDialogRef: MatDialogRef<KarmaRedeemDialogComponent> | null = null

  readonly tourSteps: IKarmaTourStep[] = [
    {
      selector: '.kw__stats',
      title: 'Your Karma stats at a glance',
      body: `<ul>
        <li><b>Wallet Balance</b> - Coins available to redemption on Marketplace courses.</li>
        <li><b>Pending Conversion</b> - Karma Points being converted / pending conversion into coins.</li>
        <li><b>Total Converted</b> - Your lifetime Karma Points converted into Karma Coins.</li>
        <li><b>Unconverted Karma</b> - Karma Points yet to be converted.</li>
      </ul>`,
      placement: 'bottom',
    },
    {
      selector: '.kw__history',
      title: 'Every transaction, tracked',
      body: `View your complete Karma Coin transaction history. Filter by time period or
        transaction type - All, Earned, or Redeemed - to quickly find transactions and track
        your running balance.`,
      placement: 'left',
    },
    {
      selector: '.kw__btn--primary',
      title: 'Redeem Your Karma Coins',
      body: `Use your Karma Coins to redeem courses from the marketplace and unlock new
        learning opportunities.`,
      placement: 'bottom',
      radius: 6,
    },
    {
      selector: '.kw__btn--ghost',
      title: 'Convert Karma Points',
      body: `Whenever you're ready to turn points into spendable coins, click "Convert Karma
        Points." To try it now, press Next to continue the tour.`,
      placement: 'bottom',
      radius: 6,
    },
    {
      selector: '.krd__body',
      title: 'Type an amount to convert',
      body: `Enter how many Karma Points you'd like to convert. "Convertible this month" shows
        your monthly limit of up to 300 KP and how many points are already pending conversion.`,
      placement: 'bottom',
      before: () => this.openConvertDialogForTour(),
      onBack: () => this.closeConvertDialogForTour(),
    },
    {
      selector: '.krd__btn--primary',
      title: 'Confirm the conversion',
      body: `Once value is entered, tap Convert to instantly turn your points into Karma Coins.
        The coins are added immediately and are ready to spend on Marketplace courses.`,
      placement: 'left',
      radius: 6,
    },
  ]

  /* The one place the tabs are mapped onto the transactions request's `type` filter */
  readonly tabs: IKarmaWalletTab[] = [
    { value: 'all', label: 'All', apiType: 'ALL' },
    { value: 'earned', label: 'Earned', apiType: 'CREDIT' },
    { value: 'redeemed', label: 'Redeemed', apiType: 'DEBIT' },
  ]

  /* One per summary card, so the skeleton lays out on the same grid as the real thing */
  readonly skeletonSlots = [0, 1, 2, 3]

  readonly periodOptions: IKarmaWalletPeriodOption[] = [
    { value: 'recent', label: 'Recent' },
    { value: 'currentMonth', label: 'Current Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'last3Months', label: 'Last 3 Months' },
    { value: 'last6Months', label: 'Last 6 Months' },
    { value: 'custom', label: 'Custom Date' },
  ]

  summary: IKarmaWalletSummary = { ...EMPTY_KARMA_WALLET_SUMMARY }

  activeTab: IKarmaWalletTab['value'] = 'all'
  activePeriod: TKarmaWalletPeriod = 'recent'
  groups: IKarmaCoinTxnGroup[] = []
  loading = true
  summaryLoading = true
  summaryError = ''
  customStart: Date | null = null
  customEnd: Date | null = null
  customError = ''

  @ViewChild('customStartPicker') customStartPicker?: MatDatepicker<Date>
  referenceDate = new Date()

  private transactions: IKarmaCoinTransaction[] = []
  private collapsedKeys = new Set<string>()
  private readonly historyRequest$ = new Subject<IKarmaTransactionsRequest>()
  private readonly destroy$ = new Subject<void>()
  private autoStartWalkthrough = false
  private destroyed = false

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private telemetrySvc: TelemetryService,
    private events: EventService,
    private karmaWalletSvc: KarmaWalletService,
    private snackBar: MatSnackBar,
  ) { }

  /* Every API failure on this page is reported here and nowhere else */
  private openSnackbar(primaryMsg: string, duration: number = 5000) {
    this.snackBar.open(primaryMsg, 'X', {
      duration,
    })
  }

  ngOnInit() {
    this.raisePageImpression()
    this.autoStartWalkthrough = this.route.snapshot.queryParamMap.get('walkthrough') === 'true'
    this.startWalkthroughOnce()

    this.fetchSummary()

    this.historyRequest$.pipe(
      switchMap(request => this.karmaWalletSvc.getTransactions(request).pipe(
        catchError(err => {
          this.openSnackbar(readApiError(err) || HISTORY_ERROR)
          return of([] as IKarmaCoinTransaction[])
        }),
      )),
      takeUntil(this.destroy$),
    ).subscribe(transactions => {
      this.transactions = transactions || []
      this.buildGroups()
      this.loading = false
    })

    this.fetchTransactions()
  }

  ngOnDestroy() {
    this.destroyed = true
    this.destroy$.next()
    this.destroy$.complete()
  }

  get activePeriodLabel(): string {
    const selected = this.periodOptions.find(option => option.value === this.activePeriod)
    return selected ? selected.label : ''
  }

  /* Month the conversion figures belong to, e.g. 'August' - the API's yearMonth, not the clock */
  get currentMonthLabel(): string {
    const parts = (this.summary.yearMonth || '').split('-')
    const month = Number(parts[1])
    const index = parts.length === 2 && month >= 1 && month <= 12
      ? month - 1
      : this.referenceDate.getMonth()
    return MONTH_NAMES[index]
  }

  /* Share of this month's cap already converted - what the card's orange bar fills to */
  get conversionProgress(): number {
    if (!this.summary.monthlyCap) {
      return 0
    }
    const ratio = this.summary.convertedThisMonth / this.summary.monthlyCap
    return Math.max(0, Math.min(100, ratio * 100))
  }

  get canRedeem(): boolean {
    return this.summary.redeemEnabled
  }

  get hasTransactions(): boolean {
    return this.groups.some(group => group.transactions.length > 0)
  }

  openKarmaCoinsInfo() {
    this.dialog.open(KarmaCoinsInfoDialogComponent, {
      width: '608px',
      maxWidth: '94vw',
      maxHeight: '90vh',
      autoFocus: false,
      panelClass: 'kci-dialog-panel',
      backdropClass: 'kci-dialog-backdrop',
      scrollStrategy: new NoopScrollStrategy(),
    }).afterClosed().subscribe((closedVia: any) => {
      /* The dialog reports which control dismissed it; fall back if it closed some other way */
      if (closedVia === 'walkthrough') {
        this.startWalkthrough()
      }
    })
  }

  selectTab(tab: IKarmaWalletTab['value']) {
    if (this.activeTab === tab) {
      return
    }
    this.activeTab = tab
    this.fetchTransactions()
  }

  selectPeriod(period: TKarmaWalletPeriod) {
    /* Re-picking Custom Date is how the calendar is reopened, so it is not a no-op */
    if (this.activePeriod === period) {
      if (period === 'custom') {
        this.openCustomStartPicker()
      }
      return
    }
    this.activePeriod = period

    if (period === 'custom') {
      this.startCustomRange()
      return
    }

    this.customError = ''
    this.fetchTransactions()
  }

  get minSelectableDate(): Date {
    const ref = this.referenceDate
    return new Date(ref.getFullYear() - LOOKBACK_YEARS, ref.getMonth(), ref.getDate())
  }

  get maxSelectableDate(): Date {
    return this.referenceDate
  }

  onCustomStartChange(value: Date | null) {
    this.customStart = value
    this.applyCustomRange()
  }

  onCustomEndChange(value: Date | null) {
    this.customEnd = value
    this.applyCustomRange()
  }

  private startCustomRange() {
    if (!this.customStart || !this.customEnd) {
      const ref = this.referenceDate
      this.customStart = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - RECENT_DAYS)
      this.customEnd = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate())
    }
    this.customError = ''
    this.fetchTransactions()
    this.openCustomStartPicker()
  }

  private openCustomStartPicker() {
    /* The fields sit behind an *ngIf, so they do not exist until this change is rendered */
    setTimeout(() => {
      if (this.customStartPicker) {
        this.customStartPicker.open()
      }
    })
  }

  private applyCustomRange() {
    if (!this.customStart || !this.customEnd) {
      this.customError = ''
      return
    }

    if (this.customEnd.getTime() < this.customStart.getTime()) {
      /* Same day at both ends is a valid one-day range; only a true inversion is refused */
      this.customError = END_BEFORE_START
      this.groups = []
      return
    }

    this.customError = ''
    this.fetchTransactions()
  }

  toggleGroup(group: IKarmaCoinTxnGroup) {
    group.expanded = !group.expanded
    if (group.expanded) {
      this.collapsedKeys.delete(group.key)
    } else {
      this.collapsedKeys.add(group.key)
    }
  }

  viewUnredeemedKarmaPoints() {
    this.raiseClick('view-more', 'unconverted-karma')
    this.router.navigate(['/app/person-profile/karma-points'], {
      queryParams: { from: 'karma-wallet' },
    })
  }
  private startWalkthroughOnce() {
    if (!this.autoStartWalkthrough) {
      return
    }
    this.autoStartWalkthrough = false
    this.awaitTourAnchor(0)
  }
  private awaitTourAnchor(attempt: number) {
    if (this.destroyed) {
      return
    }
    const selector = this.tourSteps.length ? this.tourSteps[0].selector : ''
    if (selector && this.tour && document.querySelector(selector)) {
      this.clearWalkthroughParam()
      this.startWalkthrough()
      return
    }
    if (attempt >= TOUR_ANCHOR_RETRIES) {
      return
    }
    setTimeout(() => this.awaitTourAnchor(attempt + 1), TOUR_ANCHOR_INTERVAL)
  }

  private clearWalkthroughParam() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { walkthrough: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    })
  }

  startWalkthrough() {
    this.raiseWalkthroughClick()
    this.tour.start(this.tourSteps)
  }

  private raiseWalkthroughClick() {
    this.raiseClick('start-walkthrough', 'what-is-karma-coins')
  }

  onTourAction(event: IKarmaTourAction) {
    this.raiseGuidedTourClick(`step-${event.step}-${event.action}`)
  }

  private raiseGuidedTourClick(id: string) {
    this.raiseClick(id, 'guided-tour')
  }

  private raiseClick(id: string, subType?: string) {
    const edata: WsEvents.ITelemetryEdata = {
      id,
      type: WsEvents.EnumInteractTypes.CLICK,
    }
    if (subType) {
      edata.subType = subType
    }
    this.events.dispatchEvent<WsEvents.IWsEventTelemetryInteract>({
      eventType: WsEvents.WsEventType.Telemetry,
      eventLogLevel: WsEvents.WsEventLogLevel.Info,
      data: {
        edata,
        eventSubType: WsEvents.EnumTelemetrySubType.Interact,
        object: {},
        pageContext: { pageId: KARMA_WALLET_PAGE_ID },
      },
      pageContext: { module: KARMA_WALLET_ENV },
      from: '',
      to: 'Telemetry',
    })
  }

  private raisePageImpression() {
    const pData = this.telemetrySvc.pData || {}
    try {
      $t.impression(
        {
          pageid: KARMA_WALLET_PAGE_ID,
          type: 'page',
          uri: KARMA_WALLET_PAGE_ID,
        },
        {
          context: {
            pdata: { ...pData, id: pData.id },
            env: KARMA_WALLET_ENV,
          },
          object: {},
        },
      )
    } catch (err) {
    }
  }

  onTourFinished() {
    this.closeConvertDialogForTour()
  }

  private openConvertDialogForTour(): Promise<void> {
    if (this.tourDialogRef) {
      return Promise.resolve()
    }
    this.tourDialogRef = this.openRedeemDialog()
    return new Promise<void>(resolve => {
      this.tourDialogRef!.afterOpened().subscribe(() => resolve())
    })
  }

  private closeConvertDialogForTour(): Promise<void> {
    if (!this.tourDialogRef) {
      return Promise.resolve()
    }
    const ref = this.tourDialogRef
    this.tourDialogRef = null
    return new Promise<void>(resolve => {
      ref.afterClosed().subscribe(() => resolve())
      ref.close()
    })
  }

  redeemKarmaPoints() {
    if (!this.canRedeem) {
      return
    }
    this.raiseClick('convert-karma-points')
    this.openRedeemDialog()
  }

  private openRedeemDialog(): MatDialogRef<KarmaRedeemDialogComponent> {
    const ref = this.dialog.open(KarmaRedeemDialogComponent, {
      data: { summary: this.summary },
      width: '652px',
      maxWidth: '94vw',
      maxHeight: '90vh',
      autoFocus: false,
      panelClass: 'krd-dialog-panel',
      backdropClass: 'krd-dialog-backdrop',
      disableClose: true,
      scrollStrategy: new NoopScrollStrategy(),
    })
    ref.afterClosed().subscribe((result: any) => {
      const outcome = result && result.redeemed
        ? 'convert'
        : (result && result.pending ? 'pending' : 'cancel')
      if (outcome !== 'cancel') {
        this.fetchSummary()
        this.fetchTransactions()
      }
    })
    return ref
  }

  useKarmaCoins() {
    this.raiseClick('redeem-karma-coins')
    this.router.navigate(['/app/seeAll'], {
      queryParams: { key: 'karmaTracks', tabSelected: 'Providers' },
    })
  }
  retrySummary() {
    this.fetchSummary()
  }

  private fetchSummary() {
    this.summaryLoading = true
    this.summaryError = ''
    this.karmaWalletSvc.getWalletSummary().pipe(
      takeUntil(this.destroy$),
    ).subscribe({
      next: summary => {
        this.summary = summary
        this.summaryLoading = false
      },
      error: err => {
        const message = readApiError(err) || SUMMARY_ERROR
        this.summaryError = message
        this.openSnackbar(message)
        this.summaryLoading = false
      },
    })
  }

  /* Asks the API for the active tab over the active period */
  private fetchTransactions() {
    this.loading = true
    this.historyRequest$.next(this.transactionRequest())
  }

  private transactionRequest(): IKarmaTransactionsRequest {
    const tab = this.tabs.find(option => option.value === this.activeTab)
    return {
      request: {
        ...this.periodWindow(),
        type: tab ? tab.apiType : 'ALL',
      },
    }
  }

  /* Always a complete window: the endpoint rejects a request missing either bound */
  private periodWindow(): { startDate: string, endDate: string } {
    const ref = this.referenceDate
    const monthStart = (monthsBack: number) =>
      new Date(ref.getFullYear(), ref.getMonth() - monthsBack, 1)
    /* Day 0 of a month is the last day of the one before it */
    const monthEnd = (monthsBack: number) =>
      new Date(ref.getFullYear(), ref.getMonth() - monthsBack + 1, 0)
    const window = (start: Date, end: Date) =>
      ({ startDate: this.toApiDate(start), endDate: this.toApiDate(end) })

    switch (this.activePeriod) {
      case 'currentMonth':
        return window(monthStart(0), ref)
      case 'lastMonth':
        return window(monthStart(1), monthEnd(1))
      case 'last3Months':
        return window(monthStart(3), monthEnd(1))
      case 'last6Months':
        return window(monthStart(6), monthEnd(1))
      /* Recent: a rolling 30 days through today, both ends inclusive */
      case 'custom':
      default: {
        if (this.activePeriod === 'custom' && this.customStart && this.customEnd) {
          return window(this.customStart, this.customEnd)
        }
        const start = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - RECENT_DAYS)
        return window(start, ref)
      }
    }
  }

  /* 'YYYY-MM-DD' from the local date parts - toISOString would shift the day westward */
  private toApiDate(date: Date): string {
    const month = `${date.getMonth() + 1}`.padStart(2, '0')
    const day = `${date.getDate()}`.padStart(2, '0')
    return `${date.getFullYear()}-${month}-${day}`
  }

  /* Tab and period are applied by the API now, so this only groups what came back */
  private buildGroups() {
    const grouped = new Map<string, IKarmaCoinTxnGroup>()
    this.transactions.forEach(txn => {
      const date = new Date(txn.date)
      const key = `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}`
      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          label: `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`,
          expanded: !this.collapsedKeys.has(key),
          transactions: [],
        })
      }
      const group = grouped.get(key)
      if (group) {
        group.transactions.push(txn)
      }
    })

    /* Always newest-first; the dropdown now narrows the period rather than flipping order */
    const groups = Array.from(grouped.values())
    groups.sort((a, b) => a.key < b.key ? 1 : (a.key > b.key ? -1 : 0))
    groups.forEach(group => {
      group.transactions.sort((a, b) => a.date < b.date ? 1 : (a.date > b.date ? -1 : 0))
    })
    this.groups = groups
  }
}
