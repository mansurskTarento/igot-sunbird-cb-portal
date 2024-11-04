import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { BlogReplyComponent } from './components/blog-reply.component'
import { UserImageModule, BtnSocialVoteModule, BtnSocialLikeModule, BtnPageBackModule, EditorQuillModule } from '@sunbird-cb/collection'
import { PipeSafeSanitizerModule } from '@sunbird-cb/utils-v2'
import { BtnFlagModule } from '../../forums/widgets/buttons/btn-flag/btn-flag.module'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatIconModule } from '@angular/material/icon'
import { MatMenuModule } from '@angular/material/menu'

@NgModule({
  declarations: [BlogReplyComponent],
  imports: [
    CommonModule,
    MatCardModule,
    UserImageModule,
    MatMenuModule,
    MatIconModule,
    PipeSafeSanitizerModule,
    MatButtonModule,
    BtnFlagModule,

    BtnSocialVoteModule,
    BtnSocialLikeModule,
    BtnPageBackModule,
    EditorQuillModule,
  ],
  exports: [BlogReplyComponent],
})
export class BlogsReplyModule { }
