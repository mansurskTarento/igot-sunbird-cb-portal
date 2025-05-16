import { Component, OnInit } from '@angular/core'
import { SettingsService } from '../../settings.service'
//import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { TranslateService } from '@ngx-translate/core'
/* tslint:disable*/
import _ from 'lodash'
import { MultilingualTranslationsService } from '@sunbird-cb/utils-v2'

@Component({
  selector: 'ws-app-notification-settings',
  templateUrl: './notification-settings.component.html',
  styleUrls: ['./notification-settings.component.scss'],
})
export class NotificationSettingsComponent implements OnInit {
  selectedLanguage = 'en'
  notificationSettings: any[] = [
    {
      id: 'email',
      title: 'email',
      description: 'emailDesc',
      enabled: false,
    },
    {
      id: 'push',
      title: 'push',
      description: 'pushDesc',
      enabled: false,
    },
    {
      id: 'sms',
      title: 'sms',
      description: 'smsDesc',
      enabled: true,
    },
  ]
  constructor(
    //private snackBar: MatSnackBar,
    private settingsSvc: SettingsService,
    private translate: TranslateService,
    private langtranslations: MultilingualTranslationsService,
  ) {
    if (localStorage.getItem('websiteLanguage')) {
      this.translate.setDefaultLang('en')
      let lang = JSON.stringify(localStorage.getItem('websiteLanguage'))
      lang = lang.replace(/\"/g, '')
      this.selectedLanguage = lang
      this.translate.use(lang)
    }

    this.langtranslations.languageSelectedObservable.subscribe(() => {
      if (localStorage.getItem('websiteLanguage')) {
        this.translate.setDefaultLang('en')
        const lang = localStorage.getItem('websiteLanguage')!
        this.translate.use(lang)
        this.selectedLanguage = lang
      }
    })
  }

  translateLabels(label: string, type: any) {
    return this.langtranslations.translateActualLabel(label, type, '')
  }

  ngOnInit() {
    console.log(this.settingsSvc)
  }
}
