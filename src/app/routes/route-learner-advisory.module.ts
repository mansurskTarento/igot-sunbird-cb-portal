import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { LearnerAdvisoryComponent } from '../learner-advisory/learner-advisory.component'
import { TranslateModule } from '@ngx-translate/core'
import { WidgetResolverModule } from '@sunbird-cb/resolver'

@NgModule({
  declarations: [LearnerAdvisoryComponent],
  imports: [
    CommonModule,
    TranslateModule,
    WidgetResolverModule,
    RouterModule.forChild([{ path: '', component: LearnerAdvisoryComponent }]),
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RouteLearnerAdvisoryModule {}
