import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { MatDialog } from '@angular/material/dialog'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { NSPeerValidation } from '../../models/peer-validation.model'
import { PeerValidationService } from '../../services/peer-validation.service'
import { SurveyPopupComponent } from '../survey-popup/survey-popup.component'
import { SurveyDialogComponent } from '../survey-dialog/survey-dialog.component'
@Component({
  selector: 'ws-app-peer-dashboard',
  templateUrl: './peer-dashboard.component.html',
  styleUrls: ['./peer-dashboard.component.scss'],
})
export class PeerDashboardComponent implements OnInit {
  activeTab: 'pending' | 'incoming' = 'pending'
  searchQuery = ''
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

  // Tab Counts
  tabCounts = { pending: 0, incoming: 0 }

  ngOnInit() {
    this.fetchData()
    this.fetchCounts()
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
      search: this.searchQuery,
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

  startReview(requestId: string) {
    if (this.isIncomingTab) {
      // For incoming requests, navigate to review page
      this.router.navigate(['/app/peer-validation/review', requestId])
    } else {
      // For pending surveys, open the survey dialog
      this.openSurveyForCourse(requestId)
    }
  }

  openSurveyForCourse(itemId: string) {
    // Find the dashboard item from pending surveys
    const dashboardItem = this.pendingSurveys.find(item => item.id === itemId)

    if (!dashboardItem) {
      console.error('Dashboard item not found:', itemId)
      return
    }

    // Get current user's name from config service
    // Try to get the full name from userProfile (matches what's shown in profile page)
    const userName = `${this.configSvc?.userProfile?.firstName || ''} ${this.configSvc?.userProfile?.lastName || ''}`.trim()
    const mockData: NSPeerValidation.ISurveyPopupData = {
      courseId: dashboardItem.id,
      courseName: dashboardItem.courseName,
      learnerName: userName,
      completionDate: dashboardItem.endDate,
    }

    // Directly open SurveyDialogComponent, bypassing the popup
    this.dialog.open(SurveyDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      disableClose: true,
      data: mockData
    })
  }

  openSurvey() {
    const mockData: NSPeerValidation.ISurveyPopupData = {
      courseId: 'do_111111111111111111',
      courseName: 'Effective Communication Strategies',
      learnerName: 'Test Learner',
      completionDate: new Date().toLocaleDateString(),
    }

    this.dialog.open(SurveyPopupComponent, {
      width: '600px',
      panelClass: 'custom-survey-popup',
      disableClose: true,
      data: mockData
    })
  }

  get isIncomingTab() {
    return this.activeTab === 'incoming'
  }
}
