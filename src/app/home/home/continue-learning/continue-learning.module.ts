import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { HttpClientModule } from '@angular/common/http'
import { MatIconModule } from '@angular/material/icon'
import { TranslateModule } from '@ngx-translate/core'

import { ContinueLearningComponent } from './continue-learning.component'
import { InProgressCardComponent } from './in-progress-card/in-progress-card.component'
import { WeeklyClapsCardComponent } from './weekly-claps-card/weekly-claps-card.component'

@NgModule({
  declarations: [
    ContinueLearningComponent,
    InProgressCardComponent,
    WeeklyClapsCardComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    HttpClientModule,
    MatIconModule,
    TranslateModule,
  ],
  exports: [ContinueLearningComponent],
})
export class ContinueLearningModule { }
