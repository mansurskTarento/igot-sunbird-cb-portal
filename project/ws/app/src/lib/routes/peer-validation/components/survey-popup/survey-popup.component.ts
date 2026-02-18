import { Component, Inject } from '@angular/core'
import { Router } from '@angular/router'
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog'
import { NSPeerValidation } from '../../models/peer-validation.model'
import { SurveyDialogComponent } from '../survey-dialog/survey-dialog.component'

@Component({
  selector: 'ws-app-survey-popup',
  templateUrl: './survey-popup.component.html',
  styleUrls: ['./survey-popup.component.scss'],
})
export class SurveyPopupComponent {
  constructor(
    public dialogRef: MatDialogRef<SurveyPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NSPeerValidation.ISurveyPopupData,
    private dialog: MatDialog,
    private router: Router
  ) { }

  onYes() {
    this.dialogRef.close()
    // Open the survey dialog
    this.dialog.open(SurveyDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      disableClose: true,
      data: this.data,
    })
  }

  onNo() {
    this.dialogRef.close()
    this.router.navigate(['/app/peer-validation'])
  }
}
