import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatRadioModule } from '@angular/material/radio'
import { DefaultThumbnailModule, PipeDurationTransformModule, PipePublicURLModule } from '@sunbird-cb/utils-v2'
import { DisplayContentTypeModule } from '../_common/display-content-type/display-content-type.module'
import { PickerContentComponent } from './picker-content.component'
import { MatButtonModule } from '@angular/material/button'
import { MatButtonToggleModule } from '@angular/material/button-toggle'
import { MatCardModule } from '@angular/material/card'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatChipsModule } from '@angular/material/chips'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatMenuModule } from '@angular/material/menu'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatSelectModule } from '@angular/material/select'
import { MatTabsModule } from '@angular/material/tabs'

@NgModule({
  declarations: [PickerContentComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DefaultThumbnailModule,
    PipeDurationTransformModule,
    // material modules
    MatButtonModule,
    MatButtonToggleModule,
    MatChipsModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    DisplayContentTypeModule,
    MatSelectModule,
    MatTabsModule,
    MatRadioModule,
    PipePublicURLModule,
  ],
  exports: [PickerContentComponent],
})
export class PickerContentModule {}
