import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { BlogViewComponent } from './components/blog-view.component'
import { RouterModule } from '@angular/router'
import {
  UserImageModule,
  BtnSocialLikeModule,
  BtnSocialVoteModule,
  EditorQuillModule,
  BtnPageBackModule,
} from '@sunbird-cb/collection'
import { PipeSafeSanitizerModule } from '@sunbird-cb/utils-v2'
import { BlogsReplyModule } from '../blogs-reply/blogs-reply.module'
import { ReactiveFormsModule, FormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatChipsModule } from '@angular/material/chips'
import { MatDividerModule } from '@angular/material/divider'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatIconModule } from '@angular/material/icon'
import { MatMenuModule } from '@angular/material/menu'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatToolbarModule } from '@angular/material/toolbar'
@NgModule({
  declarations: [BlogViewComponent],
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    RouterModule,
    UserImageModule,
    MatChipsModule,
    MatExpansionModule,
    PipeSafeSanitizerModule,
    MatDividerModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,

    BlogsReplyModule,
    BtnSocialLikeModule,
    BtnSocialVoteModule,
    EditorQuillModule,
    BtnPageBackModule,
  ],

  exports: [BlogViewComponent],
})
export class BlogsViewModule { }
