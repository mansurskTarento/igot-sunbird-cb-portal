import { Component } from '@angular/core'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'

@Component({
  selector: 'ws-welcome-greeting',
  templateUrl: './welcome-greeting.component.html',
  styleUrls: ['./welcome-greeting.component.scss'],
  standalone: false,
})
export class WelcomeGreetingComponent {

  constructor(private configSvc: ConfigurationsService) { }

  /** true when result.last_login was absent → first time login on platform */
  get isFirstLogin(): boolean {
    return this.configSvc.isNewUser
  }

  get userName(): string {
    return (this.configSvc.userProfile && this.configSvc.userProfile.firstName) || ''
  }
}
