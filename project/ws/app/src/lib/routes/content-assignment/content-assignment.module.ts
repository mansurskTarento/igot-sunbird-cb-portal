import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'

import {
  BtnPageBackModule,
  DisplayContentsModule,
  DisplayContentTypeModule,
  EmailInputModule,
  PickerContentModule,
  UserAutocompleteModule,
  UserImageModule,
} from '@sunbird-cb/collection'
import { DialogAssignComponent } from './components/dialog-assign/dialog-assign.component'
import {
  DialogUserRoleSelectComponent,
} from './components/dialog-user-role-select/dialog-user-role-select.component'
import { UserFilterDisplayComponent } from './components/user-filter-display/user-filter-display.component'
import { ContentAssignmentRoutingModule } from './content-assignment-routing.module'
import { ContentAssignmentGuard } from './guards/content-assignment.guard'
import { AssignmentDetailsComponent } from './routes/assignment-details/assignment-details.component'
import { ContentAssignmentComponent } from './routes/content-assignment/content-assignment.component'
import { MatButtonModule } from '@angular/material/button'
import { MatButtonToggleModule } from '@angular/material/button-toggle'
import { MatCardModule } from '@angular/material/card'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatChipsModule } from '@angular/material/chips'
import { MatDialogModule } from '@angular/material/dialog'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatGridListModule } from '@angular/material/grid-list'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatListModule } from '@angular/material/list'
import { MatMenuModule } from '@angular/material/menu'
import { MatPaginatorModule } from '@angular/material/paginator'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatRadioModule } from '@angular/material/radio'
import { MatSelectModule } from '@angular/material/select'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatStepperModule } from '@angular/material/stepper'
import { MatTableModule } from '@angular/material/table'
import { MatTabsModule } from '@angular/material/tabs'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatTooltipModule } from '@angular/material/tooltip'

@NgModule({
    declarations: [
        ContentAssignmentComponent,
        UserFilterDisplayComponent,
        DialogAssignComponent,
        DialogUserRoleSelectComponent,
        AssignmentDetailsComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        BtnPageBackModule,
        DisplayContentTypeModule,
        DisplayContentsModule,
        EmailInputModule,
        PickerContentModule,
        UserImageModule,
        // Material Imports
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatButtonToggleModule,
        MatCardModule,
        MatGridListModule,
        MatExpansionModule,
        MatFormFieldModule,
        MatListModule,
        MatIconModule,
        MatDialogModule,
        MatTooltipModule,
        MatToolbarModule,
        MatMenuModule,
        MatPaginatorModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatRadioModule,
        MatTabsModule,
        UserAutocompleteModule,
        MatChipsModule,
        MatCheckboxModule,
        MatTableModule,
        MatSidenavModule,
        MatStepperModule,
        MatSelectModule,
        ContentAssignmentRoutingModule,
    ],
    providers: [ContentAssignmentGuard]
})
export class ContentAssignmentModule { }
