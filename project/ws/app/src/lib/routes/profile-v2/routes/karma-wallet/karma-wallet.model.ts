import { v4 as uuid } from 'uuid'

export type TKarmaCoinTxnType = 'earned' | 'redeemed'
export const KARMA_CONVERSION_RATE = 1

/* Telemetry identity for the whole wallet feature - the page and its dialogs all report
   these, so they live here rather than in one component. */
export const KARMA_WALLET_PAGE_ID = 'app/person-profile/karma-wallet'
export const KARMA_WALLET_ENV = 'Karma Wallet'

export interface IKarmaWalletSummary {
  walletBalance: number
  totalRedeemed: number
  totalEarnedTillDate: number
  totalKarmaPoints: number
  unredeemedKarmaPoints: number
  yearMonth: string
  monthlyCap: number
  convertedThisMonth: number
  convertibleThisMonth: number
  capResetsOn: string
  redeemEnabled: boolean
}

export interface IKarmaWalletSummaryResponse {
  responseCode: string
  result: IKarmaWalletSummary
}

export type TKarmaRedeemStatus = 'PROCESSING' | 'SUCCESS' | 'FAILED'

export interface IKarmaRedeemRequestBody {
  pointsToConvert: number
  requestId: string
}

export interface IKarmaRedeemRequest {
  request: IKarmaRedeemRequestBody
}

/* What the wallet page hands the convert dialog, so the dialog need not refetch the summary */
export interface IKarmaRedeemDialogData {
  summary: IKarmaWalletSummary
}

/* The redeem call answers with the outcome itself - there is no status endpoint to poll */
export interface IKarmaRedeemResult {
  requestId: string
  status: TKarmaRedeemStatus
  /* SUCCESS only */
  transactionId?: string
  pointsConverted?: number
  /* FAILED only */
  errorCode?: string
  errorMessage?: string
}

export interface IKarmaRedeemAcceptedResponse {
  responseCode: string
  result: IKarmaRedeemResult
}

export interface IKarmaApiRejection {
  responseCode: string
  params: {
    err: string
    errmsg: string
  }
}

export function newRequestId(): string {
  return uuid()
}

export function readApiError(err: any): string {
  const body = (err && err.error) || err
  if (!body) {
    return ''
  }
  if (body.params && body.params.errmsg) {
    return body.params.errmsg
  }
  return body.errorMessage || ''
}

export type TKarmaTxnDirection = 'CREDIT' | 'DEBIT'

export type TKarmaTxnFilter = 'ALL' | TKarmaTxnDirection

export interface IKarmaTransactionsRequestBody {
  startDate: string
  endDate: string
  type: TKarmaTxnFilter
}

/* The endpoint wraps its body in `request`, as the platform's POST APIs do */
export interface IKarmaTransactionsRequest {
  request: IKarmaTransactionsRequestBody
}

/* One row exactly as the API returns it */
export interface IKarmaCoinTransactionApi {
  transactionId: string
  date: number
  type: TKarmaTxnDirection
  amount: number
  balanceAfter: number
  actionType: string
  contextType: string
  contextId: string
  addinfo: string
  /* 'IN_PROGRESS' while a conversion has not settled; absent on completed rows */
  status?: string
  /* POINTS_CONVERSION only: the Karma Points side of the conversion */
  pointsToConvert?: number
}

export interface IKarmaTransactionsResponse {
  responseCode: string
  result: {
    transactions: IKarmaCoinTransactionApi[]
  }
}

export const TXN_STATUS_IN_PROGRESS = 'IN_PROGRESS'
export const TXN_STATUS_FAILED = 'FAILED'
export const TXN_STATUS_SUCCESS = 'SUCCESS'

/* the api spells these back in mixed case ('Failed', 'FAILED', 'failed'), so compare folded */
export function isTxnStatus(status: any, expected: string): boolean {
  return `${status || ''}`.trim().toUpperCase() === expected
}

export interface IKarmaCoinTransaction {
  transactionId: string
  date: number
  status?: string
  amount: number
  pointsToConvert?: number
  pointsConverted?: number
  title: string
  description: string
  credit: number
  debit: number
  balance: number
  type: TKarmaCoinTxnType
}

export interface IKarmaCoinTxnGroup {
  /* Sort/group key, e.g. '2026-08' */
  key: string
  /* Display label, e.g. 'AUG 2026' */
  label: string
  expanded: boolean
  transactions: IKarmaCoinTransaction[]
}

export type TKarmaWalletPeriod =
  'recent' | 'currentMonth' | 'lastMonth' | 'last3Months' | 'last6Months' | 'custom'

export interface IKarmaWalletPeriodOption {
  value: TKarmaWalletPeriod
  label: string
}

export interface IKarmaWalletTab {
  value: 'all' | TKarmaCoinTxnType
  label: string
  /* What the transactions request sends for this tab */
  apiType: TKarmaTxnFilter
}

/* Zeroed summary the components hold until the API responds */
export const EMPTY_KARMA_WALLET_SUMMARY: IKarmaWalletSummary = {
  walletBalance: 0,
  totalRedeemed: 0,
  totalEarnedTillDate: 0,
  totalKarmaPoints: 0,
  unredeemedKarmaPoints: 0,
  yearMonth: '',
  monthlyCap: 0,
  convertedThisMonth: 0,
  convertibleThisMonth: 0,
  capResetsOn: '',
  redeemEnabled: false,
}
