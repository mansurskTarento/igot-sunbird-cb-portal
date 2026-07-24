import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { MatIconModule } from '@angular/material/icon'
import { MatButtonModule } from '@angular/material/button'
import { MatTooltipModule } from '@angular/material/tooltip'
import { AvatarPhotoModule } from '@sunbird-cb/collection'
import { TranslateModule } from '@ngx-translate/core'

import { KarmaLeaderboardComponent } from './karma-leaderboard.component'

@NgModule({
  declarations: [KarmaLeaderboardComponent],
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    AvatarPhotoModule,
    TranslateModule,
  ],
  exports: [KarmaLeaderboardComponent],
})
export class KarmaLeaderboardModule { }
