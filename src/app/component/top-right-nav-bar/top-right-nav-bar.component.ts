import { Component, Input, OnChanges, OnInit } from '@angular/core'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { DialogBoxComponent } from './../dialog-box/dialog-box.component'
import { TranslateService } from '@ngx-translate/core'
import { HomePageService } from '../../services/home-page.service'
import { ConfigurationsService, EventService, MultilingualTranslationsService } from '@sunbird-cb/utils-v2'
import { DomSanitizer } from '@angular/platform-browser'
import { HttpClient } from '@angular/common/http'
import { DialogBoxComponent as ZohoDialogComponent } from '@ws/app/src/lib/routes/profile-v3/components/dialog-box/dialog-box.component'
import { Router } from '@angular/router'
import { NotificationsService } from 'src/app/services/notifications.service'
import { MatSnackBar } from '@angular/material/snack-bar'
import { environment } from '../../../environments/environment'
import { ConfirmDialogComponent } from '@sunbird-cb/collection/src/lib/_common/confirm-dialog/confirm-dialog.component'
// const rightNavConfig = [
//   {
//     id: 1,
//     section: 'download',
//     active: true,
//   },
//   {
//     id: 2,
//     section: 'font-setting',
//     active: true,
//   },
//   {
//     id: 3,
//     section: 'help',
//     active: true,
//   },
//   {
//     id: 4,
//     section: 'profile',
//     active: true,
//   },
// ]

@Component({
  selector: 'ws-top-right-nav-bar',
  templateUrl: './top-right-nav-bar.component.html',
  styleUrls: ['./top-right-nav-bar.component.scss'],
})
export class TopRightNavBarComponent implements OnInit, OnChanges {
  @Input() item: any
  @Input() rightNavConfig: any
  @Input() showLangDropdown = true
  @Input() notificationsCount: any
  dialogRef: any
  selectedLanguage = 'en'
  multiLang: any = []
  zohoHtml: any
  zohoUrl: any = '/assets/static-data/zoho-code.html'
  isMultiLangEnabled: any
  showDropdown: boolean = false
  roles: string[] = []

  constructor(public dialog: MatDialog, public homePageService: HomePageService,
    private configSvc: ConfigurationsService,
    private langtranslations: MultilingualTranslationsService, private translate: TranslateService,
    private http: HttpClient, private sanitizer: DomSanitizer,
    private events: EventService, private snackBar: MatSnackBar,
    private router: Router, private notificationsService: NotificationsService) {
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

    if (this.configSvc && this.configSvc.unMappedUser && this.configSvc.unMappedUser.roles) {
      this.roles = this.configSvc.unMappedUser.roles
    }
  }

  ngOnInit() {
    const instanceConfig = this.configSvc.instanceConfig
    if (instanceConfig) {
      this.multiLang = instanceConfig.websitelanguages
      this.isMultiLangEnabled = instanceConfig.isMultilingualEnabled
    }
    this.rightNavConfig = this.rightNavConfig.topRightNavConfig ? this.rightNavConfig.topRightNavConfig : this.rightNavConfig
    this.homePageService.closeDialogPop.subscribe((data: any) => {
      if (data) {
        this.dialogRef.close()
      }
    })

    this.http.get(this.zohoUrl, { responseType: 'text' }).subscribe(res => {
      this.zohoHtml = this.sanitizer.bypassSecurityTrustHtml(res)
    })
  }

  ngOnChanges() {
    this.rightNavConfig = this.rightNavConfig.topRightNavConfig ? this.rightNavConfig.topRightNavConfig : this.rightNavConfig
  }
  // ngOnChanges() {}
  // openDialog(): void {
  //   this.dialogRef = this.dialog.open(DialogBoxComponent, {
  //     width: '1000px',
  //   })
  translateLabels(label: string, type: any) {
    return this.langtranslations.translateLabel(label, type, '')
  }

  onBellClick() {
    if (this.notificationsCount > 0) {
      this.notificationsService.resetNotificationsCount().subscribe((res: any) => {
        if (res.responseCode === 'OK') {
          this.notificationsCount = 0
        }
      }, error => {
        console.error('Error while fetching notifications count', error)
      })
    }
    this.showDropdown = false
    setTimeout(() => {
      this.showDropdown = true
    });
  }

  onMenuClosed() {
    this.showDropdown = false
    // setTimeout(() => {
    //   this.showDropdown = false
    // }, 3000)
  }

  selectLanguage(event: any) {
    this.selectedLanguage = event
    localStorage.setItem('websiteLanguage', this.selectedLanguage)
    this.langtranslations.updatelanguageSelected(
      true,
      this.selectedLanguage,
      this.configSvc.unMappedUser ? this.configSvc.unMappedUser.id : ''
    )
    this.configSvc.languageTranslationFlag.next(true)
  }

  getZohoForm() {
    const dialogRef = this.dialog.open(ZohoDialogComponent, {
      width: '45%',
      data: {
        view: 'zohoform',
        value: this.zohoHtml,
      },
    })
    dialogRef.afterClosed().subscribe(() => {
    })
    setTimeout(() => {
      this.callXMLRequest()
    }, 0)
  }

  openDialog(): void {
    this.dialogRef = this.dialog.open(DialogBoxComponent, {
      width: '1000px',
    })

    this.dialogRef.afterClosed().subscribe(() => {
    })
  }

  callXMLRequest() {
    let webFormxhr: any = {}
    webFormxhr = new XMLHttpRequest()
    // tslint:disable-next-line: prefer-template
    webFormxhr.open('GET', 'https://desk.zoho.in/support/GenerateCaptcha?action=getNewCaptcha&_=' + new Date().getTime(), true)
    webFormxhr.onreadystatechange = () => {
      if (webFormxhr.readyState === 4 && webFormxhr.status === 200) {
        try {
          const response = (webFormxhr.responseText != null) ? JSON.parse(webFormxhr.responseText) : ''
          const zsCaptchaUrl: any = document.getElementById('zsCaptchaUrl')
          if (zsCaptchaUrl) {
            zsCaptchaUrl.src = response.captchaUrl
            zsCaptchaUrl.style.display = 'block'
          }
          const xJdfEaS: any = document.getElementsByName('xJdfEaS')[0]
          xJdfEaS.value = response.captchaDigest
          const zsCaptchaLoading: any = document.getElementById('zsCaptchaLoading')
          zsCaptchaLoading.style.display = 'none'
          const zsCaptcha: any = document.getElementById('zsCaptcha')
          zsCaptcha.style.display = 'block'
          const refreshCaptcha: any = document.getElementById('refreshCaptcha')
          if (refreshCaptcha) {
            refreshCaptcha.addEventListener('click', () => {
              this.callXMLRequest()
            })
          }
        } catch (e) {
        }
      }
    }
    webFormxhr.send()
  }

  viewAllClick(event: any) {
    if (event.category) {
      this.raiseTelemetryEventForNotification(event)
      if (event.category === 'LEARN') {
        this.router.navigate([`/app/toc/${event.message.data.id}`])
      } else if (event.category === 'EVENT') {
        this.router.navigate([`/app/event-hub/home/${event.message.data.id}`])
      } else if (event.category === 'DISCUSSION') {
        this.router.navigate([`/app/discussion-forum-v2/community/${event.message.data.communityId}/${event.message.data.discussionId}`])
      } else if (event.category === 'NETWORK') {
        if (event.sub_category === "ACCEPTED_CONNECTION_REQUEST") {
          this.router.navigate([`/app/person-profile/${event.message.data.id}`])
        } else if (event.sub_category === "SEND_CONNECTION_REQUEST") {
          this.router.navigate([`/app/network-v2/connection-requests`])
        }
      } else if(event?.sub_category?.includes('CONTENT')) {
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
      } else if (event.sub_category === 'CONTENT_PUBLISHED' || event.sub_category === 'CONTENT_EDITED') {
        if (event.message.data && event.message.data.id) {
          this.notificationsService.getContentData(event.message.data.id).subscribe((res: any) => {
            if (res) {
              if (res.primaryCategory === 'Learning Resource' &&
                res.resourceCategory !== 'Learning Resource') {
                localStorage.setItem('isStandaloneResource', 'true')
              } else {
                localStorage.setItem('isStandaloneResource', 'false')
              }
              if (this.roles.includes('CONTENT_CREATOR')) {
                if (res.status === 'Draft') {
                  let url = `${environment.portalsForNotifications.cbp}/author/editor/${event.message.data.id}/collectionV2`
                  window.open(url, '_blank')
                } else if (res.status === 'Live') {
                  let url = `${environment.portalsForNotifications.cbp}/author/content-detail/${event.message.data.id}/overview-v2`
                  window.open(url, '_blank')
                } else {
                  let url = `${environment.portalsForNotifications.cbp}/author/content-detail/${event.message.data.id}/overview-v2?mode=edit`
                  window.open(url, '_blank')
                }
              } else {
                if (res.status === 'Draft') {
                  alert('You are not authorized to view this content, the content might be recalled to draft by the creator.')
                  //${environment.portalsForNotifications.cbp}
                  window.open(`${environment.portalsForNotifications.cbp}`, '_blank')
                } else {
                  let url = `${environment.portalsForNotifications.cbp}/author/content-detail/${event.message.data.id}/overview-v2`
                  window.open(url, '_blank')
                }
              }
            }
          })
        } else {
          this.snackBar.open('Something went wrong')
        }
      } else if (event.sub_category === 'CONTENT_REVIEW_REQUEST' || event.sub_category === 'CONTENT_REJECTED') {
        this.notificationsService.getContentData(event.message.data.id).subscribe((res: any) => {
          if (res) {
            if (res.status === 'Draft') {
              alert('You are not authorized to view this content, the content might be recalled to draft by the creator.')
              window.open(`${environment.portalsForNotifications.cbp}`, '_blank')
            } else {
              if (this.roles.includes('CONTENT_REVIEWER')) {
                let url = `${environment.portalsForNotifications.cbp}/author/content-detail/${event.message.data.id}/overview-v2?mode=edit`
                window.open(url, '_blank')
              } else if (this.roles.includes('CONTENT_CREATOR')) {
                let url = `${environment.portalsForNotifications.cbp}/author/editor/${event.message.data.id}`
                window.open(url, '_blank')
              }
            }
          }
        })
      } else if (event.category === 'PROFILE') {
        let url = `${environment.portalsForNotifications.mdo}/app/home/approvals/approval`
        window.open(url, '_blank')
        //this.router.navigate([`app/home/approvals/approval`])
      } else {
        this.router.navigate(['/app/notifications'])
      }
    } else {
      this.router.navigate(['/app/notifications'], { queryParams: { tab: event } })
    }
  }

  reCountNotifications(event: any) {
    console.log("reCountNotifications", event)
    this.notificationsService.nofificationsCount.next(event)
  }

  calculateCount(event: any) {
    console.log("sds", event)
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
