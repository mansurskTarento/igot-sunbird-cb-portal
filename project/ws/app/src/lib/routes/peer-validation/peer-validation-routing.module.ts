import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { PeerDashboardComponent } from './components/peer-dashboard/peer-dashboard.component'
import { ReviewPageComponent } from './components/review-page/review-page.component'

const routes: Routes = [
  {
    path: '',
    component: PeerDashboardComponent,
  },
  {
    path: 'review/:id',
    component: ReviewPageComponent,
  },
]
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PeerValidationRoutingModule { }
