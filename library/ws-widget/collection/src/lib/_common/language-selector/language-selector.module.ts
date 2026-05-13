import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { LanguageSelectorComponent } from './language-selector.component'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatSelectModule } from '@angular/material/select'

@NgModule({
    declarations: [LanguageSelectorComponent],
    imports: [
        CommonModule,
        MatFormFieldModule,
        MatSelectModule,
        FormsModule,
        ReactiveFormsModule,
    ],
    exports: [LanguageSelectorComponent]
})
export class LanguageSelectorModule { }
