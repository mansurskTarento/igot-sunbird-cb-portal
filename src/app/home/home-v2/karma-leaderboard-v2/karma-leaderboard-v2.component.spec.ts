import { TestBed } from '@angular/core/testing'
import { of } from 'rxjs'
import { ConfigurationsService, EventService, TelemetryService, UtilityService } from '@sunbird-cb/utils-v2'
import { EnrollmentSummaryStateService } from '@sunbird-cb/collection/src/lib/_services/enrollment-summary-state.service'
import { HomePageService } from '../../../services/home-page.service'
import { UserProfileService } from '../../../../../project/ws/app/src/lib/routes/user-profile/services/user-profile.service'
import { KarmaLeaderboardV2Component } from './karma-leaderboard-v2.component'

describe('KarmaLeaderboardV2Component', () => {
  let component: KarmaLeaderboardV2Component
  let summaryState: EnrollmentSummaryStateService
  let getItemSpy: jest.SpyInstance

  const storeSummary = (karmaPoints: number, walletBalance: number) => {
    const raw = JSON.stringify({ userCourseEnrolmentInfo: { karmaPoints, walletBalance } })
    getItemSpy.mockImplementation((key: string) => (key === 'userEnrollmentCount' ? raw : null))
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: HomePageService, useValue: { getLearnerLeaderboardCached: jest.fn(() => of({ result: { result: [] } })) } },
        { provide: ConfigurationsService, useValue: { unMappedUser: { id: 'user-1', profileDetails: {} }, instanceConfig: {} } },
        { provide: UserProfileService, useValue: {} },
        { provide: EventService, useValue: { raiseInteractTelemetry: jest.fn() } },
        { provide: TelemetryService, useValue: { sendEmptyObjectForNextInteract: jest.fn() } },
        { provide: UtilityService, useValue: { setRouteData: jest.fn() } },
      ],
    })
    summaryState = TestBed.inject(EnrollmentSummaryStateService)
    // jsdom's localStorage swallows property assignment, so spy on the prototype instead
    getItemSpy = jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
    component = TestBed.runInInjectionContext(() => new KarmaLeaderboardV2Component())
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should show the karma points and coins skeleton while the summary is loading', () => {
    summaryState.start()
    component.ngOnInit()

    expect(component.summaryLoading).toBe(true)
  })

  it('should read karma points and coins once the summary lands', () => {
    summaryState.start()
    component.ngOnInit()
    storeSummary(300, 75)
    summaryState.done()

    expect(component.summaryLoading).toBe(false)
    expect(component.myKarmaPoints).toBe(300)
    expect(component.myKarmaCoins).toBe(75)
  })

  it('should re-read when the summary is fetched again later', () => {
    storeSummary(10, 1)
    component.ngOnInit()
    summaryState.start()
    expect(component.summaryLoading).toBe(true)

    storeSummary(20, 2)
    summaryState.done()
    expect(component.myKarmaPoints).toBe(20)
    expect(component.myKarmaCoins).toBe(2)
  })

  it('should fall back to 0 when nothing is stored', () => {
    component.ngOnInit()

    expect(component.myKarmaPoints).toBe(0)
    expect(component.myKarmaCoins).toBe(0)
  })

  it('should ignore a corrupt stored summary', () => {
    getItemSpy.mockImplementation((key: string) => (key === 'userEnrollmentCount' ? '{not json' : null))
    component.ngOnInit()

    expect(component.myKarmaPoints).toBe(0)
    expect(component.summaryLoading).toBe(false)
  })
})
