import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { RouterModule } from '@angular/router'
import { ReactiveFormsModule, FormsModule } from '@angular/forms'
import { TranslateModule, TranslateLoader } from '@ngx-translate/core'

import { MatCardModule } from '@angular/material/card'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatGridListModule } from '@angular/material/grid-list'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatDividerModule } from '@angular/material/divider'
import { SkeletonLoaderModule } from '@sunbird-cb/collection/src/lib/_common/skeleton-loader/skeleton-loader.module'

import { HttpLoaderFactory } from 'src/app/app.module'
import { WidgetResolverModule } from '@sunbird-cb/resolver'
import { PipeFilterModule, PipeHtmlTagRemovalModule, PipeOrderByModule, PipeRelativeTimeModule, PipeCertificateImageURL } from '@sunbird-cb/utils-v2'
import { AvatarPhotoModule, BtnPageBackModule } from '@sunbird-cb/collection'
import { ProfileV2RoutingModule } from './profile-v2.rounting.module'
import { DiscussModule } from '../discuss/discuss.module'
import { EditorSharedModule } from '@ws/author/src/lib/routing/modules/editor/shared/shared.module'
import { ProfileCertificateDialogModule } from './components/profile-certificate-dialog/profile-certificate-dialog.module'
import { ProfileCardStatsModule } from '@sunbird-cb/collection/src/lib/_common/profile-card-stats/profile-card-stats.module'
import { WeeklyClapsModule } from '@sunbird-cb/collection/src/lib/_common/weekly-claps/weekly-claps.module'
import { UpdatePostsModule } from '@sunbird-cb/collection/src/lib/_common/update-posts/update-posts.module'
import { DiscussionsModule } from '@sunbird-cb/collection/src/lib/_common/discussions/discussions.module'
import { RecentRequestsModule } from '@sunbird-cb/collection/src/lib/_common/recent-requests/recent-requests.module'
import { PendingRequestModule } from '@sunbird-cb/collection/src/lib/_common/pending-request/pending-request.module'
import { UserLeaderboardModule } from '@sunbird-cb/collection/src/lib/_common/user-leaderboard/user-leaderboard.module'

import { LeftMenuComponent } from './components/left-menu/left-menu.component'
import { RightMenuComponent } from './components/right-menu/right-menu.component'
import { ProfileComponent } from './routes/profile/profile.component'
import { ProfileViewComponent } from './routes/profile-view/profile-view.component'
import { ProfileKarmapointsComponent } from './routes/profile-karmapoints/profile-karmapoints.component'
import { VerifyOtpComponent } from './components/verify-otp/verify-otp.component'
import { TransferRequestComponent } from './components/transfer-request/transfer-request.component'
import { WithdrawRequestComponent } from './components/withdraw-request/withdraw-request.component'
import { DesignationRequestComponent } from './components/designation-request/designation-request.component'

import { LoaderService } from '@ws/author/src/lib/services/loader.service'
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
    ],
    imports: [
        CommonModule,
        WidgetResolverModule,
        ReactiveFormsModule,
        ProfileV2RoutingModule,
        DiscussModule,
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
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient],
            },
        }),
    ],
    providers: [
        LoaderService,
        InitResolver,
        OtpService,
        PipeCertificateImageURL,
    ]
})
export class ProfileV2Module {

}
