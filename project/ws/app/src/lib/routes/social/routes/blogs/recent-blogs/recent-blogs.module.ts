import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RecentBlogComponent } from './components/recent-blog.component'
import { BtnSocialLikeModule, BtnPageBackModule, BtnSocialVoteModule } from '@sunbird-cb/collection'

import { RouterModule } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatMenuModule } from '@angular/material/menu'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatToolbarModule } from '@angular/material/toolbar'

@NgModule({
  declarations: [RecentBlogComponent],
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
    BtnSocialVoteModule,
    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
  ],
  exports: [RecentBlogComponent],
})
export class RecentBlogsModule { }
