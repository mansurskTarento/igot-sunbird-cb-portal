import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { NationalLearningWeekModule } from '@ws/app'

@NgModule({
  imports: [CommonModule, NationalLearningWeekModule],
  exports: [NationalLearningWeekModule],
})
export class RouteNationalLearningWeekModule { }
