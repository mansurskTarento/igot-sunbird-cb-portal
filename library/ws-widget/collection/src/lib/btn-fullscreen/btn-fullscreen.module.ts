import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { BtnFullscreenComponent } from './btn-fullscreen.component'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip'

@NgModule({
  declarations: [BtnFullscreenComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  exports: [BtnFullscreenComponent],
  entryComponents: [BtnFullscreenComponent],
})
export class BtnFullscreenModule { }
