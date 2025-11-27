import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core'
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog'
import { Router } from '@angular/router'

export interface ProfileVerificationData {
  organization?: string
  designation?: string
  email?: string
  mobile?: string
}

@Component({
  selector: 'ws-profile-verification-dialog',
  templateUrl: './profile-verification-dialog.component.html',
  styleUrls: ['./profile-verification-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ProfileVerificationDialogComponent implements OnInit {
  
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ProfileVerificationData,
    private dialogRef: MatDialogRef<ProfileVerificationDialogComponent>,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialize component
  }

  onVerify() {
    this.dialogRef.close({ action: 'verify' })
  }

  onUpdateProfile() {
    this.dialogRef.close({ action: 'update' })
    // Navigate to profile update page
    this.router.navigate(['/app/person-profile'])
  }

  onClose() {
    this.dialogRef.close({ action: 'close' })
  }
}
