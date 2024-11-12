import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import {
  PipeOrderByModule,
  PipeFilterV2Module,
} from '@sunbird-cb/utils-v2'

import { CardContentV2Module } from '@sunbird-cb/collection/src/lib/card-content-v2/card-content-v2.module'
import { HttpClient } from '@angular/common/http'
import { TranslateModule, TranslateLoader } from '@ngx-translate/core'
import { HttpLoaderFactory } from 'src/app/app.module'
import {
  AnnouncementsModule,
  CardsModule,
  CommonMethodsService,
  CommonStripModule,
  CompetencyPassbookModule,
  CompetencyPassbookMdoModule,
  ContentStripWithTabsLibModule,
  DataPointsModule,
  SlidersLibModule,
  MDOChannelModule,
} from '@sunbird-cb/consumption'
import { MdoChannelsComponent } from './mdo-channels/mdo-channels.component'
import { MdoChannelsMicrositeComponent } from './mdo-channels-microsite/mdo-channels-microsite.component'
import { MdoChannelsRoutingModule } from './mdo-channels-routing.module'
import { BtnPageBackModule } from '@sunbird-cb/collection/src/public-api'
import { MdoChannelFormService } from './service/mdo-channel-form.service'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MdoChannelDataService } from './service/mdo-channel-data.service'
import { MdoChannelsAllContentComponent } from './mdo-channels-all-content/mdo-channels-all-content.component'
import { AllContentService } from './service/all-content.service'
import { MdoChannelsMicrositeV2Component } from './mdo-channels-microsite-v2/mdo-channels-microsite-v2.component'
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete'
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button'
import { MatButtonToggleModule } from '@angular/material/button-toggle'
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card'
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox'
import { MatLegacyChipsModule as MatChipsModule } from '@angular/material/legacy-chips'
import { MatNativeDateModule } from '@angular/material/core'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input'
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list'
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu'
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner'
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio'
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar'
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table'
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip'

@NgModule({
  declarations: [MdoChannelsComponent, MdoChannelsMicrositeComponent, MdoChannelsAllContentComponent, MdoChannelsMicrositeV2Component],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MdoChannelsRoutingModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatListModule,
    MatSidenavModule,
    MatCardModule,
    MatExpansionModule,
    MatRadioModule,
    MatChipsModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatButtonToggleModule,
    MatTabsModule,
    MatAutocompleteModule,
    PipeOrderByModule,
    PipeFilterV2Module,
    BtnPageBackModule,
    CardContentV2Module,
    ContentStripWithTabsLibModule,
    CompetencyPassbookModule,
    CompetencyPassbookMdoModule,
    DataPointsModule,
    SlidersLibModule,
    CommonStripModule,
    MDOChannelModule,
    CardsModule,
    AnnouncementsModule,
    MatMenuModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  providers: [MdoChannelFormService, AllContentService, CommonMethodsService, MdoChannelDataService],
})
export class MDOChannelsModule { }
