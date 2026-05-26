import { CommonModule } from '@angular/common'
import { Component, Input, signal } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { MatToolbarModule } from '@angular/material/toolbar'
import { RouterModule } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { ConfirmDialogModule } from '@sunbird-cb/collection'
import { ValueService } from '@sunbird-cb/utils-v2'
import { AppNavBarV2Component } from '../../component/app-nav-bar-v2/app-nav-bar-v2.component'
import { MobileAppsService } from '../../services/mobile-apps.service'

@Component({
  selector: 'ws-header-v2',
  imports: [
    CommonModule,
    RouterModule,
    ConfirmDialogModule,
    TranslateModule,
    MatToolbarModule,
    MatIconModule,
    AppNavBarV2Component
  ],
  templateUrl: './header-v2.component.html',
  styleUrl: './header-v2.component.scss',
})
export class HeaderV2Component {
  // Signals for reactive state management
  @Input() leftNavBarOpen: boolean = false
  @Input() headerFooterConfigData: any

  isXSmall$ = this.valueSvc.isXSmall$
  mobileTopHeaderVisibilityStatus = signal<boolean>(true)

  constructor(
    private valueSvc: ValueService,
    private mobileAppsService: MobileAppsService
  ) { }

  downloadApp(): void {
    const userAgent = navigator.userAgent
    // Windows Phone must come first because its UA also contains "Android"
    if (/windows phone/i.test(userAgent)) {
      window.open('https://play.google.com/store/apps/details?id=com.igot.karmayogibharat&hl=en&gl=US', '_blank')
    }

    if (/android/i.test(userAgent)) {
      window.open('https://play.google.com/store/apps/details?id=com.igot.karmayogibharat&hl=en&gl=US', '_blank')
    }

    // iOS detection from: http://stackoverflow.com/a/9039885/177710
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      window.open('https://apps.apple.com/in/app/igot-karmayogi/id6443949491', '_blank')
    }
  }

  hideMobileTopHeader(): void {
    this.mobileTopHeaderVisibilityStatus.set(false)
    this.mobileAppsService.mobileTopHeaderVisibilityStatus.next(false)
  }
}
