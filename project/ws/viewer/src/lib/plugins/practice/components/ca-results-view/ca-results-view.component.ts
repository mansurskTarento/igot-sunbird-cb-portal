import { Component, OnInit, Input, OnDestroy, Output, EventEmitter, OnChanges } from '@angular/core'
import { Subject } from 'rxjs'
import { NSPractice } from '../../practice.model'
// import { NsContent } from '@sunbird-cb/utils-v2'

@Component({
  selector: 'viewer-ca-results-view',
  templateUrl: './ca-results-view.component.html',
  styleUrls: ['./ca-results-view.component.scss']
})
export class CaResultsViewComponent implements OnInit, OnChanges, OnDestroy {
  @Input() results!: any
  @Input() canAttempt: any
  @Input() selectedAssessmentCompatibilityLevel: number = 0
  @Input() v4questionSet: any

  @Output() userSelection = new EventEmitter<string>()

  // Orchestration State Only
  showOverallView = true;
  selectedSection: NSPractice.IQuizSubmitResSec | null = null;

  // RxJS Lifecycle Management
  destroy$ = new Subject<void>();

  ngOnInit() {
  }

  ngOnChanges() {
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
