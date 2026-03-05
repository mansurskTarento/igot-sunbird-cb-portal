import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'

// Angular Material Modules
import { MatDialogModule } from '@angular/material/dialog'
import { MatStepperModule } from '@angular/material/stepper'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatRadioModule } from '@angular/material/radio'
import { MatTableModule } from '@angular/material/table'
import { MatPaginatorModule } from '@angular/material/paginator'
import { MatTabsModule } from '@angular/material/tabs'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { PlayerVideoModule, PlayerPdfModule } from '@sunbird-cb/collection'
import { WidgetResolverModule } from '@sunbird-cb/resolver'
// Routing
import { PeerValidationRoutingModule } from './peer-validation-routing.module'

// Services
import { PeerValidationService } from './services/peer-validation.service'
import { PeerValidationMockService } from './services/peer-validation-mock.service'

// Survey Components
import { SurveyPopupComponent } from './components/survey-popup/survey-popup.component'
import { SurveyDialogComponent } from './components/survey-dialog/survey-dialog.component'
import { SurveyQuestionsComponent } from './components/survey-dialog/components/survey-questions/survey-questions.component'
import { DocumentUploadComponent } from './components/survey-dialog/components/document-upload/document-upload.component'
import { PeerSelectionComponent } from './components/survey-dialog/components/peer-selection/peer-selection.component'
import { SuccessDialogComponent } from './components/survey-dialog/components/success-dialog/success-dialog.component'
import { PeerDashboardComponent } from './components/peer-dashboard/peer-dashboard.component'
import { ReviewPageComponent } from './components/review-page/review-page.component'
import { VideoPreviewDialogComponent } from './components/survey-dialog/components/video-preview-dialog/video-preview-dialog.component'
import { VerificationRequestDialogComponent } from './components/verification-request-dialog/verification-request-dialog.component'
import { UserSearchTableComponent } from './components/survey-dialog/components/user-search-table/user-search-table.component'

@NgModule({
  declarations: [
    // Survey Components
    SurveyPopupComponent,
    SurveyDialogComponent,
    SurveyQuestionsComponent,
    DocumentUploadComponent,
    PeerSelectionComponent,
    SuccessDialogComponent,
    PeerDashboardComponent,
    ReviewPageComponent,
    VideoPreviewDialogComponent,
    VerificationRequestDialogComponent,
    UserSearchTableComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PeerValidationRoutingModule,
    // Material
    MatDialogModule,
    MatStepperModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatCheckboxModule,
    MatRadioModule,
    MatTableModule,
    MatPaginatorModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    PlayerVideoModule,
    PlayerPdfModule,
    WidgetResolverModule,
  ],
  providers: [
    PeerValidationService,
    PeerValidationMockService,
  ],
})
export class PeerValidationModule { }
