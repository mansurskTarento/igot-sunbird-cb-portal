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
  ]
})
export class SectionResultsViewComponent implements OnInit {
  @Input() sectionData!: NSPractice.IQuizSubmitResSec
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

  private initializeData(): void {
    let questions: FormattedQuestion[] = []

    // Handle the new flat data format with children array of questions
    if (this.sectionData && this.sectionData.children && Array.isArray(this.sectionData.children)) {
      questions = this.sectionData.children.map((question: any) => ({
        ...question,
        formattedTime: this.formatTime(question.timeSpent || question.timeTaken || '')
      }))
    }

    // Populate question arrays
    this.allQuestions = questions
    this.correctQuestions = questions.filter(q => q.result === 'correct')
    this.incorrectQuestions = questions.filter(q => q.result === 'incorrect')
    this.blankQuestions = questions.filter(q => q.result === 'blank')
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
