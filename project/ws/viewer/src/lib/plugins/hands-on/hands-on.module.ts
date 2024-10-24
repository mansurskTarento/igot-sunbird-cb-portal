import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { AceEditorModule } from 'ng2-ace-editor'

import { PipeSafeSanitizerModule, PipeDurationTransformModule } from '@sunbird-cb/utils-v2'
import { CompletionSpinnerModule } from '@sunbird-cb/collection'

import { HandsOnComponent } from './hands-on.component'
import { HandsOnDialogComponent } from './components/hands-on-dialog/hands-on-dialog.component'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatDialogModule } from '@angular/material/dialog'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
@NgModule({
    declarations: [HandsOnComponent, HandsOnDialogComponent],
    imports: [
        CommonModule,
        MatCardModule,
        MatIconModule,
        MatProgressBarModule,
        MatExpansionModule,
        MatButtonModule,
        MatDialogModule,
        AceEditorModule,
        MatProgressSpinnerModule,
        PipeSafeSanitizerModule,
        PipeDurationTransformModule,
        CompletionSpinnerModule,
    ],
    exports: [
        HandsOnComponent,
    ]
})
export class HandsOnModule { }
