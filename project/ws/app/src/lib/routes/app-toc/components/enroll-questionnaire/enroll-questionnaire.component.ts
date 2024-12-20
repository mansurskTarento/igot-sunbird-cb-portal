import { Component, OnInit, Inject } from '@angular/core'
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
@Component({
  selector: 'ws-app-enroll-questionnaire',
  templateUrl: './enroll-questionnaire.component.html',
  styleUrls: ['./enroll-questionnaire.component.scss'],
})
export class EnrollQuestionnaireComponent implements OnInit {
  public afterSubmitAction = this.checkAfterSubmit.bind(this)
  isReadOnly = false

  constructor(
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<EnrollQuestionnaireComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  public checkAfterSubmit(_e: any) {
    // this.renderSubject.next()
    // tslint:disable-next-line:no-console
    console.log('Form is submitted successfully')
    this.openSnackbar('Form is submitted successfully')
    this.dialogRef.close(true)
  }

  private openSnackbar(primaryMsg: string, duration: number = 5000) {
    this.snackBar.open(primaryMsg, 'X', {
      duration,
    })
  }

  ngOnInit() {
  }

}
