import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { BreadcrumbsOrgComponent } from './breadcrumbs-org.component'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatIconModule } from '@angular/material/icon'

@NgModule({
  declarations: [BreadcrumbsOrgComponent],
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
  ],
  exports: [BreadcrumbsOrgComponent],
  entryComponents: [BreadcrumbsOrgComponent],
})
export class BreadcrumbsOrgModule { }
