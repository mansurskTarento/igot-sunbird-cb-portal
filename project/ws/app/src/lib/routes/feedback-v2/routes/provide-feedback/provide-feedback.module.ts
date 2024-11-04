import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'

import { BtnContentFeedbackV2Module } from '@sunbird-cb/collection'
import { FeedbackApiService } from '../../apis/feedback-api.service'
import { FeedbackConfigResolver } from '../../resolvers/feedback-config.resolver'
import { FeedbackSummaryResolver } from '../../resolvers/feedback-summary.resolver'
import { ContentRequestComponent } from './components/content-request/content-request.component'
import { FeedbackComponent } from './components/feedback/feedback.component'
import { HomeComponent } from './components/home/home.component'
import { ServiceRequestComponent } from './components/service-request/service-request.component'
import { ProvideFeedbackRoutingModule } from './provide-feedback-routing.module'
import { MatButtonModule } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { MatTabsModule } from '@angular/material/tabs'
import { MatBadgeModule } from '@angular/material/badge'
@NgModule({
  declarations: [
    HomeComponent,
    FeedbackComponent,
    ContentRequestComponent,
    ServiceRequestComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ProvideFeedbackRoutingModule,
    BtnContentFeedbackV2Module,
    MatButtonModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatBadgeModule,
  ],
  providers: [FeedbackApiService, FeedbackSummaryResolver, FeedbackConfigResolver],
})
export class ProvideFeedbackModule { }
