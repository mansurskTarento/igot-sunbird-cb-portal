import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import {
  PipeFilterModule,
  PipeHtmlTagRemovalModule,
  PipeOrderByModule,
  PipeRelativeTimeModule,
  PipeListFilterModule,
  PipeFilterV2Module,
} from '@sunbird-cb/utils-v2'
import { MatGridListModule } from '@angular/material/grid-list'
import { ReactiveFormsModule, FormsModule } from '@angular/forms'
import { WidgetResolverModule } from '@sunbird-cb/resolver'
import { AvatarPhotoModule, BtnPageBackModule, CardContentModule } from '@sunbird-cb/collection'

import { LoaderService } from '@ws/author/src/lib/services/loader.service'
import { AllCompetenciesComponent } from './routes/all-competencies/all-competencies.component'
import { CompetencyDetailsComponent } from './routes/competency-details/competency-details.component'
import { CompetencyFiltersComponent } from './components/competency-filters/competency-filters.component'
import { CompetencyCardComponent } from './components/competency-card/competency-card.component'
import { PopularCompetencyCardComponent } from './components/popular-competency-card/popular-competency-card.component'
import { LocalDataService } from './services/localService'
import { CardContentV2Module } from '@sunbird-cb/collection/src/lib/card-content-v2/card-content-v2.module'
import { TranslateModule } from '@ngx-translate/core'
import { BrowseByCompetencyRoutingModuleV2 } from './browse-by-competency-routing-v2.module'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatChipsModule } from '@angular/material/chips'
import { MatOptionModule, MatRippleModule } from '@angular/material/core'
import { MatDialogModule } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatListModule } from '@angular/material/list'
import { MatMenuModule } from '@angular/material/menu'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatSelectModule } from '@angular/material/select'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatTabsModule } from '@angular/material/tabs'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatTooltipModule } from '@angular/material/tooltip'

@NgModule({
  declarations: [
    AllCompetenciesComponent,
    CompetencyDetailsComponent,
    CompetencyFiltersComponent,
    CompetencyCardComponent,
    PopularCompetencyCardComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    BrowseByCompetencyRoutingModuleV2,
    MatGridListModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatDividerModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatListModule,
    MatSelectModule,
    MatInputModule,
    MatDialogModule,
    MatButtonModule,
    MatSidenavModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    MatCheckboxModule,
    MatMenuModule,
    MatOptionModule,
    MatRippleModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    PipeFilterModule,
    PipeHtmlTagRemovalModule,
    PipeRelativeTimeModule,
    PipeFilterV2Module,
    AvatarPhotoModule,
    PipeOrderByModule,
    PipeListFilterModule,
    BtnPageBackModule,
    WidgetResolverModule,
    CardContentModule,
    CardContentV2Module,
    TranslateModule,
  ],
  exports: [CompetencyFiltersComponent],
  providers: [
    LoaderService,
    LocalDataService,
  ],
})
export class BrowseByCompetencyModuleV2 { }
