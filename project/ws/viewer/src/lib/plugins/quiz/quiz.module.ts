import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { QuizComponent } from './quiz.component'
import { OverviewComponent } from './components/overview/overview.component'
import { QuestionComponent } from './components/question/question.component'
import { SubmitQuizDialogComponent } from './components/submit-quiz-dialog/submit-quiz-dialog.component'

import { PipeDurationTransformModule, PipeLimitToModule } from '@sunbird-cb/utils-v2'

import {
  BtnFullscreenModule,
} from '@sunbird-cb/collection'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatDialogModule } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatListModule } from '@angular/material/list'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatRadioModule } from '@angular/material/radio'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatTableModule } from '@angular/material/table'
import { MatTooltipModule } from '@angular/material/tooltip'

@NgModule({
  declarations: [QuizComponent, OverviewComponent, QuestionComponent, SubmitQuizDialogComponent],
  entryComponents: [SubmitQuizDialogComponent],
  imports: [
    CommonModule,
    PipeDurationTransformModule,
    PipeLimitToModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatListModule,
    MatRadioModule,
    MatSidenavModule,
    MatTableModule,
    MatButtonModule,
    BtnFullscreenModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  exports: [
    QuizComponent,
  ],
})
export class QuizModule { }
