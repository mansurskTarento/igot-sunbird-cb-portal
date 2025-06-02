import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatLegacyDialogRef, MAT_LEGACY_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { HttpErrorResponse } from '@angular/common/http';
import * as _ from 'lodash';
import { ProfileV2RevampService } from '../../services/profile-v2-revamp.service';
import { designation, generateYears, organisation, state } from '../../models/profile-revamp.model';
import { MatLegacySnackBar } from '@angular/material/legacy-snack-bar';
import { PipeCertificateImageURL } from '@sunbird-cb/utils-v2';

@Component({
  selector: 'ws-app-profile-entry-edit',
  templateUrl: './profile-entry-edit.component.html',
  styleUrls: ['./profile-entry-edit.component.scss'],
  providers: [PipeCertificateImageURL]
})
export class ProfileEntryEditComponent implements OnInit {
  header: string = '';
  entryDetails: any;
  entryForm!: FormGroup;

  orgList: organisation[] = [];
  designationsList: designation[] = [];
  statesList: state[] = [];
  districtsList: string[] = [];
  todayDate: Date = new Date();
  startDate: Date = new Date();
  isCurrentlyWorking = false;

  degreesList: string[] = [];
  institutionsList: string[] = [];
  yeasersList: string[] = [];

  disableUpload = false;
  disableUrl = false;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatLegacyDialogRef<ProfileEntryEditComponent>,
    @Inject(MAT_LEGACY_DIALOG_DATA) private data: any,
    private ProfileV2RevampService: ProfileV2RevampService,
    private snackBar: MatLegacySnackBar,
    private pipeImgUrl: PipeCertificateImageURL
  ) {
    this.header = _.get(this.data, 'header', '');
    this.entryDetails = _.get(this.data, 'entryDetails', '');
  }
  ngOnInit(): void {
    this.initForm();
  }

  //#region (intialization)
  initForm(): void {
    switch (this.header) {
      case 'Service History':
        this.createServiceHistoryForm();
        break;
      case 'Educational qualifications':
        this.generateYearsList();
        this.createEducationalQualificationsForm();
        break;
      case 'Achievements':
        this.createAchievementsForm();
        break;
    }
  }
  //#endregion (intialization)

  //#region (service history)
    private createServiceHistoryForm(): void {
    this.entryForm = this.fb.group({
      orgName: [_.get(this.entryDetails, 'orgName', ''), [Validators.required]],
      designation: [_.get(this.entryDetails, 'designation', ''), [Validators.required]],
      orgState: [_.get(this.entryDetails, 'orgState', ''), [Validators.required]],
      orgDistrict: [_.get(this.entryDetails, 'orgDistrict', ''), [Validators.required]],
      startDate: [_.get(this.entryDetails, 'startDate', ''), [Validators.required]],
      endDate: [_.get(this.entryDetails, 'endDate', ''), [Validators.required]],
      currentlyWorking: [_.get(this.entryDetails, 'currentlyWorking', 'false')],
      description: [_.get(this.entryDetails, 'description', ''), [Validators.maxLength(1000), Validators.pattern(/^[a-zA-Z0-9\s.,'-]*$/)]]
    });
    this.isCurrentlyWorking = _.get(this.entryDetails, 'currentlyWorking', '') === 'true' ? true : false;
    this.getOrgList();
    this.getDesignationsList();
    this.getStatesList()
    if(_.get(this.entryDetails, 'startDate', '')) {
      this.startDate = new Date(_.get(this.entryDetails, 'startDate', ''));
    }
  }
  getOrgList() { 
    const formBody = { request: 
      { 
        filters: { 
          isTenant: true, 
          status: 1, 
          isMdo: true, 
          isCbp: true 
        },
        sort_by: {
           orgName: 'asc'
        },
        fields: ['channel'],
        limit: 20,
        offset: 0
      }
    }
    this.ProfileV2RevampService.getOrgSearch(formBody).subscribe({
      next: (res: any) => {
        this.orgList = _.get(res, 'result.response.content', []) as organisation[]
        if(this.entryForm) {
          const orgNameControl = this.entryForm.get('orgName');
          if(orgNameControl) {
            orgNameControl.patchValue(_.get(this.entryDetails, 'orgName', ''));
          }
        }
      }, error: (error: HttpErrorResponse) => {
        if (error) { 
          this.openSnackbar('Something went wrong. Please refresh or try again later.')
        }
      }
    })
  }

  getDesignationsList() {
    this.ProfileV2RevampService.getDesignations({}).subscribe({
      next: (res: any) => {
        this.designationsList = _.get(res, 'responseData', []) as designation[]
        if(this.entryForm) {
          const designationControl = this.entryForm.get('designation');
          if(designationControl) {
            designationControl.patchValue(_.get(this.entryDetails, 'designation', ''));
          }
        }
      }, error: (error: HttpErrorResponse) => {
        if (error) { 
          this.openSnackbar('Something went wrong. Please refresh or try again later.')
        }
      }
    })
  }

  getStatesList() {
    this.ProfileV2RevampService.getStatesList().subscribe({
      next: (res: any) => {
        this.statesList = _.get(res, 'result.statesList', []) as state[]
        if(this.entryForm) {
          const stateControl = this.entryForm.get('orgState');
          if(stateControl) {
            stateControl.patchValue(_.get(this.entryDetails, 'orgState', ''));
          }
          if(_.get(this.entryDetails, 'orgState', '')) {
            this.getDistrictsList(_.get(this.entryDetails, 'orgState', ''), true);
          }
        }
      }, error: (error: HttpErrorResponse) => {
        if (error) { 
          this.openSnackbar('Something went wrong. Please refresh or try again later.')
        }
      }
    })
  }

  getDistrictsList(state: string, isFirstTime: boolean = false) {
    this.ProfileV2RevampService.getDistrictsList(state).subscribe({
      next: (res: any) => {
        this.districtsList = _.get(res, 'result.districtsList[0].districts', []) as string[];
          const districtControl = this.entryForm ? this.entryForm.get('orgDistrict') : null;
        if(districtControl) {
          if (isFirstTime) {
            districtControl.patchValue(_.get(this.entryDetails, 'orgDistrict', ''));
          } else {
            districtControl.patchValue('');
          }
        }
      },
      error: (err: HttpErrorResponse) => {
        this.districtsList = [];
        if(err) {
          this.openSnackbar('Something went wrong. Please refresh or try again later.');
        }
      }
    })
  }

  onCurrentlyWorkingChange(event: boolean): void{
    this.isCurrentlyWorking = event;
    const currentlyWorkingControl = this.entryForm.get('currentlyWorking');
    if(currentlyWorkingControl) {
      currentlyWorkingControl.patchValue(event.toString());
    }
    if (event) {
      const endDateControl = this.entryForm.get('endDate');
      if (endDateControl) {
        endDateControl.setValue(null);
        endDateControl.disable();
        endDateControl.clearValidators();
        endDateControl.updateValueAndValidity();
      }
    } else {
      const endDateControl = this.entryForm.get('endDate');
      if (endDateControl) {
        endDateControl.enable();
        endDateControl.setValidators([Validators.required]);
        endDateControl.updateValueAndValidity();
      }
    }
  }

  onStartDateChange(selectedStartDate: Date): void {
    this.startDate = selectedStartDate;
    const endDateControl = this.entryForm.get('endDate');
    if (endDateControl) {
      const currentEndDate = endDateControl.value;

      // Reset end date if it is less than the selected start date
      if (currentEndDate && new Date(currentEndDate) < selectedStartDate) {
        endDateControl.setValue(null);
      }
    }
  }
  //#endregion (service history)

  //#region (educational qualifications)
  private createEducationalQualificationsForm(): void {
    this.entryForm = this.fb.group({
      degree: [_.get(this.entryDetails, 'degree', ''), [Validators.required]],
      otherDegree: [''],
      fieldOfStudy: [_.get(this.entryDetails, 'fieldOfStudy', ''), 
        [Validators.required, Validators.pattern(/^[a-zA-Z0-9\s.,'-]*$/), Validators.maxLength(250)]],
      institutionName: [_.get(this.entryDetails, 'institutionName', ''), [Validators.required]],
      otherInstituteName: [''],
      startYear: [_.get(this.entryDetails, 'startYear', ''), [Validators.required]],
      endYear: [_.get(this.entryDetails, 'endYear', ''), [Validators.required]],
    });
    this.getDegreesList();
    this.getInstitutionsList();
  }

  generateYearsList(): void {
    this.yeasersList = generateYears(1900);
  }
    

  getDegreesList() {
    this.ProfileV2RevampService.getDegreesList().subscribe({
      next: (res: any) => {
        this.degreesList = _.get(res, 'result.degreesList.degrees', []) as string[];
        if(this.entryForm) {
          const degreeControl = this.entryForm.get('degree');
          if(degreeControl) {
            degreeControl.patchValue(_.get(this.entryDetails, 'degree', ''));
          }
        }
      }, error: (error: HttpErrorResponse) => {
        if (error) { 
          this.openSnackbar('Something went wrong. Please refresh or try again later.')
        }
      }
    })
  }

  getInstitutionsList() {
    this.ProfileV2RevampService.getInstitutionsList().subscribe({
      next: (res: any) => {
        this.institutionsList = _.get(res, 'result.institutionList.institutions', []) as string[];
        if(this.entryForm) {
          const instituteNameControl = this.entryForm.get('institutionName');
          if(instituteNameControl) {
            instituteNameControl.patchValue(_.get(this.entryDetails, 'institutionName', ''));
          }
        }
      }, error: (error: HttpErrorResponse) => {
        if (error) { 
          this.openSnackbar('Something went wrong. Please refresh or try again later.')
        }
      }
    })
  }

  onDegreeChange(selectedDegree: string): void {
    const otherDegreeControl = this.entryForm.get('otherDegree');
    if (otherDegreeControl) {
      if (selectedDegree === 'other') {
        otherDegreeControl.setValidators([Validators.required, Validators.pattern(/^[a-zA-Z0-9\s.,'-]*$/)]);
      } else {
        otherDegreeControl.clearValidators();
      }
      otherDegreeControl.setValue('');
      otherDegreeControl.updateValueAndValidity();
    }
  }

  onInstituteChange(selectedInstitute: string): void {
    const otherInstituteControl = this.entryForm.get('otherInstituteName');
    if(otherInstituteControl) {
      if (selectedInstitute === 'Other') {
        otherInstituteControl.setValidators([Validators.required]);
      } else {
        otherInstituteControl.clearValidators();
      }
      otherInstituteControl.setValue('');
      otherInstituteControl.updateValueAndValidity();
    }
  }

  isEndYearDisabled(year: number): boolean {
    const startYear = this.entryForm.get('startYear')?.value as number;
    return startYear ? year < startYear : false;
  }

  onStartYearChange(value: number): void {
    const endYear = this.entryForm.get('endYear')?.value;
    if (endYear && endYear < value) {
      this.entryForm.patchValue({
        endYear: null
      });
    }
  }


  //#endregion (educational qualifications)

  //#region (achievements)
  private createAchievementsForm(): void {
    this.entryForm = this.fb.group({
      title: [_.get(this.entryDetails, 'title', ''), [Validators.required, Validators.maxLength(250)]],
      issuedOrganisation: [_.get(this.entryDetails, 'issuedOrganisation', ''), [Validators.maxLength(250)]],
      issuedDate: [_.get(this.entryDetails, 'issuedDate', '')],
      uploadedDocumentUrl: [_.get(this.entryDetails, 'documentUrl', '')],
      fileName: [_.get(this.entryDetails, 'fileName', '')],
      url: [_.get(this.entryDetails, 'url', '')],
      description: [_.get(this.entryDetails, 'description', ''), [Validators.maxLength(500)]],
    });
    if(_.get(this.entryDetails, 'fileName', '')) {
      const urlControl = this.entryForm.controls.url;
      urlControl.patchValue('')
      urlControl.disable()
      urlControl.updateValueAndValidity()
      this.disableUpload = false;
      this.disableUrl = true;
    } else if (_.get(this.entryDetails, 'url', '')) {
      this.disableUpload = true;
      this.disableUrl = false;
    }
    this.valueChanges();
  }

  valueChanges(): void {
    const urlControl = this.entryForm.get('url');
    if (urlControl) {
      urlControl.valueChanges.subscribe((value: string) => {
        if (value && value.trim() !== '') {
          const documentUrlControl = this.entryForm.get('uploadedDocumentUrl');
          if (documentUrlControl) {
            documentUrlControl.patchValue('');
            documentUrlControl.updateValueAndValidity();
          }
          const fileNameControl = this.entryForm.get('fileName');
          if (fileNameControl) {
            fileNameControl.patchValue('');
            fileNameControl.updateValueAndValidity();
          }
          this.disableUpload = true;
          this.disableUrl = false;
        } else {
          this.disableUpload = false;
          this.disableUrl = false;
        }
      });
    }
  }

  removeFile(): void {
    const documentUrlControl = this.entryForm.get('uploadedDocumentUrl');
    if (documentUrlControl) {
      documentUrlControl.patchValue('');
      documentUrlControl.updateValueAndValidity();
    }
    const urlControl = this.entryForm.get('url');
    if (urlControl) {
      urlControl.patchValue('');
      urlControl.enable();
      urlControl.updateValueAndValidity();
    }
    const fileNameControl = this.entryForm.get('fileName');
          if (fileNameControl) {
            fileNameControl.patchValue('');
            fileNameControl.updateValueAndValidity();
          }
    this.disableUpload = false;
    this.disableUrl = false;
  }

  preventDefaultCDK(event: DragEvent, isEneter = ''): void {
    event.preventDefault()
    event.stopPropagation()
    if (isEneter) {
      const dropArea = event.target as HTMLElement
      dropArea.style.opacity = isEneter === 'enter' ? '0.5' : '1'
    }
  }

  onDrop(event: DragEvent): void {
    this.preventDefaultCDK(event, 'leave')

    const files = event.dataTransfer?.files
    if (files) {
      this.onFileSelected(files)
    }
  }

  onFileSelected(files: any) {
    let imagePath: any = ''
    if (files.length === 0) {
      return
    }
    const mimeType = files[0].type
    if (!mimeType.startsWith('image/')) {
      this.openSnackbar('Only images are supported')
      return
    }
    const reader = new FileReader()
    imagePath = files[0]
    if (imagePath && imagePath.size > (500 * 1024)) {
      this.openSnackbar('Selected image size is more than 500KB.')
      imagePath = ''
      return
    }
    reader.readAsDataURL(files[0])
    this.saveImage(imagePath)
  }

  saveImage(imagePath: any) {
    if (imagePath) {
      const fileName = imagePath.name.replace(/[^A-Za-z0-9.]/g, '')
      const formdata = new FormData()
      formdata.append('data', imagePath, fileName)
      this.ProfileV2RevampService.updateAchievementPic(formdata).subscribe({
        next: (res: any) => {
          if (res) {
            const createdUrl = _.get(res, 'result.url', '')
            const urlToReplace = 'https://storage.googleapis.com/igot'
            const urlSplice = createdUrl.slice(urlToReplace.length)
            // let uploadedFile = createdUrl
            // if (createdUrl.startsWith(urlToReplace)) {
            //   const urlSplice = createdUrl.slice(urlToReplace.length)
            //   uploadedFile = `${environment.domainName}assets/public/${urlSplice}`
            // }
            const uploadedFile = this.pipeImgUrl.transform(urlSplice)
            const documentUrlControl = this.entryForm.get('uploadedDocumentUrl');
            if (documentUrlControl) {
              documentUrlControl.patchValue(uploadedFile)
              documentUrlControl.updateValueAndValidity()
            }
            const urlControl = this.entryForm.get('url');
            if (urlControl) {
              urlControl.patchValue('')
              urlControl.disable()
              urlControl.updateValueAndValidity()
            }
            const fileNameControl = this.entryForm.get('fileName');
          if (fileNameControl) {
            fileNameControl.patchValue(fileName);
            fileNameControl.updateValueAndValidity();
          }
            this.disableUrl = true
            this.disableUpload = false
          }
        }, error: (error: HttpErrorResponse) => {
          if (error) {
            const errorMessage = _.get(error, 'error.message', 'Something went wrong please try again')
            this.openSnackbar(errorMessage)
          }
        }
      })
    }
  }

  //#endregion (achievements)

  handleSubmit(): void {
    if (this.entryForm) {
      if (this.entryForm.valid) {
        this.dialogRef.close(this.entryForm.value);
      } else {
        this.markFormGroupTouched(this.entryForm);
      }
    }
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.entryForm.get(controlName);
    if (control && control.touched && control.hasError(errorName)) {
      return true;
    }
    return false;
  }

  handleCancel(): void {
    this.dialogRef.close();
  }

  private openSnackbar(primaryMsg: string, duration: number = 5000) {
    this.snackBar.open(primaryMsg, 'X', {
      duration,
    })
  }
}
