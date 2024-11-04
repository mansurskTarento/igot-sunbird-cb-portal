import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'

import {
  BtnChannelAnalyticsModule,
  BtnContentDownloadModule,
  BtnContentLikeModule,
  BtnContentMailMeModule,
  BtnContentShareModule,
  BtnGoalsModule, BtnKbModule,
  BtnPageBackModule,
  BtnPlaylistModule,
  DisplayContentTypeModule,
  PipeContentRouteModule,
  BtnKbAnalyticsModule,
  UserAutocompleteModule,
} from '@sunbird-cb/collection'
import { WidgetResolverModule } from '@sunbird-cb/resolver'
import {
  DefaultThumbnailModule,
  HorizontalScrollerModule, PipeDurationTransformModule, PipeLimitToModule, PipePartialContentModule, PipePublicURLModule,
} from '@sunbird-cb/utils-v2'
import { Searchv2RoutingModule } from './searchv2-routing.module'
import { GlobalSearchComponent } from './routes/global-search/global-search.component'
import { LearnSearchComponent } from './routes/learn-search/learn-search.component'
import { SearchFiltersComponent } from './components/search-filters/search-filters.component'
import { InfiniteScrollModule } from 'ngx-infinite-scroll'
import { TranslateModule } from '@ngx-translate/core'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatChipsModule } from '@angular/material/chips'
import { MatOptionModule, MatRippleModule } from '@angular/material/core'
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
    GlobalSearchComponent,
    LearnSearchComponent,
    SearchFiltersComponent,
  ],
  imports: [
    CommonModule,
    Searchv2RoutingModule,
    BtnPageBackModule,
    MatToolbarModule,
    MatTabsModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatOptionModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    MatListModule,
    MatSelectModule,
    MatCardModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatSidenavModule,
    MatRippleModule,
    DefaultThumbnailModule,
    MatTooltipModule,
    PipeContentRouteModule,
    PipeLimitToModule,
    PipeDurationTransformModule,
    BtnContentDownloadModule,
    BtnContentLikeModule,
    BtnContentShareModule,
    BtnPlaylistModule,
    BtnGoalsModule,
    BtnContentMailMeModule,
    BtnKbAnalyticsModule,
    PipePartialContentModule,
    PipePublicURLModule,
    HorizontalScrollerModule,
    MatProgressSpinnerModule,
    DisplayContentTypeModule,
    WidgetResolverModule,
    BtnKbModule,
    BtnChannelAnalyticsModule,
    MatDividerModule,
    UserAutocompleteModule,
    InfiniteScrollModule,
    TranslateModule,
  ],
  exports: [],
  providers: [],
})
export class Searchv2Module { }
