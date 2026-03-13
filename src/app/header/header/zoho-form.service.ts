import { Injectable } from '@angular/core';
import { ConfigurationsService } from '@sunbird-cb/utils-v2';
import { HttpClient } from '@angular/common/http';
const GET_USER_BASIC_DETAILS = '/apis/proxies/v8/user/profile/v1/basic';

@Injectable({
  providedIn: 'root',
})
export class ZohoFormService {
  private SUBJECT_PREFIX = 'APAR/CA issue - ';
  private blockedFileExtensions = [
    'exe',
    'bat',
    'cmd',
    'js',
    'vbs',
    'pif',
    'scr',
    'dll',
    'sys',
    'msi',
    'reg',
    'jar',
    'com',
  ];
  private userProfileData: any = null;

  // Attachment tracking
  private zsAttachedAttachmentsCount = 0;
  private zsAttachmentFileBrowserIdsList = [1, 2, 3, 4, 5];

  // Getter for attachment count (used in validation)
  getAttachedFilesCount(): number {
    return this.zsAttachedAttachmentsCount;
  }

  constructor(
    private configSvc: ConfigurationsService,
    private http: HttpClient,
  ) {
    if (!this.userProfileData) {
      this.initializeUserData();
    }
  }

  private initializeUserData(): void {
    this.http
      .get(GET_USER_BASIC_DETAILS + '/' + this.configSvc.userProfileV2?.userId)
      .subscribe({
        next: (response: any) => {
          this.userProfileData = response?.result?.response || null;
        },
        error: () => {
          if (this.configSvc?.userProfileV2) {
            this.userProfileData = this.configSvc.userProfileV2;
          }
        },
      });
  }

  // ===== Issue Type Handler =====
  handleIssueTypeChange(selectElement: any): void {
    try {
      const value = selectElement.value || '';
      const othersBlock = document.getElementById('others-block');
      const subjectInput = document.getElementById(
        'subject-input',
      ) as HTMLInputElement;

      // Show/hide the "Others" details field
      if (othersBlock) {
        if (value === 'Others') {
          othersBlock.classList.add('visible');
        } else {
          othersBlock.classList.remove('visible');
        }
      }

      // Update subject field with issue type
      if (subjectInput) {
        if (value && value !== '') {
          const selectedOption = (selectElement as HTMLSelectElement).options[
            (selectElement as HTMLSelectElement).selectedIndex
          ];
          const issueLabel = selectedOption.text;
          subjectInput.value = this.SUBJECT_PREFIX + issueLabel;
        } else {
          subjectInput.value = this.SUBJECT_PREFIX;
        }
      }
    } catch (error) {
      console.error('Error handling issue type change:', error);
    }
  }

  // ===== Organisation Handlers =====
  toggleCentreState(radioElement: any): void {
    try {
      const ministryBlock = document.getElementById('ministry-block');
      const ministryLabel = document.getElementById('ministry-label');
      const ministryInput = document.getElementById(
        'ministry-input',
      ) as HTMLInputElement;
      const btnCentre = document.getElementById('btn-centre');
      const btnState = document.getElementById('btn-state');

      if (ministryBlock && ministryLabel && ministryInput) {
        ministryBlock.classList.add('visible');

        // Remove active class from both buttons
        if (btnCentre) btnCentre.classList.remove('active');
        if (btnState) btnState.classList.remove('active');

        if (radioElement.value === 'Centre') {
          if (btnCentre) btnCentre.classList.add('active');
          ministryLabel.textContent = 'Ministry / Department / Organization';
          ministryInput.placeholder = 'Enter ministry or department name';
        } else if (radioElement.value === 'State') {
          if (btnState) btnState.classList.add('active');
          ministryLabel.textContent = 'State / Department / Organization';
          ministryInput.placeholder =
            'Enter state department or organization name';
        }
      }
    } catch (error) {
      console.error('Error toggling Centre/State radio:', error);
    }
  }

  // ===== Service Details Handlers =====
  toggleAIS(checkboxElement: any): void {
    try {
      const aisBlock = document.getElementById('ais-block');
      const aisLabelText = document.getElementById('ais-label-text');
      const hiddenSelect = document.getElementById(
        'CASECF29',
      ) as HTMLSelectElement;

      if (aisBlock && aisLabelText && hiddenSelect) {
        if (checkboxElement.checked) {
          aisBlock.classList.add('visible');
          aisLabelText.textContent = 'Yes';
          hiddenSelect.value = 'Yes';
          // Populate batch years when AIS is enabled
          const batchYearSelect = document.getElementById('CASECF27') as HTMLSelectElement;
          if (batchYearSelect) {
            this.ensureBatchYearsPopulated(batchYearSelect);
          }
        } else {
          aisBlock.classList.remove('visible');
          aisLabelText.textContent = 'No';
          hiddenSelect.value = 'No';
          // Clear AIS fields
          this.clearSelectValue('CASECF24');
          this.clearSelectValue('CASECF27');
          this.clearSelectValue('CASECF26');
        }
      }
    } catch (error) {
      console.error('Error toggling AIS checkbox:', error);
    }
  }

  // ===== Attachment Handler =====
  initializeAttachmentZone(): void {
    // Set up click handler for attachment zone after DOM is ready
    setTimeout(() => {
      const zone = document.querySelector('.attachment-zone') as HTMLElement;
      if (zone) {
        zone.onclick = () => {
          this.triggerFileInputClick();
        };
      }
    }, 100);
  }

  private triggerFileInputClick(): void {
    if (this.zsAttachmentFileBrowserIdsList.length > 0) {
      const nextId = this.zsAttachmentFileBrowserIdsList[0];
      const fileInput = document.getElementById('zsattachment_' + nextId) as HTMLInputElement;
      if (fileInput) {
        fileInput.click();
      }
    }
  }

  handleFileAttachment(filePath: string, element: any): void {
    if (!filePath) return;

    const els = element.files;
    if (els && els[0]) {
      const size = els[0].size / (1024 * 1024);
      if (size > 20) {
        element.value = '';
        alert('Maximum allowed file size is 20MB.');
        return;
      }
    }

    const fileName =
      filePath.indexOf('\\') > -1 ? filePath.split('\\').pop() : filePath;
    if (!fileName) return;

    const parts = fileName.split('.');
    const ext = parts[parts.length - 1]?.toLowerCase() || '';

    if (this.blockedFileExtensions.indexOf(ext) !== -1) {
      element.value = '';
      alert('File extension not supported.');
      return;
    }

    // Get the current file input ID and remove it from available list
    const elementId = element.id;
    const curId = parseInt(elementId.split('_')[1], 10);
    const removeIdx = this.zsAttachmentFileBrowserIdsList.indexOf(curId);
    if (removeIdx > -1) {
      this.zsAttachmentFileBrowserIdsList.splice(removeIdx, 1);
    }

    // Add file to display
    this.addFileToDisplay(fileName, curId);
    this.zsAttachedAttachmentsCount++;
  }

  private addFileToDisplay(fileName: string, fileId: number): void {
    const container = document.getElementById('zsFileBrowseAttachments');
    if (!container) return;

    const fileDiv = document.createElement('div');
    fileDiv.className = 'filenamecls';
    fileDiv.id = 'file_' + fileId;

    const fileNameSpan = document.createElement('span');
    fileNameSpan.textContent = fileName;

    const closeLink = document.createElement('a');
    closeLink.href = 'javascript:;';
    closeLink.className = 'zsfilebrowseAttachment';
    closeLink.id = 'fileclose_' + fileId;
    closeLink.textContent = '×';
    closeLink.onclick = () => this.removeFileAttachment(fileId);

    fileDiv.appendChild(fileNameSpan);
    fileDiv.appendChild(closeLink);
    container.appendChild(fileDiv);
  }

  removeFileAttachment(fileId: number): void {
    const fileInput = document.getElementById('zsattachment_' + fileId) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }

    const fileDiv = document.getElementById('file_' + fileId);
    if (fileDiv) {
      fileDiv.remove();
    }

    this.zsAttachedAttachmentsCount--;
    this.zsAttachmentFileBrowserIdsList.push(fileId);
    this.zsAttachmentFileBrowserIdsList.sort((a, b) => a - b);
  }

  resetAttachmentState(): void {
    this.zsAttachedAttachmentsCount = 0;
    this.zsAttachmentFileBrowserIdsList = [1, 2, 3, 4, 5];

    const container = document.getElementById('zsFileBrowseAttachments');
    if (container) {
      container.innerHTML = '';
    }

    // Reset all file inputs
    for (let i = 1; i <= 5; i++) {
      const fileInput = document.getElementById('zsattachment_' + i) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  }

  // ===== Captcha Handler =====
  loadCaptcha(): void {
    try {
      const webFormxhr = new XMLHttpRequest();
      webFormxhr.open(
        'GET',
        'https://desk.zoho.in/support/GenerateCaptcha?action=getNewCaptcha&_=' +
          new Date().getTime(),
        true,
      );
      webFormxhr.onreadystatechange = () => {
        if (webFormxhr.readyState === 4 && webFormxhr.status === 200) {
          try {
            const response = JSON.parse(webFormxhr.responseText);
            this.updateCaptchaDisplay(response);
          } catch (e) {
            console.error('Error parsing captcha response:', e);
          }
        }
      };
      webFormxhr.send();
    } catch (error) {
      console.error('Error loading Zoho captcha:', error);
    }
  }

  private updateCaptchaDisplay(response: any): void {
    const zsCaptchaUrl = document.getElementById('zsCaptchaUrl');
    if (zsCaptchaUrl) {
      (zsCaptchaUrl as HTMLImageElement).src = response.captchaUrl;
      zsCaptchaUrl.style.display = 'block';
    }

    const xJdfEaS = document.getElementsByName(
      'xJdfEaS',
    )[0] as HTMLInputElement;
    if (xJdfEaS) {
      xJdfEaS.value = response.captchaDigest;
    }

    const zsCaptchaLoading = document.getElementById('zsCaptchaLoading');
    if (zsCaptchaLoading) {
      zsCaptchaLoading.style.display = 'none';
    }

    const zsCaptcha = document.getElementById('zsCaptcha');
    if (zsCaptcha) {
      zsCaptcha.style.display = 'block';
    }
  }

  // ===== Form Reset =====
  resetForm(formId: string): void {
    try {
      const form = document.forms.namedItem('zsWebToCase_' + formId,) as HTMLFormElement;
      if (form) form.reset();

      document
        .getElementById('zsSubmitButton_120349000138968626')
        ?.removeAttribute('disabled');

      // Reset all conditional blocks
      this.resetAISBlock();
      this.resetMinistryBlock();
      this.resetOthersBlock();
      this.resetSubjectField();
      this.resetConsentCheckbox();
      this.resetAttachmentState();
    } catch (error) {
      console.error('Error resetting Zoho form:', error);
    }
  }

  private resetAISBlock(): void {
    document.getElementById('ais-block')?.classList.remove('visible');
    const aisToggle = document.getElementById('ais-toggle') as HTMLInputElement;
    if (aisToggle) aisToggle.checked = false;

    const aisLabelText = document.getElementById('ais-label-text');
    if (aisLabelText) aisLabelText.textContent = 'No';

    const hiddenSelect = document.getElementById('CASECF29',) as HTMLSelectElement;
    if (hiddenSelect) hiddenSelect.value = 'No';
  }

  private resetMinistryBlock(): void {
    document.getElementById('ministry-block')?.classList.remove('visible');
    document.getElementById('btn-centre')?.classList.remove('active');
    document.getElementById('btn-state')?.classList.remove('active');
  }

  private resetOthersBlock(): void {
    document.getElementById('others-block')?.classList.remove('visible');
  }

  private resetSubjectField(): void {
    const subjectInput = document.getElementById('subject-input',) as HTMLInputElement;
    if (subjectInput) subjectInput.value = this.SUBJECT_PREFIX;
  }

  private resetConsentCheckbox(): void {
    const consentCheckbox = document.getElementById('consent-checkbox',) as HTMLInputElement;
    if (consentCheckbox) consentCheckbox.checked = true;
  }

  clearSelectValue(elementId: string): void {
    const selectElement = document.getElementById(elementId,) as HTMLSelectElement;
    if (selectElement) {
      selectElement.value = '';
    }
  }

  // ===== AIS Data Retrieval =====
  getBatchYear(): string {
    try {
      const batchYearSelect = document.getElementById(
        'CASECF27',
      ) as HTMLSelectElement;
      if (batchYearSelect) {
        // Ensure batch year options are populated
        this.ensureBatchYearsPopulated(batchYearSelect);
        return batchYearSelect.value;
      }
      return '';
    } catch (error) {
      console.error('Error retrieving batch year:', error);
      return '';
    }
  }

  getAISValues(): any {
    try {
      const serviceSelect = document.getElementById(
        'CASECF24',
      ) as HTMLSelectElement;
      const batchYearSelect = document.getElementById(
        'CASECF27',
      ) as HTMLSelectElement;
      const cadreSelect = document.getElementById(
        'CASECF26',
      ) as HTMLSelectElement;

      // Ensure batch year options are populated
      if (batchYearSelect) {
        this.ensureBatchYearsPopulated(batchYearSelect);
      }

      return {
        service: serviceSelect ? serviceSelect.value : '',
        batchYear: batchYearSelect ? batchYearSelect.value : '',
        cadre: cadreSelect ? cadreSelect.value : '',
      };
    } catch (error) {
      console.error('Error retrieving AIS values:', error);
      return { service: '', batchYear: '', cadre: '' };
    }
  }

  private ensureBatchYearsPopulated(selectElement: HTMLSelectElement): void {
    try {
      if (selectElement.options.length > 1) {
        return;
      }

      // Populate batch years from 1960 to 2026, skipping 1961
      for (let y = 1960; y <= 2026; y++) {
        if (y === 1961) continue;
        const opt = document.createElement('option');
        opt.value = y.toString();
        opt.text = y.toString();
        selectElement.appendChild(opt);
      }
    } catch (error) {
      console.error('Error populating batch years:', error);
    }
  }

  patchUserDataFromConfig(): void {
    let userProfile = this.userProfileData;
    if (!userProfile && this.configSvc && this.configSvc.userProfileV2) {
      userProfile = this.configSvc.userProfileV2;
    }

    if (!userProfile) return;

    const personalDetails =
      userProfile['profileDetails']['personalDetails'] || {};
    const professionalDetails =
      userProfile['profileDetails']['professionalDetails'] || {};

    // Map user data directly from profile
    const userData = {
      name: personalDetails['firstname'] || userProfile['firstName'] || '',
      email:
        personalDetails['primaryEmail'] || userProfile['primaryEmail'] || '',
      phone: personalDetails['mobile'] || userProfile['mobile'] || '',
      designation: professionalDetails?.length
        ? professionalDetails[0]['designation']
        : '',
    };

    const contactNameInput = document.querySelector(
      'input[name="Contact Name"]',
    ) as HTMLInputElement;
    if (contactNameInput && userData.name) {
      contactNameInput.value = userData.name;
      contactNameInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const emailInput = document.querySelector(
      'input[name="Email"]',
    ) as HTMLInputElement;
    if (emailInput && userData.email) {
      emailInput.value = userData.email;
      emailInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const phoneInput = document.querySelector(
      'input[name="Phone"]',
    ) as HTMLInputElement;
    if (phoneInput && userData.phone) {
      phoneInput.value = userData.phone;
      phoneInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const designationInput = document.querySelector(
      'input[name="Designation"]',
    ) as HTMLInputElement;
    if (designationInput && userData.designation) {
      designationInput.value = userData.designation;
      designationInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  // ===== Form Validation and Submission =====
  validateAndSubmitForm(): boolean {
    try {
      const mandatoryFields = ['Contact Name', 'Email', 'Phone', 'Subject'];
      const form = document.forms.namedItem('zsWebToCase_120349000138968626') as HTMLFormElement;

      if (!form) {
        console.error('Form not found');
        return false;
      }

      // Validate mandatory fields
      for (const fieldName of mandatoryFields) {
        const field = form[fieldName] as HTMLInputElement;
        if (!field || !field.value.trim()) {
          const fieldLabel = fieldName === 'Contact Name' ? 'Name' : fieldName;
          alert(`${fieldLabel} cannot be empty`);
          if (field) field.focus();
          return false;
        }

        // Email validation
        if (fieldName === 'Email') {
          const emailRegex = /^([\w_][\w\-_.+'&]*)@(?=.{4,256}$)(([\w]+)([\-_]*[\w])*[\.])+[a-zA-Z]{2,22}$/;
          if (!emailRegex.test(field.value)) {
            alert('Enter a valid email address');
            field.focus();
            return false;
          }
        }
      }

      // Validate captcha
      const captchaField = form['zsWebFormCaptchaWord'] as HTMLInputElement;
      if (!captchaField || !captchaField.value.trim()) {
        alert('Please enter the captcha code.');
        if (captchaField) captchaField.focus();
        return false;
      }

      // Disable submit button
      const submitBtn = document.getElementById('zsSubmitButton_120349000138968626') as HTMLButtonElement;
      if (submitBtn) {
        submitBtn.disabled = true;
      }

      return true;
    } catch (error) {
      console.error('Error validating form:', error);
      return false;
    }
  }
}
