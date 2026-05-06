import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { GamificationRoutingModule } from './gamification-routing.module'


import { UserImageModule } from '@sunbird-cb/collection'
import { PipeNameTransformModule, PipeCountTransformModule } from '@sunbird-cb/utils-v2'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatTabsModule } from '@angular/material/tabs'
import { MatToolbarModule } from '@angular/material/toolbar'

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    GamificationRoutingModule,
    MatTabsModule,
    MatCardModule,
    MatDividerModule,
    MatButtonModule,
    MatTabsModule,
    MatToolbarModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    UserImageModule,
    PipeNameTransformModule,
    PipeCountTransformModule,
  ],
})
export class GamificationModule { }
