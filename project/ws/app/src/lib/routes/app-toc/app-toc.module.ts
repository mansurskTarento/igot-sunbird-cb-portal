import { NgModule } from '@angular/core'
import { CommonModule, DatePipe } from '@angular/common'
import { RouterModule } from '@angular/router'
import { ReactiveFormsModule, FormsModule } from '@angular/forms'
import { AppTocRoutingModule } from './app-toc-routing.module'
import { NgCircleProgressModule } from 'ng-circle-progress'
import { TranslateModule } from '@ngx-translate/core'
import { InfiniteScrollModule } from 'ngx-infinite-scroll'

// custom modules
import { WidgetResolverModule } from '@sunbird-cb/resolver'
import { DiscussionUiModule } from '@sunbird-cb/discussions-ui-v8'
import {
  PipeDurationTransformModule,
  PipeSafeSanitizerModule,
  PipeLimitToModule,
  PipePartialContentModule,
  HorizontalScrollerModule,
  DefaultThumbnailModule,
  PipeNameTransformModule,
  PipeCountTransformModule,
  PipeFilterV3Module,
  PipeRelativeTimeModule,
  PipePublicURLModule,
  MultilingualTranslationsService,
} from '@sunbird-cb/utils-v2'
import {
  BtnCallModule,
  BtnContentDownloadModule,
  BtnContentLikeModule,
  BtnContentShareModule,
  BtnContentFeedbackModule,
  BtnContentFeedbackV2Module,
  BtnGoalsModule,
  BtnMailUserModule,
  BtnPageBackModule,
  UserImageModule,
  DisplayContentTypeModule,
  BtnPlaylistModule,
  DisplayContentTypeIconModule,
  ContentProgressModule,
  UserContentRatingModule,
  PipeContentRouteModule,
  PipeContentRoutePipe,
  BtnKbModule,
  MarkAsCompleteModule,
  PlayerBriefModule,
  CardContentModule,
  UserAutocompleteModule,
  AvatarPhotoModule,
  ContentRatingV2DialogModule,
  RatingSummaryModule,
  CardRatingCommentModule,
  AttendanceHelperModule,
  AttendanceCardModule,
} from '@sunbird-cb/collection'
import { SkeletonLoaderModule } from '@sunbird-cb/collection/src/lib/_common/skeleton-loader/skeleton-loader.module'
import { ContentTocModule } from '@sunbird-cb/toc'
import { TocKpiValuesModule } from '@sunbird-cb/toc'
import { MicroSurveyModule } from '@sunbird-cb/micro-surveys'
import { CardContentV2Module } from '@sunbird-cb/collection/src/lib/card-content-v2/card-content-v2.module'
import { ConnectionNameModule } from '@sunbird-cb/collection/src/lib/_common/connection-name/connection-name.module'
import { CertificateDialogModule } from '@sunbird-cb/collection/src/lib/_common/certificate-dialog/certificate-dialog.module'
import { ConfirmDialogModule } from '@sunbird-cb/collection/src/lib/_common/confirm-dialog/confirm-dialog.module'
import { KarmaPointsModule } from '@sunbird-cb/toc'
import { TipsForLearnerModule } from '@sunbird-cb/collection/src/lib/_common/tips-for-learner/tips-for-learner.module'

// Components
import { AllDiscussionWidgetComponent } from '../discuss/widget/all-discussion-widget/category-widget/all-discussion-widget.component'
import { TagWidgetComponent } from '../discuss/widget/tag-widget/tag-widget.component'

// Services
import { ApiService, AccessControlService } from '../../../../../author/src/public-api'
import { EditorService } from '../../../../../author/src/lib/routing/modules/editor/services/editor.service'
import { AppPublicTocResolverService } from 'src/app/routes/public/public-toc/app-public-toc-resolver.service'

// Resolver

// Directives
import { CommonMethodsService, ContentLanguageService } from '@sunbird-cb/consumption'
import { UserProfileService } from '../user-profile/services/user-profile.service'
import { OtpService } from '../user-profile/services/otp.services'
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
import { WidgetCommentModule } from '@sunbird-cb/discussion-v2'
import { SlidersDynamicModule } from '@sunbird-cb/collection/src/lib/sliders-dynamic/sliders-dynamic.module'
import { NonReleventFeedbackDialogModule } from '../../../../../../../library/ws-widget/collection/src/lib/_common/non-relevent-feedback-dialog/non-relevent-feedback-dialog.module'
import { TocHomeComponent } from './toc-home/toc-home.component'
import { AppTocLibModule } from '@sunbird-cb/toc'
@NgModule({
  declarations: [
    AllDiscussionWidgetComponent,
    TagWidgetComponent,
    TocHomeComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    AppTocRoutingModule,
    MatToolbarModule,
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    MatRadioModule,
    MatTabsModule,
    MatCardModule,
    MatListModule,
    MatDividerModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSelectModule,
    MatSnackBarModule,
    MatExpansionModule,
    MatDatepickerModule,
    MatNativeDateModule,
    DisplayContentTypeModule,
    DisplayContentTypeIconModule,
    PipeDurationTransformModule,
    PipeSafeSanitizerModule,
    PipeLimitToModule,
    PipeNameTransformModule,
    PipeCountTransformModule,
    PipePartialContentModule,
    PipeFilterV3Module,
    PipeRelativeTimeModule,
    PipeContentRouteModule,
    PipePublicURLModule,
    BtnCallModule,
    BtnContentDownloadModule,
    BtnContentLikeModule,
    BtnContentFeedbackModule,
    BtnContentFeedbackV2Module,
    ContentRatingV2DialogModule,
    RatingSummaryModule,
    CertificateDialogModule,
    ConfirmDialogModule,
    BtnGoalsModule,
    SkeletonLoaderModule,
    BtnPlaylistModule,
    BtnMailUserModule,
    BtnPageBackModule,
    HorizontalScrollerModule,
    UserImageModule,
    DefaultThumbnailModule,
    WidgetResolverModule,
    ContentProgressModule,
    UserContentRatingModule,
    BtnKbModule,
    MarkAsCompleteModule,
    PlayerBriefModule,
    CardContentModule,
    CardContentV2Module,
    BtnContentShareModule,
    UserAutocompleteModule,
    AvatarPhotoModule,
    DiscussionUiModule,
    ConnectionNameModule,
    CardRatingCommentModule,
    InfiniteScrollModule,
    AttendanceHelperModule,
    AttendanceCardModule,
    MicroSurveyModule,
    ContentTocModule,
    NgCircleProgressModule.forRoot({}),
    TranslateModule,
    TocKpiValuesModule,
    KarmaPointsModule,
    TipsForLearnerModule,
    WidgetCommentModule,
    SlidersDynamicModule,
    NonReleventFeedbackDialogModule,
    AppTocLibModule
  ],
  providers: [
    AppPublicTocResolverService,
    PipeContentRoutePipe,
    EditorService,
    ApiService,
    AccessControlService,
    MultilingualTranslationsService,
    CommonMethodsService,
    UserProfileService,
    OtpService,
    ContentLanguageService,
    DatePipe
  ],
  exports: [
  ]
})
export class AppTocModule { }
