import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ContentRatingV2DialogComponent } from './content-rating-v2-dialog.component'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { HttpClient } from '@angular/common/http'
import { TranslateModule, TranslateLoader } from '@ngx-translate/core'
import { MatButtonModule } from '@angular/material/button'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatDialogModule } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { MatTooltipModule } from '@angular/material/tooltip'
import { TranslateHttpLoader } from '@ngx-translate/http-loader'

export function ContentRatingHttpLoaderFactory(http: HttpClient) {
    return new TranslateHttpLoader(http)
}

@NgModule({
    declarations: [ContentRatingV2DialogComponent],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatDialogModule,
        MatProgressSpinnerModule,
        MatFormFieldModule,
        MatInputModule,
        MatSnackBarModule,
        MatCheckboxModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: ContentRatingHttpLoaderFactory,
                deps: [HttpClient],
            },
        }),
    ],
    exports: [
        ContentRatingV2DialogComponent,
    ]
})
export class ContentRatingV2DialogModule { }
