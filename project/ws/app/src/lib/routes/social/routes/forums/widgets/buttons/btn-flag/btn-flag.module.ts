import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { BtnFlagComponent } from './btn-flag.component'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip'

@NgModule({
  declarations: [BtnFlagComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  exports: [BtnFlagComponent],
})
export class BtnFlagModule { }
