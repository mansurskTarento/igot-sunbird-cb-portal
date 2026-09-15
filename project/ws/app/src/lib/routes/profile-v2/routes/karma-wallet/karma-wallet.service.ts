import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import {
  IKarmaCoinTransaction,
  IKarmaCoinTransactionApi,
  IKarmaRedeemAcceptedResponse,
  IKarmaRedeemRequest,
  IKarmaRedeemStatusResponse,
  IKarmaRedeemStatusResult,
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
  WALLET_REDEEM_STATUS: `${WALLET_BASE}/redeem/status`,
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

  redeem(request: IKarmaRedeemRequest): Observable<IKarmaRedeemAcceptedResponse['result']> {
    return this.http.post<IKarmaRedeemAcceptedResponse>(
      API_END_POINTS.WALLET_REDEEM, request).pipe(
      map(response => response.result),
    )
  }

  getRedeemStatus(requestId: string): Observable<IKarmaRedeemStatusResult> {
    return this.http.get<IKarmaRedeemStatusResponse>(
      `${API_END_POINTS.WALLET_REDEEM_STATUS}/${requestId}`).pipe(
      map(response => response.result),
    )
  }
}


const ACTION_TITLES: { [actionType: string]: string } = {
  POINTS_REDEMPTION: 'Karma Points Redemption',
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

/* The secondary line under the title, assembled from contextType and the addinfo extras */
function descriptionFor(txn: IKarmaCoinTransactionApi): string {
  const info = parseAddInfo(txn.addinfo)
  switch (txn.contextType) {
    case 'POINTS_CONVERSION':
      return info.pointsUsed === undefined
        ? 'Converted Karma Points to Karma Coins'
        : `Converted ${info.pointsUsed} Karma Points to Karma Coins`
    case 'MARKETPLACE_COURSE': {
      const course = info.courseName || ''
      return info.providerName ? `${course} — Provider: ${info.providerName}` : course
    }
    /* Unknown contexts still have a name to show more often than not */
    default:
      return info.courseName || info.eventName || info.contentName || ''
  }
}

export function toCoinRow(txn: IKarmaCoinTransactionApi): IKarmaCoinTransaction {
  const isCredit = txn.type === 'CREDIT'
  return {
    transactionId: txn.transactionId,
    date: txn.date,
    title: titleFor(txn.actionType),
    description: descriptionFor(txn),
    credit: isCredit ? txn.amount : 0,
    debit: isCredit ? 0 : txn.amount,
    balance: txn.balanceAfter,
    type: isCredit ? 'earned' : 'redeemed',
  }
}
