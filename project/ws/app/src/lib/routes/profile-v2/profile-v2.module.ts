import { NgModule } from '@angular/core'
import { CommonModule, DatePipe } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { RouterModule } from '@angular/router'
import { ReactiveFormsModule, FormsModule } from '@angular/forms'
import { TranslateModule, TranslateLoader } from '@ngx-translate/core'

import { MatCardModule } from '@angular/material/card'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatGridListModule } from '@angular/material/grid-list'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatDividerModule } from '@angular/material/divider'
import { SkeletonLoaderModule } from '@sunbird-cb/collection'

import { WidgetResolverModule } from '@sunbird-cb/resolver'
import { PipeFilterModule, PipeHtmlTagRemovalModule, PipeOrderByModule, PipeRelativeTimeModule, PipeCertificateImageURL } from '@sunbird-cb/utils-v2'
import { AvatarPhotoModule, BtnPageBackModule } from '@sunbird-cb/collection'
import { ProfileV2RoutingModule } from './profile-v2.rounting.module'
import { EditorSharedModule } from '@ws/author'
import { ProfileCertificateDialogModule } from './components/profile-certificate-dialog/profile-certificate-dialog.module'
import { ProfileCardStatsModule } from '@sunbird-cb/collection'
import { WeeklyClapsModule } from '@sunbird-cb/collection'
import { UpdatePostsModule } from '@sunbird-cb/collection'
import { DiscussionsModule } from '@sunbird-cb/collection'
import { RecentRequestsModule } from '@sunbird-cb/collection'
import { PendingRequestModule } from '@sunbird-cb/collection'
import { UserLeaderboardModule } from '@sunbird-cb/collection'

import { LeftMenuComponent } from './components/left-menu/left-menu.component'
import { RightMenuComponent } from './components/right-menu/right-menu.component'
import { ProfileComponent } from './routes/profile/profile.component'
import { ProfileViewComponent } from './routes/profile-view/profile-view.component'
import { ProfileKarmapointsComponent } from './routes/profile-karmapoints/profile-karmapoints.component'
import { VerifyOtpComponent } from './components/verify-otp/verify-otp.component'
import { TransferRequestComponent } from './components/transfer-request/transfer-request.component'
import { WithdrawRequestComponent } from './components/withdraw-request/withdraw-request.component'
import { DesignationRequestComponent } from './components/designation-request/designation-request.component'

import { LoaderService } from '@ws/author'
import { InitResolver } from './resolvers/init-resolve.service'
import { OtpService } from '../user-profile/services/otp.services'
import { RejectionReasonPopupComponent } from './components/rejection-reason-popup/rejection-reason-popup.component'
import { MatButtonModule } from '@angular/material/button'
import { MatChipsModule } from '@angular/material/chips'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatDialogModule } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatListModule } from '@angular/material/list'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatSelectModule } from '@angular/material/select'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatTabsModule } from '@angular/material/tabs'
import { MatTooltipModule } from '@angular/material/tooltip'
import { ProfileViewV2Component } from './routes/profile-view-v2/profile-view-v2.component'
import { UserStatsComponent } from './components/profile-revamp/user-stats/user-stats.component'
import { AchievementsComponent } from './components/profile-revamp/achievements/achievements.component'
import { CompetenciesComponent } from './components/profile-revamp/competencies/competencies.component'
import { EducationalQualificationsComponent } from './components/profile-revamp/educational-qualifications/educational-qualifications.component'
import { ServiceHistoryComponent } from './components/profile-revamp/service-history/service-history.component'
import { MatMenuModule } from '@angular/material/menu'
import { CoverPhotoEditPopupComponent } from './components/profile-revamp/cover-photo-edit-popup/cover-photo-edit-popup.component'
import { PeopleSuggestionsComponent } from './components/profile-revamp/people-suggestions/people-suggestions.component'
import { ImageCropperModule } from 'ngx-image-cropper'
import { PrfileEditV2Component } from './revamp-dialogs/prfile-edit-v2/prfile-edit-v2.component'
import { ProfilePrimaryDetailsComponent } from './components/profile-revamp/profile-primary-details/profile-primary-details.component'
import { ProfileEntryEditComponent } from './revamp-dialogs/profile-entry-edit/profile-entry-edit.component'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { DragDropModule } from '@angular/cdk/drag-drop'
import { CertificateViewPopupModule } from './components/profile-revamp/certificate-view-popup/certificate-view-popup.module'
import { SearchV3Module } from '../search-v3/search-v3.module'
import { CommunitySuggestionsModule, DialogComponentsModule } from '@sunbird-cb/consumption'
import { DescriptionComponent } from './components/profile-revamp/description/description.component'
import { MatRadioModule } from '@angular/material/radio'

import { CustomFieldsComponent } from './routes/custom-fields/custom-fields.component'
import { ViewCustomFieldsComponent } from './routes/view-custom-fields/view-custom-fields.component'
import { TranslateHttpLoader } from '@ngx-translate/http-loader'

export function ProfileV2HttpLoaderFactory(http: HttpClient) {
    return new TranslateHttpLoader(http)
}

@NgModule({
    declarations: [
        ProfileComponent,
        ProfileViewComponent,
        ProfileKarmapointsComponent,
        LeftMenuComponent,
        RightMenuComponent,
        VerifyOtpComponent,
        TransferRequestComponent,
        WithdrawRequestComponent,
        DesignationRequestComponent,
        RejectionReasonPopupComponent,
        ProfileViewV2Component,
        UserStatsComponent,
        ServiceHistoryComponent,
        EducationalQualificationsComponent,
        CompetenciesComponent,
        AchievementsComponent,
        CoverPhotoEditPopupComponent,
        PeopleSuggestionsComponent,
        PrfileEditV2Component,
        ProfilePrimaryDetailsComponent,
        ProfileEntryEditComponent,
        DescriptionComponent,
        CustomFieldsComponent,
        ViewCustomFieldsComponent,
    ],
    imports: [
        CommonModule,
        WidgetResolverModule,
        ReactiveFormsModule,
        ProfileV2RoutingModule,
        FormsModule,
        RouterModule,
        MatGridListModule,
        MatExpansionModule,
        MatFormFieldModule,
        MatDividerModule,
        MatIconModule,
        MatCardModule,
        MatChipsModule,
        MatListModule,
        MatSelectModule,
        ReactiveFormsModule,
        MatInputModule,
        MatDialogModule,
        MatButtonModule,
        MatSidenavModule,
        MatProgressSpinnerModule,
        MatProgressBarModule,
        PipeFilterModule,
        PipeHtmlTagRemovalModule,
        PipeRelativeTimeModule,
        AvatarPhotoModule,
        EditorSharedModule,
        PipeOrderByModule,
        BtnPageBackModule,
        WidgetResolverModule,
        ProfileCertificateDialogModule,
        MatTabsModule,
        SkeletonLoaderModule,
        ProfileCardStatsModule,
        WeeklyClapsModule,
        UserLeaderboardModule,
        UpdatePostsModule,
        DiscussionsModule,
        RecentRequestsModule,
        PendingRequestModule,
        MatTooltipModule,
        MatDatepickerModule,
        MatAutocompleteModule,
        TranslateModule,
        MatMenuModule,
        ImageCropperModule,
        MatCheckboxModule,
        MatRadioModule,
        DragDropModule,
        SearchV3Module,
        CommunitySuggestionsModule,
        CertificateViewPopupModule,
        DialogComponentsModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: ProfileV2HttpLoaderFactory,
                deps: [HttpClient],
            },
        }),
    ],
    providers: [
        LoaderService,
        InitResolver,
        OtpService,
        PipeCertificateImageURL,
        PrfileEditV2Component,
        ProfileEntryEditComponent,
        ServiceHistoryComponent,
        EducationalQualificationsComponent,
        AchievementsComponent,
        DatePipe,
    ],
})
export class ProfileV2Module {

}
