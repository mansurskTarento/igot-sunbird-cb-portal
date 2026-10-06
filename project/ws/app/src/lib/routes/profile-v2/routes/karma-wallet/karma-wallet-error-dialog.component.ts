import { Component, Inject, ViewEncapsulation } from '@angular/core'
import { Location } from '@angular/common'
import { Router } from '@angular/router'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'

const HOME_ROUTE = '/page/home'

export interface IKarmaWalletErrorDialogData {
  canGoBack: boolean
}

@Component({
  selector: 'ws-app-karma-wallet-error-dialog',
  templateUrl: './karma-wallet-error-dialog.component.html',
  styleUrls: ['./karma-wallet-error-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: false,
})
export class KarmaWalletErrorDialogComponent {

  constructor(
    private dialogRef: MatDialogRef<KarmaWalletErrorDialogComponent>,
    private location: Location,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) private data: IKarmaWalletErrorDialogData | null,
  ) { }

  goBack() {
    this.dialogRef.close()
    if (this.data && this.data.canGoBack) {
      this.location.back()
      return
    }
    this.router.navigate([HOME_ROUTE])
  }
}
