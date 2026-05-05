import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { NonReleventFeedbackDialogComponent } from './non-relevent-feedback-dialog.component'
import { MatDialogModule } from '@angular/material/dialog'
import { TranslateModule } from '@ngx-translate/core'
import { MatInputModule } from '@angular/material/input'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatButtonModule } from '@angular/material/button'

@NgModule({
  declarations: [NonReleventFeedbackDialogComponent],
  imports: [
    CommonModule,
    MatDialogModule,
    TranslateModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
  ],
  exports: [NonReleventFeedbackDialogComponent],
})
export class NonReleventFeedbackDialogModule { }
