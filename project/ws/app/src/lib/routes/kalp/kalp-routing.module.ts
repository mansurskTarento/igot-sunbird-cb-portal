import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
import { BharatKalpPageComponent } from './bharat-kalp/bharat-kalp.component'
import { BharatKalpSeeAllComponent } from './bharat-kalp-see-all/bharat-kalp-see-all.component'
import { BharatKalpFormService } from './bharat-kalp-form.service'

const routes: Routes = [
  {
    path: '',
    component: BharatKalpPageComponent,
    data: {
      module: 'Bharat Kalp',
      pageId: 'app/learn/bharat-kalp',
      pageKey: 'bharat-kalp',
    },
    resolve: {
      formData: BharatKalpFormService,
    },
  },
  {
    path: 'see-all',
    component: BharatKalpSeeAllComponent,
    data: {
      module: 'Bharat Kalp',
      pageId: 'app/learn/bharat-kalp/see-all',
      pageKey: 'bharat-kalp',
    },
    resolve: {
      formData: BharatKalpFormService,
    },
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class KalpRoutingModule { }
