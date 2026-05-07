import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core'
import { Subject } from 'rxjs'
import * as _ from 'lodash'
import { NSPractice } from '../../practice.model'
import { TranslateService } from '@ngx-translate/core'
import { NsContent } from '@sunbird-cb/utils-v2'

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
    styleUrls: ['./overall-result-view.component.scss'],
    standalone: false
})
export class OverallResultViewComponent implements OnInit, OnChanges, OnDestroy {
  @Input() resultsData: any
  @Input() selectedAssessmentCompatibilityLevel: number = 1
  @Input() v4questionSet: any
  @Input() hideSectionTable = false
  @Output() viewQuestions = new EventEmitter<NSPractice.IQuizSubmitResSec>();

  // Component-owned computed properties
  isPassed = false;
  overallScorePercent: number | null = null;
  marksObtainedText = '';
  requiredPassPercent: number | null = null;
  summaryCards: any[] = [];
  sectionTableData: SectionTableData[] = [];
  displayedColumns = ['sectionName', 'result', 'yourScore', 'requiredScore', 'actions'];
  failureInfo: FailureInfo | null = null;
  isDataLoaded = false;
  isPracticeAssessment = false

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
    this.overallScorePercent = null
    this.marksObtainedText = ''
    this.requiredPassPercent = null
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
    this.isPracticeAssessment = results?.primaryCategory === NsContent.EPrimaryCategory.PRACTICE_RESOURCE

    if (this.selectedAssessmentCompatibilityLevel >= 7) {
      this.overallScorePercent = parseFloat(this.sanitizeNumber(_.get(results, 'totalPercentage', null)).toFixed(2))
      this.requiredPassPercent = null
      const correct = this.sanitizeNumber(_.get(results, 'totalSectionMarks', 0))
      const total = this.sanitizeNumber(_.get(results, 'totalMarks', 0))
      this.marksObtainedText = `${correct} out of ${total} marks`
    } else {
      this.overallScorePercent = parseFloat(this.sanitizeNumber(_.get(results, 'overallResult', null)).toFixed(2))
      this.requiredPassPercent = parseFloat(this.sanitizeNumber(_.get(results, 'passPercentage', null)).toFixed(2))
    }

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
    const total = this.sanitizeNumber(_.get(results, 'total', 0)) || (correct + incorrect + blank)

    const totalSectionMarks = this.sanitizeNumber(_.get(results, 'totalSectionMarks', null))
    const totalMarks = this.sanitizeNumber(_.get(results, 'totalMarks', null))
    const timeTaken = _.get(results, 'timeTakenForAssessment', null)

    const cards = []

    if (_.get(results, 'totalSectionMarks') != null && _.get(results, 'totalMarks') != null
      && !isNaN(totalSectionMarks) && !isNaN(totalMarks) && !this.isPracticeAssessment) {
      cards.push({
        imgType: 'icon',
        imgPath: 'speed',
        class: 'icon-bg-blue',
        summary: `${totalSectionMarks.toFixed(2)}/${totalMarks}`,
        summaryType: 'quizresult.score',
      })
    }

    if (timeTaken != null && !isNaN(Number(timeTaken)) && !this.isPracticeAssessment) {
      cards.push({
        imgType: 'img',
        imgPath: '/assets/icons/final-assessment/nest_clock_farsight_analog.svg',
        class: 'icon-bg-lite-green',
        summary: this.millisecondsToHMS(timeTaken),
        summaryType: 'quizresult.timeTaken',
      })
    }

    if (total > 0) {
      cards.push({
        imgType: 'img',
        imgPath: '/assets/icons/final-assessment/assignment.svg',
        class: 'icon-bg-pink',
        summary: `${correct + incorrect}/${total}`,
        summaryType: 'quizresult.attempted',
      })
    }

    if (total > 0) {
      cards.push({
        imgType: 'icon',
        imgPath: 'check_circle_outline',
        class: 'icon-bg-yellow',
        summary: `${correct}/${total}`,
        summaryType: 'quizresult.correct',
      })
    }

    if (_.get(results, 'incorrect') != null && !isNaN(Number(_.get(results, 'incorrect')))) {
      cards.push({
        imgType: 'icon',
        imgPath: 'cancel',
        class: 'icon-bg-red',
        summary: incorrect.toString(),
        summaryType: 'quizresult.wrong',
      })
    }

    this.summaryCards = cards
  }

  millisecondsToHMS(milleSeconds: any): string {
    const ms = Number(milleSeconds)
    const seconds: number = Math.floor((ms / 1000) % 60)
    const minutes: number = Math.floor((ms / (1000 * 60)) % 60)
    const hours: number = Math.floor((ms / (1000 * 60 * 60)) % 24)

    const hoursStr: string = (hours < 10) ? `0${hours}` : `${hours}`
    const minutesStr: string = (minutes < 10) ? `0${minutes}` : `${minutes}`
    const secondsStr: string = (seconds < 10) ? `0${seconds}` : `${seconds}`

    return `${hoursStr}:${minutesStr}:${secondsStr}`
  }
  private sanitizeNumber(value: any): number {
    if (value === null || value === undefined) return 0
    const num = Number(value)
    if (isNaN(num)) return 0
    return num
  }

  computeSectionTableData() {
    const children = _.get(this.resultsData, 'children', [])
    const v4Children: any[] = this.selectedAssessmentCompatibilityLevel < 7
      ? _.get(this.v4questionSet, 'children', [])
      : []

    this.sectionTableData = children.map((section: any, index: number) => {
      let sectionName = _.get(section, 'name', '')
      if (!sectionName && this.selectedAssessmentCompatibilityLevel < 7) {
        const matched = v4Children.find((c: any) => c.identifier === section.identifier)
        sectionName = _.get(matched, 'name', `Section ${String.fromCharCode(65 + index)}`)
      }
      if (!sectionName) {
        sectionName = `Section ${String.fromCharCode(65 + index)}`
      }
      const pass = _.get(section, 'pass', false)
      const result = _.get(section, 'result', 0)
      const minimumPass = _.get(section, 'passPercentage', this.requiredPassPercent)

      return {
        sectionName,
        result: pass ? 'PASSED' : 'FAILED',
        yourScore: parseFloat(this.sanitizeNumber(result).toFixed(2)),
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

    const rawTotalMarks = _.get(this.resultsData, 'totalMarks', null)
    const rawTotalSectionMarks = _.get(this.resultsData, 'totalSectionMarks', null)

    if (
      rawTotalMarks === null || rawTotalMarks === undefined ||
      rawTotalSectionMarks === null || rawTotalSectionMarks === undefined ||
      !this.requiredPassPercent ||
      this.overallScorePercent === null || this.overallScorePercent === undefined
    ) {
      this.failureInfo = null
      return
    }

    const totalMarks = this.sanitizeNumber(rawTotalMarks)
    const totalSectionMarks = this.sanitizeNumber(rawTotalSectionMarks)
    const pointsNeeded = Math.ceil((this.requiredPassPercent * totalMarks / 100) - totalSectionMarks)
    const percentageNeeded = this.requiredPassPercent - this.overallScorePercent

    this.failureInfo = {
      percentageMore: Math.max(0, parseFloat(percentageNeeded.toFixed(2))),
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
