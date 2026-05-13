import { NgModule } from '@angular/core'
import { CommonModule, DatePipe } from '@angular/common'
import { LeaderboardRoutingModule } from './leaderboard-routing.module'
import { LeaderboardHomeComponent } from './components/leaderboard-home/leaderboard-home.component'

import { LeaderboardItemComponent } from '../leaderboard-item/leaderboard-item.component'
import { CardListComponent } from '../card-list/card-list.component'
import { CardListItemComponent } from '../card-list-item/card-list-item.component'
import { UserImageModule } from '@sunbird-cb/collection'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { PipeNameTransformModule, PipeCountTransformModule } from '@sunbird-cb/utils-v2'
import { MatButtonModule } from '@angular/material/button'
import { MatButtonToggleModule } from '@angular/material/button-toggle'
import { MatCardModule } from '@angular/material/card'
import { MatNativeDateModule } from '@angular/material/core'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatDividerModule } from '@angular/material/divider'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatMenuModule } from '@angular/material/menu'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatSelectModule } from '@angular/material/select'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatTabsModule } from '@angular/material/tabs'
import { MatToolbarModule } from '@angular/material/toolbar'

@NgModule({
  declarations: [LeaderboardHomeComponent,
    LeaderboardItemComponent,
    CardListComponent,
    CardListItemComponent,
  ],
  imports: [
    CommonModule,
    LeaderboardRoutingModule,
    MatTabsModule,
    MatCardModule,
    MatDividerModule,
    MatButtonModule,
    MatTabsModule,
    MatToolbarModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    UserImageModule,
    PipeNameTransformModule,
    FormsModule,
    ReactiveFormsModule,
    PipeCountTransformModule,
    MatFormFieldModule,
    MatInputModule,
    MatSidenavModule,
    MatMenuModule,
    MatButtonToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  providers: [DatePipe],
})
export class LeaderboardModule { }
