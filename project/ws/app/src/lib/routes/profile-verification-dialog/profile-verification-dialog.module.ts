import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { TranslateModule } from '@ngx-translate/core'
import { MatButtonModule } from '@angular/material/button'
import { ProfileVerificationDialogComponent } from './profile-verification-dialog.component'

@NgModule({
  declarations: [ProfileVerificationDialogComponent],
  imports: [
    CommonModule,
    TranslateModule,
    MatButtonModule,
  ],
  exports: [ProfileVerificationDialogComponent],
})
export class ProfileVerificationDialogModule { }
