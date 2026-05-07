import { Component } from '@angular/core'
import { MatDialogRef } from '@angular/material/dialog'

@Component({
    selector: 'ws-app-success-dialog',
    templateUrl: './success-dialog.component.html',
    styleUrls: ['./success-dialog.component.scss'],
    standalone: false
})
export class SuccessDialogComponent {
  constructor(public dialogRef: MatDialogRef<SuccessDialogComponent>) { }

  onDone() {
    this.dialogRef.close()
  }
}
