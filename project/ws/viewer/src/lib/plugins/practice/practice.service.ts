import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { NSPractice } from './practice.model'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { CommonMethodsService } from '@sunbird-cb/consumption'
import { BehaviorSubject, EMPTY, Observable, Subject, of, throwError } from 'rxjs'
import { catchError, concatMap, delay, map, retryWhen, shareReplay, switchMap, take } from 'rxjs/operators'
// tslint:disable-next-line
import _ from 'lodash'

const API_END_POINTS = {
  ASSESSMENT_SUBMIT_V2: '/apis/protected/v8/user/evaluate/assessment/submit/v2',
  ASSESSMENT_SUBMIT_V3: '/apis/protected/v8/user/evaluate/assessment/submit/v3',
  ASSESSMENT_SUBMIT_V4: '/apis/protected/v8/user/evaluate/assessment/submit/v4',
  ASSESSMENT_SUBMIT_V5: '/apis/protected/v8/user/evaluate/assessment/submit/v5',
  ASSESSMENT_SUBMIT_V6: '/apis/protected/v8/user/evaluate/assessment/submit/v6',
  ASSESSMENT_SUBMIT_V7: '/apis/protected/v8/user/evaluate/assessment/submit/v7',
  ASSESSMENT_RESULT_V4: '/apis/proxies/v8/user/assessment/v4/result',
  ASSESSMENT_RESULT_V5: '/apis/proxies/v8/user/assessment/v5/result',
  ASSESSMENT_RESULT_V7: '/apis/proxies/v8/user/assessment/v7/result',
  QUESTION_PAPER_SECTIONS_V4: '/apis/proxies/v8/assessment/read',
  QUESTION_PAPER_QUESTIONS_V4: '/apis/proxies/v8/question/read',
  QUESTION_PAPER_SECTIONS: '/apis/proxies/v8/assessment/v5/read',
  QUESTION_PAPER_QUESTIONS: '/apis/proxies/v8/question/v5/read',
  SAVE_AND_NEXT_QUESTION: 'apis/proxies/v8/assessment/save',
  CAN_ATTEMPT: (assessmentId: any) => `/apis/proxies/v8/user/assessment/retake/${assessmentId}`,
  CAN_ATTEMPT_V5: (assessmentId: any) => `/apis/proxies/v8/user/assessment/v5/retake/${assessmentId}`,
  CAN_ATTEMPT_V7: (assessmentId: any) => `/apis/proxies/v8/user/assessment/v7/retake/${assessmentId}`,
  PUBLIC_QUESTION_READ: 'api/public/assessment/v5/read',
  PUBLIC_QUESTION_LIST: '/api/public/assessment/v5/question/list',
  PUBLIC_ASSESSMENT_SUBMIT: 'api/public/assessment/v5/assessment/submit',
  PUBLIC_ASSESSMENT_RESULT: 'api/public/assessment/v5/result',
  PUBLIC_QUESTION_V4_READ: 'api/public/assessment/v1/read',
  PUBLIC_QUESTION_V4_LIST: '/api/public/assessment/v5/question/list',
  PUBLIC_ASSESSMENT_V4_SUBMIT: 'api/public/assessment/v4/assessment/submit',
  PUBLIC_ASSESSMENT_V4_RESULT: 'api/public/assessment/v5/result',
}
const forcreator = window.location.href.includes('editMode=true')
@Injectable({
  providedIn: 'root',
})

export class PracticeService {

  paperSections: BehaviorSubject<NSPractice.IQPaper | null> = new BehaviorSubject<NSPractice.IQPaper | null>(null)
  questionAnswerHash: BehaviorSubject<NSPractice.IQAnswer> = new BehaviorSubject<NSPractice.IQAnswer>({})
  secAttempted: BehaviorSubject<NSPractice.ISecAttempted[] | []> = new BehaviorSubject<NSPractice.ISecAttempted[] | []>([])
  mtfSrc: BehaviorSubject<NSPractice.IMtfSrc> = new BehaviorSubject<NSPractice.IMtfSrc>({})
  currentSection: BehaviorSubject<Partial<NSPractice.IPaperSection>> = new BehaviorSubject<Partial<NSPractice.IPaperSection>>({})
  // questionAnswerHashV2:BehaviorSubject<NSPractice.IQAnswer> = new BehaviorSubject<NSPractice.IQAnswer>({})
  displayCorrectAnswer: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  checkAlreadySubmitAssessment = new Subject()
  clearResponse = new Subject()

  private playerConfig$: Observable<any> = this.http
    .get<any>(`${this.configSvc.sitePath}/feature/toc.json`)
    .pipe(catchError(() => of({})), shareReplay(1))

  constructor(
    private http: HttpClient,
    private configSvc: ConfigurationsService,
    private commonMethodsSvc: CommonMethodsService,
  ) {

  }

  private isApiEnabled(urlConfigPath: string, defaultUrl: string): Observable<boolean> {
    return this.playerConfig$.pipe(
      map((tocConfig: any) => !!this.commonMethodsSvc.getEnabledUrl({
        apiConfig: tocConfig?.playerApiConfig,
        urlConfigPath,
        defaultUrl,
      })),
      take(1),
    )
  }

  // handleError(error: ErrorEvent) {
  //   let errorMessage = ''
  //   if (error.error instanceof ErrorEvent) {
  //     errorMessage = `Error: ${error.error.message}`
  //   }
  //   return throwError(errorMessage)
  // }
  startSection(section: NSPractice.IPaperSection) {
    if (section) {
      const sections = this.secAttempted.getValue()
      for (let i = 0; sections && i < sections.length; i += 1) {
        if (sections[i] && section.identifier === sections[i].identifier) {
          sections[i].isAttempted = true
          sections[i].fullAttempted = false
        }
      }
      this.secAttempted.next(sections)
    }
  }
  setFullAttemptSection(section: NSPractice.IPaperSection) {
    if (section) {
      const sections = this.secAttempted.getValue()
      for (let i = 0; sections && i < sections.length; i += 1) {
        if (sections[i] && section.identifier === sections[i].identifier) {
          sections[i].isAttempted = true
          sections[i].fullAttempted = true
        }
      }
      this.secAttempted.next(sections)
    }
  }
  qAnsHash(value: any) {
    // tslint:disable-next-line
    this.questionAnswerHash.next(value)
  }
  submitQuizV2(req: NSPractice.IQuizSubmitRequest): Observable<NSPractice.IQuizSubmitResponse> {
    return this.isApiEnabled('assessmentSubmitV2', API_END_POINTS.ASSESSMENT_SUBMIT_V2).pipe(
      switchMap((enabled: boolean) => enabled
        ? this.http.post<NSPractice.IQuizSubmitResponse>(API_END_POINTS.ASSESSMENT_SUBMIT_V2, req)
        : EMPTY
      ),
    )
  }
  submitQuizV3(req: NSPractice.IQuizSubmit): Observable<NSPractice.IQuizSubmitResponseV2> {
    return this.isApiEnabled('assessmentSubmitV3', API_END_POINTS.ASSESSMENT_SUBMIT_V3).pipe(
      switchMap((enabled: boolean) => enabled
        ? this.http.post<{ result: NSPractice.IQuizSubmitResponseV2 }>(API_END_POINTS.ASSESSMENT_SUBMIT_V3, req)
            .pipe(map((response: { result: NSPractice.IQuizSubmitResponseV2 }) => response.result))
        : EMPTY
      ),
    )
  }
  submitQuizV4(req: NSPractice.IQuizSubmit): Observable<any> {
    return this.isApiEnabled('assessmentSubmitV4', API_END_POINTS.ASSESSMENT_SUBMIT_V4).pipe(
      switchMap((enabled: boolean) => enabled
        ? this.http.post<{ result: NSPractice.IQuizSubmitResponseV2 }>(API_END_POINTS.ASSESSMENT_SUBMIT_V4, req).pipe(map(response => {
          return response
        }))
        : EMPTY
      ),
    )
  }

  submitQuizV5(req: NSPractice.IQuizSubmit): Observable<any> {
    return this.isApiEnabled('assessmentSubmitV5', API_END_POINTS.ASSESSMENT_SUBMIT_V5).pipe(
      switchMap((enabled: boolean) => enabled
        ? this.http.post<{ result: NSPractice.IQuizSubmitResponseV2 }>(API_END_POINTS.ASSESSMENT_SUBMIT_V5, req).pipe(map(response => {
          return response
        }))
        : EMPTY
      ),
    )
  }

  submitQuizV6(req: NSPractice.IQuizSubmit): Observable<any> {
    return this.isApiEnabled('assessmentSubmitV6', API_END_POINTS.ASSESSMENT_SUBMIT_V6).pipe(
      switchMap((enabled: boolean) => enabled
        ? this.http.post<{ result: NSPractice.IQuizSubmitResponseV2 }>(API_END_POINTS.ASSESSMENT_SUBMIT_V6, req).pipe(map(response => {
          return response
        }))
        : EMPTY
      ),
    )
  }

  submitQuizV7(req: NSPractice.IQuizSubmit): Observable<any> {
    return this.isApiEnabled('assessmentSubmitV7', API_END_POINTS.ASSESSMENT_SUBMIT_V7).pipe(
      switchMap((enabled: boolean) => enabled
        ? this.http.post<{ result: NSPractice.IQuizSubmitResponseV2 }>(API_END_POINTS.ASSESSMENT_SUBMIT_V7, req).pipe(map(response => {
          return response
        }))
        : EMPTY
      ),
    )
  }

  publicV4Submit(req: NSPractice.IQuizSubmit): Observable<any> {
    return this.isApiEnabled('publicAssessmentV4Submit', API_END_POINTS.PUBLIC_ASSESSMENT_V4_SUBMIT).pipe(
      switchMap((enabled: boolean) => enabled
        ? this.http.post<{ result: NSPractice.IQuizSubmitResponseV2 }>(
          API_END_POINTS.PUBLIC_ASSESSMENT_V4_SUBMIT, req).pipe(map(response => {
          return response
        }))
        : EMPTY
      ),
    )
  }
  publicV5Submit(req: NSPractice.IQuizSubmit): Observable<any> {
    return this.isApiEnabled('publicAssessmentSubmit', API_END_POINTS.PUBLIC_ASSESSMENT_SUBMIT).pipe(
      switchMap((enabled: boolean) => enabled
        ? this.http.post<{ result: NSPractice.IQuizSubmitResponseV2 }>(
          API_END_POINTS.PUBLIC_ASSESSMENT_SUBMIT, req).pipe(map(response => {
          return response
        }))
        : EMPTY
      ),
    )
  }
  quizResult(req: any, forPreview?: any) {
    const isPublic = forPreview && !forcreator
    const url = isPublic ? API_END_POINTS.PUBLIC_ASSESSMENT_V4_RESULT : API_END_POINTS.ASSESSMENT_RESULT_V4
    const configKey = isPublic ? 'publicAssessmentResult' : 'assessmentResultV4'
    return this.isApiEnabled(configKey, url).pipe(
      switchMap((enabled: boolean) => enabled
        ? this.http.post<{ result: NSPractice.IQuizSubmitResponseV2 }>(
          url, req).pipe(map(response => {
          return response
        }))
        : EMPTY
      ),
    )
  }

  quizResultV5(req: any, forPreview?: any) {
    const isPublic = forPreview && !forcreator
    const url = isPublic ? API_END_POINTS.PUBLIC_ASSESSMENT_RESULT : API_END_POINTS.ASSESSMENT_RESULT_V5
    const configKey = isPublic ? 'publicAssessmentResult' : 'assessmentResultV5'
    return this.isApiEnabled(configKey, url).pipe(
      switchMap((enabled: boolean) => enabled
        ? this.http.post<{ result: NSPractice.IQuizSubmitResponseV2 }>(url, req).pipe(map(response => {
          return response
        }))
        : EMPTY
      ),
    )
  }

  quizResultV7(req: any, forPreview?: any) {
    const isPublic = forPreview && !forcreator
    const url = isPublic ? API_END_POINTS.PUBLIC_ASSESSMENT_RESULT : API_END_POINTS.ASSESSMENT_RESULT_V7
    const configKey = isPublic ? 'publicAssessmentResult' : 'assessmentResultV7'
    return this.isApiEnabled(configKey, url).pipe(
      switchMap((enabled: boolean) => enabled
        ? this.http.post<{ result: NSPractice.IQuizSubmitResponseV2 }>(url, req).pipe(map(response => {
          return response
        }))
        : EMPTY
      ),
    )
  }

  createAssessmentSubmitRequest(
    identifier: string,
    title: string,
    quiz: NSPractice.IQuiz,
    questionAnswerHash: { [questionId: string]: any[] },
    mtfSrc: {
      [questionId: string]: {
        source: string[],
        target: string[]
      }
    }
  ): NSPractice.IQuizSubmitRequest {
    const quizWithAnswers = {
      ...quiz,
      identifier,
      title,
    }
    quizWithAnswers.questions.map(question => {
      if (
        question.questionType === undefined ||
        question.questionType === 'mcq-mca' ||
        question.questionType === 'mcq-sca' ||
        question.questionType === 'mcq-mca-w' ||
        question.questionType === 'mcq-sca-tf'
      ) {
        return question.options.map(option => {
          if (questionAnswerHash[question.questionId]) {
            option.userSelected = questionAnswerHash[question.questionId].includes(option.optionId)
          } else {
            option.userSelected = false
          }
          return option
        })
      } if (question.questionType === 'ftb') {
        for (let i = 0; i < question.options.length; i += 1) {
          if (questionAnswerHash[question.questionId]) {
            question.options[i].response = questionAnswerHash[question.questionId][0].split(',')[i]
          }
        }
      } else if (question.questionType === 'mtf') {
        for (let i = 0; i < question.options.length; i += 1) {
          // this.mtfSrc['']
          // if (mtfSrc[question.questionId] && mtfSrc[question.questionId].source[i] && mtfSrc[question.questionId].target[i]) {
          //   for (let j = 0; j < question.options.length; j += 1) {
              let  opText = question.options[i].text.trim()
              opText = opText.replace(/\&lt;/g, '<').replace(/\&gt;/g, '>')
              opText = this.extractContent(opText)
              if (mtfSrc[question.questionId] && mtfSrc[question.questionId].source.length
                && mtfSrc[question.questionId].source.includes(opText.replace(/<(.|\n)*?>/g, ''))) {
                  // tslint:disable-next-line: max-line-length
                const stringRemoveSlashN =  this.extractContent(question.options[i].text.replace(/\n/g, '').replace(/\&lt;/g, '<').replace(/\&gt;/g, '>'))
                const idxOfSource = _.indexOf(mtfSrc[question.questionId].source, stringRemoveSlashN.replace(/<(.|\n)*?>/g, ''))
                const targetId = mtfSrc[question.questionId].target[idxOfSource]
                if (targetId) {
                  const lastChar = targetId.slice(-1)
                  if (question && lastChar) {
                    question.options[i].response = question.rhsChoices && question.rhsChoices[Number(lastChar) - 1]
                  }
                  question.options[i].userSelected = true
                } else {
                  question.options[i].userSelected = false
                }

              // }
            // }
          } else {
            question.options[i].response = ''
          }
        }
        // for (let i = 0; i < question.options.length; i += 1) {
        //   if (questionAnswerHash[question.questionId] && questionAnswerHash[question.questionId][0][i]) {
        //     for (let j = 0; j < questionAnswerHash[question.questionId][0].length; j += 1) {
        //       if (question.options[i].text.trim() === questionAnswerHash[question.questionId][0][j].source.innerText.trim()) {
        //         question.options[i].response = questionAnswerHash[question.questionId][0][j].target.innerText
        //       }
        //     }
        //   } else {
        //     question.options[i].response = ''
        //   }
        // }
      }
      return question
    })
    return quizWithAnswers
  }

  extractContent(htmlData: any) {
    const spanData = document.createElement('span')
    spanData.innerHTML = htmlData
    const text = spanData.textContent || spanData.innerText || ''

    // Replace non-breaking spaces (U+00A0) with regular spaces (U+0020)
    return text.replace(/\u00A0/g, ' ')
  }

  sanitizeAssessmentSubmitRequest(requestData: NSPractice.IQuizSubmitRequest): NSPractice.IQuizSubmitRequest {
    requestData.questions.map(question => {
      question.question = ''
      question.options.map(option => {
        option.hint = ''
        option.text = question.questionType === 'ftb' || question.questionType === 'mtf' ? option.text : ''
      })
    })
    return requestData
  }

  getSection(sectionId: string, forPreview?: any, postReqData?: any, collectionId?: any): Observable<any> {
    const retryOnServerError = retryWhen(errors =>
      errors.pipe(
        concatMap((error, count) => {
          // Only retry on 500 status code and maximum of 2 retries
          if (count < 2 && error.status === 500) {
            return of(error).pipe(delay(1000)) // 1 second delay between retries
          }
          return throwError(error)
        })
      )
    )

    return this.isApiEnabled('questionPaperSections', API_END_POINTS.QUESTION_PAPER_SECTIONS).pipe(
      switchMap((enabled: boolean) => {
        if (!enabled) { return EMPTY }
        if (forPreview && !forcreator) {
          return this.http.post<NSPractice.ISectionResponse>(
            API_END_POINTS.PUBLIC_QUESTION_READ,
            postReqData
          ).pipe(retryOnServerError)
        }
        if (forcreator) {
          return this.http.get<NSPractice.ISectionResponse>(
            `${API_END_POINTS.QUESTION_PAPER_SECTIONS}/${sectionId}?editMode=true`
          ).pipe(retryOnServerError)
        }
        return this.http.get<NSPractice.ISectionResponse>(
          `${API_END_POINTS.QUESTION_PAPER_SECTIONS}/${sectionId}?parentContextId=${collectionId}`
        ).pipe(retryOnServerError)
      }),
    )
  }

  getQuestions(identifiers: string[], assessmentId: string,
               forPreview?: any, userDetails?: any, collectionId?: any): Observable<{ count: Number, questions: any[] }> {
    const data = {
      assessmentId,
      request: {
        search: {
          identifier: identifiers,
        },
      },
    }
    return this.isApiEnabled('questionPaperQuestions', API_END_POINTS.QUESTION_PAPER_QUESTIONS).pipe(
      switchMap((enabled: boolean) => {
        if (!enabled) { return EMPTY }
        if (forPreview && !forcreator) {
          const forPreviewData = {
            assessmentIdentifier: assessmentId,
            contextId: collectionId,
            request: {
              search: {
                identifier: identifiers,
              },
            },
            ...userDetails,
          }
          return this.http.post<{ count: Number, questions: any[] }>(
            API_END_POINTS.PUBLIC_QUESTION_LIST, forPreviewData)
        }
        if (forcreator) {
          // tslint:disable-next-line: max-line-length
          return this.http.post<{ count: Number, questions: any[] }>(`${API_END_POINTS.QUESTION_PAPER_QUESTIONS}?editMode=true`, data)
        }
        return this.http.post<{ count: Number, questions: any[] }>(API_END_POINTS.QUESTION_PAPER_QUESTIONS, data)
      }),
    )
  }

  getSectionV4(sectionId: string, forPreview?: any, postReqData?: any, collectionId?: any): Observable<any> {
    const retryOnServerError = retryWhen(errors =>
      errors.pipe(
        concatMap((error, count) => {
          // Only retry on 500 status code and maximum of 2 retries
          if (count < 2 && error.status === 500) {
            return of(error).pipe(delay(1000)) // 1 second delay between retries
          }
          return throwError(error)
        })
      )
    )
    return this.isApiEnabled('questionPaperSectionsV4', API_END_POINTS.QUESTION_PAPER_SECTIONS_V4).pipe(
      switchMap((enabled: boolean) => {
        if (!enabled) { return EMPTY }
        if (forPreview && !forcreator) {
          return this.http.post<NSPractice.ISectionResponse>(API_END_POINTS.PUBLIC_QUESTION_V4_READ, postReqData).pipe(retryOnServerError)
        }
        if (forcreator) {
          // tslint:disable-next-line: max-line-length
          return this.http.get<NSPractice.ISectionResponse>(`${API_END_POINTS.QUESTION_PAPER_SECTIONS_V4}/${sectionId}?editMode=true`).pipe(retryOnServerError)
        }
        // tslint:disable-next-line: max-line-length
        return this.http.get<NSPractice.ISectionResponse>(`${API_END_POINTS.QUESTION_PAPER_SECTIONS_V4}/${sectionId}?parentContextId=${collectionId}`).pipe(retryOnServerError)
      }),
    )
  }

  getQuestionsV4(identifiers: string[], assessmentId: string,
                 forPreview?: any, userDetails?: any, collectionId?: any): Observable<{ count: Number, questions: any[] }> {
    const data = {
      assessmentId,
      request: {
        search: {
          identifier: identifiers,
        },
      },
    }
    return this.isApiEnabled('questionPaperQuestionsV4', API_END_POINTS.QUESTION_PAPER_QUESTIONS_V4).pipe(
      switchMap((enabled: boolean) => {
        if (!enabled) { return EMPTY }
        if (forPreview && !forcreator) {
          const forPreviewData = {
            assessmentIdentifier: assessmentId,
            contextId: collectionId,
            request: {
              search: {
                identifier: identifiers,
              },
            },
            ...userDetails,
          }
          return this.http.post<{ count: Number, questions: any[] }>(
            API_END_POINTS.PUBLIC_QUESTION_V4_LIST, forPreviewData)
        }
        if (forcreator) {
          // tslint:disable-next-line: max-line-length
          return this.http.post<{ count: Number, questions: any[] }>(`${API_END_POINTS.QUESTION_PAPER_QUESTIONS_V4}?editMode=true`, data)
        }
        // tslint:disable-next-line: max-line-length
        return this.http.post<{ count: Number, questions: any[] }>(API_END_POINTS.QUESTION_PAPER_QUESTIONS_V4, data)
      }),
    )
  }

  shuffle(array: any[] | (string | undefined)[]) {
    let currentIndex = array.length
    let temporaryValue
    let randomIndex

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex)
      currentIndex -= 1

      // And swap it with the current element.
      temporaryValue = array[currentIndex]
      array[currentIndex] = array[randomIndex]
      array[randomIndex] = temporaryValue
    }

    return array
  }

  canAttend(identifier: string): Observable<NSPractice.IRetakeAssessment> {
    if (identifier) {
      return this.isApiEnabled('canAttempt', API_END_POINTS.CAN_ATTEMPT(identifier)).pipe(
        switchMap((enabled: boolean) => enabled
          ? this.http.get<any>(API_END_POINTS.CAN_ATTEMPT(identifier)).pipe(map(r => r.result))
          : of({ attemptsMade: 0, attemptsAllowed: 1 })
        ),
      )
    }
    return of({
      attemptsMade: 0,
      attemptsAllowed: 1,
    })
  }

  canAttendV5(identifier: string): Observable<NSPractice.IRetakeAssessment> {
    if (identifier) {
      return this.isApiEnabled('canAttemptV5', API_END_POINTS.CAN_ATTEMPT_V5(identifier)).pipe(
        switchMap((enabled: boolean) => enabled
          ? this.http.get<any>(API_END_POINTS.CAN_ATTEMPT_V5(identifier)).pipe(map(r => r.result))
          : of({ attemptsMade: 0, attemptsAllowed: 1 })
        ),
      )
    }
    return of({
      attemptsMade: 0,
      attemptsAllowed: 1,
    })
  }

  canAttendV7(identifier: string): Observable<NSPractice.IRetakeAssessment> {
    if (identifier) {
      return this.isApiEnabled('canAttemptV7', API_END_POINTS.CAN_ATTEMPT_V7(identifier)).pipe(
        switchMap((enabled: boolean) => enabled
          ? this.http.get<any>(API_END_POINTS.CAN_ATTEMPT_V7(identifier)).pipe(map(r => r.result))
          : of({ attemptsMade: 0, attemptsAllowed: 1 })
        ),
      )
    }
    return of({
      attemptsMade: 0,
      attemptsAllowed: 1,
    })
  }

  saveAndNextQuestion(req: NSPractice.IQuizSubmit) {
    return this.isApiEnabled('saveAndNextQuestion', API_END_POINTS.SAVE_AND_NEXT_QUESTION).pipe(
      switchMap((enabled: boolean) => enabled
        ? this.http.post<{ result: NSPractice.IQuizSubmitResponseV2 }>(API_END_POINTS.SAVE_AND_NEXT_QUESTION, req).pipe(map(response => {
          return response
        }))
        : EMPTY
      ),
    )
  }

  shCorrectAnswer(val: boolean) {
    this.displayCorrectAnswer.next(val)
  }
}
