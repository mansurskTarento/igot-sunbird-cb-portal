import { NgModule } from '@angular/core'
import { CommonModule, DatePipe } from '@angular/common'
import { ReactiveFormsModule, FormsModule } from '@angular/forms'

// Material modules
import { MatCardModule } from '@angular/material/card'
import { MatButtonModule } from '@angular/material/button'

import { MatIconModule } from '@angular/material/icon'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { MatBottomSheetModule, MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet'
import { MatTooltipModule } from '@angular/material/tooltip'

// Sunbird modules
import { PipeHtmlTagRemovalModule, PipeFilterV2Module, PipePublicURLModule } from '@sunbird-cb/utils-v2'
import { SkeletonLoaderModule } from '@sunbird-cb/collection/src/lib/_common/skeleton-loader/skeleton-loader.module'
import { TranslateModule, TranslateLoader } from '@ngx-translate/core'
import { HttpLoaderFactory } from '@sunbird-cb/collection/src/public-api'
import { HttpClient } from '@angular/common/http'

// Events module dependencies
import { EventService } from '../../services/events.service'
import { EventsCalendarComponent } from './events-calendar.component'

@NgModule({
  declarations: [
    EventsCalendarComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatBottomSheetModule,
    MatTooltipModule,
    PipeHtmlTagRemovalModule,
    PipeFilterV2Module,
    PipePublicURLModule,
    SkeletonLoaderModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  exports: [
    EventsCalendarComponent
  ],
  providers: [
    { provide: MAT_BOTTOM_SHEET_DATA, useValue: {} },
    { provide: MatBottomSheetRef, useValue: {} },
    EventService,
    DatePipe
  ]
})
export class EventsCalendarModule { }