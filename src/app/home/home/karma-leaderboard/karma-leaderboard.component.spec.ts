import { TestBed } from '@angular/core/testing'
import { of } from 'rxjs'
import { EnrollmentSummaryStateService } from '@sunbird-cb/collection/src/lib/_services/enrollment-summary-state.service'
import { KarmaLeaderboardComponent } from './karma-leaderboard.component'

describe('KarmaLeaderboardComponent', () => {
  let component: KarmaLeaderboardComponent
  let summaryState: EnrollmentSummaryStateService
  let getItemSpy: jest.SpyInstance

  const homePageSvc = { getLearnerLeaderboardCached: jest.fn(() => of({ result: { result: [] } })) }
  const configSvc = { unMappedUser: { id: 'user-1', profileDetails: {} } }
  const eventSvc = { raiseInteractTelemetry: jest.fn() }

  const storeSummary = (karmaPoints: number) => {
    const raw = JSON.stringify({ userCourseEnrolmentInfo: { karmaPoints } })
    getItemSpy.mockImplementation((key: string) => (key === 'userEnrollmentCount' ? raw : null))
  }

  beforeEach(() => {
    summaryState = new EnrollmentSummaryStateService()
    // jsdom's localStorage swallows property assignment, so spy on the prototype instead
    getItemSpy = jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
    // the component injects DestroyRef, which needs an injection context
    component = TestBed.runInInjectionContext(() => new KarmaLeaderboardComponent(
      homePageSvc as any, configSvc as any, {} as any, eventSvc as any, summaryState,
    ))
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should show the karma points skeleton while the summary is loading', () => {
    summaryState.start()
    component.ngOnInit()

    expect(component.summaryLoading).toBe(true)
  })

  it('should read the karma points once the summary lands', () => {
    summaryState.start()
    component.ngOnInit()
    storeSummary(250)
    summaryState.done()

    expect(component.summaryLoading).toBe(false)
    expect(component.myKarmaPoints).toBe(250)
  })

  it('should read straight away when no summary fetch is in flight', () => {
    storeSummary(40)
    component.ngOnInit()

    expect(component.summaryLoading).toBe(false)
    expect(component.myKarmaPoints).toBe(40)
  })

  it('should re-read when the summary is fetched again later', () => {
    storeSummary(40)
    component.ngOnInit()
    summaryState.start()
    expect(component.summaryLoading).toBe(true)

    storeSummary(90)
    summaryState.done()
    expect(component.myKarmaPoints).toBe(90)
  })

  it('should fall back to 0 when nothing is stored', () => {
    component.ngOnInit()

    expect(component.myKarmaPoints).toBe(0)
    expect(component.summaryLoading).toBe(false)
  })

  it('should ignore a corrupt stored summary', () => {
    getItemSpy.mockImplementation((key: string) => (key === 'userEnrollmentCount' ? '{not json' : null))
    component.ngOnInit()

    expect(component.myKarmaPoints).toBe(0)
    expect(component.summaryLoading).toBe(false)
  })
})
