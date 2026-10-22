import { of } from 'rxjs'
import { API_END_POINTS, KarmaWalletService, toCoinRow } from './karma-wallet.service'
import { IKarmaCoinTransactionApi } from './karma-wallet.model'

/**
 * The two rows the transactions endpoint documents, verbatim. The dev account has no history,
 * so this payload is the only check that the row adapter reads a real response correctly.
 */
const RESPONSE_ROWS: IKarmaCoinTransactionApi[] = [
  {
    transactionId: 'TXN-000027',
    date: 1724745000000,
    type: 'CREDIT',
    amount: 300,
    balanceAfter: 792,
    actionType: 'POINTS_REDEMPTION',
    contextType: 'POINTS_CONVERSION',
    contextId: 'req-abc123',
    addinfo: '{"pointsUsed":300,"ratio":"1:1"}',
  },
  {
    transactionId: 'TXN-000028',
    date: 1724745000000,
    type: 'DEBIT',
    amount: 40,
    balanceAfter: 752,
    actionType: 'COURSE_ENROLLMENT',
    contextType: 'MARKETPLACE_COURSE',
    contextId: 'ext_11443840659823001611',
    addinfo: '{"courseName":"Understanding AI from MIT","providerName":"MIT OpenCourseWare"}',
  },
]

describe('toCoinRow against a live transactions payload', () => {

  it('should read a credit as an earned row, spelling out the conversion from addinfo', () => {
    expect(toCoinRow(RESPONSE_ROWS[0])).toEqual({
      transactionId: 'TXN-000027',
      date: 1724745000000,
      status: undefined,
      amount: 300,
      pointsToConvert: undefined,
      title: 'Karma Coins Redeemption',
      description: 'Converted 300 Karma Points to Karma Coins',
      credit: 300,
      debit: 0,
      balance: 792,
      type: 'earned',
    })
  })

  it('should read a debit as a redeemed row, naming the course and its provider', () => {
    expect(toCoinRow(RESPONSE_ROWS[1])).toEqual({
      transactionId: 'TXN-000028',
      date: 1724745000000,
      status: undefined,
      amount: 40,
      pointsToConvert: undefined,
      title: 'Marketplace Course Purchase',
      description: 'MIT OpenCourseWare - Understanding AI from MIT',
      credit: 0,
      debit: 40,
      balance: 752,
      type: 'redeemed',
    })
  })

  it('should survive an addinfo that is absent or not JSON', () => {
    const broken = { ...RESPONSE_ROWS[1], addinfo: 'not json at all' }
    expect(toCoinRow(broken).description).toBe('')
    const missing = { ...RESPONSE_ROWS[1], addinfo: '' }
    expect(toCoinRow(missing).description).toBe('')
  })

  it('should carry the course name an in-progress redemption sends at the top level', () => {
    const inProgress = {
      ...RESPONSE_ROWS[1], addinfo: '', status: 'IN_PROGRESS', courseName: 'AI-Powered Retail Operations',
    }
    expect(toCoinRow(inProgress).courseName).toBe('AI-Powered Retail Operations')
  })

  it('should title-case an actionType it has no mapping for', () => {
    const unknown = { ...RESPONSE_ROWS[0], actionType: 'SOME_NEW_ACTION' }
    expect(toCoinRow(unknown).title).toBe('Some New Action')
  })
})

describe('KarmaWalletService', () => {
  let http: any
  let service: KarmaWalletService

  beforeEach(() => {
    http = { get: jest.fn(), post: jest.fn() }
    service = new KarmaWalletService(http)
  })

  it('should unwrap the result of the wallet summary response', done => {
    http.get.mockReturnValue(of({ result: { walletBalance: 10 } }))

    service.getWalletSummary().subscribe(summary => {
      expect(http.get).toHaveBeenCalledWith(API_END_POINTS.WALLET_SUMMARY)
      expect(summary).toEqual({ walletBalance: 10 })
      done()
    })
  })

  it('should post the request and adapt each transaction row', done => {
    const request: any = { request: { type: 'ALL', startDate: '2026-08-01', endDate: '2026-08-26' } }
    http.post.mockReturnValue(of({ result: { transactions: [RESPONSE_ROWS[1]] } }))

    service.getTransactions(request).subscribe(rows => {
      expect(http.post).toHaveBeenCalledWith(API_END_POINTS.WALLET_TRANSACTIONS, request)
      expect(rows.length).toBe(1)
      expect(rows[0].type).toBe('redeemed')
      done()
    })
  })

  it('should return no rows when the response carries no result or transactions', done => {
    http.post.mockReturnValueOnce(of({}))
    http.post.mockReturnValueOnce(of({ result: {} }))
    const request: any = { request: {} }

    service.getTransactions(request).subscribe(first => {
      expect(first).toEqual([])
      service.getTransactions(request).subscribe(second => {
        expect(second).toEqual([])
        done()
      })
    })
  })

  it('should patch the profile details through the extPatch endpoint', done => {
    http.post.mockReturnValue(of({ ok: true }))

    service.updateProfileDetails({ a: 1 }).subscribe(res => {
      expect(http.post).toHaveBeenCalledWith(API_END_POINTS.UPDATE_PROFILE_DETAILS, { a: 1 })
      expect(res).toEqual({ ok: true })
      done()
    })
  })

  it('should unwrap the result of the redeem response', done => {
    http.post.mockReturnValue(of({ result: { requestId: 'req-1', status: 'SUCCESS' } }))
    const request: any = { request: { requestId: 'req-1', pointsToConvert: 5 } }

    service.redeem(request).subscribe(result => {
      expect(http.post).toHaveBeenCalledWith(API_END_POINTS.WALLET_REDEEM, request)
      expect(result).toEqual({ requestId: 'req-1', status: 'SUCCESS' })
      done()
    })
  })

  it('should describe a conversion row without a points figure, and a provider-only row', () => {
    const conversion = { ...RESPONSE_ROWS[0], addinfo: '' }
    expect(toCoinRow(conversion).description).toBe('Converted Karma Points to Karma Coins')
    const providerOnly = { ...RESPONSE_ROWS[1], addinfo: '{"providerName":"MIT"}' }
    expect(toCoinRow(providerOnly).description).toBe('MIT')
    const converted = { ...RESPONSE_ROWS[0], addinfo: '{"pointsConverted":7}' }
    expect(toCoinRow(converted).description).toBe('Converted 7 Karma Points to Karma Coins')
  })
})
