import { Component, OnInit, OnDestroy, inject } from '@angular/core'
import { Router } from '@angular/router'
import { ConfigurationsService, EventService, WsEvents, WidgetEnrollService } from '@sunbird-cb/utils-v2'
import { HomePageService } from '../../../services/home-page.service'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { TranslateModule } from '@ngx-translate/core'
import { InProgressCardV2Component } from './in-progress-card-v2/in-progress-card-v2.component'
import { WeeklyClapsCardV2Component } from './weekly-claps-card-v2/weekly-claps-card-v2.component'

// In-progress enrollment payload — same as ContentStripWithTabsPills uses for the "In Progress" pill
const IN_PROGRESS_PAYLOAD = {
  request: {
    retiredCoursesEnabled: true,
    status: 'In-Progress',
  },
}

// External enrollment payload for in-progress courses
const IN_PROGRESS_EXTERNAL_PAYLOAD = {
  request: {
    status: 'In-Progress',
  },
}

@Component({
  selector: 'ws-continue-learning-v2',
  templateUrl: './continue-learning-v2.component.html',
  styleUrls: ['./continue-learning-v2.component.scss'],
  standalone: true,
  imports: [TranslateModule, InProgressCardV2Component, WeeklyClapsCardV2Component],
})
export class ContinueLearningV2Component implements OnInit, OnDestroy {
  inProgressCourse: any = null
  isInProgressLoading = true

  insightsData: any = null
  weeklyData: any = null
  isWeeklyLoading = true

  private readonly configSvc = inject(ConfigurationsService)
  private readonly enrollSvc = inject(WidgetEnrollService)
  private readonly homePageSvc = inject(HomePageService)
  private readonly router = inject(Router)
  private readonly eventSvc = inject(EventService)
  private readonly destroy$ = new Subject<void>()

  ngOnInit() {
    this.loadInProgressCourse()
    this.loadWeeklyClaps()
  }

  // Calls enrollment APIs directly — same as ContentStripWithTabsPillsComponent.fetchFromInternalEnrollmentList
  loadInProgressCourse() {
    const userId = this.configSvc.userProfile?.userId
    if (!userId) {
      this.isInProgressLoading = false
      return
    }

    this.enrollSvc.fetchInternalEnrollmentData(userId, IN_PROGRESS_PAYLOAD)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        let courses: any[] = []
        if (res?.result?.courses?.length) {
          courses = [...courses, ...res.result.courses]
        }
        this.enrollSvc.fetchExternalEnrollmentData(IN_PROGRESS_EXTERNAL_PAYLOAD)
          .pipe(takeUntil(this.destroy$))
          .subscribe((extRes: any) => {
            if (extRes?.result?.courses?.length) {
              courses = [...courses, ...extRes.result.courses]
            }
            this.inProgressCourse = this.formatAndPickFirst(courses)
            this.isInProgressLoading = false
          }, () => {
            this.inProgressCourse = this.formatAndPickFirst(courses)
            this.isInProgressLoading = false
          })
      }, () => {
        this.enrollSvc.fetchExternalEnrollmentData(IN_PROGRESS_EXTERNAL_PAYLOAD)
          .pipe(takeUntil(this.destroy$))
          .subscribe((extRes: any) => {
            const courses = extRes?.result?.courses ?? []
            this.inProgressCourse = this.formatAndPickFirst(courses)
            this.isInProgressLoading = false
          }, () => { this.isInProgressLoading = false })
      })
  }

  private formatAndPickFirst(courses: any[]): any {
    if (!courses?.length) { return null }
    const content = courses.map((c: any) => {
      const contentTemp: any = c.content || c.event || {}
      contentTemp.completionPercentage = c.completionPercentage || c.progress || 0
      contentTemp.completionStatus = c.completionStatus || c.status || 0
      contentTemp.enrolledDate = c.enrolledDate || ''
      contentTemp.lastContentAccessTime = c.lastContentAccessTime || ''
      contentTemp.lastReadContentStatus = c.lastReadContentStatus || ''
      contentTemp.lastReadContentId = c.lastReadContentId || ''
      contentTemp.lrcProgressDetails = c.lrcProgressDetails || ''
      contentTemp.issuedCertificates = c.issuedCertificates || c.issued_certificates || []
      contentTemp.batchId = c.batchId || ''
      contentTemp.content = c.content || c.event || {}
      contentTemp.content.primaryCategory = (c.content?.primaryCategory) || (c.event?.resourceType) || ''
      contentTemp.cType = c.event ? 'event' : ''
      return contentTemp
    })
    const sorted = content.sort((a: any, b: any) => {
      const dateA: any = new Date(a.lastContentAccessTime || 0)
      const dateB: any = new Date(b.lastContentAccessTime || 0)
      return dateB - dateA
    })
    return sorted[0] ?? null
  }

  loadWeeklyClaps() {
    const rootOrgId = this.configSvc.userProfile?.rootOrgId ?? ''
    const request = {
      request: {
        filters: {
          primaryCategory: 'programs',
          organisations: ['across', rootOrgId],
        },
      },
    }
    this.homePageSvc.getInsightsData(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        if (res?.result?.response) {
          this.insightsData = res.result.response
          if (this.insightsData['weekly-claps']) {
            this.insightsData['weeklyClaps'] = this.insightsData['weekly-claps']
          }
          this.weeklyData = this.buildWeeklyData(this.insightsData['weeklyClaps'])
        }
        this.isWeeklyLoading = false
      }, () => { this.isWeeklyLoading = false })
  }

  private buildWeeklyData(weeklyClaps: any): any {
    const weekKeys = ['week1', 'week2', 'week3', 'week4']
    const weekLabels = ['W1', 'W2', 'W3', 'W4']
    const now = new Date()
    const startDate = weeklyClaps?.startDate ? new Date(weeklyClaps.startDate) : null
    const endDate = weeklyClaps?.endDate ? new Date(weeklyClaps.endDate) : null
    const periodMs = (startDate && endDate) ? (endDate.getTime() - startDate.getTime()) / 4 : 0

    const weekList = weekKeys.map((key, i) => {
      let activeWeek = false
      if (startDate && periodMs) {
        const wStart = new Date(startDate.getTime() + i * periodMs)
        const wEnd = new Date(startDate.getTime() + (i + 1) * periodMs)
        activeWeek = now >= wStart && now < wEnd
      }
      return { label: weekLabels[i], key, activeWeek }
    })
    return { enableCard: true, weekList }
  }

  viewAll() {
    this.eventSvc.raiseInteractTelemetry(
      {
        type: WsEvents.EnumInteractTypes.CLICK,
        subType: 'view-all-btn',
        id: 'continue-learning-view-all',
      },
      {},
      { module: WsEvents.EnumTelemetrymodules.HOME }
    )
    this.router.navigateByUrl('app/seeAll/new?key=continueLearning&tabSelected=Contents&pillSelected=inprogress')
  }

  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }
}