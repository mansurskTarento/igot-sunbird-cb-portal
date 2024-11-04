import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { DialogSocialDeletePostComponent } from './dialog-social-delete-post.component'
import { MatButtonModule } from '@angular/material/button'
import { MatDialogModule } from '@angular/material/dialog'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'

@NgModule({
  declarations: [DialogSocialDeletePostComponent],
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  entryComponents: [DialogSocialDeletePostComponent],
})
export class DialogSocialDeletePostModule {}
