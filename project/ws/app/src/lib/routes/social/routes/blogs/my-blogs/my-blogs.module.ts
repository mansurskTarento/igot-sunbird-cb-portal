import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { MyBlogComponent } from './components/my-blog.component'
import { RouterModule } from '@angular/router'
import { BlogsResultModule } from '../blogs-result/blogs-result.module'
import { BtnPageBackModule } from '@sunbird-cb/collection'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatTabsModule } from '@angular/material/tabs'
import { MatToolbarModule } from '@angular/material/toolbar'

@NgModule({
  declarations: [MyBlogComponent],
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    RouterModule,
    MatTabsModule,
    BlogsResultModule,
    MatButtonModule,
    BtnPageBackModule,
  ],
  exports: [MyBlogComponent],
})
export class MyBlogsModule { }
