import { Component, OnInit, OnDestroy } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { ConfigurationsService, EventService, WsEvents, WidgetEnrollService } from '@sunbird-cb/utils-v2'
import { HomePageService } from '../../../services/home-page.service'
import { Observable, of, Subject } from 'rxjs'
import { catchError, takeUntil } from 'rxjs/operators'

@Component({
  selector: 'ws-continue-learning',
  templateUrl: './continue-learning.component.html',
  styleUrls: ['./continue-learning.component.scss'],
  standalone: false,
})
export class ContinueLearningComponent implements OnInit, OnDestroy {
  inProgressCourse: any = null
  isInProgressLoading = true
  private inProgressCourses: any[] = []

  insightsData: any = null
  weeklyData: any = null
  isWeeklyLoading = true

  private destroy$ = new Subject<void>()

  constructor(
    private activatedRoute: ActivatedRoute,
    private configSvc: ConfigurationsService,
    private enrollSvc: WidgetEnrollService,
    private homePageSvc: HomePageService,
    private router: Router,
    private eventSvc: EventService,
  ) { }

  ngOnInit() {
    this.loadInProgressCourse()
    this.loadWeeklyClaps()
  }

  // Same implementation as My Learning's ContentStripWithTabsPillsComponent.fetchFromInternalEnrollmentList
  loadInProgressCourse() {
    const userId = this.configSvc.userProfile && this.configSvc.userProfile.userId
    if (!userId) {
      this.isInProgressLoading = false
      return
    }

    // Get page config from route resolver (same data My Learning's widgetData comes from)
    const pageData = this.activatedRoute.snapshot.data && this.activatedRoute.snapshot.data.pageData
    const config = pageData && pageData.data
    const newHomeStrip: any[] = (config && config.newHomeStrip) || []

    // Find the My Learning strip — structure: newHomeStrip[i].strips[0].request.enrollmentList
    let myLearningStrip: any = null
    for (const widget of newHomeStrip) {
      if (widget && widget.strips && widget.strips.length) {
        const strip = widget.strips[0]
        if (strip && strip.request &&
          (strip.request.enrollmentList || strip.request.enrollmentlist) &&
          strip.tabs && strip.tabs.length) {
          myLearningStrip = strip
          break
        }
      }
    }

    if (!myLearningStrip) {
      console.warn('[ContinueLearning] Could not find My Learning strip in config')
      this.isInProgressLoading = false
      return
    }

    // Get the In Progress pill's payload — same as library's fetchFromInternalEnrollmentList
    const tab = myLearningStrip.tabs[0]
    const pills = tab && tab.pillsData
    if (!pills || !pills.length) {
      this.isInProgressLoading = false
      return
    }

    // Find In Progress pill by value, fallback to first pill
    const inProgressPill = pills.find((p: any) =>
      p.value && p.value.toLowerCase() === 'inprogress'
    ) || pills[0]

    const payload = inProgressPill && inProgressPill.request && inProgressPill.request.payload
    if (!payload) {
      this.isInProgressLoading = false
      return
    }

    // Remove limit — same as library does: delete n.request.payload.request.limit
    const pillPayload = JSON.parse(JSON.stringify(payload))
    if (pillPayload && pillPayload.request && pillPayload.request.limit) {
      delete pillPayload.request.limit
    }

    // Same APIs as My Learning, but fetched in parallel and rendered as each one lands.
    // They used to be nested, which meant the skeleton was only ever cleared inside the
    // external-enrolment callback — an external call that failed to settle left the card
    // stuck on the loader even after the internal call had returned its courses
    this.collectEnrolments(this.enrollSvc.fetchInternalEnrollmentData(userId, pillPayload))
    this.collectEnrolments(this.enrollSvc.fetchExternalEnrollmentData(pillPayload))
  }

  // accumulates courses from either enrolment source; whichever responds first renders
  private collectEnrolments(source$: Observable<any>) {
    source$
      .pipe(catchError(() => of(null)), takeUntil(this.destroy$))
      .subscribe((res: any) => {
        // cleared before formatting so a malformed course can never strand the loader
        this.isInProgressLoading = false
        const courses = (res && res.result && res.result.courses) || []
        if (courses.length) {
          this.inProgressCourses = [...this.inProgressCourses, ...courses]
        }
        if (this.inProgressCourses.length) {
          this.inProgressCourse = this.formatAndPickFirst(this.inProgressCourses)
        }
      })
  }

  // Same as My Learning's formatNewEnrollmentData — map + sort by lastContentAccessTime desc
  private formatAndPickFirst(courses: any[]): any {
    if (!courses || !courses.length) {
      return null
    }
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
      contentTemp.content.primaryCategory = (c.content && c.content.primaryCategory) ||
        (c.event && c.event.resourceType) || ''
      contentTemp.cType = c.event ? 'event' : ''
      return contentTemp
    })
    // Same sort as library: lastContentAccessTime descending
    const sorted = content.sort((a: any, b: any) => {
      const dateA: any = new Date(a.lastContentAccessTime || 0)
      const dateB: any = new Date(b.lastContentAccessTime || 0)
      return dateB - dateA
    })
    return sorted[0] || null
  }

  loadWeeklyClaps() {
    const rootOrgId = (this.configSvc.userProfile && this.configSvc.userProfile.rootOrgId) || ''
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
        if (res && res.result && res.result.response) {
          this.insightsData = res.result.response
          if (this.insightsData['weekly-claps']) {
            this.insightsData['weeklyClaps'] = this.insightsData['weekly-claps']
          }
          // Build weekList for child component (W1–W4 with activeWeek flag)
          this.weeklyData = this.buildWeeklyData(this.insightsData['weeklyClaps'])

        }
        this.isWeeklyLoading = false
      }, () => { this.isWeeklyLoading = false })
  }

  private buildWeeklyData(weeklyClaps: any): any {
    const weekKeys = ['week1', 'week2', 'week3', 'week4']
    const weekLabels = ['W1', 'W2', 'W3', 'W4']
    const now = new Date()
    const startDate = weeklyClaps && weeklyClaps.startDate ? new Date(weeklyClaps.startDate) : null
    const endDate = weeklyClaps && weeklyClaps.endDate ? new Date(weeklyClaps.endDate) : null
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
      {
        module: WsEvents.EnumTelemetrymodules.HOME,
      }
    )
    this.router.navigateByUrl('app/seeAll/new?key=continueLearning&tabSelected=Contents&pillSelected=inprogress')
  }

  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
