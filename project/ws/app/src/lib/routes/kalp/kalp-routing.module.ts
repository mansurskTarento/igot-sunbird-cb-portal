import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
import { BharatKalpPageComponent } from './bharat-kalp/bharat-kalp.component'
import { BharatKalpSeeAllComponent } from './bharat-kalp-see-all/bharat-kalp-see-all.component'
import { KalpFormService } from './services/kalp-form.service'

const routes: Routes = [
  {
    path: 'bharat-kalp',
    component: BharatKalpPageComponent,
    data: {
      module: 'Bharat Kalp',
      pageId: 'app/learn/kalp/bharat-kalp',
      pageKey: 'bharat-kalp',
    },
    resolve: {
      formData: KalpFormService,
    },
  },
  {
    path: 'bharat-kalp/see-all',
    component: BharatKalpSeeAllComponent,
    data: {
      module: 'Bharat Kalp',
      pageId: 'app/learn/kalp/bharat-kalp/see-all',
      pageKey: 'bharat-kalp',
    },
    resolve: {
      formData: KalpFormService,
    },
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class KalpRoutingModule { }
