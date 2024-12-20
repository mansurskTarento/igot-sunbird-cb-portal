import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { LanguageSelectorComponent } from './language-selector.component'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field'
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select'

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
