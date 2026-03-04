import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core'
import { Subject } from 'rxjs'
import * as _ from 'lodash'
import { NSPractice } from '../../practice.model'
import { TranslateService } from '@ngx-translate/core'

interface SummaryCard {
  label: string
  value: string
  icon?: string
  iconUrl?: string
  class?: string
}

interface SectionTableData {
  sectionName: string
  result: string
  yourScore: number
  requiredScore: number
  rawSectionData: NSPractice.IQuizSubmitResSec
}

interface FailureInfo {
  percentageMore: number
  additionalMarks: number
}

@Component({
  selector: 'viewer-overall-result-view',
  templateUrl: './overall-result-view.component.html',
  styleUrls: ['./overall-result-view.component.scss']
})
export class OverallResultViewComponent implements OnInit, OnChanges, OnDestroy {
  @Input() resultsData: any
  @Output() viewQuestions = new EventEmitter<NSPractice.IQuizSubmitResSec>();

  // Component-owned computed properties
  isPassed = false;
  overallScorePercent = 0;
  marksObtainedText = '';
  requiredPassPercent = 0;
  summaryCards: SummaryCard[] = [];
  sectionTableData: SectionTableData[] = [];
  displayedColumns = ['sectionName', 'result', 'yourScore', 'requiredScore', 'actions'];
  failureInfo: FailureInfo | null = null;
  isDataLoaded = false;

  // RxJS Lifecycle Management
  destroy$ = new Subject<void>();

  constructor(
    private translateService: TranslateService,
  ) {
    if (localStorage.getItem('websiteLanguage')) {
      this.translateService.setDefaultLang('en')
      const lang = localStorage.getItem('websiteLanguage')!
      this.translateService.use(lang)
    }
  }

  ngOnInit() {
    this.computeUIData()
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['resultsData'] && changes['resultsData'].currentValue) {
      this.resetValues()
      this.computeUIData()
    }
  }

  resetValues() {
    this.isPassed = false
    this.overallScorePercent = 0
    this.marksObtainedText = ''
    this.requiredPassPercent = 0
    this.summaryCards = []
    this.sectionTableData = []
    this.failureInfo = null
    this.isDataLoaded = false
  }


  // Component owns its computations
  computeUIData() {
    const results = this.resultsData
    if (!results) {
      this.isDataLoaded = false
      return
    }

    // Basic derived state
    this.isPassed = _.get(results, 'pass', false)
    this.overallScorePercent = this.sanitizeNumber(_.get(results, 'overallResult', 0))
    this.requiredPassPercent = this.sanitizeNumber(_.get(results, 'passPercentage', 0))

    const correct = this.sanitizeNumber(_.get(results, 'correct', 0))
    const incorrect = this.sanitizeNumber(_.get(results, 'incorrect', 0))
    const blank = this.sanitizeNumber(_.get(results, 'blank', 0))
    const total = correct + incorrect + blank
    this.marksObtainedText = `${correct} out of ${total} marks`

    // Summary cards computation
    this.computeSummaryCards()

    // Section table data computation
    this.computeSectionTableData()

    // Compute failure info once
    this.computeFailureInfo()

    this.isDataLoaded = true
  }

  computeSummaryCards() {
    const results = this.resultsData
    const correct = this.sanitizeNumber(_.get(results, 'correct', 0))
    const incorrect = this.sanitizeNumber(_.get(results, 'incorrect', 0))
    const blank = this.sanitizeNumber(_.get(results, 'blank', 0))
    const total = correct + incorrect + blank
    const totalMarks = _.get(results, 'totalMarks', '')

    // Calculate total time from all questions across all sections
    const timeTaken = _.get(results, 'timeTakenForAssessment') ? this.formatTime(_.get(results, 'timeTakenForAssessment')) : ''

    this.summaryCards = []

    if (timeTaken !== '') {
      this.summaryCards.push({ label: 'Time Taken', value: timeTaken, icon: 'schedule', class: 'time-green' })
    }

    if (total > 0) {
      this.summaryCards.push({ label: 'Attempted', value: `${total - blank}/${total}`, icon: 'assignment', class: 'attempted-orange' })
    }

    if (totalMarks !== '' && totalMarks !== null && totalMarks !== undefined) {
      this.summaryCards.push({ label: 'Marks Obtained', value: `${totalMarks}`, icon: 'emoji_events', class: 'marks-blue' })
    }
  }

  // private calculateTotalTimeTaken(): string {
  //   const sections = _.get(this.resultsData, 'children', [])
  //   let totalMs = 0

  //   sections.forEach((section: any) => {
  //     const questions = _.get(section, 'children', [])
  //     questions.forEach((question: any) => {
  //       totalMs += parseInt(question.timeSpent, 10) || 0
  //     })
  //   })

  //   return this.formatTime(totalMs)
  // }

  private formatTime(ms: string | number): string {
    const totalSeconds = Math.max(1, Math.floor(Number(ms) / 1000))
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    const pad = (n: number) => n < 10 ? `0${n}` : `${n}`

    if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)} m`
    if (minutes > 0) return `${pad(minutes)}:${pad(seconds)}`
    return `${seconds}s`
  }

  private sanitizeNumber(value: any): number {
    if (value === null || value === undefined) return 0
    const num = Number(value)
    if (isNaN(num)) return 0
    return num
  }

  computeSectionTableData() {
    const children = _.get(this.resultsData, 'children', [])

    this.sectionTableData = children.map((section: any, index: number) => {
      const sectionName = _.get(section, 'name', `Section ${String.fromCharCode(65 + index)}`)
      const pass = _.get(section, 'pass', false)
      const result = _.get(section, 'result', 0)
      const minimumPass = _.get(section, 'passPercentage', this.requiredPassPercent)

      return {
        sectionName,
        result: pass ? 'PASSED' : 'FAILED',
        yourScore: result,
        requiredScore: minimumPass,
        rawSectionData: section
      }
    })
  }

  computeFailureInfo() {
    if (this.isPassed) {
      this.failureInfo = null
      return
    }

    const total = _.get(this.resultsData, 'total', 0)
    const correct = _.get(this.resultsData, 'correct', 0)
    const pointsNeeded = Math.ceil((this.requiredPassPercent * total / 100) - correct)
    const percentageNeeded = this.requiredPassPercent - this.overallScorePercent

    this.failureInfo = {
      percentageMore: Math.max(0, Math.round(percentageNeeded)),
      additionalMarks: Math.max(0, pointsNeeded)
    }
  }

  // Event handlers
  onViewQuestions(section: SectionTableData) {
    this.viewQuestions.emit(section.rawSectionData)
  }

  // Mandatory lifecycle cleanup
  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
