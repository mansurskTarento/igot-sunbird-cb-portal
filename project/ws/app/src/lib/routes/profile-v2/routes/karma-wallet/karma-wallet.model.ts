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

export interface IKarmaRedeemAcceptedResponse {
  responseCode: string
  result: {
    requestId: string
    status: TKarmaRedeemStatus
  }
}

export interface IKarmaRedeemStatusResult {
  requestId: string
  status: TKarmaRedeemStatus
  /* SUCCESS only */
  transactionId?: string
  pointsConverted?: number
  /* FAILED only */
  errorCode?: string
  errorMessage?: string
}

export interface IKarmaRedeemStatusResponse {
  responseCode: string
  result: IKarmaRedeemStatusResult
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
}

export interface IKarmaTransactionsResponse {
  responseCode: string
  result: {
    transactions: IKarmaCoinTransactionApi[]
  }
}

export interface IKarmaCoinTransaction {
  transactionId: string
  /* Epoch milliseconds, straight off the API */
  date: number
  /* Primary label, e.g. 'Event Attendance' */
  title: string
  /* Secondary label, e.g. 'Karmayogi Talks — Evidence-based policy' */
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
