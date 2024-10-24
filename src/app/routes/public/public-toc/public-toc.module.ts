import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { CommonModule } from '@angular/common'
import { PublicTocComponent } from './public-toc.component'
import { RouterModule } from '@angular/router'
import { PipeDurationTransformModule, PipePartialContentModule, PipeSafeSanitizerModule } from '@sunbird-cb/utils-v2'
import { AppTocService } from '@ws/app/src/lib/routes/app-toc/services/app-toc.service'
import { AppTocModule } from '@ws/app/src/public-api'
import { BtnPageBackNavModule } from '@sunbird-cb/collection/src/public-api'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatChipsModule } from '@angular/material/chips'
import { MatNativeDateModule } from '@angular/material/core'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatDialogModule } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatListModule } from '@angular/material/list'
import { MatMenuModule } from '@angular/material/menu'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatRadioModule } from '@angular/material/radio'
import { MatSelectModule } from '@angular/material/select'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { MatTabsModule } from '@angular/material/tabs'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatTooltipModule } from '@angular/material/tooltip'

@NgModule({
    declarations: [PublicTocComponent],
    imports: [
        CommonModule,
        RouterModule,
        MatToolbarModule,
        MatIconModule,
        MatButtonModule,
        MatMenuModule,
        MatCardModule,
        MatTooltipModule,
        MatTabsModule,
        MatChipsModule,
        MatDividerModule,
        MatProgressBarModule,
        MatListModule,
        MatDialogModule,
        MatRadioModule,
        MatExpansionModule,
        MatProgressSpinnerModule,
        MatCheckboxModule,
        MatInputModule,
        MatFormFieldModule,
        MatSelectModule,
        MatSnackBarModule,
        MatDatepickerModule,
        MatNativeDateModule,
        PipeSafeSanitizerModule,
        PipeDurationTransformModule,
        PipePartialContentModule,
        AppTocModule,
        BtnPageBackNavModule,
    ],
    exports: [PublicTocComponent],
    providers: [AppTocService],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PublicTocModule { }
