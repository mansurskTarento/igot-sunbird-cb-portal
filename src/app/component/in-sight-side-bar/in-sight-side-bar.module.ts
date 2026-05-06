import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { InsightSideBarComponent } from './in-sight-side-bar.component'

// Material modules
import { MatCardModule } from '@angular/material/card'
import { MatIconModule } from '@angular/material/icon'
import { MatButtonModule } from '@angular/material/button'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatSelectModule } from '@angular/material/select'
import { MatDialogModule } from '@angular/material/dialog'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'

// Sunbird CB Collection modules
import {
  AvatarPhotoModule,
  BtnPageBackModule,
  CardContentModule,
  ContentStripMultipleModule,
  ContentStripNewMultipleModule,
  DiscussStripMultipleModule,
  NetworkStripMultipleModule,
  UserImageModule
} from '@sunbird-cb/collection'

// Import WidgetResolverModule from the correct package
import { WidgetResolverModule } from '@sunbird-cb/resolver'

// Utilities from @sunbird-cb/utils-v2
import {
  PipeNameTransformModule,
  PipeRelativeTimeModule,
  ImageResponsiveModule,
  PipeLimitToModule,
  PipePartialContentModule,
  PipeDurationTransformModule,
  HorizontalScrollerModule,
  HorizontalScrollerV2Module
} from '@sunbird-cb/utils-v2'

// Import specific modules from collection (using full paths)
import { WeeklyClapsModule } from '@sunbird-cb/collection'
import { UpdatePostsModule } from '@sunbird-cb/collection'
import { RecentRequestsModule } from '@sunbird-cb/collection'
import { PendingRequestModule } from '@sunbird-cb/collection'
import { ProfileCardStatsModule } from '@sunbird-cb/collection'
import { UserLeaderboardModule } from '@sunbird-cb/collection'
import { DiscussionsModule } from '@sunbird-cb/collection'
import { TipsForLearnerModule } from '@sunbird-cb/collection'

// Import consumption modules
import { ContentStripWithTabsLibModule, ContentStripWithTabsPillsModule, DialogComponentsModule } from '@sunbird-cb/consumption'

// Import translate module
import { TranslateModule } from '@ngx-translate/core'

// Import home other portal module
import { HomeOtherPortalModule } from '../home-other-portal/home-other-portal.module'

@NgModule({
  declarations: [InsightSideBarComponent],
  imports: [
    // Angular modules
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,

    // Material modules
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatSelectModule,
    MatDialogModule,
    MatProgressSpinnerModule,

    // Widget modules from @sunbird-cb/collection
    AvatarPhotoModule,
    BtnPageBackModule,
    CardContentModule,
    ContentStripMultipleModule,
    ContentStripNewMultipleModule,
    DiscussStripMultipleModule,
    NetworkStripMultipleModule,
    UserImageModule,
    WidgetResolverModule,

    // Specific collection modules with full paths
    WeeklyClapsModule,
    UpdatePostsModule,
    RecentRequestsModule,
    PendingRequestModule,
    ProfileCardStatsModule,
    UserLeaderboardModule,
    DiscussionsModule,
    TipsForLearnerModule,

    // Consumption modules
    ContentStripWithTabsLibModule,
    ContentStripWithTabsPillsModule,
    DialogComponentsModule,

    // Utility modules from @sunbird-cb/utils-v2
    PipeNameTransformModule,
    PipeRelativeTimeModule,
    ImageResponsiveModule,
    PipeLimitToModule,
    PipePartialContentModule,
    PipeDurationTransformModule,
    HorizontalScrollerModule,
    HorizontalScrollerV2Module,

    // Translate module
    TranslateModule,

    // Home other portal module
    HomeOtherPortalModule
  ],
  exports: [InsightSideBarComponent]
})
export class InSightSideBarModule { }