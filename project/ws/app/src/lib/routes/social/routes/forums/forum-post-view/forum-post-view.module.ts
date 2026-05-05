import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { BtnSocialVoteModule, BtnSocialLikeModule } from '@sunbird-cb/collection'
import { ForumPostViewComponent } from './components/forum-post-view.component'
import { ForumCardModule } from '../forum-card/forum-card.module'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'

@NgModule({
  declarations: [ForumPostViewComponent],
  imports: [
    CommonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatButtonModule,
    BtnSocialVoteModule,
    BtnSocialLikeModule,
    RouterModule,
    ForumCardModule,
  ],
  exports: [ForumPostViewComponent],
})
export class ForumPostViewModule { }
