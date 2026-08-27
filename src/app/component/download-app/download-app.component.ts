import { Component, Input, OnInit, inject } from '@angular/core'
import { MatDialogRef } from '@angular/material/dialog'
import { HomePageService } from '../../services/home-page.service'
import { TranslateService } from '@ngx-translate/core'
@Component({
    selector: 'ws-download-app',
    templateUrl: './download-app.component.html',
    styleUrls: ['./download-app.component.scss'],
    standalone: false
})
export class DownloadAppComponent implements OnInit {
  @Input() popupClass = ''
  public isMobile = false
  // null when the component is rendered inline (home.component.html) rather than in a dialog
  private dialogRef = inject(MatDialogRef, { optional: true })

  get isDialog(): boolean {
    return !!this.dialogRef
  }

  constructor(public homePageService: HomePageService, private translate: TranslateService) {
    if (localStorage.getItem('websiteLanguage')) {
      this.translate.setDefaultLang('en')
      const lang = localStorage.getItem('websiteLanguage')!
      this.translate.use(lang)
    }
   }

  ngOnInit() {
    // console.log('popupClass',this.popupClass,window.innerWidth);
    if (window.innerWidth <= 1200) {
      this.isMobile = true
    } else {
      this.isMobile = false
    }
  }

  closePopup() {
    // Close the host dialog directly. closeDialogPop alone is not enough: its only subscribers
    // are top-right-nav-bar(-v2), and they close *their own* dialogRef, so a dialog opened from
    // anywhere else (root.openAppDownloadDialog) was never closed by it.
    this.dialogRef?.close()
    this.homePageService.closeDialogPop.next(true)
  }

}
