import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
// tslint:disable-next-line: max-line-length

import { MatDialogModule } from '@angular/material/dialog'
import { MatListModule } from '@angular/material/list'
import { RouterModule } from '@angular/router'
import { BtnPageBackModule, BtnSocialLikeModule, BtnSocialVoteModule } from '@sunbird-cb/collection'
import { BtnModeratorModule } from '../widgets/buttons/btn-moderator/btn-moderator.module'
import { DialogBoxModeratorComponent } from '../widgets/Dialog-Box/dialog-box-moderator/dialog-box-moderator.component'
import { DialogBoxModeratorModule } from '../widgets/Dialog-Box/dialog-box-moderator/dialog-box-moderator.module'
import { ModeratorTimelineComponent } from './components/moderator-timeline.component'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatChipsModule } from '@angular/material/chips'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatMenuModule } from '@angular/material/menu'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatToolbarModule } from '@angular/material/toolbar'
@NgModule({
  declarations: [ModeratorTimelineComponent],
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatMenuModule,
    BtnSocialLikeModule,
    RouterModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    BtnPageBackModule,
    BtnPageBackModule,
    BtnSocialVoteModule,
    BtnSocialLikeModule,
    DialogBoxModeratorModule,
    MatButtonModule,
    MatDialogModule,
    MatExpansionModule,
    MatChipsModule,
    MatFormFieldModule,
    BtnModeratorModule,
    MatListModule,
    MatDialogModule,

  ],
  entryComponents: [DialogBoxModeratorComponent],
  exports: [ModeratorTimelineComponent],
})
export class ModeratorTimelineModule { }
