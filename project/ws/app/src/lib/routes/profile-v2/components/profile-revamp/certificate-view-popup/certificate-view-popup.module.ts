import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { MatIconModule } from '@angular/material/icon'
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog'
import { TranslateModule } from '@ngx-translate/core'
import { CertificateViewPopupComponent } from './certificate-view-popup.component'

@NgModule({
  declarations: [CertificateViewPopupComponent],
  imports: [
    CommonModule,
    MatIconModule,
    MatDialogModule,
    TranslateModule,
  ],
  exports: [CertificateViewPopupComponent],
})
export class CertificateViewPopupModule {}
