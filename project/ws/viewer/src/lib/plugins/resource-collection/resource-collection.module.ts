import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { ResourceCollectionComponent } from './resource-collection.component'
import { ViewSubmissionComponent } from './components/view-submission/view-submission.component'
import { PlayerPdfModule, PlayerVideoModule, PlayerSurveyModule } from '@sunbird-cb/collection'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatDialogModule } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatPaginatorModule } from '@angular/material/paginator'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatTableModule } from '@angular/material/table'
import { MatTabsModule } from '@angular/material/tabs'
import { MatToolbarModule } from '@angular/material/toolbar'

@NgModule({
  declarations: [ResourceCollectionComponent, ViewSubmissionComponent],
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatDialogModule,
    MatCardModule,
    MatPaginatorModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatIconModule,
    MatToolbarModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    PlayerPdfModule,
    PlayerVideoModule,
    PlayerSurveyModule,
  ],
  entryComponents: [
    ViewSubmissionComponent,
  ],
  exports: [
    ResourceCollectionComponent,
  ],
})
export class ResourceCollectionModule { }
