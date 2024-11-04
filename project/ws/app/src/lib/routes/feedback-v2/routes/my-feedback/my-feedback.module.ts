import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ReactiveFormsModule } from '@angular/forms'
import { LayoutModule } from '@angular/cdk/layout'

import { PipeSafeSanitizerModule } from '@sunbird-cb/utils-v2'
import {
  UserImageModule,
  DisplayContentTypeModule,
  BtnContentFeedbackV2Module,
} from '@sunbird-cb/collection'

import { MyFeedbackRoutingModule } from './my-feedback-routing.module'
import { HomeComponent } from './components/home/home.component'
import { FeedbackListComponent } from './components/feedback-list/feedback-list.component'
import { FeedbackThreadComponent } from './components/feedback-thread/feedback-thread.component'
import { FeedbackThreadItemComponent } from './components/feedback-thread-item/feedback-thread-item.component'
import { MyFeedbackService } from './services/my-feedback.service'
import { FeedbackFilterDialogComponent } from './components/feedback-filter-dialog/feedback-filter-dialog.component'
import { FeedbackTypeComponent } from './components/feedback-type/feedback-type.component'
import { FeedbackThreadHeaderComponent } from './components/feedback-thread-header/feedback-thread-header.component'
import { FeedbackSummaryResolver } from '../../resolvers/feedback-summary.resolver'
import { FeedbackConfigResolver } from '../../resolvers/feedback-config.resolver'
import { MatButtonModule } from '@angular/material/button'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatChipsModule } from '@angular/material/chips'
import { MatRippleModule } from '@angular/material/core'
import { MatDialogModule } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatListModule } from '@angular/material/list'
import { MatMenuModule } from '@angular/material/menu'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatSelectModule } from '@angular/material/select'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { MatTabsModule } from '@angular/material/tabs'
import { MatTooltipModule } from '@angular/material/tooltip'
import { MatBadgeModule } from '@angular/material/badge'

@NgModule({
  declarations: [
    HomeComponent,
    FeedbackListComponent,
    FeedbackThreadComponent,
    FeedbackThreadItemComponent,
    FeedbackFilterDialogComponent,
    FeedbackTypeComponent,
    FeedbackThreadHeaderComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LayoutModule,
    MatListModule,
    MatIconModule,
    MatDividerModule,
    MatRippleModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatTooltipModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatBadgeModule,
    MatTabsModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatChipsModule,
    MatMenuModule,
    PipeSafeSanitizerModule,
    UserImageModule,
    DisplayContentTypeModule,
    BtnContentFeedbackV2Module,
    MyFeedbackRoutingModule,
  ],
  providers: [MyFeedbackService, FeedbackSummaryResolver, FeedbackConfigResolver],
  entryComponents: [FeedbackFilterDialogComponent],
})
export class MyFeedbackModule {}
