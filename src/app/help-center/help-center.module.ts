import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { HelpCenterRoutingModule } from './help-center-routing.module'
import { ReactiveFormsModule } from '@angular/forms'
import { HelpCenterComponent } from './help-center/help-center/help-center.component'
import { SuppotSectionComponent } from './help-center/suppot-section/suppot-section.component'
import { MatIconModule } from '@angular/material/icon'


@NgModule({
  declarations: [HelpCenterComponent, SuppotSectionComponent],
  imports: [
    CommonModule,
    HelpCenterRoutingModule,
    ReactiveFormsModule,
    MatIconModule

  ]
})
export class HelpCenterModule { }
