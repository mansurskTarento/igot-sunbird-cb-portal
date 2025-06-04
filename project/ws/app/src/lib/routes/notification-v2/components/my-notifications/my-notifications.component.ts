import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { EventService, MultilingualTranslationsService } from '@sunbird-cb/utils-v2';

@Component({
  selector: 'ws-app-my-notifications',
  templateUrl: './my-notifications.component.html',
  styleUrls: ['./my-notifications.component.scss']
})
export class MyNotificationsComponent {
  selectedLanguage = 'en'
  constructor(private translate: TranslateService,
    private langtranslations: MultilingualTranslationsService,
    private router: Router, private events: EventService) {
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
    this.raiseTelemetryEventForNotification(notification)
    if (notification.category === 'LEARN') {
      this.router.navigate([`/app/toc/${notification.message.id}`])
    } else if (notification.category === 'EVENT') {
      this.router.navigate([`/app/event-hub/home/${notification.message.id}`])
    } else if (notification.category === 'DISCUSSION') {
      this.router.navigate([`/app/discussion-forum-v2/community/${notification.message.communityId}/${notification.message.postId}`])
    } else if (notification.category === 'NETWORK') {
      if (notification.sub_category === "ACCEPTED_CONNECTION_REQUEST") {
        this.router.navigate([`/app/network-v2/my-connection`])
      } else if (notification.sub_category === "SEND_CONNECTION_REQUEST") {
        this.router.navigate([`/app/network-v2/connection-requests`])
      }
    }
  }

  raiseTelemetryEventForNotification(notification: any) {
    this.events.raiseInteractTelemetry(
      {
        type: 'click',
        subType: 'notification-engine',
        id: notification.notification_id,
      },
      {},
      {
        module: 'Home',
      }
    )
  }

}
