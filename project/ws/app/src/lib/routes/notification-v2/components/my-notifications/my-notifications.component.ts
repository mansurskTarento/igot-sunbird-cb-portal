import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MultilingualTranslationsService } from '@sunbird-cb/utils-v2';

@Component({
  selector: 'ws-app-my-notifications',
  templateUrl: './my-notifications.component.html',
  styleUrls: ['./my-notifications.component.scss']
})
export class MyNotificationsComponent {
  selectedLanguage = 'en'
  constructor(private translate: TranslateService,
    private langtranslations: MultilingualTranslationsService,
    private router: Router) {
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

  redirectTo(notification: any) {
    if (notification.type === 'learn') {
      this.router.navigate([`/app/toc/${notification.message.id}`])
    } else if (notification.type === 'event') {
      this.router.navigate([`/app/event-hub/home/${notification.message.id}`])
    } else if (notification.type === 'discussion') {
      this.router.navigate([`/app/discussion-forum-v2/community/${notification.message.id}`])
    } else if (notification.type === 'network') {
      this.router.navigate([`/app/network-v2/my-connection`])
    }
  }

}
