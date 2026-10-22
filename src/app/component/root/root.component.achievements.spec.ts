import { signal } from '@angular/core'
import { EnrollmentSummaryStateService } from '@sunbird-cb/collection/src/lib/_services/enrollment-summary-state.service'
import { RootComponent } from './root.component'

/**
 * The My Achievements sidebar section is filled from the enrolment summary, which InitService
 * loads in the background. RootComponent's constructor needs ~25 services, none of which these
 * methods touch, so the instance is built off the prototype with only the state they use.
 */
describe('RootComponent - My Achievements from the background enrolment summary', () => {
  let component: any
  let summaryState: EnrollmentSummaryStateService
  let getItemSpy: jest.SpyInstance

  const achievementsSection = () => ({
    sectionKey: 'my_achievements',
    items: [
      { code: 'learning_hours', value: '' },
      { code: 'badges', value: '' },
      { code: 'karma_points', value: '' },
      { code: 'karma_coins', value: '' },
      { code: 'rank', value: '' },
      { code: 'hidden', value: '', enabled: false },
    ],
  })

  const storeSummary = (info: any) => {
    const raw = JSON.stringify({ userCourseEnrolmentInfo: info })
    getItemSpy.mockImplementation((key: string) => (key === 'userEnrollmentCount' ? raw : null))
  }

  const sidebarSection = () => component.menuBarDetails.navSections
    .find((section: any) => section.sectionKey === 'my_achievements')

  beforeEach(() => {
    summaryState = new EnrollmentSummaryStateService()
    // jsdom's localStorage swallows property assignment, so spy on the prototype instead
    getItemSpy = jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)

    component = Object.create(RootComponent.prototype)
    component.enrollmentSummaryState = summaryState
    component.menuBarDetails = { navSections: [achievementsSection(), { sectionKey: 'quick_actions' }] }
    component.detailsChanged = signal(false)
    component.leftNavBarIsOpen = signal(true)
    // the rank comes off the leaderboard API, which is out of scope here
    component.achievementRankRequested = true
  })

  afterEach(() => {
    component.achievementsSummarySub?.unsubscribe()
    jest.restoreAllMocks()
  })

  it('should show the section as a skeleton while the summary is loading', () => {
    summaryState.start()
    component.setAchivements()

    expect(sidebarSection().sectionLoading).toBe(true)
  })

  it('should fill the section once the summary lands', () => {
    summaryState.start()
    component.setAchivements()
    storeSummary({ timeSpentOnCompletedCourses: 5400, badgeCount: 3, karmaPoints: 120, walletBalance: 45 })
    summaryState.done()

    const section = sidebarSection()
    const value = (code: string) => section.items.find((item: any) => item.code === code).value
    expect(section.sectionLoading).toBe(false)
    expect(value('learning_hours')).toBe('1h 30m')
    expect(value('badges')).toBe('3 Badges')
    expect(value('karma_points')).toBe('120 Karma Points')
    expect(value('karma_coins')).toBe('45 Karma Coins')
    expect(section.items.some((item: any) => item.code === 'hidden')).toBe(false)
  })

  it('should go back to a skeleton and refill when the summary is fetched again', () => {
    storeSummary({ karmaPoints: 10 })
    component.setAchivements()
    summaryState.start()
    expect(sidebarSection().sectionLoading).toBe(true)

    storeSummary({ karmaPoints: 99 })
    summaryState.done()
    const karma = sidebarSection().items.find((item: any) => item.code === 'karma_points')
    expect(sidebarSection().sectionLoading).toBe(false)
    expect(karma.value).toBe('99 Karma Points')
  })

  it('should toggle detailsChanged so the sidebar picks up each update', () => {
    summaryState.start()
    component.setAchivements()
    const afterSkeleton = component.detailsChanged()
    summaryState.done()

    expect(component.detailsChanged()).toBe(!afterSkeleton)
  })

  it('should drop the previous subscription when called again', () => {
    component.setAchivements()
    const first = component.achievementsSummarySub
    component.setAchivements()

    expect(first.closed).toBe(true)
  })

  it('should do nothing when the config has no My Achievements section', () => {
    component.menuBarDetails = { navSections: [{ sectionKey: 'quick_actions' }] }

    expect(() => component.setAchivements()).not.toThrow()
    expect(component.achievementsSummarySub).toBeUndefined()
  })
})
