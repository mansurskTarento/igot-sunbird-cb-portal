import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { ClickOutsideDirective } from './clickoutside.directive'
import { AppChatbotComponent } from './app-chatbot.component'
import { ChatbotService } from './chatbot.service'
import { FormsModule } from '@angular/forms'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { CommonModule } from '@angular/common'
import { MatIconModule } from '@angular/material/icon'
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner'
import { AiTutorComponent } from '@ws/viewer/src/lib/components/ai-tutor/ai-tutor.component'


@NgModule({
  declarations: [
    ClickOutsideDirective,
    AppChatbotComponent,
    AiTutorComponent
  ],
  imports: [
    FormsModule,
    BrowserModule,
    MatIconModule,
    BrowserAnimationsModule,
    MatProgressSpinnerModule,
    CommonModule,
  ],
  exports: [AppChatbotComponent],
  providers: [ChatbotService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})

export class AppChatbotModule { }
