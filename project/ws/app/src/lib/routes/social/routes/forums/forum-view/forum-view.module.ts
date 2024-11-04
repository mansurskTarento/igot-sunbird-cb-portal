import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'

import { RouterModule } from '@angular/router'
import { BtnPageBackModule, BtnSocialLikeModule } from '@sunbird-cb/collection'
import { ForumViewComponent } from './components/forum-view.component'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatChipsModule } from '@angular/material/chips'
import { MatDialogModule } from '@angular/material/dialog'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatListModule } from '@angular/material/list'
import { MatMenuModule } from '@angular/material/menu'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatTooltipModule } from '@angular/material/tooltip'

@NgModule({
  declarations: [ForumViewComponent],
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatMenuModule,

    RouterModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    BtnPageBackModule,
    BtnSocialLikeModule,

    MatListModule,
    MatButtonModule,
    MatDialogModule,
    MatExpansionModule,
    MatChipsModule,
    MatFormFieldModule,
    MatTooltipModule,

  ],

  exports: [ForumViewComponent],
})
export class ForumViewModule { }
