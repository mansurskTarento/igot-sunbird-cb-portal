import { Component, Inject } from '@angular/core'
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog'
import { NSPeerValidation } from '../../models/peer-validation.model'
import { SurveyDialogComponent } from '../survey-dialog/survey-dialog.component'
import { PeerValidationService } from '../../services/peer-validation.service'

@Component({
    selector: 'ws-app-survey-popup',
    templateUrl: './survey-popup.component.html',
    styleUrls: ['./survey-popup.component.scss'],
    standalone: false
})
export class SurveyPopupComponent {
  constructor(
    public dialogRef: MatDialogRef<SurveyPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NSPeerValidation.ISurveyPopupData,
    private dialog: MatDialog,
    private peerValidationService: PeerValidationService,
  ) { }

  onYes() {
    const surveyDialogRef = this.dialog.open(SurveyDialogComponent, {
      width: '1100px',
      maxWidth: '95vw',
      disableClose: true,
      data: this.data,
    })
    this.dialogRef.close()
    surveyDialogRef.afterClosed().subscribe((result: string) => {
      if (result === 'submitted') {
        this.peerValidationService.notificationSubmitted$.next()
      }
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
          error: () => this.dialogRef.close(),
        })
    } else {
      this.dialogRef.close()
    }
  }
  onNo() {
    this.dialogRef.close()
  }
}
