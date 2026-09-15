import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { RouterModule } from '@angular/router'
import { MatButtonModule } from '@angular/material/button'
import { MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatMenuModule } from '@angular/material/menu'
import { MatTooltipModule } from '@angular/material/tooltip'
import { TranslateLoader, TranslateModule } from '@ngx-translate/core'
import { TranslateHttpLoader } from '@ngx-translate/http-loader'
import {
  BreadcrumbComponent,
  CardCourseV2Component,
  CardPlanV2Component,
  FiltersModule,
  PaginationModule,
} from '@sunbird-cb/consumption'
import { PlansRoutingModule } from './plans-routing.module'
import { PlansShowAllComponent } from './plans-show-all/plans-show-all.component'
import { PlanDetailComponent } from './plan-detail/plan-detail.component'
import { PlansFilterMobileComponent } from './plans-filter-mobile/plans-filter-mobile.component'
import { PlansService } from './services/plans.service'

export function plansHttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http)
}

/**
 * Plan listings — the "show all" surface behind the home page's plan strips.
 *
 * Renders whole training plans (APAR / AI CBP / CBP), not the content inside them, which is
 * what separates it from the older `/page/cbp` CbpModule: that page lists a plan's courses.
 */
@NgModule({
  declarations: [PlansShowAllComponent, PlanDetailComponent],
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    PlansRoutingModule,
    // Standalone pieces from the component library
    BreadcrumbComponent,
    CardCourseV2Component,
    CardPlanV2Component,
    PlansFilterMobileComponent,
    // NgModule-packaged pieces
    FiltersModule,
    PaginationModule,
    // FiltersModule calls TranslateModule.forRoot() internally. In a lazy-loaded module that
    // registers a FRESH TranslateService in this module's injector rather than reusing the
    // app's, and that instance starts with no language and no strings — so without a loader
    // of its own every key on this page renders as its own name ("plansShowAll.filter").
    // seeAll.module.ts carries the same declaration for the same reason.
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: plansHttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  providers: [PlansService],
})
export class PlansModule { }
