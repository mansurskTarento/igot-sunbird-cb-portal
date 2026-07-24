import { Component, Input, OnChanges, Output, EventEmitter } from '@angular/core'
import { Router } from '@angular/router'
import { EventService, WsEvents } from '@sunbird-cb/utils-v2'

@Component({
  selector: 'ws-in-progress-card',
  templateUrl: './in-progress-card.component.html',
  styleUrls: ['./in-progress-card.component.scss'],
  standalone: false,
})
export class InProgressCardComponent implements OnChanges {
  @Input() course: any = null
  @Input() isLoading = true
  @Output() resumed = new EventEmitter<void>()

  readonly circumference = 2 * Math.PI * 30  // r=30 → ~188.5

  progressPercent = 0
  courseName = ''
  courseOrg = ''
  courseId = ''
  isRetired = false

  constructor(private router: Router, private eventSvc: EventService) { }

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

