import { NgModule } from '@angular/core'
import { CommonModule, DatePipe } from '@angular/common'
import { MatGridListModule } from '@angular/material/grid-list'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatDividerModule } from '@angular/material/divider'

import { MatCardModule } from '@angular/material/card'
import { EventsRoutingModule } from './events-routing.module'
import { EventsHomeComponent } from './routes/events-home/events-home.component'
import { EventsComponent } from './routes/events/events.component'
import { LoaderService } from '@ws/author'
import { InitResolver } from '@ws/author'
import { ReactiveFormsModule, FormsModule } from '@angular/forms'
import { BtnPageBackModule, BtnPageBackNavModule, ContentProgressModule, ContentStripWithTabsModule, HttpLoaderFactory } from '@sunbird-cb/collection'
import { AvatarPhotoModule } from '@sunbird-cb/collection'
import {
  PipeHtmlTagRemovalModule, PipeFilterV2Module, PipePublicURLModule, HorizontalScrollerV2Module,
  PipeFilterModule,
  PipeRelativeTimeModule,
  PipeFilterSearchModule,
  PipeOrderByModule,
} from '@sunbird-cb/utils-v2'
import { EventsCardComponent } from './components/events-card/events-card.component'
import { TodayEventCardComponent } from './components/today-event-card/today-event-card.component'
import { EventDetailComponent } from './routes/event-detail/event-detail.component'
import { WidgetResolverModule } from '@sunbird-cb/resolver'
import { RightMenuCardComponent } from './components/right-menu-card/right-menu-card.component'
import { PresenterCardComponent } from './components/presenter-card/presenter-card.component'
import { EventService } from './services/events.service'
import { TranslateModule, TranslateLoader } from '@ngx-translate/core'
import { MatButtonModule } from '@angular/material/button'
import { MatChipsModule } from '@angular/material/chips'
// import { MatDialogModule } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatListModule } from '@angular/material/list'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatSelectModule } from '@angular/material/select'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatTabsModule } from '@angular/material/tabs'
import { KarmaPointsModule } from '@sunbird-cb/toc'
import { EventPlayerComponent } from './routes/event-player/event-player.component'
import { EventPdfPlayerComponent } from './components/event-pdf-player/event-pdf-player.component'
import { ViewerResolve } from '@ws/viewer/src/lib/viewer.resolve'
import { SkeletonLoaderModule } from '@sunbird-cb/collection'
import { EventYouTubeComponent } from './components/event-you-tube/event-you-tube.component'
import { EventResolve } from './services/event-resolver.resolve'
import { WidgetCommentModule } from '@sunbird-cb/discussion-v2'
import { InfiniteScrollModule } from 'ngx-infinite-scroll'
import { HttpClient } from '@angular/common/http'
import { EventsHomeV2Component } from './routes/events-home-v2/events-home-v2.component'
import { EventsCalendarModule } from './routes/events-calendar/events-calendar.module'
import { EventsEngagementComponent } from './routes/events-engagement/events-engagement.component'
import { ContentStripWithTabsPillsModule, ContentStripWithTabsLibModule } from '@sunbird-cb/consumption'
import { MatDialogModule } from '@angular/material/dialog'

import { ViewAllComponent } from './routes/view-all/view-all.component'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { EventCardV2Module } from '@sunbird-cb/collection'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { MatMenuModule } from '@angular/material/menu'
import { MatBottomSheetModule, MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet'
import { MobileFiltersComponent } from './routes/events/mobile-filters/mobile-filters.component'
import { MatTooltipModule } from '@angular/material/tooltip'
import { SeeAllComponent } from './routes/events/see-all/see-all.component'
import { EventVideoPlayerComponent } from './components/event-video-player/event-video-player.component'
import { EventsV2Component } from './routes/events-v2/events-v2.component'
import { MyAllEventsComponent } from './routes/events/my-all-events/my-all-events.component'
import { ShareDiscussionModule } from '@sunbird-cb/discussion-v2'
import { MatRadioModule } from '@angular/material/radio'
@NgModule({
  declarations: [
    EventsComponent,
    EventsHomeComponent,
    EventsCardComponent,
    TodayEventCardComponent,
    EventDetailComponent,
    RightMenuCardComponent,
    PresenterCardComponent,
    EventPlayerComponent,
    EventPdfPlayerComponent,
    EventYouTubeComponent,
    EventsHomeV2Component,
    EventsEngagementComponent,
    ViewAllComponent,
    MobileFiltersComponent,
    SeeAllComponent,
    EventVideoPlayerComponent,
    EventsV2Component,
    MyAllEventsComponent,
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
    MatRadioModule,
    MatCheckboxModule,
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
    WidgetCommentModule,
    InfiniteScrollModule,
    MatSnackBarModule,
    ContentStripWithTabsPillsModule,
    ContentStripWithTabsLibModule,
    MatDatepickerModule,
    EventCardV2Module,
    MatSnackBarModule,
    MatMenuModule,
    MatBottomSheetModule,
    MatTooltipModule,
    ShareDiscussionModule,
    EventsCalendarModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  providers: [
    { provide: MAT_BOTTOM_SHEET_DATA, useValue: {} },
    { provide: MatBottomSheetRef, useValue: {} },
    LoaderService,
    InitResolver,
    EventService,
    ViewerResolve,
    EventResolve,
    DatePipe,
    EventsEngagementComponent,
  ],
})
export class EventsModule { }
