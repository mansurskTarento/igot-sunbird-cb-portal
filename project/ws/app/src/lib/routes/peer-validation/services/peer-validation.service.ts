import { Injectable } from '@angular/core'
import { Observable, forkJoin, Subject } from 'rxjs'
import { map, switchMap } from 'rxjs/operators'
import { NSPeerValidation } from '../models/peer-validation.model'
import { HttpClient } from '@angular/common/http'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'

const API_END_POINTS = {
  GET_SURVEY_FORM: (formId: string) => `/apis/proxies/v8/forms/v2/getFormById?formId=${formId}`,
  GET_USER_BY_ID: (id: string) => `/apis/proxies/v8/api/user/v2/read/${id}`,
  SEARCH_USERS: '/apis/proxies/v8/user/v1/search',
  SUBMIT_SURVEY: '/apis/proxies/v8/forms/peersurvey/submit',
  SEARCH_SUBMISSIONS: '/apis/proxies/v8/forms/v2/submissions/search',
  UPLOAD_FILE: (formId: string) => `/apis/proxies/v8/peersurvey/upload?formId=${formId}`,
  GET_NOTIFICATIONS: (subType: string, page: number, size: number) =>
    `/apis/proxies/v8/v1/notifications/peervalidation/list?subType=${subType}&page=${page}&size=${size}`,
  MARK_NOTIFICATION_READ: '/apis/proxies/v8/v1/notifications/v2/read',
}

@Injectable({
  providedIn: 'root',
})
export class PeerValidationService {
  /** Emits whenever a survey or review is successfully submitted — dashboard subscribes to trigger a refresh. */
  readonly dashboardRefresh$ = new Subject<void>()

  constructor(private http: HttpClient, private configSvc: ConfigurationsService) { }


  getAllUsers(rootOrgId?: string) {
    const orgId = rootOrgId || this.configSvc.userProfile?.rootOrgId
    const reqBody = {
      request: {
        query: '',
        filters: {
          rootOrgId: orgId,
        },
      },
    }
    return this.http.post(API_END_POINTS.SEARCH_USERS, reqBody)
  }

  getUserById(userId: string): Observable<any> {
    return this.http.get<any>(API_END_POINTS.GET_USER_BY_ID(userId))
  }

  getAllUsersBySurveyCreator(surveyCreatedById: string): Observable<any> {
    return this.getUserById(surveyCreatedById).pipe(
      switchMap((res: any) => {
        const rootOrgId =
          res?.result?.response?.rootOrgId ||
          res?.result?.rootOrgId ||
          this.configSvc.userProfile?.rootOrgId
        return this.getAllUsers(rootOrgId)
      })
    )
  }

  getSurveyQuestions(formId?: string): Observable<NSPeerValidation.ISurveyQuestion[]> {
    return this.http.get<any>(API_END_POINTS.GET_SURVEY_FORM(formId || '')).pipe(
      map((res: any) => {
        // Detect application-level failure (HTTP 200 but status: 'failed')
        if (res?.params?.status === 'failed') {
          throw new Error(res?.params?.errMsg || 'Failed to load survey form.')
        }
        const fields: any[] = (res && res.result && res.result.response && res.result.response.fields) || []
        return fields
          .filter((field: any) => field.fieldType !== 'separator' && field.fieldType !== 'heading')
          .map((field: any, index: number): NSPeerValidation.ISurveyQuestion => {
            let type: NSPeerValidation.ISurveyQuestion['type'] = 'textArea'
            if (field.fieldType === 'numericRating' || field.fieldType === 'rating' || field.fieldType === 'range') {
              type = 'numericRating'
            } else if (field.fieldType === 'textarea' || field.fieldType === 'text') {
              type = 'textArea'
            } else if (field.fieldType === 'radio' || field.fieldType === 'dropdown' || field.fieldType === 'single-select') {
              type = 'radio'
            } else if (field.fieldType === 'checkbox' || field.fieldType === 'multi-select') {
              type = 'checkbox'
            }

            // For radio/checkbox: options come from field.values [{value, key}]
            // For other types: options may come from field.options
            let options: string[] | undefined
            if (field.values && field.values.length > 0 && (type === 'radio' || type === 'checkbox')) {
              options = field.values.map((v: any) => v.value || v.key || '')
            } else if (field.options) {
              options = field.options.map((opt: any) => (typeof opt === 'string' ? opt : opt.label || opt.value || opt))
            }

            // ratingCount: for numericRating use values array length
            const ratingCount: number = (type === 'numericRating' && field.values?.length) ? field.values.length : 5

            return {
              id: field.id || field.name || `Q${index + 1}`,
              text: field.label || field.name || '',
              type,
              required: field.isRequired || false,
              maxLength: field.maxLength,
              options,
              minLabel: field.minLabel,
              maxLabel: field.maxLabel,
              ratingCount,
            }
          })
      })
    )
  }

  uploadDocument(file: File, formId: string): Observable<NSPeerValidation.IUploadedDocument> {
    const formData = new FormData()
    formData.append('file', file)
    return this.http.post<any>(API_END_POINTS.UPLOAD_FILE(formId), formData).pipe(
      map((res: any) => {
        if (res?.params?.status === 'failed' || res?.params?.err) {
          throw new Error(res?.params?.errmsg || 'Upload failed.')
        }
        return {
          id: `DOC_${Date.now()}`,
          name: file.name,
          type: file.type,
          size: file.size,
          url: res.result.url,
          uploadedAt: new Date(),
        } as NSPeerValidation.IUploadedDocument
      })
    )
  }

  submitSurvey(submission: NSPeerValidation.ISurveySubmission): Observable<any> {
    return this.http.post(API_END_POINTS.SUBMIT_SURVEY, submission)
  }

  getDashboardData(filters: NSPeerValidation.IDashboardFilters): Observable<{ data: NSPeerValidation.IDashboardItem[], count: number }> {
    const subType = filters.tab === 0 ? 'PEER_EVALUATION_ASSIGNED' : 'PEER_REVIEW_ASSIGNED'
    return this.http.get<any>(API_END_POINTS.GET_NOTIFICATIONS(subType, filters.pageIndex, filters.pageSize)).pipe(
      map((res: any) => {
        const notifications: NSPeerValidation.IDashboardItem[] = res?.result?.notifications || []
        return {
          data: notifications,
          count: res?.result?.totalCount || 0,
        }
      })
    )
  }

  markNotificationIgnored(notificationId: string, createdAt: string): Observable<any> {
    const body = {
      request: {
        type: 'individual',
        ids: [notificationId],
        created_at: createdAt,
        status: 'IGNORED',
      },
    }
    return this.http.patch(API_END_POINTS.MARK_NOTIFICATION_READ, body)
  }

  getDashboardCounts(): Observable<{ all: number, pending: number, incoming: number }> {
    return forkJoin([
      this.http.get<any>(API_END_POINTS.GET_NOTIFICATIONS('PEER_EVALUATION_ASSIGNED', 0, 1)),
      this.http.get<any>(API_END_POINTS.GET_NOTIFICATIONS('PEER_REVIEW_ASSIGNED', 0, 1)),
    ]).pipe(
      map(([pendingRes, incomingRes]) => {
        const pending = pendingRes?.result?.totalCount || 0
        const incoming = incomingRes?.result?.totalCount || 0
        return { all: pending + incoming, pending, incoming }
      })
    )
  }

  // Fetch a learner's submission for the review page
  getSubmission(submittedBy: string, formId: string, courseId: string): Observable<NSPeerValidation.IReviewRequest | null> {
    const body = {
      filters: { submittedBy, formId, contextId: courseId },
      sortBy: 'submittedDate',
      sortOrder: 'DESC',
      size: 1,
    }
    return this.http.post<any>(API_END_POINTS.SEARCH_SUBMISSIONS, body).pipe(
      map((res: any) => {
        const content: any[] = res?.result?.response?.content
        if (!content || content.length === 0) return null
        const item = content[0]
        return {
          submissionId: item.submissionId,
          formId: item.formId || '',
          submittedBy: item.submittedBy || '',
          learnerName: item.fullName || '',
          courseName: item.contextName || '',
          completionDate: item.submittedDate
            ? new Date(item.submittedDate).toLocaleDateString()
            : '',
          contextId: item.contextId || '',
          contextOrgId: item.contextOrgId || '',
          status: item.status || '',
          responses: (item.responses || []).map((r: any) => ({
            questionId: r.questionId,
            question: r.question || '',
            answer: r.answer,
            answerType: r.answerType || '',
          })),
          attachments: item.attachments || [],
        } as NSPeerValidation.IReviewRequest
      })
    )
  }

  submitReview(submission: NSPeerValidation.IReviewSubmission): Observable<any> {
    return this.http.post(API_END_POINTS.SUBMIT_SURVEY, submission)
  }
}
