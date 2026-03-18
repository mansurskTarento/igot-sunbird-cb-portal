import { Component, OnInit, OnDestroy } from '@angular/core'
import { Router, NavigationEnd } from '@angular/router'
import { MatDialog } from '@angular/material/dialog'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { NSPeerValidation } from '../../models/peer-validation.model'
import { PeerValidationService } from '../../services/peer-validation.service'
import { SurveyDialogComponent } from '../survey-dialog/survey-dialog.component'
import { Subscription } from 'rxjs'
import { filter } from 'rxjs/operators'
@Component({
  selector: 'ws-app-peer-dashboard',
  templateUrl: './peer-dashboard.component.html',
  styleUrls: ['./peer-dashboard.component.scss'],
})
export class PeerDashboardComponent implements OnInit, OnDestroy {
  activeTab: 'pending' | 'incoming' = 'pending'
  sortBy = 'oldest'
  dateFilter = 'all'

  // Pagination
  pageIndex = 0
  pageSize = 15
  totalItems = 0

  // Dashboard Data
  incomingRequests: NSPeerValidation.IDashboardItem[] = []
  pendingSurveys: NSPeerValidation.IDashboardItem[] = []

  constructor(
    private router: Router,
    private peerValidationService: PeerValidationService,
    private dialog: MatDialog,
    private configSvc: ConfigurationsService
  ) { }

  private routerSub!: Subscription
  private refreshSub!: Subscription
  private isDashboardActive = false

  // Tab Counts
  tabCounts = { pending: 0, incoming: 0 }

  ngOnInit() {
    this.isDashboardActive = true
    this.fetchData()
    this.fetchCounts()
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      if (this.isDashboardActive && event.urlAfterRedirects === '/app/peer-validation') {
        this.fetchData()
        this.fetchCounts()
      }
    })
    // Refresh the list whenever any survey or review is submitted,
    // regardless of which dialog/page triggered the submission.
    this.refreshSub = this.peerValidationService.dashboardRefresh$.subscribe(() => {
      this.fetchData()
      this.fetchCounts()
    })
  }

  ngOnDestroy() {
    this.isDashboardActive = false
    if (this.routerSub) {
      this.routerSub.unsubscribe()
    }
    if (this.refreshSub) {
      this.refreshSub.unsubscribe()
    }
  }

  fetchCounts() {
    this.peerValidationService.getDashboardCounts().subscribe(counts => {
      this.tabCounts = counts
    })
  }

  fetchData() {
    // Clear stale data immediately so the old list doesn't blink
    // while the new API response is in-flight.
    this.pendingSurveys = []
    this.incomingRequests = []
    this.totalItems = 0
    const filters: NSPeerValidation.IDashboardFilters = {
      tab: this.activeTab === 'pending' ? 0 : 1,
      search: '',
      sortBy: this.sortBy,
      dateFilter: this.dateFilter,
      pageIndex: this.pageIndex,
      pageSize: this.pageSize
    }

    this.peerValidationService.getDashboardData(filters).subscribe(response => {
      this.totalItems = response.count
      if (this.activeTab === 'incoming') {
        this.incomingRequests = response.data
        this.pendingSurveys = []
      } else {
        this.pendingSurveys = response.data
        this.incomingRequests = []
      }
    })
  }

  onPageChange(event: any) {
    this.pageIndex = event.pageIndex
    this.pageSize = event.pageSize
    this.fetchData()
  }

  onFilterChange() {
    this.pageIndex = 0 // Reset to first page on filter change
    this.fetchData()
  }

  onTabChange(tab: 'pending' | 'incoming') {
    this.activeTab = tab
    this.fetchData()
  }

  startReview(notificationId: string) {
    if (this.isIncomingTab) {
      const item = this.incomingRequests.find(i => i.notification_id === notificationId)
      if (!item) return
      this.router.navigate(['/app/peer-validation/review', item.metadata.formId], {
        queryParams: {
          courseName: item.metadata.courseName,
          requestedName: item.metadata.learnerName,
          formId: item.metadata.formId,
          submittedBy: item.metadata.learnerId || item.metadata.submittedBy || '',
          courseId: item.metadata.contextId || item.metadata.courseId || '',
          notificationId: item.notification_id || '',
          surveyEndDate: item.survey_end_date || '',
          createdAt: item.created_at || '',
        },
      })
    } else {
      this.openSurveyForCourse(notificationId)
    }
  }

  openSurveyForCourse(notificationId: string) {
    const dashboardItem = this.pendingSurveys.find(item => item.notification_id === notificationId)
    if (!dashboardItem) {
      console.error('Dashboard item not found:', notificationId)
      return
    }
    const userName = `${this.configSvc?.userProfile?.firstName || ''} ${this.configSvc?.userProfile?.lastName || ''}`.trim()
    const mockData: NSPeerValidation.ISurveyPopupData = {
      formId: dashboardItem.metadata.formId,
      contextId: dashboardItem.metadata.contextId || dashboardItem.metadata.courseId || '',
      contextOrgId: dashboardItem.metadata.contextOrgId || '',
      courseName: dashboardItem.metadata.courseName,
      learnerName: userName,
      completionDate: dashboardItem.metadata.completionDate,
      surveyCreatedById: dashboardItem.metadata.surveyCreatedById || '',
      notificationId: dashboardItem.notification_id || '',
      createdAt: dashboardItem.created_at || '',
      thumbnail: dashboardItem.metadata.thumbnail || '',
    }

    // Directly open SurveyDialogComponent, bypassing the popup
    const dialogRef = this.dialog.open(SurveyDialogComponent, {
      width: '980px',
      maxWidth: '95vw',
      disableClose: true,
      data: mockData
    })

    dialogRef.afterClosed().subscribe(() => {
      this.fetchData()
      this.fetchCounts()
    })
  }

  get isIncomingTab() {
    return this.activeTab === 'incoming'
  }

  getStatusLabel(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'Active'
      case 'EXPIRED': return 'Ended'
      default: return status
    }
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'active'
      case 'EXPIRED': return 'ended'
      default: return status?.toLowerCase() || ''
    }
  }
}
