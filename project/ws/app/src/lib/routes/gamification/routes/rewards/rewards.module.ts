import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { RewardsRoutingModule } from './rewards-routing.module'
import { MyRewardsComponent } from './components/my-rewards/my-rewards.component'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatTabsModule } from '@angular/material/tabs'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatTooltipModule } from '@angular/material/tooltip'


@NgModule({
  declarations: [MyRewardsComponent],
  imports: [
    CommonModule,
    RewardsRoutingModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatDividerModule,
  ],
})
export class RewardsModule { }
