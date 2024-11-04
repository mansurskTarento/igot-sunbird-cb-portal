import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'

import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { WidgetResolverModule } from '@sunbird-cb/resolver'

import { CardDetailComponent } from './components/card-detail/card-detail.component'
import { CompetencyHomeComponent } from './components/competency-home/competency-home.component'
import { AchievementsComponent } from './components/achievements/achievements.component'
import { HorizontalScrollerModule } from '@sunbird-cb/utils-v2'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatDividerModule } from '@angular/material/divider'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatIconModule } from '@angular/material/icon'
import { MatListModule } from '@angular/material/list'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatTabsModule } from '@angular/material/tabs'

@NgModule({
  declarations: [CardDetailComponent, CompetencyHomeComponent, AchievementsComponent],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    HorizontalScrollerModule,

    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatTabsModule,
    MatExpansionModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    WidgetResolverModule,
  ],
})
export class CompetencyModule {}
