import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { CompetencyPassbookComponent } from './competency-passbook/competency-passbook.component'
import { BaseCompetencyListComponent } from './base-competency-list/base-competency-list.component'
import { BaseCompetencyCardDetailsComponent } from './base-competency-card-details/base-competency-card-details.component'

const routes: Routes = [
  {
    path: '',
    component: CompetencyPassbookComponent,
    children: [
      {
        path: 'list',
        component: BaseCompetencyListComponent,
      },
      {
        path: 'details',
        component: BaseCompetencyCardDetailsComponent,
      },
    ],
  },
]

@NgModule({
  imports: [
    RouterModule.forChild(routes),
  ],
  exports: [RouterModule],
  providers: [],
})

export class CompetencyPassbookRoutingModule { }
