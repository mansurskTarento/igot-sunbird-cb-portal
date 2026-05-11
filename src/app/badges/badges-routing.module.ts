import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { BadgeDetailsComponent } from './badge-details/badge-details.component'

const routes: Routes = [
  {
    path: '',
    component: BadgeDetailsComponent,
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BadgesRoutingModule { }
