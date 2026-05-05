import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { UserProfileRoutingModule } from './user-profile-routing.module'
import { UserProfileComponent } from './components/user-profile/user-profile.component'
import { TabDirective } from './components/user-profile/tab.directive'
import { SharedModule } from '@ws/author/src/lib/modules/shared/shared.module'
import { ReactiveFormsModule, FormsModule } from '@angular/forms'
import { UserProfileService } from './services/user-profile.service'
import { LoaderService } from '@ws/author/src/public-api'
import { BtnPageBackModule } from '@sunbird-cb/collection'
import { PipeDurationTransformModule } from '@sunbird-cb/utils-v2'
import { OtpService } from './services/otp.services'
import { RequestDialogComponent } from './components/request-dialog/request-dialog.component'
import { EhrmsComponent } from './components/user-profile/e-hrms/ehrms/ehrms.component'
import { SkeletonLoaderModule } from '@sunbird-cb/collection/src/lib/_common/skeleton-loader/skeleton-loader.module'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatButtonModule } from '@angular/material/button'
import { MatButtonToggleModule } from '@angular/material/button-toggle'
import { MatCardModule } from '@angular/material/card'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatChipsModule } from '@angular/material/chips'
import { MatNativeDateModule } from '@angular/material/core'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatDialogModule } from '@angular/material/dialog'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatListModule } from '@angular/material/list'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatRadioModule } from '@angular/material/radio'
import { MatSelectModule } from '@angular/material/select'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { MatTableModule } from '@angular/material/table'
import { MatTabsModule } from '@angular/material/tabs'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatTooltipModule } from '@angular/material/tooltip'

@NgModule({
    declarations: [
        UserProfileComponent,
        TabDirective,
        RequestDialogComponent,
        EhrmsComponent,
    ],
    imports: [
        BtnPageBackModule,
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        UserProfileRoutingModule,
        SharedModule,
        MatButtonModule,
        MatTooltipModule,
        MatIconModule,
        MatListModule,
        MatSidenavModule,
        MatToolbarModule,
        MatCardModule,
        MatExpansionModule,
        MatRadioModule,
        MatChipsModule,
        MatInputModule,
        MatFormFieldModule,
        MatDialogModule,
        MatListModule,
        MatInputModule,
        MatSnackBarModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatTableModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
        MatButtonToggleModule,
        MatTabsModule,
        MatAutocompleteModule,
        PipeDurationTransformModule,
        SkeletonLoaderModule,
    ],
    providers: [UserProfileService, LoaderService, OtpService]
})
export class UserProfileModule { }
