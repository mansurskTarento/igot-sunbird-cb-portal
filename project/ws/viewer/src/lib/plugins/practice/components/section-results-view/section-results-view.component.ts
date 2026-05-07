import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core'
import { trigger, style, transition, animate } from '@angular/animations'
import * as _ from 'lodash'
import { NSPractice } from '../../practice.model'

interface FormattedQuestion extends NSPractice.ISectionQuestion {
  formattedTime?: string
}

@Component({
    selector: 'viewer-section-results-view',
    templateUrl: './section-results-view.component.html',
    styleUrls: ['./section-results-view.component.scss'],
    animations: [
        trigger('slideDown', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(-10px)' }),
                animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
            ]),
            transition(':leave', [
                animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
            ])
        ])
    ],
    standalone: false
})
export class SectionResultsViewComponent implements OnInit {
  @Input() sectionData!: NSPractice.IQuizSubmitResSec
  @Input() hideSectionHeader = false
  @Input() selectedAssessmentCompatibilityLevel: number = 0
  @Output() back = new EventEmitter<void>();

  // Question arrays for different tabs
  allQuestions: FormattedQuestion[] = []
  correctQuestions: FormattedQuestion[] = []
  incorrectQuestions: FormattedQuestion[] = []
  blankQuestions: FormattedQuestion[] = []

  // Expandable row tracking
  expandedRowsMap: Map<string, boolean> = new Map()

  constructor() { }

  ngOnInit(): void {
    this.initializeData()
  }

  private normalizeResult(result: string): string {
    switch ((result || '').toLowerCase()) {
      case 'correct': return 'Correct'
      case 'incorrect': return 'Incorrect'
      case 'blank': return 'Unattempted'
      default: return result
    }
  }

  private initializeData(): void {
    const correct: FormattedQuestion[] = []
    const incorrect: FormattedQuestion[] = []
    const blank: FormattedQuestion[] = []
    const all: FormattedQuestion[] = []

    if (this.sectionData && this.sectionData.children && Array.isArray(this.sectionData.children)) {
      for (const question of this.sectionData.children) {
        const normalizedResult = this.normalizeResult(question.result)
        const formatted: FormattedQuestion = {
          ...question,
          result: normalizedResult,
          formattedTime: this.formatTime(question.timeSpent || '')
        }
        all.push(formatted)
        if (normalizedResult === 'Correct') { correct.push(formatted) }
        else if (normalizedResult === 'Incorrect') { incorrect.push(formatted) }
        else if (normalizedResult === 'Unattempted') { blank.push(formatted) }
      }
    }

    this.allQuestions = all
    this.correctQuestions = correct
    this.incorrectQuestions = incorrect
    this.blankQuestions = blank
  }

  // Toggle row expansion
  toggleRowExpansion(questionId: string): void {
    const isExpanded = this.expandedRowsMap.get(questionId) || false
    this.expandedRowsMap.set(questionId, !isExpanded)
  }

  // Check if row is expanded
  isRowExpanded(questionId: string): boolean {
    return this.expandedRowsMap.get(questionId) || false
  }

  // Format time to hh:mm:ss (converts from milliseconds)
  private formatTime(timeSpent: string | number): string {
    if (typeof timeSpent === 'string' && timeSpent.includes(':')) {
      return timeSpent
    }

    const ms = typeof timeSpent === 'string' ? parseInt(timeSpent, 10) : timeSpent
    const totalSeconds = Math.max(1, Math.floor((ms || 0) / 1000))

    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) return `${this.padZero(hours)}:${this.padZero(minutes)}:${this.padZero(seconds)}`
    if (minutes > 0) return `${this.padZero(minutes)}:${this.padZero(seconds)}`
    return `${seconds}s`
  }

  private padZero(num: number): string {
    return num < 10 ? `0${num}` : `${num}`
  }

  goBack() {
    this.back.emit()
  }

}
