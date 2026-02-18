import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { PeerValidationMockService } from './peer-validation-mock.service'
import { NSPeerValidation } from '../models/peer-validation.model'
import { HttpClient } from '@angular/common/http'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
@Injectable({
  providedIn: 'root',
})
export class PeerValidationService {
  constructor(private http: HttpClient, private configSvc: ConfigurationsService, private mockService: PeerValidationMockService) { }


  getAllUsers() {
    const rootOrgId = this.configSvc.userProfile?.rootOrgId
    const reqBody = {
      request: {
        query: '',
        filters: {
          rootOrgId,
          // status: 1,
        },
        // limit: 1000,
      },
    }
    return this.http.post('/apis/proxies/v8/user/v1/search', reqBody)
  }
  getSurveyQuestions(): Observable<NSPeerValidation.ISurveyQuestion[]> {
    return this.mockService.getSurveyQuestions()
  }

  searchPeers(query: string): Observable<NSPeerValidation.IPeerInfo[]> {
    return this.mockService.searchPeers(query)
  }

  uploadDocument(file: File): Observable<NSPeerValidation.IUploadedDocument> {
    return this.mockService.uploadDocument(file)
  }

  submitSurvey(submission: NSPeerValidation.ISurveySubmission): Observable<{ success: boolean, requestId: string }> {
    return this.mockService.submitSurvey(submission)
  }

  getDashboardData(filters: NSPeerValidation.IDashboardFilters): Observable<{ data: NSPeerValidation.IDashboardItem[], count: number }> {
    return this.mockService.getDashboardData(filters)
  }

  getDashboardCounts(): Observable<{ all: number, pending: number, incoming: number }> {
    return this.mockService.getDashboardCounts()
  }

  getReviewRequest(id: string): Observable<NSPeerValidation.IReviewRequest> {
    return this.mockService.getReviewRequest(id)
  }

  submitReview(submission: NSPeerValidation.IReviewSubmission): Observable<{ success: boolean }> {
    return this.mockService.submitReview(submission)
  }

  isEligibleForSurvey(completionDate: string | Date): boolean {
    const completion = new Date(completionDate)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - completion.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays >= 30
  }
}
