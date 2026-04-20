import { Subject, of } from 'rxjs'
import { NavigationEnd } from '@angular/router'
import { PeerDashboardComponent } from './peer-dashboard.component'
import { NSPeerValidation } from '../../models/peer-validation.model'

// ─── shared mock factory ─────────────────────────────────────────────────────

const makeDashboardItem = (overrides: Partial<NSPeerValidation.IDashboardItem> = {}): NSPeerValidation.IDashboardItem => ({
  notification_id: 'n1',
  status: 'PENDING',
  survey_end_date: '2027-12-31',
  created_at: '2024-01-01',
  updated_at: null,
  user_id: 'user1',
  action: null,
  action_at: null,
  metadata: {
    contextId: 'ctx1',
    formId: 'form1',
    courseName: 'Test Course',
    isSurveySubmitted: false,
    completionDate: '2024-01-10',
    surveyCreatedById: 'creator1',
    surveyEndDate: '2027-12-31',
    learnerName: 'John Doe',
    learnerId: 'learner1',
    submittedBy: 'user1',
    courseId: 'course1',
    contextOrgId: 'org1',
    thumbnail: 'thumb.jpg',
  },
  ...overrides,
})

// ─── tests ───────────────────────────────────────────────────────────────────

describe('PeerDashboardComponent', () => {
  let component: PeerDashboardComponent
  let routerEvents$: Subject<any>
  let routerMock: any
  let peerValidationServiceMock: any
  let dialogMock: any
  let configSvcMock: any

  beforeEach(() => {
    routerEvents$ = new Subject<any>()
    routerMock = {
      events: routerEvents$.asObservable(),
      navigate: jest.fn(),
    }
    peerValidationServiceMock = {
      dashboardRefresh$: new Subject<void>(),
      getDashboardData: jest.fn().mockReturnValue(of({ data: [makeDashboardItem()], count: 1 })),
      getDashboardCounts: jest.fn().mockReturnValue(of({ pending: 2, incoming: 3, all: 5 })),
    }
    dialogMock = {
      open: jest.fn().mockReturnValue({ afterClosed: () => of(null) }),
    }
    configSvcMock = {
      userProfile: { firstName: 'Jane', lastName: 'Smith', rootOrgId: 'org1' },
    }
    component = new PeerDashboardComponent(routerMock, peerValidationServiceMock, dialogMock, configSvcMock)
  })

  afterEach(() => {
    try { component.ngOnDestroy() } catch { /* already destroyed */ }
  })

  // ─── ngOnInit ──────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('should call fetchData and fetchCounts on init', () => {
      component.ngOnInit()
      expect(peerValidationServiceMock.getDashboardData).toHaveBeenCalledTimes(1)
      expect(peerValidationServiceMock.getDashboardCounts).toHaveBeenCalledTimes(1)
    })

    it('should re-fetch on NavigationEnd matching dashboard URL', () => {
      component.ngOnInit()
      routerEvents$.next(new NavigationEnd(1, '/app/peer-validation', '/app/peer-validation'))
      expect(peerValidationServiceMock.getDashboardData).toHaveBeenCalledTimes(2)
      expect(peerValidationServiceMock.getDashboardCounts).toHaveBeenCalledTimes(2)
    })

    it('should NOT re-fetch on NavigationEnd to a different URL', () => {
      component.ngOnInit()
      routerEvents$.next(new NavigationEnd(1, '/app/home', '/app/home'))
      // Only the initial fetch, not a second one
      expect(peerValidationServiceMock.getDashboardData).toHaveBeenCalledTimes(1)
    })

    it('should re-fetch on dashboardRefresh$ emission', () => {
      component.ngOnInit()
      peerValidationServiceMock.dashboardRefresh$.next()
      expect(peerValidationServiceMock.getDashboardData).toHaveBeenCalledTimes(2)
    })
  })

  // ─── ngOnDestroy ──────────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should not throw when subscriptions are undefined', () => {
      expect(() => component.ngOnDestroy()).not.toThrow()
    })

    it('should unsubscribe and stop reacting to router events', () => {
      component.ngOnInit()
      component.ngOnDestroy()
      routerEvents$.next(new NavigationEnd(1, '/app/peer-validation', '/app/peer-validation'))
      // After destroy, call count should remain at 1 (from ngOnInit)
      expect(peerValidationServiceMock.getDashboardData).toHaveBeenCalledTimes(1)
    })
  })

  // ─── fetchCounts ──────────────────────────────────────────────────────────

  describe('fetchCounts', () => {
    it('should update tabCounts from service', () => {
      component.fetchCounts()
      expect(component.tabCounts).toEqual({ pending: 2, incoming: 3, all: 5 })
    })
  })

  // ─── fetchData ────────────────────────────────────────────────────────────

  describe('fetchData', () => {
    it('should populate pendingSurveys on pending tab', () => {
      component.activeTab = 'pending'
      component.fetchData()
      expect(component.pendingSurveys.length).toBe(1)
      expect(component.incomingRequests.length).toBe(0)
      expect(component.totalItems).toBe(1)
    })

    it('should populate incomingRequests on incoming tab', () => {
      component.activeTab = 'incoming'
      component.fetchData()
      expect(component.incomingRequests.length).toBe(1)
      expect(component.pendingSurveys.length).toBe(0)
    })

    it('should clear previous data before fetching', () => {
      component.pendingSurveys = [makeDashboardItem()]
      component.incomingRequests = [makeDashboardItem()]
      component.totalItems = 99
      peerValidationServiceMock.getDashboardData.mockReturnValue(of({ data: [], count: 0 }))
      component.fetchData()
      expect(component.totalItems).toBe(0)
      expect(component.pendingSurveys.length).toBe(0)
    })

    it('should build correct filters for pending tab', () => {
      component.activeTab = 'pending'
      component.pageIndex = 2
      component.pageSize = 20
      component.fetchData()
      expect(peerValidationServiceMock.getDashboardData).toHaveBeenCalledWith(
        expect.objectContaining({ tab: 0, pageIndex: 2, pageSize: 20 })
      )
    })

    it('should build correct filters for incoming tab', () => {
      component.activeTab = 'incoming'
      component.fetchData()
      expect(peerValidationServiceMock.getDashboardData).toHaveBeenCalledWith(
        expect.objectContaining({ tab: 1 })
      )
    })
  })

  // ─── onPageChange ─────────────────────────────────────────────────────────

  describe('onPageChange', () => {
    it('should update pageIndex and pageSize then fetch', () => {
      component.onPageChange({ pageIndex: 3, pageSize: 25 })
      expect(component.pageIndex).toBe(3)
      expect(component.pageSize).toBe(25)
      expect(peerValidationServiceMock.getDashboardData).toHaveBeenCalled()
    })
  })

  // ─── onFilterChange ───────────────────────────────────────────────────────

  describe('onFilterChange', () => {
    it('should reset pageIndex to 0 and fetch data', () => {
      component.pageIndex = 5
      component.onFilterChange()
      expect(component.pageIndex).toBe(0)
      expect(peerValidationServiceMock.getDashboardData).toHaveBeenCalled()
    })
  })

  // ─── onTabChange ──────────────────────────────────────────────────────────

  describe('onTabChange', () => {
    it('should switch to incoming tab and fetch', () => {
      component.onTabChange('incoming')
      expect(component.activeTab).toBe('incoming')
      expect(peerValidationServiceMock.getDashboardData).toHaveBeenCalled()
    })

    it('should switch to pending tab and fetch', () => {
      component.activeTab = 'incoming'
      component.onTabChange('pending')
      expect(component.activeTab).toBe('pending')
    })
  })

  // ─── startReview ──────────────────────────────────────────────────────────

  describe('startReview', () => {
    it('should navigate to review page for incoming item', () => {
      component.activeTab = 'incoming'
      component.incomingRequests = [makeDashboardItem()]
      component.startReview('n1')
      expect(routerMock.navigate).toHaveBeenCalledWith(
        ['/app/peer-validation/review', 'form1'],
        expect.objectContaining({
          queryParams: expect.objectContaining({ formId: 'form1', courseName: 'Test Course' }),
        })
      )
    })

    it('should do nothing when incoming item is not found', () => {
      component.activeTab = 'incoming'
      component.incomingRequests = []
      component.startReview('nonexistent')
      expect(routerMock.navigate).not.toHaveBeenCalled()
    })

    it('should open survey dialog for pending tab', () => {
      component.activeTab = 'pending'
      component.pendingSurveys = [makeDashboardItem()]
      component.startReview('n1')
      expect(dialogMock.open).toHaveBeenCalled()
    })

    it('should pass notificationId and createdAt in navigate queryParams', () => {
      const item = makeDashboardItem({ notification_id: 'notif99', created_at: '2024-03-15', survey_end_date: '2027-06-01' })
      component.activeTab = 'incoming'
      component.incomingRequests = [item]
      component.startReview('notif99')
      expect(routerMock.navigate).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          queryParams: expect.objectContaining({ notificationId: 'notif99', createdAt: '2024-03-15' }),
        })
      )
    })
  })

  // ─── openSurveyForCourse ──────────────────────────────────────────────────

  describe('openSurveyForCourse', () => {
    it('should log error and return early when item not found', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { })
      component.pendingSurveys = []
      component.openSurveyForCourse('missing')
      expect(consoleSpy).toHaveBeenCalledWith('Dashboard item not found:', 'missing')
      consoleSpy.mockRestore()
    })

    it('should open SurveyDialogComponent when item found', () => {
      component.pendingSurveys = [makeDashboardItem()]
      component.openSurveyForCourse('n1')
      expect(dialogMock.open).toHaveBeenCalled()
    })

    it('should call fetchData and fetchCounts after dialog closes', () => {
      component.pendingSurveys = [makeDashboardItem()]
      component.openSurveyForCourse('n1')
      // afterClosed returns of(null) synchronously → fetchData + fetchCounts called
      expect(peerValidationServiceMock.getDashboardData).toHaveBeenCalled()
      expect(peerValidationServiceMock.getDashboardCounts).toHaveBeenCalled()
    })

    it('should build learnerName from configSvc userProfile', () => {
      component.pendingSurveys = [makeDashboardItem()]
      component.openSurveyForCourse('n1')
      const dialogCallArg = dialogMock.open.mock.calls[0][1]
      expect(dialogCallArg.data.learnerName).toBe('Jane Smith')
    })

    it('should handle missing firstName/lastName in configSvc', () => {
      configSvcMock.userProfile = {}
      component.pendingSurveys = [makeDashboardItem()]
      component.openSurveyForCourse('n1')
      const dialogCallArg = dialogMock.open.mock.calls[0][1]
      expect(dialogCallArg.data.learnerName).toBe('')
    })
  })

  // ─── isIncomingTab getter ─────────────────────────────────────────────────

  describe('isIncomingTab', () => {
    it('should return true when activeTab is incoming', () => {
      component.activeTab = 'incoming'
      expect(component.isIncomingTab).toBe(true)
    })

    it('should return false when activeTab is pending', () => {
      component.activeTab = 'pending'
      expect(component.isIncomingTab).toBe(false)
    })
  })

  // ─── getStatusLabel ───────────────────────────────────────────────────────

  describe('getStatusLabel', () => {
    it('should return "Active" for PENDING', () => {
      expect(component.getStatusLabel('PENDING')).toBe('Active')
    })

    it('should return "Ended" for EXPIRED', () => {
      expect(component.getStatusLabel('EXPIRED')).toBe('Ended')
    })

    it('should return the status itself for unknown values', () => {
      expect(component.getStatusLabel('COMPLETED')).toBe('COMPLETED')
    })

    it('should handle null gracefully', () => {
      expect(component.getStatusLabel(null as any)).toBeNull()
    })
  })

  // ─── getStatusClass ───────────────────────────────────────────────────────

  describe('getStatusClass', () => {
    it('should return "active" for PENDING', () => {
      expect(component.getStatusClass('PENDING')).toBe('active')
    })

    it('should return "ended" for EXPIRED', () => {
      expect(component.getStatusClass('EXPIRED')).toBe('ended')
    })

    it('should return lowercased status for unknown values', () => {
      expect(component.getStatusClass('COMPLETED')).toBe('completed')
    })

    it('should return empty string for null input', () => {
      expect(component.getStatusClass(null as any)).toBe('')
    })
  })

  // ─── formatDate ───────────────────────────────────────────────────────────

  describe('formatDate', () => {
    it('should return empty string for empty input', () => {
      expect(component.formatDate('')).toBe('')
    })

    it('should return original string for invalid date', () => {
      expect(component.formatDate('not-a-date')).toBe('not-a-date')
    })

    it('should format valid date as dd-mm-yyyy', () => {
      const result = component.formatDate('2024-03-05')
      expect(result).toMatch(/^\d{2}-\d{2}-2024$/)
    })
  })

  // ─── formatSurveyEndDate ──────────────────────────────────────────────────

  describe('formatSurveyEndDate', () => {
    it('should return empty string for empty input', () => {
      expect(component.formatSurveyEndDate('')).toBe('')
    })

    it('should return original string for invalid date', () => {
      expect(component.formatSurveyEndDate('invalid-date')).toBe('invalid-date')
    })

    it('should format valid date using toLocaleDateString', () => {
      const result = component.formatSurveyEndDate('2024-06-15T00:00:00Z')
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })
  })

  // ─── startReview – OR-fallback branches ──────────────────────────────────

  describe('startReview – alternate metadata field fallbacks', () => {
    it('should use course_name when courseName is absent', () => {
      component.activeTab = 'incoming'
      const item = makeDashboardItem()
        ; (item.metadata as any).courseName = undefined
        ; (item.metadata as any).course_name = 'Alt Course Name'
      component.incomingRequests = [item]
      component.startReview('n1')
      const qp = routerMock.navigate.mock.calls[0][1].queryParams
      expect(qp.courseName).toBe('Alt Course Name')
    })

    it('should use submittedBy when learnerId is absent', () => {
      component.activeTab = 'incoming'
      const item = makeDashboardItem()
        ; (item.metadata as any).learnerId = undefined
        ; (item.metadata as any).submittedBy = 'submitUser'
      component.incomingRequests = [item]
      component.startReview('n1')
      const qp = routerMock.navigate.mock.calls[0][1].queryParams
      expect(qp.submittedBy).toBe('submitUser')
    })

    it('should use courseId fallback when contextId is absent', () => {
      component.activeTab = 'incoming'
      const item = makeDashboardItem()
        ; (item.metadata as any).contextId = undefined
        ; (item.metadata as any).courseId = 'altCourse1'
      component.incomingRequests = [item]
      component.startReview('n1')
      const qp = routerMock.navigate.mock.calls[0][1].queryParams
      expect(qp.courseId).toBe('altCourse1')
    })

    it('should use cource_id fallback when contextId and courseId are absent', () => {
      component.activeTab = 'incoming'
      const item = makeDashboardItem()
        ; (item.metadata as any).contextId = undefined
        ; (item.metadata as any).courseId = undefined
        ; (item.metadata as any).cource_id = 'typoId'
      component.incomingRequests = [item]
      component.startReview('n1')
      const qp = routerMock.navigate.mock.calls[0][1].queryParams
      expect(qp.courseId).toBe('typoId')
    })

    it('should use org_id fallback when contextOrgId is absent', () => {
      component.activeTab = 'incoming'
      const item = makeDashboardItem()
        ; (item.metadata as any).contextOrgId = undefined
        ; (item.metadata as any).org_id = 'altOrg'
      component.incomingRequests = [item]
      component.startReview('n1')
      const qp = routerMock.navigate.mock.calls[0][1].queryParams
      expect(qp.contextOrgId).toBe('altOrg')
    })

    it('should produce empty string for notificationId when notification_id is absent', () => {
      component.activeTab = 'incoming'
      const item = makeDashboardItem()
        ; (item as any).notification_id = undefined
      component.incomingRequests = [item]
      component.startReview(undefined as any)
      const qp = routerMock.navigate.mock.calls[0][1].queryParams
      expect(qp.notificationId).toBe('')
    })

    it('should produce empty string for surveyEndDate when survey_end_date is absent', () => {
      component.activeTab = 'incoming'
      const item = makeDashboardItem()
        ; (item as any).survey_end_date = undefined
      component.incomingRequests = [item]
      component.startReview('n1')
      const qp = routerMock.navigate.mock.calls[0][1].queryParams
      expect(qp.surveyEndDate).toBe('')
    })

    it('should produce empty string for createdAt when created_at is absent', () => {
      component.activeTab = 'incoming'
      const item = makeDashboardItem()
        ; (item as any).created_at = undefined
      component.incomingRequests = [item]
      component.startReview('n1')
      const qp = routerMock.navigate.mock.calls[0][1].queryParams
      expect(qp.createdAt).toBe('')
    })
  })
})
