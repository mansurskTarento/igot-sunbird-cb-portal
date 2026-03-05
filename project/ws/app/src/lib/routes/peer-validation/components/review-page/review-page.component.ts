import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { MatDialog } from '@angular/material/dialog'
import { PeerValidationService } from '../../services/peer-validation.service'
import { NSPeerValidation } from '../../models/peer-validation.model'
import { SuccessDialogComponent } from '../survey-dialog/components/success-dialog/success-dialog.component'
import { VideoPreviewDialogComponent } from '../survey-dialog/components/video-preview-dialog/video-preview-dialog.component'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'

@Component({
  selector: 'ws-app-review-page',
  templateUrl: './review-page.component.html',
  styleUrls: ['./review-page.component.scss'],
})
export class ReviewPageComponent implements OnInit {
  requestId: string | null = null
  requestData: NSPeerValidation.IReviewRequest | null = null
  learnerName: string | null = null
  designation: string | null = null
  // Confirmation Checkbox
  clarificationChecked = false
  currentUserId: string | null = null

  surveyQuestions: any[] = [] // Ideally retrieve from service map

  // Peer Selection
  availablePeers: NSPeerValidation.IPeerInfo[] = []
  selectedForwardPeer: NSPeerValidation.IPeerInfo | null = null
  excludedIds: string[] = []

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private peerValidationService: PeerValidationService,
    private dialog: MatDialog,
    private configSvc: ConfigurationsService,
  ) { }

  ngOnInit() {
    this.requestId = this.route.snapshot.paramMap.get('id')
    if (this.requestId) {
      this.fetchRequestData(this.requestId)
    }

    this.currentUserId = this.configSvc.userProfile?.userId || null

    // Exclude current user from search (e.g. Harshit Rao)
    if (this.configSvc.userProfile && this.configSvc.userProfile.userId) {
      this.excludedIds = [this.configSvc.userProfile.userId]
    }

    this.loadQuestions()
    this.learnerName = `${this.configSvc.userProfile?.firstName || ''} ${this.configSvc.userProfile?.lastName || ''}`
    this.designation = this.configSvc?.userProfile?.professionalDetails?.[0]?.designation
  }

  loadQuestions() {
    this.peerValidationService.getSurveyQuestions().subscribe(qs => {
      this.surveyQuestions = qs
    })
  }

  fetchRequestData(id: string) {
    this.peerValidationService.getReviewRequest(id).subscribe(data => {
      this.requestData = data
      this.selectedForwardPeer = null // cleared by default as per request
      this.updateExcludedIds()
    })
  }

  updateExcludedIds() {
    const ids = new Set<string>()
    if (this.currentUserId) ids.add(this.currentUserId)

    if (this.requestData) {
      if (this.requestData.reportingOfficer?.id) ids.add(this.requestData.reportingOfficer.id)
      // Use optional chaining carefully if types are not strictly defined yet in TS
      // @ts-ignore
      if (this.requestData.peer?.id) ids.add(this.requestData.peer.id)
      // @ts-ignore
      if (this.requestData.subordinate?.id) ids.add(this.requestData.subordinate.id)
    }

    this.excludedIds = Array.from(ids)
  }

  getResponseForQuestion(questionId: string): any {
    if (!this.requestData) return null
    const response = this.requestData.responses.find(r => r.questionId === questionId)
    return response ? response.value : null
  }

  getMultiSelectResponse(questionId: string): string[] {
    const value = this.getResponseForQuestion(questionId)
    return Array.isArray(value) ? value : []
  }

  goBack() {
    this.router.navigate(['/app/peer-validation'])
  }

  approve() {
    if (!this.requestId) return

    const submission: NSPeerValidation.IReviewSubmission = {
      requestId: this.requestId,
      ratings: [], // Fill if there are reviewer ratings
      decision: 'approved',
    }
    this.peerValidationService.submitReview(submission).subscribe(() => {
      const dialogRef = this.dialog.open(SuccessDialogComponent, {
        width: '400px',
        panelClass: 'custom-success-dialog',
      })

      dialogRef.afterClosed().subscribe(() => {
        this.goBack()
      })
    })
  }

  reject() {
    if (!this.requestId) return
      const submission: NSPeerValidation.IReviewSubmission = {
        requestId: this.requestId,
        ratings: [],
        decision: 'rejected',
      }
      this.peerValidationService.submitReview(submission).subscribe(() => {

        const dialogRef = this.dialog.open(SuccessDialogComponent, {
          width: '400px',
          panelClass: 'custom-success-dialog',
        })

        dialogRef.afterClosed().subscribe(() => {
          this.goBack()
        })
      })
  }

  // Helper for array generation for read-only rating
  getRange(n: number) {
    return Array.from({ length: n }, (_, i) => i + 1)
  }

  // Helper to format file size
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  // Preview document (video or PDF)
  previewDocument(doc: NSPeerValidation.IUploadedDocument) {
    this.dialog.open(VideoPreviewDialogComponent, {
      width: '800px',
      maxWidth: '90vw',
      height: doc.type.includes('pdf') ? '90vh' : 'auto',
      data: {
        url: doc.url,
        name: doc.name,
        type: doc.type,
      },
    })
  }

  // Search Table Logic
  showForwardPeerSearch = false

  toggleSearch() {
    this.showForwardPeerSearch = !this.showForwardPeerSearch
  }

  onPeerSelected(peer: any) {
    this.selectedForwardPeer = peer
    this.showForwardPeerSearch = false
  }

  getDisplayName(user: any): string {
    if (!user) return ''
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim()
    }
    return user.name || ''
  }
}
