import { toCoinRow } from './karma-wallet.service'
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
      title: 'Karma Points Redemption',
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
      title: 'Marketplace Course Purchase',
      description: 'Understanding AI from MIT — Provider: MIT OpenCourseWare',
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

  it('should title-case an actionType it has no mapping for', () => {
    const unknown = { ...RESPONSE_ROWS[0], actionType: 'SOME_NEW_ACTION' }
    expect(toCoinRow(unknown).title).toBe('Some New Action')
  })
})
