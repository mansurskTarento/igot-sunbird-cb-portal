import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { CbpFiltersModule } from '@sunbird-cb/collection/src/lib/_common/cbp-filters/cbp-filters.module'

import { SkeletonLoaderModule } from '@sunbird-cb/collection/src/lib/_common/skeleton-loader/skeleton-loader.module'
import { PipeSafeSanitizerModule } from '@sunbird-cb/utils-v2'
import { CompetencyPassbookRoutingModule } from './competency-passbook-routing.module'

import { CompetencyPassbookComponent } from './competency-passbook/competency-passbook.component'
import { CompetencyCardDetailsComponent } from './competency-card-details/competency-card-details.component'
// tslint:disable-next-line: max-line-length
import { CompetencyPassbookSideBarComponent } from './../component/competency-passbook-side-bar/competency-passbook-side-bar.component'
import { CompetencySearchComponent } from './competency-search/competency-search.component'
import { TranslateModule } from '@ngx-translate/core'
import { DialogComponentsModule } from '@sunbird-cb/consumption'
import { FormsModule } from '@angular/forms'
import { MatIconModule } from '@angular/material/icon'
import { MatMenuModule } from '@angular/material/menu'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatTabsModule } from '@angular/material/tabs'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { CompetencyFiltersComponent } from './competency-filters/competency-filters.component'
import { CompetencyListV2Component } from './competency-list-v2/competency-list-v2.component'
import { BaseCompetencyListComponent } from './base-competency-list/base-competency-list.component'
import { CompetencyListComponent } from './competency-list/competency-list.component'
import { BaseCompetencyCardDetailsComponent } from './base-competency-card-details/base-competency-card-details.component'
import { CompetencyCardDetailsV2Component } from './competency-card-details-v2/competency-card-details-v2.component'
import { CertificateViewPopupComponent } from '../../../project/ws/app/src/lib/routes/profile-v2/components/profile-revamp/certificate-view-popup/certificate-view-popup.component'

@NgModule({
  declarations: [
    CompetencyPassbookComponent,
    CompetencyPassbookSideBarComponent,
    CompetencySearchComponent,
    CompetencyListV2Component,
    CompetencyCardDetailsComponent,
    CompetencyFiltersComponent,
    BaseCompetencyListComponent,
    CompetencyListComponent,
    BaseCompetencyCardDetailsComponent,
    CompetencyCardDetailsV2Component,
    CertificateViewPopupComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatIconModule,
    MatMenuModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatCheckboxModule,
    CompetencyPassbookRoutingModule,
    SkeletonLoaderModule,
    PipeSafeSanitizerModule,
    CbpFiltersModule,
    TranslateModule,
    DialogComponentsModule,
  ],
  exports: [
    TranslateModule,
  ],
})

export class CompetencyPassbookModule { }
