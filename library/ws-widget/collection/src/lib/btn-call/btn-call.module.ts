import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { BtnCallComponent } from './btn-call.component'
import { BtnCallDialogComponent } from './btn-call-dialog/btn-call-dialog.component'
import { MatButtonModule } from '@angular/material/button'
import { MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { MatTooltipModule } from '@angular/material/tooltip'

@NgModule({
  declarations: [BtnCallComponent, BtnCallDialogComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  exports: [BtnCallComponent],
  entryComponents: [BtnCallComponent, BtnCallDialogComponent],
})
export class BtnCallModule { }
