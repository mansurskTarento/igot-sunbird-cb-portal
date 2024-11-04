import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { GroupCheckboxComponent } from './group-checkbox.component'
import { MatIconModule } from '@angular/material/icon'
import { MatCardModule } from '@angular/material/card'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatGridListModule } from '@angular/material/grid-list'
@NgModule({
  declarations: [GroupCheckboxComponent],
  imports: [
    CommonModule,
    MatCheckboxModule,
    MatCardModule,
    MatGridListModule,
    MatIconModule,
  ],
  exports: [GroupCheckboxComponent],
})
export class GroupCheckboxModule { }
