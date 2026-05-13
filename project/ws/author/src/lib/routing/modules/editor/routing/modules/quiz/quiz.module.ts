import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { DragDropModule } from '@angular/cdk/drag-drop'
import { SharedModule } from '../../../../../../modules/shared/shared.module'
import { EditorSharedModule } from '../../../../../../routing/modules/editor/shared/shared.module'
import { QuizRoutingModule } from './quiz-routing.module'
import { AuthViewerModule } from '../../../../../../modules/viewer/viewer.module'

import { QuizComponent } from '../../../../../../routing/modules/editor/routing/modules/quiz/components/quiz/quiz.component'
import { MatchTheFollowingComponent } from '../../../../../../routing/modules/editor/routing/modules/quiz/components/match-the-following/match-the-following.component'
import { MultipleChoiceQuestionComponent } from '../../../../../../routing/modules/editor/routing/modules/quiz/components/multiple-choice-question/multiple-choice-question.component'
import { FillUpsEditorComponent } from '../../../../../../routing/modules/editor/routing/modules/quiz/components/fill-ups-editor/fill-ups-editor.component'
import { QuestionEditorComponent } from '../../../../../../routing/modules/editor/routing/modules/quiz/components/question-editor/question-editor.component'
import { QuestionEditorSidenavComponent } from '../../../../../../routing/modules/editor/routing/modules/quiz/shared/components/question-editor-sidenav/question-editor-sidenav.component'
import { QuizStoreService } from './services/store.service'
import { OpenPlainCkEditorComponent } from './shared/components/open-plain-ck-editor/open-plain-ck-editor.component'
import { RomanConvertPipe } from '../../../../../../routing/modules/editor/routing/modules/quiz/shared/roman-convert.pipe'
import { QuizQusetionsComponent } from './components/quiz/quiz-questions/quiz-questions.component'

@NgModule({
    declarations: [
        QuizComponent,
        QuizQusetionsComponent,
        QuestionEditorComponent,
        MatchTheFollowingComponent,
        MultipleChoiceQuestionComponent,
        FillUpsEditorComponent,
        QuestionEditorSidenavComponent,
        OpenPlainCkEditorComponent,
        RomanConvertPipe,
    ],
    imports: [
        CommonModule,
        SharedModule,
        EditorSharedModule,
        DragDropModule,
        QuizRoutingModule,
        AuthViewerModule,
    ],
    providers: [QuizStoreService],
    exports: [QuizComponent, QuizQusetionsComponent],
})
export class QuizModule { }
