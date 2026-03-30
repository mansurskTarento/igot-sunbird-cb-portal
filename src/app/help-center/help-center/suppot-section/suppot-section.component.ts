import { Component, HostListener } from '@angular/core'
import { ZohoFormService } from '../../../header/header/zoho-form.service'
import { DialogBoxComponent as ZohoDialogComponent } from '@ws/app/src/lib/routes/profile-v3/components/dialog-box/dialog-box.component'
import { HttpClient } from '@angular/common/http'
import { DomSanitizer } from '@angular/platform-browser'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'

import {
  stateContacts, utStates
} from './../help-center/help-center.model'

interface Admin {
  name: string
  designation: string
  email: string
  mobile: string
}

interface StateData {
  region: string
  admins: Admin[]
}

@Component({
  selector: 'app-suppot-section',
  templateUrl: './suppot-section.component.html',
  styleUrls: ['./suppot-section.component.scss'],
})
export class SuppotSectionComponent {



  filteredStates: string[] = [];

  selectedState: any | null = null;

  gridSearch = '';

  @HostListener('document:keydown.escape')
  onEsc() {
    this.closeStateModal()
  }

  stateContacts: Record<string, StateData> = stateContacts
  utStates = utStates
  activeRegion = 'all'

  phoneNumber = '+91 9990141256';
  supportHours = '8:00 AM – 8:00 PM IST';

  features = [
    { icon: 'shield', label: 'Dedicated Expert Team' },
    { icon: 'headset_mic', label: 'Multi-Channel Support' },
    { icon: 'bolt', label: 'Quick Resolution' },
  ];
  zohoHtml: any
  zohoUrl: any = '/assets/static-data/support-html/zoho_karmayogi_form.html'
  constructor(private zohoFormService: ZohoFormService, private http: HttpClient,
    private sanitizer: DomSanitizer, public dialog: MatDialog,) {

  }

  ngOnInit() {
    // Load Zoho form HTML
    this.http.get(this.zohoUrl, { responseType: 'text' }).subscribe(res => {
      this.zohoHtml = this.sanitizer.bypassSecurityTrustHtml(res)
    })
    this.applyFilters()
  }
  onCallNow(): void {
    window.location.href = 'tel:+919990141256'
  }

  onRaiseTicket(): void {
    // Navigate to ticket form or external URL
    // window.open('https://igot.gov.in/support', '_blank');
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

  getInitials(name: string): string {
    return name.split(' ')
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase()
  }

  applyFilters() {
    if (!this.stateContacts) {
      this.filteredStates = []
      return
    }

    let states = Object.keys(this.stateContacts).sort()

    if (this.activeRegion !== 'all') {
      states = states.filter(
        s => this.stateContacts[s]?.region === this.activeRegion
      )
    }

    if (this.gridSearch) {
      states = states.filter(s =>
        s.toLowerCase().includes(this.gridSearch.toLowerCase())
      )
    }

    this.filteredStates = states
  }

  filterRegion(region: string) {
    this.activeRegion = region
    this.applyFilters()
  }

  filterStateGrid(value: string) {
    this.gridSearch = value
    this.applyFilters()
  }

  openStateModal(state: string) {
    this.selectedState = state
  }

  closeStateModal() {
    this.selectedState = null
  }

  formatPhone(mobile: string): string {
    return mobile.replace(/\s/g, '')
  }

  get selectedStateData(): StateData | null {
    return this.selectedState ? this.stateContacts[this.selectedState] : null
  }

}