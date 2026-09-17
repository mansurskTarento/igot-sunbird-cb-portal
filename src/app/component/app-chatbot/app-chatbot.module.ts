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
import { IGotSarthiComponent } from './../igot-sarthi/igot-sarthi.component'
import { MarkdownModule } from 'ngx-markdown'
import { PipeDurationTransformModule } from '@sunbird-cb/utils-v2'
import { DragDropModule } from '@angular/cdk/drag-drop'
import { NonReleventFeedbackDialogModule } from '@sunbird-cb/collection'
import { MatTooltipModule } from '@angular/material/tooltip'
import { ItsmChatModule, SupportAIComponent } from '@sunbird-cb/itsm-chatbot'

// Guard the library hook until its conditional textarea is rendered.
const supportAIAfterViewInit = SupportAIComponent.prototype.ngAfterViewInit
SupportAIComponent.prototype.ngAfterViewInit = function (): void {
  if (this.textArea) {
    supportAIAfterViewInit.call(this)
  } else {
    setTimeout(() => this.scrollToBottomEvent.emit(), 200)
  }
}

@NgModule({
  declarations: [
    ClickOutsideDirective,
    AppChatbotComponent,
    IGotSarthiComponent,
  ],
  imports: [
    FormsModule,
    BrowserModule,
    MatIconModule,
    BrowserAnimationsModule,
    MatProgressSpinnerModule,
    CommonModule,
    PipeDurationTransformModule,
    MarkdownModule.forRoot(),
    DragDropModule,
    NonReleventFeedbackDialogModule,
    MatTooltipModule,
    ItsmChatModule,
  ],
  exports: [AppChatbotComponent, MarkdownModule, NonReleventFeedbackDialogModule],
  providers: [ChatbotService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})

export class AppChatbotModule { }
