import { Component, OnInit } from '@angular/core'
import { SettingsService } from '../../settings.service'
//import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { TranslateService } from '@ngx-translate/core'
/* tslint:disable*/
import _ from 'lodash'

@Component({
  selector: 'ws-app-notification-settings',
  templateUrl: './notification-settings.component.html',
  styleUrls: ['./notification-settings.component.scss'],
})
export class NotificationSettingsComponent implements OnInit {

  notificationSettings: any[] = [
    {
      id: 'email',
      title: 'Email Notification',
      description: 'Keep receiving notifications through email.',
      enabled: false,
    },
    {
      id: 'push',
      title: 'Push Notification',
      description: 'Keep receiving push notifications on mobile.',
      enabled: false,
    },
    {
      id: 'sms',
      title: 'SMS Notification',
      description: 'Keep receiving SMS notifications. ',
      enabled: true,
    },

  ]
  constructor(
    //private snackBar: MatSnackBar,
    private settingsSvc: SettingsService,
    private translate: TranslateService,
  ) {
    if (localStorage.getItem('websiteLanguage')) {
      this.translate.setDefaultLang('en')
      let lang = localStorage.getItem('websiteLanguage')!
      this.translate.use(lang)
    }
  }

  ngOnInit() {
    console.log(this.settingsSvc)
  }
}
