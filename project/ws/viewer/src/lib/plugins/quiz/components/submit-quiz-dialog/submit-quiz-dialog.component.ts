import { Component, OnInit, Inject } from '@angular/core'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'

@Component({
    selector: 'viewer-submit-quiz-dialog',
    templateUrl: './submit-quiz-dialog.component.html',
    styleUrls: ['./submit-quiz-dialog.component.scss'],
    standalone: false
})
export class SubmitQuizDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<SubmitQuizDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  ngOnInit() {
  }

}
