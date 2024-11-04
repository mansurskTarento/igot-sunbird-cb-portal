import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { DialogBoxModeratorComponent } from '../../Dialog-Box/dialog-box-moderator/dialog-box-moderator.component'
import { DialogBoxModeratorModule } from '../../Dialog-Box/dialog-box-moderator/dialog-box-moderator.module'
import { BtnModeratorComponent } from './btn-moderator.component'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip'

@NgModule({
  declarations: [BtnModeratorComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    DialogBoxModeratorModule,
  ],
  exports: [BtnModeratorComponent],
  entryComponents: [BtnModeratorComponent, DialogBoxModeratorComponent],
})
export class BtnModeratorModule { }
