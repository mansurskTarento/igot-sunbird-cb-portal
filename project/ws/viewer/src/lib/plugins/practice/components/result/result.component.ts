import { Component, EventEmitter, Input, OnInit, OnChanges, Output, ViewChild } from '@angular/core'
import { NsContent, MultilingualTranslationsService } from '@sunbird-cb/utils/src/public-api'
import { NSPractice } from '../../practice.model'
import { MatAccordion } from '@angular/material/expansion'
import { MatTableDataSource } from '@angular/material'
import * as _ from 'lodash'
@Component({
  selector: 'viewer-result',
  templateUrl: './result.component.html',
  styleUrls: ['./result.component.scss'],
})
export class ResultComponent implements OnInit, OnChanges {
  @Input() percentage = 0
  @Input() levelText!: string
  @Input() isPassed = false
  @Input() quizCategory!: NsContent.EPrimaryCategory
  @Input() quizResponse!: NSPractice.IQuizSubmitResponseV2
  @Input() coursePrimaryCategory: any
  @Output() userSelection = new EventEmitter<string>()
  @Output() fetchResult = new EventEmitter<string>()
  @ViewChild(MatAccordion, { static: true }) accordion: MatAccordion | undefined
  staticImage = '/assets/images/exam/practice-result.png'
  questionTYP = NsContent.EPrimaryCategory
  selectedQuestionData: any
  activeQuestionSet: any = ''
  color = 'warn'
  mode = 'determinate'
  value = 45
  showText = 'Rating'
  isMobile = false
  showInsight = false
  questionStatuTableData: any = []
  quizResponseClone: any
  selectedSectionId = ''
  selectedStatus = 'all'
  summaryTableDataSource: any = new MatTableDataSource([
    {
      subject: 'Section A',
      yourScore: '0.25 / 35',
    },
    {
      subject: 'Section B',
      yourScore: '-1.25 / 35',
    },
    {
      subject: 'Section C',
      yourScore: '-1.25 / 30',
    },
  ])
  summaryTableDisplayeColumns = [
    { header: 'Subject', key: 'subject' },
    { header: 'Your Score', key: 'yourScore' },
  ]

  competitiveTableDataSource = new MatTableDataSource([
    {
      subject: 'Section A',
      yourScore: '0.25 / 35',
      topperScore: '35/35',
    },
    {
      subject: 'Section B',
      yourScore: '-1.25 / 35',
      topperScore: '32.5/35',
    },
  ])
  competitiveTableDisplayedColumns = [
    { header: 'Subject', key: 'subject' },
    { header: 'Your Score', key: 'yourScore' },
    // { header: 'Topper Score', key: 'topperScore' },
  ]

  overAllSummary = [
    {
      imgType: 'icon',
      imgPath: 'speed',
      class: 'icon-bg-blue',
      summary: '',
      summaryType: 'Score',
    },
    // {
    //   imgType: 'img',
    //   imgPath: '/assets/icons/final-assessment/nest_clock_farsight_analog.svg',
    //   class: 'icon-bg-lite-green',
    //   summary: '0:9:8',
    //   summaryType: 'Time Taken',
    // },
    {
      imgType: 'img',
      imgPath: '/assets/icons/final-assessment/assignment.svg',
      class: 'icon-bg-pink',
      summary: '',
      summaryType: 'Attempted',
    },
    {
      imgType: 'icon',
      imgPath: 'check_circle_outline',
      class: 'icon-bg-yellow',
      summary: '',
      summaryType: 'Correct',
    },
    {
      imgType: 'img',
      imgPath: '/assets/icons/final-assessment/target.svg',
      class: 'icon-bg-dark-green',
      summary: '',
      summaryType: 'Accuracy',
    },
  ]

  scoreSummary = [
    {
      imgType: 'img',
      imgPath: '/assets/icons/final-assessment/nest_clock_farsight_analog.svg',
      class: 'icon-bg-lite-green',
      summary: '0:9:8',
      summaryType: 'Time Taken',
    },
    {
      imgType: 'img',
      imgPath: '/assets/icons/final-assessment/assignment.svg',
      class: 'icon-bg-pink',
      summary: '84/100',
      summaryType: 'Attempted',
    },
    {
      imgType: 'icon',
      imgPath: 'check_circle_outline',
      class: 'icon-bg-yellow',
      summary: '15/100',
      summaryType: 'Correct',
    },
    {
      imgType: 'icon',
      imgPath: 'cancel',
      class: 'icon-bg-red',
      summary: '69',
      summaryType: 'Worning',
    },
  ]

  questionStatuTableDataSource: any = new MatTableDataSource([])
  questionStatuTableColumns = [
    { header: 'Questions', key: 'question' },
    { header: 'Status', key: 'status' },
    { header: 'Question Tagging', key: 'questionTagg' },
    { header: 'Time Taken', key: 'timeTaken' },
  ]

  sectionsList: any = []

  constructor(private langtranslations: MultilingualTranslationsService) {

  }

  ngOnInit() {
    if (window.innerWidth < 768) {
      this.isMobile = true
    } else {
      this.isMobile = false
    }
  }

  ngOnChanges() {
    // console.log(this.quizResponse, this.quizResponse)
    if (this.quizResponse) {
      this.quizResponseClone = _.clone(this.quizResponse)
      const sectionTableData = []
        /* tslint:disable */
      for (let i = 0; i < this.quizResponse.children.length; i++) {
        if (this.quizResponse.children[i]) {
          // if (this.quizResponse.children[i]['correct']) {
            let sectionName = '';
            if(this.quizResponse.children.length === 1) {
              sectionName = 'Default Section'
            } else {
              if(i==0) {
                sectionName = 'Section A'
              } else if(i==1) {
                sectionName = 'Section B'
              } else if(i==2) {
                sectionName = 'Section C'
              } else if(i==3) {
                sectionName = 'Section D'
              } else if(i==4) {
                sectionName = 'Section E'
              } else if(i==5) {
                sectionName = 'Section F'
              }
            }
            
            const sectionObj = { subject: `${sectionName}`, yourScore : ((this.quizResponse.children[i]['correct']) / Number(this.quizResponse.children[i]['total']))}
            sectionTableData.push(sectionObj)
          // }
        }
      }
      this.summaryTableDataSource = new MatTableDataSource(sectionTableData)
      this.summaryTableDisplayeColumns = [
        { header: 'Subject', key: 'subject' },
        { header: 'Your Score', key: 'yourScore' },
      ]

      this.competitiveTableDataSource = new MatTableDataSource([
        {
          subject: 'Section A',
          yourScore: '0.25 / 35',
          topperScore: '35/35',
        },
        {
          subject: 'Section B',
          yourScore: '-1.25 / 35',
          topperScore: '32.5/35',
        },
      ])
      this.competitiveTableDisplayedColumns = [
        { header: 'Subject', key: 'subject' },
        { header: 'Your Score', key: 'yourScore' },
        // { header: 'Topper Score', key: 'topperScore' },
      ]

      this.overAllSummary = [
        {
          imgType: 'icon',
          imgPath: 'speed',
          class: 'icon-bg-blue',
          summary: `${Number(this.percentage)}/100`,
          summaryType: 'Score',
        },
        // {
        //   imgType: 'img',
        //   imgPath: '/assets/icons/final-assessment/nest_clock_farsight_analog.svg',
        //   class: 'icon-bg-lite-green',
        //   summary: '0:9:8',
        //   summaryType: 'Time Taken',
        // },
        {
          imgType: 'img',
          imgPath: '/assets/icons/final-assessment/assignment.svg',
          class: 'icon-bg-pink',
          summary: `${(this.quizResponse.correct + this.quizResponse.incorrect)}/${this.quizResponse.total}`,
          summaryType: 'Attempted',
        },
        {
          imgType: 'icon',
          imgPath: 'check_circle_outline',
          class: 'icon-bg-yellow',
          summary: `${this.quizResponse.correct}/${this.quizResponse.total}`,
          summaryType: 'Correct',
        },
        {
          imgType: 'img',
          imgPath: '/assets/icons/final-assessment/target.svg',
          class: 'icon-bg-dark-green',
          summary: `${(Number(this.quizResponse.correct / this.quizResponse.total) * 100)}%`,
          summaryType: 'Accuracy',
        },
      ]

      this.scoreSummary = [
        // {
        //   imgType: 'img',
        //   imgPath: '/assets/icons/final-assessment/nest_clock_farsight_analog.svg',
        //   class: 'icon-bg-lite-green',
        //   summary: '0:9:8',
        //   summaryType: 'Time Taken',
        // },
        {
          imgType: 'img',
          imgPath: '/assets/icons/final-assessment/assignment.svg',
          class: 'icon-bg-pink',
          summary: `${(this.quizResponse.correct + this.quizResponse.incorrect)}/${this.quizResponse.total}`,
          summaryType: 'Attempted',
        },
        {
          imgType: 'icon',
          imgPath: 'check_circle_outline',
          class: 'icon-bg-yellow',
          summary: `${this.quizResponse.correct}/${this.quizResponse.total}`,
          summaryType: 'Correct',
        },
        {
          imgType: 'icon',
          imgPath: 'cancel',
          class: 'icon-bg-red',
          summary: this.quizResponse.incorrect.toString(),
          summaryType: 'Wrong',
        },
      ]

      this.questionStatuTableDataSource = new MatTableDataSource([
      ])
      this.questionStatuTableColumns = [
        { header: 'Questions', key: 'question' },
        { header: 'Status', key: 'status' },
        // { header: 'Question Tagging', key: 'questionTagg' },
        // { header: 'Time Taken', key: 'timeTaken' },
      ]
        /* tslint:disable */
      for (let i = 0; i < this.quizResponse.children.length; i++) {
        let sectionName = '';
            if(this.quizResponse.children.length === 1) {
              sectionName = 'Default Section'
            } else {
              if(i==0) {
                sectionName = 'Section A'
              } else if(i==1) {
                sectionName = 'Section B'
              } else if(i==2) {
                sectionName = 'Section C'
              } else if(i==3) {
                sectionName = 'Section D'
              } else if(i==4) {
                sectionName = 'Section E'
              } else if(i==5) {
                sectionName = 'Section F'
              }
            }
        const obj: any = {
                  sectionName: sectionName,
                  identifier: this.quizResponse.children[i]['identifier'],
        }
          /* tslint:disable */
        if(this.quizResponse.children[i] && this.quizResponse.children[i].children && this.quizResponse.children[i].children.length) {
          for (let j = 0; j < this.quizResponse.children[i].children.length; j++) {
            const objChildren: any = {
              question: this.quizResponse.children[i].children[j]['question'],
              status: this.quizResponse.children[i].children[j]['result'],
              questionTagg: this.quizResponse.children[i].children[j]['questionLevel'],
              timeTaken: '00:00:09',
            }
            this.questionStatuTableData.push(objChildren)
          }
        }        
        this.sectionsList.push(obj)
      }

      this.getSectionalData('all', 'all')
      // this.sectionsList = [
      //   {
      //     sectionName: 'Section A',
      //   },
      //   {
      //     sectionName: 'Section B',
      //   },
      //   {
      //     sectionName: 'Section C',
      //   },
      // ]
    }
  }

  getSectionalData(sectionId: string= 'all', resultType: string= 'all') {
    let quizResponse: any = this.quizResponse
    this.selectedSectionId = sectionId
    this.questionStatuTableData = []
    if (this.selectedSectionId === 'all') {
        /* tslint:disable */
      for (let i = 0; i < this.quizResponse.children.length; i++) {
          /* tslint:disable */
          if(this.quizResponse.children[i] && this.quizResponse.children[i].children && this.quizResponse.children[i].children.length) {
            for (let j = 0; j < this.quizResponse.children[i].children.length; j++) {
              if (resultType === 'all') {
                const obj: any = {
                  question: this.quizResponse.children[i].children[j]['question'],
                  status: this.quizResponse.children[i].children[j]['result'],
                  questionTagg: this.quizResponse.children[i].children[j]['questionLevel'],
                  timeTaken: '00:00:09',
                }
                this.questionStatuTableData.push(obj)
              } else if (resultType === 'correct') {
                if (this.quizResponse.children[i].children[j]['result'] === 'correct') {
                  const obj: any = {
                    question: this.quizResponse.children[i].children[j]['question'],
                    status: this.quizResponse.children[i].children[j]['result'],
                    questionTagg: this.quizResponse.children[i].children[j]['questionLevel'],
                    timeTaken: '00:00:09',
                  }
                  this.questionStatuTableData.push(obj)
                }
              } else if (resultType === 'wrong') {
                if (this.quizResponse.children[i].children[j]['result'] === 'incorrect') {
                  const obj: any = {
                    question: this.quizResponse.children[i].children[j]['question'],
                    status: this.quizResponse.children[i].children[j]['result'],
                    questionTagg: this.quizResponse.children[i].children[j]['questionLevel'],
                    timeTaken: '00:00:09',
                  }
                  this.questionStatuTableData.push(obj)
                }
              }  else if (resultType === 'notAnswered') {
                if (this.quizResponse.children[i].children[j]['result'] === 'blank') {
                  const obj: any = {
                    question: this.quizResponse.children[i].children[j]['question'],
                    status: this.quizResponse.children[i].children[j]['result'],
                    questionTagg: this.quizResponse.children[i].children[j]['questionLevel'],
                    timeTaken: '00:00:09',
                  }
                  this.questionStatuTableData.push(obj)
                }
              }
    
            }
          }
        
      }
      this.questionStatuTableDataSource = this.questionStatuTableData
    } else {
        /* tslint:disable */
      for (let i = 0; i < this.quizResponse.children.length; i++) {
        if (this.quizResponse.children[i]['identifier'] === this.selectedSectionId) {
          quizResponse = this.quizResponse.children[i]
          break
        }
      }
        /* tslint:disable */
      for (let j = 0; j < quizResponse.children.length; j++) {
        if (resultType === 'all') {
          const obj: any = {
            question: quizResponse.children[j]['question'],
            status: quizResponse.children[j]['result'],
            questionTagg: quizResponse.children[j]['questionLevel'],
            timeTaken: '00:00:09',
          }
          this.questionStatuTableData.push(obj)
        } else if (resultType === 'correct') {
          if (quizResponse.children[j]['result'] === 'correct') {
            const obj: any = {
              question: quizResponse.children[j]['question'],
              status: quizResponse.children[j]['result'],
              questionTagg: quizResponse.children[j]['questionLevel'],
              timeTaken: '00:00:09',
            }
            this.questionStatuTableData.push(obj)
          }
        } else if (resultType === 'wrong') {
          if (quizResponse.children[j]['result'] === 'incorrect') {
            const obj: any = {
              question: quizResponse.children[j]['question'],
              status: quizResponse.children[j]['result'],
              questionTagg: quizResponse.children[j]['questionLevel'],
              timeTaken: '00:00:09',
            }
            this.questionStatuTableData.push(obj)
          }
        }  else if (resultType === 'notAnswered') {
          if (quizResponse.children[j]['result'] === 'blank') {
            const obj: any = {
              question: quizResponse.children[j]['question'],
              status: quizResponse.children[j]['result'],
              questionTagg: quizResponse.children[j]['questionLevel'],
              timeTaken: '00:00:09',
            }
            this.questionStatuTableData.push(obj)
          }
        }
      }
    this.questionStatuTableDataSource = this.questionStatuTableData
    }

  }

  getQuestionByStatus(status: string) {
    this.selectedStatus = status
    this.getSectionalData(this.selectedSectionId, status)
  }

  action(event: NSPractice.TUserSelectionType) {
    this.userSelection.emit(event)
  }
  get isOnlySection(): boolean {
    return this.quizResponse.children.length === 1
  }

  checkRes() {
    if (this.quizResponse) {
      if (typeof this.quizResponse === 'string') {
        return true
      }
    }
    return false
  }

  retryResult() {
    this.fetchResult.emit()
  }
  getQuestionCount(data: any, activeQuestionSet: any) {
    this.activeQuestionSet = activeQuestionSet
    this.selectedQuestionData = data
  }

  updateProgress(value: any) {
    const progress: any = document.querySelector('.circular-progress')
    progress.style.setProperty('--percentage', `${value * 3.6}deg`)
    progress.style.setProperty('--passPercentage', value)
    progress.innerText = `${value}%`
  }

  translateLabels(label: string, type: any) {
    return this.langtranslations.translateLabelWithoutspace(label, type, '')
  }

  getFinalColumns(displayedColumns: any): string[] {
    const displayColumns = _.map(displayedColumns, c => c.key)
    return displayColumns
  }
}
