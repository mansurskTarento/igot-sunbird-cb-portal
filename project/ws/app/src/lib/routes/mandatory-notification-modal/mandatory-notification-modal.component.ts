import { Component, Inject } from '@angular/core'
import { EventService } from '@sunbird-cb/utils-v2'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
@Component({
    selector: 'ws-mandatory-notification-modal',
    templateUrl: './mandatory-notification-modal.component.html',
    styleUrls: ['./mandatory-notification-modal.component.scss'],
    standalone: false
})
export class MandatoryNotificationModalComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private events: EventService,
    private dialogRef: MatDialogRef<MandatoryNotificationModalComponent>,
  ) {
    this.dialogRef.disableClose = true
  }

  onAccept(): void {
    this.raiseTelemetryForShare('accept')
    this.dialogRef.close('accepted')
  }

  onReject(): void {
    this.raiseTelemetryForShare('reject')
    this.dialogRef.close('rejected')
  }
  raiseTelemetryForShare(subType: any) {
    this.events.raiseInteractTelemetry(
      {
        type: 'click',
        subType,
        id: 'mandatory-notification-modal',
      },
      {
        id: this.data?.notification?.message?.data?.assessmentId || '',
        type: this.data?.notification?.message?.data?.primaryCategory || 'Comprehensive Assessment Program',
      },
      {
        module: 'mandatory-notification'
      }
    )
  }
}
