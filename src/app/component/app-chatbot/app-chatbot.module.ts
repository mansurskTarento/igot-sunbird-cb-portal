import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { ClickOutsideDirective } from './clickoutside.directive'
import { AppChatbotComponent } from './app-chatbot.component'
import { ChatbotService } from './chatbot.service'
import { FormsModule } from '@angular/forms'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { CommonModule } from '@angular/common'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'

@NgModule({
  declarations: [
    ClickOutsideDirective,
    AppChatbotComponent,
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
