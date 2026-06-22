import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { WelcomeGreetingComponent } from './welcome-greeting.component'
import { TranslateModule } from '@ngx-translate/core'

@NgModule({
  declarations: [WelcomeGreetingComponent],
  imports: [CommonModule, TranslateModule],
  exports: [WelcomeGreetingComponent],
})
export class WelcomeGreetingModule { }
