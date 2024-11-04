import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ProfileCertificateDialogComponent } from './profile-certificate-dialog.component'
import { PipeSafeSanitizerModule, PipePublicURLModule } from '@sunbird-cb/utils-v2'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatMenuModule } from '@angular/material/menu'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { MatTooltipModule } from '@angular/material/tooltip'

@NgModule({
  declarations: [ProfileCertificateDialogComponent],
  imports: [
    CommonModule,
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatMenuModule,
    MatSnackBarModule,
    PipeSafeSanitizerModule,
    PipePublicURLModule,
  ],
  exports: [
    ProfileCertificateDialogComponent,
  ],
  entryComponents: [ProfileCertificateDialogComponent],
})
export class ProfileCertificateDialogModule { }
