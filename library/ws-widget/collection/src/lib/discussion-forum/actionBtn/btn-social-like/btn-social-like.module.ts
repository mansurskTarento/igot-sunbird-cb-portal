import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { BtnSocialLikeComponent } from './btn-social-like.component'
import { DialogSocialActivityUserModule } from '../../dialog/dialog-social-activity-user/dialog-social-activity-user.module'
import { MatBadgeModule } from '@angular/material/badge'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip'

@NgModule({
  declarations: [BtnSocialLikeComponent],
  imports: [
    CommonModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    MatBadgeModule,
    DialogSocialActivityUserModule,
  ],
  exports: [BtnSocialLikeComponent],
})
export class BtnSocialLikeModule {}
