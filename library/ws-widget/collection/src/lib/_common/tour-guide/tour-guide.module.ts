import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { TourComponent } from './tour-guide.component'
import { MatCardModule } from '@angular/material/card'
import { MatIconModule } from '@angular/material/icon'

@NgModule({
  declarations: [TourComponent],
  imports: [
    MatCardModule,
    MatIconModule,
    CommonModule,
  ],
  exports: [TourComponent],
})
export class TourModule { }
