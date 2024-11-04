import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { DashboardComponent } from './components/dashboard/dashboard.component'
import { HorizontalScrollerModule, PipeDurationTransformModule, DefaultThumbnailModule } from '@sunbird-cb/utils-v2'
import { UserImageModule, CardKnowledgeModule } from '@sunbird-cb/collection'

import { WidgetResolverModule } from '@sunbird-cb/resolver'
import { CalendarModule } from '../../module/calendar-module/calendar.module'
import { RouterModule } from '@angular/router'
import { CoursePendingCardComponent } from './components/course-pending-card/course-pending-card.component'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatChipsModule } from '@angular/material/chips'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatTooltipModule } from '@angular/material/tooltip'

@NgModule({
  declarations: [DashboardComponent, CoursePendingCardComponent],
  imports: [
    CommonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatDatepickerModule,
    MatDividerModule,
    MatButtonModule,
    DefaultThumbnailModule,
    HorizontalScrollerModule,
    UserImageModule,
    WidgetResolverModule,
    PipeDurationTransformModule,
    CalendarModule,
    RouterModule,
    CardKnowledgeModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
})
export class DashboardModule {}
