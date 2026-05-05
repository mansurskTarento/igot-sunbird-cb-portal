import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MatFormFieldModule } from '@angular/material/form-field'
import { DialogBoxAdminComponent } from './dialog-box-admin.component'
import { MatButtonModule } from '@angular/material/button'
import { MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatRadioModule } from '@angular/material/radio'

@NgModule({
  declarations: [DialogBoxAdminComponent],
  imports: [
    FormsModule,
    CommonModule,
    MatIconModule,
    MatRadioModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
  ],
  exports: [DialogBoxAdminComponent],
})
export class DialogBoxAdminModule { }
