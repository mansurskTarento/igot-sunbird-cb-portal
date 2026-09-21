import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import {
  IKarmaCoinTransaction,
  IKarmaCoinTransactionApi,
  IKarmaRedeemAcceptedResponse,
  IKarmaRedeemRequest,
  IKarmaTransactionsRequest,
  IKarmaTransactionsResponse,
  IKarmaWalletSummary,
  IKarmaWalletSummaryResponse,
} from './karma-wallet.model'

const WALLET_BASE = '/apis/proxies/v8/karmawallet/v1'

export const API_END_POINTS = {
  WALLET_SUMMARY: `${WALLET_BASE}/summary`,
  WALLET_TRANSACTIONS: `${WALLET_BASE}/transactions`,
  WALLET_REDEEM: `${WALLET_BASE}/redeem`,
  UPDATE_PROFILE_DETAILS: '/apis/proxies/v8/user/v1/extPatch',
}

@Injectable()
export class KarmaWalletService {

  constructor(readonly http: HttpClient) { }

  getWalletSummary(): Observable<IKarmaWalletSummary> {
    return this.http.get<IKarmaWalletSummaryResponse>(API_END_POINTS.WALLET_SUMMARY).pipe(
      map(response => response.result),
    )
  }

  getTransactions(request: IKarmaTransactionsRequest): Observable<IKarmaCoinTransaction[]> {
    return this.http.post<IKarmaTransactionsResponse>(
      API_END_POINTS.WALLET_TRANSACTIONS, request).pipe(
      map(response => ((response.result && response.result.transactions) || []).map(toCoinRow)),
    )
  }

  updateProfileDetails(request: any): Observable<any> {
    return this.http.post<any>(API_END_POINTS.UPDATE_PROFILE_DETAILS, request)
  }

  redeem(request: IKarmaRedeemRequest): Observable<IKarmaRedeemAcceptedResponse['result']> {
    return this.http.post<IKarmaRedeemAcceptedResponse>(
      API_END_POINTS.WALLET_REDEEM, request).pipe(
      map(response => response.result),
    )
  }
}

const ACTION_TITLES: { [actionType: string]: string } = {
  POINTS_REDEMPTION: 'Karma Coins Redeemption',
  POINTS_CONVERSION: 'Karma Points Conversion',
  COURSE_ENROLLMENT: 'Marketplace Course Purchase',
  COURSE_COMPLETION: 'Course Completion',
  EVENT_ATTENDANCE: 'Event Attendance',
}

/* 'POINTS_REDEMPTION' -> 'Points Redemption', so a new action type never renders as an enum */
function titleFor(actionType: string): string {
  if (ACTION_TITLES[actionType]) {
    return ACTION_TITLES[actionType]
  }
  return (actionType || '')
    .split('_')
    .filter(word => !!word)
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
}

/* `addinfo` arrives as a JSON string; a missing or malformed one must not take the row down */
function parseAddInfo(raw: string): { [key: string]: any } {
  if (!raw) {
    return {}
  }
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch (err) {
    return {}
  }
}

function descriptionFor(txn: IKarmaCoinTransactionApi): string {
  const info = parseAddInfo(txn.addinfo)
  const points = info.pointsConverted === undefined ? info.pointsUsed : info.pointsConverted
  if (points !== undefined || txn.contextType === 'POINTS_CONVERSION') {
    return points === undefined
      ? 'Converted Karma Points to Karma Coins'
      : `Converted ${points} Karma Points to Karma Coins`
  }
  const provider = info.providerName || ''
  const course = info.courseName || info.eventName || info.contentName || ''
  if (provider && course) {
    return `${provider} - ${course}`
  }
  return provider || course
}

export function toCoinRow(txn: IKarmaCoinTransactionApi): IKarmaCoinTransaction {
  const isCredit = txn.type === 'CREDIT'
  const info = parseAddInfo(txn.addinfo)
  return {
    transactionId: txn.transactionId,
    date: txn.date,
    status: txn.status || info.status,
    amount: txn.amount,
    pointsToConvert: txn.pointsToConvert,
    pointsConverted: info.pointsConverted,
    title: titleFor(txn.actionType),
    description: descriptionFor(txn),
    credit: isCredit ? txn.amount : 0,
    debit: isCredit ? 0 : txn.amount,
    balance: txn.balanceAfter,
    type: isCredit ? 'earned' : 'redeemed',
  }
}
