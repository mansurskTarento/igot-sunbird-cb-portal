import { CommonModule } from '@angular/common'
import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { ActivityCardComponent } from './activity-card.component'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatIconModule } from '@angular/material/icon'

@NgModule({
  declarations: [ActivityCardComponent],
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    RouterModule,
  ],
  exports: [ActivityCardComponent],
  schemas: [NO_ERRORS_SCHEMA],
})
export class ActivityCardModule { }
