import { Component, OnInit, Input, OnDestroy, Output, EventEmitter, OnChanges } from '@angular/core'
import { Subject } from 'rxjs'
import { NSPractice } from '../../practice.model'
import { NsContent } from '@sunbird-cb/utils-v2'
import { ViewerHeaderSideBarToggleService } from '../../../../viewer-header-side-bar-toggle.service'
// import { NsContent } from '@sunbird-cb/utils-v2'

@Component({
  selector: 'viewer-ca-results-view',
  templateUrl: './ca-results-view.component.html',
  styleUrls: ['./ca-results-view.component.scss'],
  standalone: false
})
export class CaResultsViewComponent implements OnInit, OnChanges, OnDestroy {
  @Input() results!: any
  @Input() canAttempt: any
  @Input() selectedAssessmentCompatibilityLevel: number = 0
  @Input() v4questionSet: any
  @Output() userSelection = new EventEmitter<string>()

  // Orchestration State Only
  showOverallView = true
  selectedSection: NSPractice.IQuizSubmitResSec | null = null
  isSingleSection = false
  isPracticeAssessment = false

  // RxJS Lifecycle Management
  destroy$ = new Subject<void>()

  constructor(
    public viewerHeaderSideBarToggleService: ViewerHeaderSideBarToggleService,
  ) { }

  ngOnInit() {
  }

  ngOnChanges() {
    const sections = this.results?.children
    if (Array.isArray(sections) && sections.length === 1) {
      this.isSingleSection = true
      this.selectedSection = sections[0]
      this.showOverallView = true
    } else {
      this.isSingleSection = false
      this.selectedSection = null
      this.showOverallView = true
    }
    this.isPracticeAssessment = this.results?.primaryCategory === NsContent.EPrimaryCategory.PRACTICE_RESOURCE
  }

  // Navigation Orchestration
  onViewQuestions(section: NSPractice.IQuizSubmitResSec) {
    this.selectedSection = section
    this.showOverallView = false
  }

  onBackFromSection() {
    this.selectedSection = null
    this.showOverallView = true
  }

  retakeTest() {
    this.userSelection.emit('retake')
  }

  // Mandatory lifecycle cleanup
  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
