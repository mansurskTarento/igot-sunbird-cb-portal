import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { PipeFilterModule, PipeHtmlTagRemovalModule, PipeOrderByModule, PipeRelativeTimeModule, PipeListFilterModule } from '@sunbird-cb/utils-v2'
import { TaxonomyHomeComponent } from './routes/taxonomy-home/taxonomy.component'
import { TaxonomyRoutingModule } from './taxonomy.rounting.module'
import { TaxonomyLevelCardComponent } from './components/taxonomy-level-card/taxonomy-level-card.component'
import { LeftMenuComponent } from './components/left-menu/left-menu.component'

// import { BasicCKEditorComponent } from './components/basic-ckeditor/basic-ckeditor.component'
import { MatGridListModule } from '@angular/material/grid-list'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatDividerModule } from '@angular/material/divider'
import { WidgetResolverModule } from '@sunbird-cb/resolver'

import { MatCardModule } from '@angular/material/card'
import { ReactiveFormsModule, FormsModule } from '@angular/forms'
import { AvatarPhotoModule, BtnPageBackModule, CardContentModule } from '@sunbird-cb/collection'
import { LoaderService } from '@ws/author'

import { TaxonomyExplorerComponent } from './routes/taxonomy-explorer/explorer.component'
import { BreadcrumbsOrgModule } from './components/breadcrumbs/breadcrumbs-org.module'
import { CardContentV2Module } from '@sunbird-cb/collection'
import { MatButtonModule } from '@angular/material/button'
import { MatChipsModule } from '@angular/material/chips'
import { MatDialogModule } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatListModule } from '@angular/material/list'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatSelectModule } from '@angular/material/select'
import { MatSidenavModule } from '@angular/material/sidenav'

@NgModule({
  declarations: [
    TaxonomyHomeComponent,
    TaxonomyLevelCardComponent,
    LeftMenuComponent,
    TaxonomyExplorerComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TaxonomyRoutingModule,
    MatGridListModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatDividerModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatListModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatDialogModule,
    MatButtonModule,
    MatSidenavModule,
    MatProgressSpinnerModule,
    PipeFilterModule,
    PipeHtmlTagRemovalModule,
    PipeRelativeTimeModule,
    AvatarPhotoModule,
    // EditorSharedModule,
    // CkEditorModule,
    PipeOrderByModule,
    PipeListFilterModule,
    BtnPageBackModule,
    WidgetResolverModule,
    CardContentModule,
    CardContentV2Module,
    BreadcrumbsOrgModule,
  ],
  providers: [
    // CKEditorService,
    LoaderService,
  ],
})
export class TaxonomyModule {

}
