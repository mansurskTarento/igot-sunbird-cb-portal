import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { BadgesRoutingModule } from './badges-routing.module'
import { BadgeComponent } from './components/badge/badge.component'

import { BadgesCardComponent } from './components/badges-card/badges-card.component'
import { BadgesNotEarnedComponent } from './components/badges-not-earned/badges-not-earned.component'
import { HorizontalScrollerModule, DefaultThumbnailModule } from '@sunbird-cb/utils-v2'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatTabsModule } from '@angular/material/tabs'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatTooltipModule } from '@angular/material/tooltip'
@NgModule({
  declarations: [BadgeComponent, BadgesCardComponent, BadgesNotEarnedComponent],
  imports: [
    CommonModule,
    BadgesRoutingModule,
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    MatProgressBarModule,
    HorizontalScrollerModule,
    DefaultThumbnailModule,
  ],
})
export class BadgesModule { }
