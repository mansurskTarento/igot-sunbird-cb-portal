import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { DialogBoxAdminAcceptComponent } from './dialog-box-admin-accept.component'
import { MatButtonModule } from '@angular/material/button'
import { MatDialogModule } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatRadioModule } from '@angular/material/radio'

@NgModule({
  declarations: [DialogBoxAdminAcceptComponent],
  imports: [
    FormsModule,
    CommonModule,
    MatIconModule,
    MatRadioModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
  ],
  exports: [DialogBoxAdminAcceptComponent],
})
export class DialogBoxAdminAcceptModule { }
