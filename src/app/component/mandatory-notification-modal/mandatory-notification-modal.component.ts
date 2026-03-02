import { Component, Inject } from '@angular/core'
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog'

export interface MandatoryNotificationData {

}

@Component({
  selector: 'ws-mandatory-notification-modal',
  templateUrl: './mandatory-notification-modal.component.html',
  styleUrls: ['./mandatory-notification-modal.component.scss'],
})
export class MandatoryNotificationModalComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: MandatoryNotificationData,
    private dialogRef: MatDialogRef<MandatoryNotificationModalComponent>,
  ) {
    this.dialogRef.disableClose = true
  }

  onAccept(): void {
    this.dialogRef.close('accepted')
  }

  onReject(): void {
    this.dialogRef.close('rejected')
  }
}
