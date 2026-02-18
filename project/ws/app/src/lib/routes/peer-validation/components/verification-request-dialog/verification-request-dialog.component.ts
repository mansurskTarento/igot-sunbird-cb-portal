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
    @Inject(MAT_DIALOG_DATA) public data: { learnerName: string, requestId: string },
    private router: Router
  ) { }

  onYes() {
    this.dialogRef.close()
    // Navigate to the review page
    this.router.navigate(['/app/peer-validation/review', this.data.requestId])
  }

  onNo() {
    this.dialogRef.close()
  }
}
