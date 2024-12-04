import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
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
import { AppTocCertificationModule } from './routes/app-toc-certification/app-toc-certification.module'
import { SkeletonLoaderModule } from '@sunbird-cb/collection/src/lib/_common/skeleton-loader/skeleton-loader.module'
import { ContentTocModule } from '@sunbird-cb/collection/src/lib/_common/content-toc/content-toc.module'
import { ShareTocModule } from './share-toc/share-toc.module'
import { TocKpiValuesModule } from '@sunbird-cb/collection/src/lib/_common/content-toc/toc-kpi-values/toc-kpi-values.module'
import { MicroSurveyModule } from '@sunbird-cb/micro-surveys'
import { CardContentV2Module } from '@sunbird-cb/collection/src/lib/card-content-v2/card-content-v2.module'
import { ConnectionNameModule } from '@sunbird-cb/collection/src/lib/_common/connection-name/connection-name.module'
import { CertificateDialogModule } from '@sunbird-cb/collection/src/lib/_common/certificate-dialog/certificate-dialog.module'
import { ConfirmDialogModule } from '@sunbird-cb/collection/src/lib/_common/confirm-dialog/confirm-dialog.module'
import { KarmaPointsModule } from '@sunbird-cb/collection/src/lib/_common/content-toc/karma-points/karma-points.module'
import { TipsForLearnerModule } from '@sunbird-cb/collection/src/lib/_common/tips-for-learner/tips-for-learner.module'

// Components
import { AppTocAnalyticsComponent } from './routes/app-toc-analytics/app-toc-analytics.component'
import { AppTocContentsComponent } from './routes/app-toc-contents/app-toc-contents.component'
import { AppTocHomeComponent } from './components/app-toc-home/app-toc-home.component'
import { AppTocHomeComponent as AppTocHomeRootComponent } from './routes/app-toc-home/app-toc-home.component'
import { AppTocOverviewComponent } from './components/app-toc-overview/app-toc-overview.component'
import { AppTocBannerComponent } from './components/app-toc-banner/app-toc-banner.component'
import { AppTocCohortsComponent } from './components/app-toc-cohorts/app-toc-cohorts.component'
import { AppTocContentCardComponent } from './components/app-toc-content-card/app-toc-content-card.component'
import { AppTocDiscussionComponent } from './components/app-toc-discussion/app-toc-discussion.component'
import { AppTocDialogIntroVideoComponent } from './components/app-toc-dialog-intro-video/app-toc-dialog-intro-video.component'
import { AppTocOverviewComponent as AppTocOverviewRootComponent } from './routes/app-toc-overview/app-toc-overview.component'
import { AppTocCohortsComponent as AppTocCohortsRootComponent } from './routes/app-toc-cohorts/app-toc-cohorts.component'
import { AppTocAnalyticsTilesComponent } from './components/app-toc-analytics-tiles/app-toc-analytics-tiles.component'
import { KnowledgeArtifactDetailsComponent } from './components/knowledge-artifact-details/knowledge-artifact-details.component'
import { AppTocSinglePageComponent as AppTocSinglePageRootComponent } from './routes/app-toc-single-page/app-toc-single-page.component'
import { AppTocSinglePageComponent } from './components/app-toc-single-page/app-toc-single-page.component'
import { CreateBatchDialogComponent } from './components/create-batch-dialog/create-batch-dialog.component'
import { AllDiscussionWidgetComponent } from '../discuss/widget/all-discussion-widget/category-widget/all-discussion-widget.component'
import { AppTocSessionsComponent } from './components/app-toc-sessions/app-toc-sessions.component'
import { AppTocSessionCardComponent } from './components/app-toc-session-card/app-toc-session-card.component'
import { EnrollQuestionnaireComponent } from './components/enroll-questionnaire/enroll-questionnaire.component'
import { TagWidgetComponent } from '../discuss/widget/tag-widget/tag-widget.component'

// Services
import { AppTocService } from './services/app-toc.service'
import { AppTocResolverService } from './resolvers/app-toc-resolver.service'
import { ProfileResolverService } from './resolvers/profile-resolver.service'
import { CertificationApiService } from './routes/app-toc-certification/apis/certification-api.service'
import { ActionService } from './services/action.service'
import { ApiService, AccessControlService } from '../../../../../author/src/public-api'
import { EditorService } from '../../../../../author/src/lib/routing/modules/editor/services/editor.service'
import { AppPublicTocResolverService } from 'src/app/routes/public/public-toc/app-public-toc-resolver.service'

// Resolver
import { CertificationMetaResolver } from './routes/app-toc-certification/resolvers/certification-meta.resolver'
import { ContentCertificationResolver } from './routes/app-toc-certification/resolvers/content-certification.resolver'

// Directives
import { AppTocOverviewDirective } from './routes/app-toc-overview/app-toc-overview.directive'
import { AppTocHomeDirective } from './routes/app-toc-home/app-toc-home.directive'
import { AppTocCohortsDirective } from './routes/app-toc-cohorts/app-toc-cohorts.directive'
import { AppTocSinglePageDirective } from './routes/app-toc-single-page/app-toc-single-page.directive'
import { AppTocCiosHomeComponent } from './components/app-toc-cios-home/app-toc-cios-home.component'
import { CommonMethodsService } from '@sunbird-cb/consumption'
import { UserProfileService } from '../user-profile/services/user-profile.service'
import { OtpService } from '../user-profile/services/otp.services'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
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
import { DiscussionV2Module } from '@sunbird-cb/discussion-v2'
import { SlidersDynamicModule } from '@sunbird-cb/collection/src/lib/sliders-dynamic/sliders-dynamic.module'
import { EnrollProfileFormComponent } from './components/enroll-profile-form/enroll-profile-form.component'

@NgModule({
  declarations: [
    AppTocAnalyticsComponent,
    AppTocContentsComponent,
    AppTocHomeComponent,
    AppTocOverviewComponent,
    AppTocBannerComponent,
    AppTocCohortsComponent,
    AppTocContentCardComponent,
    AppTocDiscussionComponent,
    AppTocDialogIntroVideoComponent,
    AppTocOverviewDirective,
    AppTocOverviewRootComponent,
    AppTocHomeDirective,
    AppTocHomeRootComponent,
    AppTocCohortsDirective,
    AppTocCohortsRootComponent,
    KnowledgeArtifactDetailsComponent,
    AppTocAnalyticsTilesComponent,
    AppTocSinglePageComponent,
    AppTocSinglePageRootComponent,
    AppTocSinglePageDirective,
    CreateBatchDialogComponent,
    AllDiscussionWidgetComponent,
    TagWidgetComponent,
    AppTocSessionsComponent,
    AppTocSessionCardComponent,
    EnrollQuestionnaireComponent,
    EnrollProfileFormComponent,
    AppTocCiosHomeComponent,
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
    FormsModule,
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
    AppTocCertificationModule,
    MarkAsCompleteModule,
    PlayerBriefModule,
    MatProgressSpinnerModule,
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
    MatChipsModule,
    MatAutocompleteModule,
    ContentTocModule,
    NgCircleProgressModule.forRoot({}),
    TranslateModule,
    ShareTocModule,
    TocKpiValuesModule,
    KarmaPointsModule,
    TipsForLearnerModule,
    ReactiveFormsModule,
    DiscussionV2Module,
    SlidersDynamicModule,
  ],
  providers: [
    AppTocResolverService,
    AppPublicTocResolverService,
    AppTocService,
    PipeContentRoutePipe,
    CertificationApiService,
    CertificationMetaResolver,
    ContentCertificationResolver,
    EditorService,
    ApiService,
    AccessControlService,
    ProfileResolverService,
    ActionService,
    MultilingualTranslationsService,
    CommonMethodsService,
    UserProfileService,
    OtpService,
  ],
  exports: [
    AppTocDiscussionComponent,
    AppTocSinglePageComponent,
    AppTocBannerComponent,
    AppTocHomeRootComponent,
    AppTocHomeComponent,
    ShareTocModule,
    AppTocCiosHomeComponent,
  ],
  entryComponents: [
    AppTocDialogIntroVideoComponent,
    AppTocOverviewComponent,
    AppTocHomeComponent,
    AppTocSinglePageComponent,
    AppTocSinglePageRootComponent,
    CreateBatchDialogComponent,
    EnrollQuestionnaireComponent,
    EnrollProfileFormComponent,
  ],
})
export class AppTocModule { }
