import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { PlayerBriefComponent } from './player-brief.component'
import { PipeCountTransformModule, PipeDurationTransformModule } from '@sunbird-cb/utils-v2'
import { DisplayContentTypeModule } from '../display-content-type/display-content-type.module'
import { UserContentRatingModule } from '../user-content-rating/user-content-rating.module'
import { UserImageModule } from '../user-image/user-image.module'
import { BtnMailUserModule } from '../../btn-mail-user/btn-mail-user.module'
import { MarkAsCompleteModule } from '../mark-as-complete/mark-as-complete.module'
import { TranslateModule } from '@ngx-translate/core'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatChipsModule } from '@angular/material/chips'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'

@NgModule({
  declarations: [PlayerBriefComponent],
  imports: [
    CommonModule,
    PipeCountTransformModule,
    PipeDurationTransformModule,
    DisplayContentTypeModule,
    MatDividerModule,
    MatChipsModule,
    MatIconModule,
    UserContentRatingModule,
    MatCardModule,
    UserImageModule,
    BtnMailUserModule,
    MatButtonModule,
    MarkAsCompleteModule,
    TranslateModule.forChild(),
  ],
  exports: [PlayerBriefComponent],
})
export class PlayerBriefModule { }
