import { Component } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { ConfigurationsService, EventService, MultilingualTranslationsService } from '@sunbird-cb/utils-v2'
import { NotificationsService } from '../../../../../../../../../src/app/services/notifications.service'
import { environment } from 'src/environments/environment'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { MatDialog as MatDialogNew } from '@angular/material/dialog'
import { ConfirmDialogComponent } from '@sunbird-cb/collection/src/lib/_common/confirm-dialog/confirm-dialog.component'
import { SurveyPopupComponent } from '../../../peer-validation/components/survey-popup/survey-popup.component'
import { VerificationRequestDialogComponent } from '../../../peer-validation/components/verification-request-dialog/verification-request-dialog.component'
import { LibNotificationsService } from '@sunbird-cb/notification'
import { ActivatedRoute } from '@angular/router'
@Component({
  selector: 'ws-app-my-notifications',
  templateUrl: './my-notifications.component.html',
  styleUrls: ['./my-notifications.component.scss']
})
export class MyNotificationsComponent {
  selectedLanguage = 'en'
  roles: string[] = []
  fragment: string = ''
  constructor(private translate: TranslateService,
    private langtranslations: MultilingualTranslationsService,
    private notificationsService: NotificationsService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private configService: ConfigurationsService,
    private events: EventService,
    private libNotificationsService: LibNotificationsService,
    private route: ActivatedRoute,
    private matDialog: MatDialogNew) {
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
    this.libNotificationsService._handleClick.subscribe((content: any) => {
      if (content && content.identifier) {
        this.notificationsService.handleConetentRedirection(content)
      }
    })
    this.route.fragment.subscribe((fragment: any) => {
      if (fragment) {
        this.fragment = fragment
      }
    })
  }


  redirectTo(notification: any) {
    this.raiseTelemetryEventForNotification(notification)
    if (notification.category === 'PEER_VALIDATION' || notification.sub_type === 'PEER_VALIDATION') {
      if (notification.sub_category === 'PEER_REVIEW_ASSIGNED') {
        // Incoming: someone assigned this user as a peer reviewer
        this.openVerificationPopup(notification)
      } else {
        // PEER_EVALUATION_ASSIGNED or other: learner needs to fill the survey
        this.openSurveypopup(notification)
      }
    } else {
      this.notificationsService.handleRedirection(notification, environment, this.roles, this.snackBar)
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    const dd = String(date.getDate()).padStart(2, '0')
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const yyyy = date.getFullYear()
    return `${dd}-${mm}-${yyyy}`
  }

  openSurveypopup(notification: any) {
    const profile = this.configService.userProfile
    const learnerName = `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim()
    const notifData = notification.message?.data?.[0] || {}
    if (notifData.isSurveySubmitted === true) {
      this.snackBar.open('You have already completed the survey.', 'X', { duration: 3000 })
      return
    }
    if (notifData.surveyEndDate && new Date(notifData.surveyEndDate) < new Date()) {
      this.snackBar.open('Survey has ended.', 'X', { duration: 3000 })
      return
    }
    this.matDialog.open(SurveyPopupComponent, {
      width: '500px',
      disableClose: true,
      data: {
        learnerName: learnerName || '',
        courseName: notifData.courseName || '',
        completionDate: this.formatDate(notifData.completionDate || ''),
        formId: notifData.formId || '',
        isSurveySubmitted: notifData.isSurveySubmitted || false,
        surveyCreatedById: notifData.surveyCreatedById || '',
        notificationId: notification.notification_id || '',
        createdAt: notification.created_at || '',
        contextOrgId: notifData.contextOrgId || '',
        contextId: notifData.contextId || '',
      },
    })
  }

  openVerificationPopup(notification: any) {
    const notifData = notification.message?.data?.[0] || {}
    if (notifData.isReviewSubmitted === true) {
      this.snackBar.open('You have already submitted the review.', 'X', { duration: 3000 })
      return
    }
    if (notifData.surveyEndDate && new Date(notifData.surveyEndDate) < new Date()) {
      this.snackBar.open('Survey has ended.', 'X', { duration: 3000 })
      return
    }
    this.matDialog.open(VerificationRequestDialogComponent, {
      width: '440px',
      maxWidth: '90vw',
      disableClose: true,
      data: {
        requestedName: notifData.requestedName || notifData.learnerName || '',
        courseName: notifData.courseName || '',
        formId: notifData.formId || '',
        isReviewSubmitted: notifData.isReviewSubmitted || false,
        surveyEndDate: notifData.surveyEndDate || '',
        notificationId: notification.notification_id || '',
        createdAt: notification.created_at || '',
        contextOrgId: notifData.contextOrgId || '',
        contextId: notifData.contextId || '',
      },
    })
  }

  showDialog(data: any, url: string) {
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
