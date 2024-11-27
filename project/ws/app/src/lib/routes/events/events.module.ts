import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { MatGridListModule } from '@angular/material/grid-list'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatDividerModule } from '@angular/material/divider'

import { MatCardModule } from '@angular/material/card'
import { EventsRoutingModule } from './events-routing.module'
import { EventsHomeComponent } from './routes/events-home/events-home.component'
import { EventsComponent } from './routes/events/events.component'
import { LoaderService } from '@ws/author/src/public-api'
import { InitResolver } from '@ws/author/src/lib/services/init-resolve.service'
import { ReactiveFormsModule, FormsModule } from '@angular/forms'
import { BtnPageBackModule, BtnPageBackNavModule, ContentProgressModule, ContentStripWithTabsModule, HttpLoaderFactory } from '@sunbird-cb/collection/src/public-api'
import { AvatarPhotoModule } from '@sunbird-cb/collection/src/lib/_common/avatar-photo/avatar-photo.module'
import { PipeHtmlTagRemovalModule, PipeFilterV2Module, PipePublicURLModule, HorizontalScrollerV2Module,
  PipeFilterModule,
  PipeRelativeTimeModule,
  PipeFilterSearchModule,
  PipeOrderByModule,
 } from '@sunbird-cb/utils-v2'
import { EventsCardComponent } from './components/events-card/events-card.component'
import { TodayEventCardComponent } from './components/today-event-card/today-event-card.component'
import { EventDetailComponent } from './routes/event-detail/event-detail.component'
import { RelatedPostsComponent } from './components/related-posts/related-posts.component'
import { WidgetResolverModule } from '@sunbird-cb/resolver'
import { RightMenuCardComponent } from './components/right-menu-card/right-menu-card.component'
import { PresenterCardComponent } from './components/presenter-card/presenter-card.component'
import { EventService } from './services/events.service'
import { TranslateLoader, TranslateModule } from '@ngx-translate/core'
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
import { MatTabsModule } from '@angular/material/tabs'
import { KarmaPointsModule } from '@sunbird-cb/collection/src/lib/_common/content-toc/karma-points/karma-points.module'
import { EventPlayerComponent } from './routes/event-player/event-player.component'
import { EventPdfPlayerComponent } from './components/event-pdf-player/event-pdf-player.component'
import { ViewerResolve } from '@ws/viewer/src/lib/viewer.resolve'
import { SkeletonLoaderModule } from '@sunbird-cb/collection/src/lib/_common/skeleton-loader/skeleton-loader.module'
import { EventYouTubeComponent } from './components/event-you-tube/event-you-tube.component'
import { EventResolve } from './services/event-resolver.resolve'
import { DiscussionV2Module } from '@sunbird-cb/discussion-v2'
import { InfiniteScrollModule } from 'ngx-infinite-scroll'
import { HttpClient } from '@angular/common/http'

@NgModule({
  declarations: [
    EventsComponent,
    EventsHomeComponent,
    EventsCardComponent,
    TodayEventCardComponent,
    EventDetailComponent,
    RelatedPostsComponent,
    RightMenuCardComponent,
    PresenterCardComponent,
    EventPlayerComponent,
    EventPdfPlayerComponent,
    EventYouTubeComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    EventsRoutingModule,
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
    PipeFilterModule,
    PipeHtmlTagRemovalModule,
    PipeRelativeTimeModule,
    AvatarPhotoModule,
    PipeOrderByModule,
    PipeFilterV2Module,
    PipeFilterSearchModule,
    PipePublicURLModule,
    BtnPageBackModule,
    WidgetResolverModule,
    MatTabsModule,
    HorizontalScrollerV2Module,
    ContentStripWithTabsModule,
    KarmaPointsModule,
    BtnPageBackNavModule,
    SkeletonLoaderModule,
    ContentProgressModule,
    DiscussionV2Module,
    InfiniteScrollModule,
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
    EventService,
    ViewerResolve,
    EventResolve,
  ],
})
export class EventsModule { }
