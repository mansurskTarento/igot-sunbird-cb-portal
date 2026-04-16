import { Component, Inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { Router } from '@angular/router'
import { PeerValidationService } from '../../services/peer-validation.service'

@Component({
  selector: 'ws-app-verification-request-dialog',
  templateUrl: './verification-request-dialog.component.html',
  styleUrls: ['./verification-request-dialog.component.scss'],
})
export class VerificationRequestDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<VerificationRequestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      requestedName: string
      courseName: string
      formId: string
      isReviewSubmitted: boolean
      surveyEndDate: string
      notificationId: string
      createdAt: string
      contextId: string
      submittedBy: string
    },
    private router: Router,
    private peerValidationService: PeerValidationService,
  ) { }

  onYes() {
    this.dialogRef.close()
    this.router.navigate(['/app/peer-validation/review', this.data.formId], {
      queryParams: {
        courseName: this.data.courseName || '',
        requestedName: this.data.requestedName || '',
        formId: this.data.formId || '',
        submittedBy: this.data.submittedBy || '',
        courseId: this.data.contextId || '',
        notificationId: this.data.notificationId || '',
        surveyEndDate: this.data.surveyEndDate || '',
        createdAt: this.data.createdAt || '',
      },
      state: {
        requestedName: this.data.requestedName,
        courseName: this.data.courseName,
        formId: this.data.formId,
        submittedBy: this.data.submittedBy || '',
        courseId: this.data.contextId || '',
        isReviewSubmitted: this.data.isReviewSubmitted,
        surveyEndDate: this.data.surveyEndDate,
        notificationId: this.data.notificationId || '',
        createdAt: this.data.createdAt || ''
      },
    })
  }
  onNoButton() {
    if (this.data.notificationId && this.data.createdAt) {
      this.peerValidationService
        .markNotificationIgnored(this.data.notificationId, this.data.createdAt)
        .subscribe({
          next: () => {
            this.peerValidationService.dashboardRefresh$.next()
            this.dialogRef.close('ignored')
          },
          error: () => this.dialogRef.close()
        })
    } else {
      this.dialogRef.close()
    }
  }

  onNo() {
    this.dialogRef.close()
  }
}
