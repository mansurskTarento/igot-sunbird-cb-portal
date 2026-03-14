import { Component, Input, OnInit } from '@angular/core'
import { delay } from 'rxjs/operators'
import { HeaderService } from './header.service'
import { MobileAppsService } from '../../services/mobile-apps.service'
import {
  ValueService,
} from '@sunbird-cb/utils-v2'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { HttpClient } from '@angular/common/http'
import { DomSanitizer } from '@angular/platform-browser'
import { DialogBoxComponent as ZohoDialogComponent } from '@ws/app/src/lib/routes/profile-v3/components/dialog-box/dialog-box.component'
import { ZohoFormService } from './zoho-form.service'
@Component({
  selector: 'ws-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  isXSmall$ = this.valueSvc.isXSmall$
  isNavBarRequired = true
  showNavbar = true
  widgetData = {}
  mobileTopHeaderVisibilityStatus = true
  zohoHtml: any
  zohoUrl: any = '/assets/static-data/support-html/zoho_karmayogi_form.html'
  @Input() mode: any
  @Input() headerFooterConfigData: any
  @Input() showHubs = false
  constructor(
    private valueSvc: ValueService,
    public headerService: HeaderService,
    public mobileAppsService: MobileAppsService,
    public dialog: MatDialog,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private zohoFormService: ZohoFormService) { }

  ngOnInit() {
    this.headerService.showNavbarDisplay$.pipe(delay(500)).subscribe(display => {
      this.showNavbar = display
    })

    // Load Zoho form HTML
    this.http.get(this.zohoUrl, { responseType: 'text' }).subscribe(res => {
      this.zohoHtml = this.sanitizer.bypassSecurityTrustHtml(res)
    })

    // tslint:disable-next-line: whitespace
    this.widgetData = { // tslint:disable-next-line: whitespace
      widgets: [
        [
          {
            dimensions: {},
            className: 'ws-mat-primary-lite-background-important new-box-hubs',
            widget: {
              widgetType: 'card',
              widgetSubType: 'cardHomeHubs',
              widgetData: {},
            },
          },
        ],
      ],
    } // tslint:disable-next-line: whitespace
  } // tslint:disable-next-line: whitespace

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

  get navBarRequired(): boolean {
    // tslint:disable-next-line: whitespace
    return this.isNavBarRequired
  }

  get isShowNavbar(): boolean {
    return this.showNavbar
  }

  hideMobileTopHeader() {
    this.mobileTopHeaderVisibilityStatus = false
    this.mobileAppsService.mobileTopHeaderVisibilityStatus.next(this.mobileTopHeaderVisibilityStatus)
  }

  openSupportForm(): void {
    this.dialog.open(ZohoDialogComponent, {
      width: 'auto',
      height: '100vh',
      maxWidth: '100vw',
      position: {
        top: '0',
        right: '0'
      },
      panelClass: 'right-side-dialog',
      data: {
        view: 'zohoform',
        value: this.zohoHtml,
      },
    })
    setTimeout(() => {
      this.initializeZohoForm()
    }, 300)
  }

  private initializeZohoForm(): void {
    try {
      // Expose all form handlers to window for HTML event bindings
      (window as any).handleIssueType = (sel: any) => { this.zohoFormService.handleIssueTypeChange(sel); return true }
      (window as any).toggleCentreState = (sel: any) => { this.zohoFormService.toggleCentreState(sel); return true }
      (window as any).toggleAIS = (sel: any) => { this.zohoFormService.toggleAIS(sel); return true }
      (window as any).zsRenderBrowseFileAttachment = (filePath: string, element: any) => { this.zohoFormService.handleFileAttachment(filePath, element); return true }
      (window as any).zsRegenerateCaptcha = () => { this.zohoFormService.loadCaptcha(); return true }
      (window as any).zsResetWebForm = (id: string) => { this.zohoFormService.resetForm(id); return true }
      (window as any).zsValidateMandatoryFields = () => { return this.zohoFormService.validateAndSubmitForm() }
      (window as any).zsGetAttachedFilesCount = () => { return this.zohoFormService.getAttachedFilesCount() }

      this.zohoFormService.loadCaptcha()
      this.zohoFormService.patchUserDataFromConfig()
      this.zohoFormService.initializeAttachmentZone()
    } catch (error) {
      console.error('Error initializing Zoho form:', error)
      this.zohoFormService.loadCaptcha()
    }
  }
}
