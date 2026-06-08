import { Component, Input, OnChanges, Output, EventEmitter, inject } from '@angular/core'
import { Router } from '@angular/router'
import { EventService, WsEvents } from '@sunbird-cb/utils-v2'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'ws-in-progress-card-v2',
  templateUrl: './in-progress-card-v2.component.html',
  styleUrls: ['./in-progress-card-v2.component.scss'],
  standalone: true,
  imports: [TranslateModule],
})
export class InProgressCardV2Component implements OnChanges {
  @Input() course: any = null
  @Input() isLoading = true
  @Output() resumed = new EventEmitter<void>()

  private readonly router = inject(Router)
  private readonly eventSvc = inject(EventService)

  readonly circumference = 2 * Math.PI * 30  // r=30 → ~188.5

  progressPercent = 0
  courseName = ''
  courseOrg = ''
  courseId = ''
  isRetired = false

  ngOnChanges() {
    if (this.course) {
      // contentTemp = c.content with extra fields; contentTemp.content = c.content
      const content = this.course.content || this.course
      this.progressPercent = Math.round(this.course.completionPercentage || this.course.progress || 0)
      this.courseName = content.name || content.courseName || ''
      this.courseOrg = (content.organisation && content.organisation[0]) || ''
      this.courseId = content.identifier || this.course.courseId || ''
      this.isRetired = (content.status || '').toLowerCase() === 'retired'
    }
  }

  get strokeDashoffset(): number {
    return this.circumference - (this.circumference * this.progressPercent / 100)
  }

  resume() {
    this.eventSvc.raiseInteractTelemetry(
      {
        type: WsEvents.EnumInteractTypes.CLICK,
        subType: 'resume-btn',
        id: 'continue-learning-resume',
      },
      {
        id: this.courseId,
        type: 'Course',
      },
      {
        module: WsEvents.EnumTelemetrymodules.HOME,
      }
    )
    this.navigate()
  }

  private navigate(): void {
    const id = this.courseId
    if (!id) { return }

    // External content (partner-hosted)
    if (id.startsWith('ext_')) {
      this.router.navigateByUrl(`/app/toc/ext/${id}`)
      return
    }

    // Event / Offline Session → event-hub
    const content = this.course?.content || this.course
    const category = content?.primaryCategory || ''
    if (category === 'Offline Session') {
      this.router.navigate([`/app/event-hub/home/${id}`])
      return
    }

    // Course, Program, Blended Program, Curated Program,
    // Standalone Assessment, and all other do_ identifiers → TOC
    this.router.navigate(['/app/toc', id, 'overview'])
  }
}

