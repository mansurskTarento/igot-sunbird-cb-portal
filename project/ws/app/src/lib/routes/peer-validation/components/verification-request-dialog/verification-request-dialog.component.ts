import { Component, Inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { Router } from '@angular/router'

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
    },
    private router: Router
  ) { }

  onYes() {
    this.dialogRef.close()
    this.router.navigate(['/app/peer-validation/review', this.data.formId], {
      queryParams: {
        courseName: this.data.courseName || '',
        requestedName: this.data.requestedName || '',
        formId: this.data.formId || '',
        notificationId: this.data.notificationId || '',
        surveyEndDate: this.data.surveyEndDate || '',
        createdAt: this.data.createdAt || '',
      },
      state: {
        requestedName: this.data.requestedName,
        courseName: this.data.courseName,
        formId: this.data.formId,
        isReviewSubmitted: this.data.isReviewSubmitted,
        surveyEndDate: this.data.surveyEndDate,
        notificationId: this.data.notificationId || '',
        createdAt: this.data.createdAt || ''
      },
    })
  }
  onNoButton() {
    this.dialogRef.close()
  }

  onNo() {
    this.dialogRef.close()
  }
}
