import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { HomeRoutingModule } from './home-routing.module'

import { MatCardModule } from '@angular/material/card'
import { MatIconModule } from '@angular/material/icon'

import { HeaderModule } from '../header/header.module'
import {
    GridLayoutModule, SlidersModule, DiscussStripMultipleModule,
    NetworkStripMultipleModule, ContentStripWithTabsModule, AvatarPhotoModule,
} from '@sunbird-cb/collection'
import { SkeletonLoaderModule } from '@sunbird-cb/collection'
import { PipeRelativeTimeModule, ImageResponsiveModule } from '@sunbird-cb/utils-v2'
import { WeeklyClapsModule } from '@sunbird-cb/collection'
import { TipsForLearnerModule } from '@sunbird-cb/collection'
import { UpdatePostsModule } from '@sunbird-cb/collection'
import { DiscussionsModule } from '@sunbird-cb/collection'
import { RecentRequestsModule } from '@sunbird-cb/collection'
import { SharedModule } from '../shared/shared.module'
import { FeedListModule } from './home/feed-list/feed-list.module'

import { HomeComponent } from './home/home.component'
import { HomeV2Component } from './home-v2/home-v2.component'
import { DiscussionInfoComponent } from '../component/discussion-info/discussion-info.component'
import { PageContainerComponent } from '../component/page-container/page-container.component'
import { ClientSliderComponent } from '../component/client-slider/client-slider.component'
import { HomeOtherPortalModule } from '../component/home-other-portal/home-other-portal.module'
import { HomeContainerComponent } from '../component/home-container/home-container.component'
import { NetworkHubComponent } from './home/network-hub/network-hub.component'
import { NotificationComponent } from './home/notification/notification.component'
import { SurveyFormComponent } from '../component/app-survey/survey-form/survey-form.component'

import { HomePageService } from '../services/home-page.service'
import { PendingRequestModule } from '@sunbird-cb/collection'
import { TranslateLoader, TranslateModule } from '@ngx-translate/core'
import { HttpLoaderFactory } from '../app.module'
import { HttpClient } from '@angular/common/http'
import { ContentStripWithTabsLibModule, ContentStripWithTabsPillsModule, ContetnSectionsComponent } from '@sunbird-cb/consumption'
import { SurveyFormModule } from '@sunbird-cb/collection'
import { MatButtonModule } from '@angular/material/button'
import { SignupService } from '../routes/signup/signup.service'
import { InSightSideBarModule } from '../component/in-sight-side-bar/in-sight-side-bar.module'


@NgModule({
    declarations: [
        HomeComponent,
        HomeV2Component,
        PageContainerComponent, DiscussionInfoComponent, ClientSliderComponent,
        HomeContainerComponent,
        NetworkHubComponent, NotificationComponent, SurveyFormComponent,
    ],
    imports: [
        CommonModule,
        RouterModule,
        HomeRoutingModule,
        GridLayoutModule,
        SlidersModule,
        DiscussStripMultipleModule,
        NetworkStripMultipleModule,
        ContentStripWithTabsModule,
        MatCardModule,
        MatIconModule,
        SharedModule,
        WeeklyClapsModule,
        TipsForLearnerModule,
        UpdatePostsModule,
        DiscussionsModule,
        RecentRequestsModule,
        SkeletonLoaderModule,
        PipeRelativeTimeModule,
        ImageResponsiveModule,
        AvatarPhotoModule,
        PendingRequestModule,
        ContentStripWithTabsLibModule,
        ContentStripWithTabsPillsModule,
        MatButtonModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient],
            },
        }),
        SurveyFormModule,
        FeedListModule,
        InSightSideBarModule,
        HomeOtherPortalModule,
        ContetnSectionsComponent,
    ],
    exports: [
        HeaderModule,
        MatCardModule,
        SharedModule,
        TranslateModule,
        FeedListModule,
        InSightSideBarModule,
        HomeOtherPortalModule,
    ],
    providers: [
        HomePageService,
        SignupService,
    ],
})
export class HomeModule { }
