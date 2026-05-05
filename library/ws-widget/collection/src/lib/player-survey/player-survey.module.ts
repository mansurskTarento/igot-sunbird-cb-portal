import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { BtnFullscreenModule } from '../btn-fullscreen/btn-fullscreen.module'
import { PlayerSurveyComponent } from './player-survey.component'
import { MicroSurveyModule } from '@sunbird-cb/micro-surveys'
import { TranslateModule } from '@ngx-translate/core'
import { MatButtonModule } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatMenuModule } from '@angular/material/menu'
import { MatSliderModule } from '@angular/material/slider'
import { MatToolbarModule } from '@angular/material/toolbar'
import { SurveyFormQuestionComponent } from '@sunbird-cb/toc'
import { MatRadioModule } from '@angular/material/radio'
import { MatSelectModule } from '@angular/material/select'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { SurveyFormSectionComponent } from '@sunbird-cb/toc'



@NgModule({
    declarations: [PlayerSurveyComponent],
    imports: [
        CommonModule,
        MatInputModule,
        MatIconModule,
        MatFormFieldModule,
        MatMenuModule,
        MatButtonModule,
        MatSliderModule,
        MatToolbarModule,
        ReactiveFormsModule,
        FormsModule,
        BtnFullscreenModule,
        MatInputModule,
        MicroSurveyModule,
        MatRadioModule,
        MatSelectModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
        SurveyFormQuestionComponent,
        SurveyFormSectionComponent,
        TranslateModule.forChild(),
    ],
    exports: [PlayerSurveyComponent]
})
export class PlayerSurveyModule { }
