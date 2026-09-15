import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { PlansShowAllComponent } from './plans-show-all/plans-show-all.component'
import { PlanDetailComponent } from './plan-detail/plan-detail.component'

const routes: Routes = [
  {
    // The plan type, reporting year and paging all live in query params
    // (?planType=apar&planYear=2026-27&page=1), so one route serves all three plan listings
    // and a filtered view stays shareable.
    path: '',
    component: PlansShowAllComponent,
    data: {
      pageType: 'feature',
      pageKey: 'plans',
      pageId: 'app/plans',
      module: 'Learn',
    },
  },
  {
    // One plan and the content inside it. The id is the plan id the listing cards carry.
    path: ':id',
    component: PlanDetailComponent,
    data: {
      pageType: 'feature',
      pageKey: 'plan-detail',
      pageId: 'app/plans/:id',
      module: 'Learn',
    },
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PlansRoutingModule { }
