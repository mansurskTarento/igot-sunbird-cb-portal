import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ConfigurationsService, EventService, MultilingualTranslationsService } from '@sunbird-cb/utils-v2';
import { NotificationsService } from '../../../../../../../../../src/app/services/notifications.service';
import { environment } from 'src/environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { ConfirmDialogComponent } from '@sunbird-cb/collection/src/lib/_common/confirm-dialog/confirm-dialog.component';
@Component({
  selector: 'ws-app-my-notifications',
  templateUrl: './my-notifications.component.html',
  styleUrls: ['./my-notifications.component.scss']
})
export class MyNotificationsComponent {
  selectedLanguage = 'en'
  roles: string[] = []
  constructor(private translate: TranslateService,
    private langtranslations: MultilingualTranslationsService,
    private notificationsService: NotificationsService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private configService: ConfigurationsService,
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
    if (this.configService && this.configService.unMappedUser && this.configService.unMappedUser.roles) {
      this.roles = this.configService.unMappedUser.roles
    }
  }


  redirectTo(notification: any) {
    this.raiseTelemetryEventForNotification(notification)
    if (notification.category === 'LEARN') {
      this.router.navigate([`/app/toc/${notification.message.data.id}`])
    } else if (notification.category === 'EVENT') {
      this.router.navigate([`/app/event-hub/home/${notification.message.data.id}`])
    } else if (notification.category === 'DISCUSSION') {
      this.router.navigate([`/app/discussion-forum-v2/community/${notification.message.data.communityId}/${notification.message.data.discussionId}`])
    } else if (notification.category === 'NETWORK') {
      if (notification.sub_category === "ACCEPTED_CONNECTION_REQUEST") {
        this.router.navigate([`/app/network-v2/my-connection`])
      } else if (notification.sub_category === "SEND_CONNECTION_REQUEST") {
        this.router.navigate([`/app/network-v2/connection-requests`])
      }
    } else if(notification?.sub_category?.includes('CONTENT')) {
      let data = {
        data: {
          title: '',
          cancelButton: 'Cancel',
          acceptButton: 'Confirm',
          message: 'You will be redirected to the Content Portal to view content-related notifications.',
        },
      }
      let url = `${environment?.portalsForNotifications?.cbp}/app/home`
      this.showDialog(data, url)
    } else if (notification.sub_category === 'CONTENT_PUBLISHED' || notification.sub_category === 'CONTENT_EDITED') {
      if (notification.message.data && notification.message.data.id) {
        this.notificationsService.getContentData(notification.message.data.id).subscribe((res: any) => {
          if (res) {
            if (res.primaryCategory === 'Learning Resource' &&
              res.resourceCategory !== 'Learning Resource') {
              localStorage.setItem('isStandaloneResource', 'true')
            } else {
              localStorage.setItem('isStandaloneResource', 'false')
            }
            if (this.roles.includes('CONTENT_CREATOR')) {
              if (res.status === 'Draft') {
                let url = `${environment.portalsForNotifications.cbp}/author/editor/${notification.message.data.id}/collectionV2`
                window.open(url, '_blank')
              } else if (res.status === 'Live') {
                let url = `${environment.portalsForNotifications.cbp}/author/content-detail/${notification.message.data.id}/overview-v2`
                window.open(url, '_blank')
              } else {
                let url = `${environment.portalsForNotifications.cbp}/author/content-detail/${notification.message.data.id}/overview-v2?mode=edit`
                window.open(url, '_blank')
              }
            } else {
              if (res.status === 'Draft') {
                alert('You are not authorized to view this content, the content might be recalled to draft by the creator.')
                //${environment.portalsForNotifications.cbp}
                window.open(`${environment.portalsForNotifications.cbp}`, '_blank')
              } else {
                let url = `${environment.portalsForNotifications.cbp}/author/content-detail/${notification.message.data.id}/overview-v2`
                window.open(url, '_blank')
              }
            }
          }
        })
      } else {
        this.snackBar.open('Something went wrong')
      }
    } else if (notification.sub_category === 'CONTENT_REVIEW_REQUEST' || notification.sub_category === 'CONTENT_REJECTED') {
      if (notification.message.data && notification.message.data.id) {
        this.notificationsService.getContentData(notification.message.data.id).subscribe((res: any) => {
          if (res) {
            if (res.status === 'Draft') {
              alert('You are not authorized to view this content, the content might be recalled to draft by the creator.')
              window.open(`${environment.portalsForNotifications.cbp}`, '_blank')
            } else {
              if (this.roles.includes('CONTENT_REVIEWER')) {
                let url = `${environment.portalsForNotifications.cbp}/author/content-detail/${notification.message.data.id}/overview-v2?mode=edit`
                window.open(url, '_blank')
              } else if (this.roles.includes('CONTENT_CREATOR')) {
                let url = `${environment.portalsForNotifications.cbp}/author/editor/${notification.message.data.id}`
                window.open(url, '_blank')
              }
            }
          }
        })
      } else if (notification.category === 'PROFILE') {
        let url = `${environment.portalsForNotifications.mdo}/app/home/approvals/approval`
        window.open(url, '_blank')
      }
    }
  }

  showDialog(data: any, url:string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, data)
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        window.open(url, '_blank')
      }
    })
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
