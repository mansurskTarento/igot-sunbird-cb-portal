import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { SurveyShikshaComponent } from '../component/survey-shiksha/survey-shiksha.component'

@NgModule({
  declarations: [SurveyShikshaComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([{ path: '', component: SurveyShikshaComponent }]),
  ],
})
export class RouteSurveyShikshaModule {}
