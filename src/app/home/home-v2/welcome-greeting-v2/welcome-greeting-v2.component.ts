import { Component, inject } from '@angular/core'
import { TitleCasePipe } from '@angular/common'
import { TranslateModule } from '@ngx-translate/core'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'

@Component({
  selector: 'ws-welcome-greeting-v2',
  templateUrl: './welcome-greeting-v2.component.html',
  styleUrls: ['./welcome-greeting-v2.component.scss'],
  standalone: true,
  imports: [TitleCasePipe, TranslateModule],
})
export class WelcomeGreetingV2Component {
  private readonly configSvc = inject(ConfigurationsService)

  /** true when result.last_login was absent → first time login on platform */
  get isFirstLogin(): boolean {
    return this.configSvc.isNewUser
  }

  get userName(): string {
    return this.configSvc.userProfile?.firstName ?? ''
  }
}
