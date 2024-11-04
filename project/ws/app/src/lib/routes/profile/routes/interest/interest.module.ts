import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { InterestComponent } from './components/interest/interest.component'
// import { PipeLimitToModule } from '@ws-shared/util'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'

import { PipeLimitToModule } from '@sunbird-cb/utils-v2'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatChipsModule } from '@angular/material/chips'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatSnackBarModule } from '@angular/material/snack-bar'

@NgModule({
  declarations: [InterestComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatSnackBarModule,
    MatChipsModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    PipeLimitToModule,
  ],
  exports: [InterestComponent],
})
export class InterestModule {}
