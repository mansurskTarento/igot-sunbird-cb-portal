import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { GraphGeneralComponent } from './graph-general.component'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatSelectModule } from '@angular/material/select'

@NgModule({
    declarations: [GraphGeneralComponent],
    imports: [CommonModule, FormsModule, ReactiveFormsModule, MatSelectModule, MatFormFieldModule]
})
export class GraphGeneralModule {}
