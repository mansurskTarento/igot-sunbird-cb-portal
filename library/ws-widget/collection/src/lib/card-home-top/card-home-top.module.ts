import { NgModule } from '@angular/core'
import { CardHomeTopComponent } from './card-home-top.component'
import { CardActivityComponent } from './card-activity/card-activity.component'
import { CardCompetencyComponent } from './card-competency/card-competency.component'
import { CardGoalComponent } from './card-goal/card-goal.component'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { BrowserModule } from '@angular/platform-browser'
import { AvatarPhotoModule } from '../_common/avatar-photo/avatar-photo.module'
import { CardLearningStatusComponent } from './card-learning-status/card-learning-status.component'
import { StarRatingComponent } from './star-rating/star-rating.component'
import { MatTooltipModule } from '@angular/material/tooltip'
import { MatGridListModule } from '@angular/material/grid-list'
import { HorizontalScrollerModule, PipeNameTransformModule } from '@sunbird-cb/utils-v2'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatChipsModule } from '@angular/material/chips'
import { MatDividerModule } from '@angular/material/divider'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'

@NgModule({
  declarations: [CardHomeTopComponent, StarRatingComponent, CardActivityComponent,
    CardCompetencyComponent, CardGoalComponent,
    CardLearningStatusComponent],
  imports: [AvatarPhotoModule, BrowserModule, MatButtonModule, MatCardModule, MatChipsModule, MatDividerModule, MatGridListModule,
    MatExpansionModule, MatIconModule, MatProgressSpinnerModule, MatProgressBarModule, MatFormFieldModule,
    MatTooltipModule, HorizontalScrollerModule, PipeNameTransformModule],
  entryComponents: [CardHomeTopComponent],
})
export class CardHomeTopModule {

}
