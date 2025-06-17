import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatLegacyDialogRef, MAT_LEGACY_DIALOG_DATA, MatLegacyDialog } from '@angular/material/legacy-dialog';
import * as _ from 'lodash';
import { HttpErrorResponse } from '@angular/common/http';
import { MatLegacySnackBar } from '@angular/material/legacy-snack-bar';
import { debounceTime, distinctUntilChanged, startWith, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { EMAIL_PATTERN, EMP_ID_PATTERN, IMAGE_SIZE_1MB, MOBILE_PATTERN, PIN_CODE_PATTERN, state } from '../../models/profile-revamp.model';
import { ProfileV2RevampService } from '../../services/profile-v2-revamp.service';
import { ConfirmDialogComponent } from '@sunbird-cb/collection/src/lib/_common/confirm-dialog/confirm-dialog.component'
import { OtpService } from '../../../user-profile/services/otp.services';
import { VerifyOtpComponent } from '../../components/verify-otp/verify-otp.component'
import { NsUserProfileDetails } from '../../../user-profile/models/NsUserProfile'
import { DatePipe } from '@angular/common';
import { ImageCropComponent, PipeCertificateImageURL } from '@sunbird-cb/utils-v2';
import { NotificationComponent } from '@ws/author/src/lib/modules/shared/components/notification/notification.component'
import { PROFILE_IMAGE_SUPPORT_TYPES } from '@ws/author/src/lib/constants/upload'
import { Notify } from '@ws/author/src/lib/constants/notificationMessage';
import { NOTIFICATION_TIME } from '@ws/author/src/lib/constants/constant';


@Component({
  selector: 'ws-app-prfile-edit-v2',
  templateUrl: './prfile-edit-v2.component.html',
  styleUrls: ['./prfile-edit-v2.component.scss']
})

export class PrfileEditV2Component implements OnInit, OnDestroy {
  header = '';
  profileDetails: any;
  profileForm!: FormGroup;
  currentDate: Date = new Date();
  initilisationInProgress = true;

  profileImage: string | null = null;
  profileImageChanged = false;
  userInitials = '';
  statesList: state[] = [];
  districtsList: string[] = [];

  groupsList: any[] = [];
  designationsMeta: any[] = [];
  designationsTotalCount = 0
  designationSearchText = ''
  designationsOffset = 0
  filterDesignationsMeta: any = []
  isLoadingMoreDesignations = false;
  designationListLoadCount = 50

  verifyEmail: boolean = false;
  verifyMobile: boolean = false;
  approvedDomainList: any = []
  destroySubject$ = new Subject()
  contextToken: any
  eUserGender = Object.keys(NsUserProfileDetails.EUserGender)
  eCategory = Object.keys(NsUserProfileDetails.ECategory)
  masterLanguageBackup: any[] = [];
  masterLanguages: any[] = [];
  isMatcompleteOpened = false
  isCadreStatus = false
  showBatchForNoCadre = true
  civilServiceTypeId = '';
  civilServiceId = '';
  cadreId = '';
  noCadreDetails = true
  civilServiceData: any
  civilServiceTypes: any[] = []
  serviceType: any
  serviceListData: any
  serviceNamesList: any
  serviceId: any
  yearArray: any = []
  selectedServiceName: any
  selectedService: any
  civilServiceName: any
  cadreList: any[] = []
  cadreControllingAuthority: any
  startBatch: any;
  endBatch: any;
  exclusionYear: any;
  selectedCadreName: any;
  selectedCadre: any;


  constructor(
    private fb: FormBuilder,
    private dialogRef: MatLegacyDialogRef<PrfileEditV2Component>,
    @Inject(MAT_LEGACY_DIALOG_DATA) public data: any,
    private profileV2RevampService: ProfileV2RevampService,
    private snackBar: MatLegacySnackBar,
    private otpService: OtpService,
    private dialog: MatLegacyDialog,
    private datePipe: DatePipe,
    private pipeImgUrl: PipeCertificateImageURL,
  ) {
    this.header = _.get(this.data, 'header', '');
    this.profileDetails = _.get(this.data, 'profileDetails', {});
    this.profileImage = _.get(this.data, 'profileImage', null);
    this.groupsList = _.get(this.data, 'groupsList', []);
  }

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    switch (this.header) {
      case 'Profile':
        this.createProfileForm();
        this.getInitials();
        this.getStatesList();
        break;
      case 'Primary Details':
        this.createPrimaryDetailsForm();
        this.getdesignationsMeta();
        break;
      case 'About Me':
        this.createAboutMeForm();
        break;
      case 'Other Details':
        this.createOtherDetailsForm();
        break;
      default:
        this.profileForm = this.fb.group({});
    }
  }

  //#region (profile)
  private createProfileForm(): void {
    this.profileImage = _.get(this.profileDetails, 'profileImage', null);
    this.profileForm = this.fb.group({
      firstname: [_.get(this.profileDetails, 'firstname', ''), [Validators.required, Validators.pattern(/^(?!.*\s{2,})(?!.*[-']{2,})[a-zA-Z\s'-]*$/), Validators.maxLength(200), Validators.minLength(2)]],
      state: [_.get(this.profileDetails, 'state', '')],
      district: [_.get(this.profileDetails, 'district', '')]
    });
    setTimeout(() => {
      this.initilisationInProgress = false;
    }, 10)
  }

  getInitials(): void {
    const userName = _.get(this.profileDetails, 'firstname', '');
    if (userName) {
      if (userName.split(' ').length > 1) {
        const nameArr = userName.split(' ')
        this.userInitials = nameArr[0].charAt(0) + nameArr[1].charAt(0)
      } else {
        this.userInitials = userName.charAt(0)
      }
    }
  }

  getStatesList() {
    this.profileV2RevampService.getStatesList().subscribe({
      next: (res: any) => {
        this.statesList = _.get(res, 'result.statesList', []) as state[];
        if (_.get(this.profileDetails, 'state', '')) {
          const stateControl = this.profileForm ? this.profileForm.get('state') : null;
          if (stateControl) {
            stateControl.patchValue(_.get(this.profileDetails, 'state', ''));
          }
          this.getDistrictsList(_.get(this.profileDetails, 'state', ''), true);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.statesList = [];
        this.openSnackbar(_.get(err, 'error.params.errmsg', 'Something went wrong'));
      }
    })
  }

  getDistrictsList(state: string, isFirstTime: boolean = false) {
    this.profileV2RevampService.getDistrictsList(state).subscribe({
      next: (res: any) => {
        this.districtsList = _.get(res, 'result.districtsList[0].districts', []) as string[];
        const districtControl = this.profileForm ? this.profileForm.get('district') : null;
        if (districtControl) {
          if (isFirstTime) {
            districtControl.patchValue(_.get(this.profileDetails, 'district', ''));
          } else {
            districtControl.patchValue('');
          }
        }
      },
      error: (err: HttpErrorResponse) => {
        this.districtsList = [];
        this.openSnackbar(_.get(err, 'error.params.errmsg', 'Something went wrong'));
      }
    })
  }

  get customNameValidation(): string {
    const userName = this.profileForm.get('firstname');
    if (userName && userName.value) {
      if (/[@#$%^&*()_+={}[\]|\\:;"<>?,./~`]/.test(userName.value) && /\d/.test(userName.value)) {
        return 'NetworkV2Profile.invalidNameFormat';
      } else if (!userName.value.trim()) {
        return 'NetworkV2Profile.nameIsRequired';
      } else if (/^\s|[-'\s]$/.test(userName.value)) {
        return 'NetworkV2Profile.nameCannotStartOrEndWithSpace';
      } else if (/\d/.test(userName.value)) {
        return 'NetworkV2Profile.nameCannotContainNumbers';
      } else if (/[@#$%^&*()_+={}[\]|\\:;"<>?,./~`]/.test(userName.value)) {
        return 'NetworkV2Profile.specialCharNotAllowedInName';
      } else if (/(\s{2,}|[-']{2,})/.test(userName.value)) {
        return 'NetworkV2Profile.pleaseAvoidMultipleSpaces';
      }
    }
    return 'NetworkV2Profile.invalidNameFormat'
  }


  //#region (profile image)

  handleUploadProfileImg(file: File) {
      const formData = new FormData()
      const fileName = file.name.replace(/[^A-Za-z0-9.]/g, '')
      if (
        !(
          PROFILE_IMAGE_SUPPORT_TYPES.indexOf(
            `.${fileName
              .toLowerCase()
              .split('.')
              .pop()}`,
          ) > -1
        )
      ) {
        this.snackBar.openFromComponent(NotificationComponent, {
          data: {
            type: Notify.INVALID_IMG_FORMAT,
          },
          duration: NOTIFICATION_TIME * 1500,
        })
        return
      }
  
      if (file.size > IMAGE_SIZE_1MB * 2) {
        this.snackBar.openFromComponent(NotificationComponent, {
          data: {
            type: 'Maximum upload file size: 2MB',
          },
          duration: NOTIFICATION_TIME * 1500,
        })
        return
      }
  
      const dialogRef = this.dialog.open(ImageCropComponent, {
        width: '70%',
        data: {
          isRoundCrop: true,
          imageFile: file,
          width: 272,
          height: 148,
          isThumbnail: true,
          imageFileName: fileName,
        },
      })
  
      dialogRef.afterClosed().subscribe({
        next: (result: File) => {
          if (result) {
            formData.append('data', result, fileName)
            const reader = new FileReader();
            reader.onload = () => {
              this.genrateProfileImageUrl(result, fileName);
            };
            reader.readAsDataURL(result);
          }
        },
      })
    }

  genrateProfileImageUrl(file: any, fileName?: string) {
    if(file) {
      const formdata = new FormData()
      formdata.append('data', file, fileName)
      this.profileV2RevampService.updateProfilePic(formdata).subscribe({
        next: (res: any) => {
          const createdUrl = _.get(res, 'result.url', '')
          const folderNameToSplit = '/profileImage/'
          const urlSplice = createdUrl.split(folderNameToSplit)[1]
          this.profileImage = this.pipeImgUrl.transform(`${folderNameToSplit}${urlSplice}`)
          this.profileImageChanged = true
        }
      })
    }
  }
  uploadImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      this.handleUploadProfileImg(file);
    };
    input.click();
  }

  deleteImage() {
    this.profileImage = '';
    this.profileImageChanged = true
  }
  //#endregion (end of profile image)
  //#endregion (profile)

  //#region (primary details)
  private createPrimaryDetailsForm(): void {
    this.profileForm = this.fb.group({
      group: [_.get(this.profileDetails, 'group', ''), Validators.required],
      designation: [_.get(this.profileDetails, 'designation', ''), Validators.required],
      searchDesignation: [''],
    });
    this.checkCurrentDesignationPresent();
    setTimeout(() => {
      this.initilisationInProgress = false;
    }, 10)
    const searchDesignationControl = this.profileForm.get('searchDesignation');
    if (searchDesignationControl) {
      let settingValueChange = true
      searchDesignationControl.valueChanges
        .pipe(
          debounceTime(250),
          distinctUntilChanged(),
          startWith(''),
        )
        .subscribe(searchText => {
          this.designationsOffset = 0
          if (searchText && searchText.length > 1) {
          this.designationSearchText = searchText // to avoid api call with single character
            this.getdesignationsMeta()
          } else if(!searchText) {
            if(!settingValueChange) {
              this.designationSearchText = searchText
              this.getdesignationsMeta() 
            }
            this.checkCurrentDesignationPresent()
          }
          settingValueChange = false
        })
    }
  }

  getdesignationsMeta() {
    const requestBody: any = {
      filterCriteriaMap: {
        status: 'Active'
      },
      requestedFields: [],
      pageNumber: this.designationsOffset,
      pageSize: this.designationListLoadCount
    }
    if(this.designationSearchText){
      requestBody['searchString'] = this.designationSearchText
    }
    this.isLoadingMoreDesignations = true
    this.profileV2RevampService.searchDesignation(requestBody).subscribe({
      next: (res: any) => {
        this.isLoadingMoreDesignations = false
        if(this.designationsOffset === 0) {
          this.designationsMeta = _.get(res, 'result.result.data', [])
        } else {
          this.designationsMeta = [...this.designationsMeta, ..._.get(res, 'result.result.data', [])]
        }
        this.designationsTotalCount = _.get(res, 'result.result.totalCount', 0)
        this.checkCurrentDesignationPresent()
      }, error: (error: HttpErrorResponse) => {
        if(error) {
          this.openSnackbar('Something went wrong. Please refresh or try again later.')
        }
      }
    })
  }

  setupScrollListener(opened: boolean): void {
    const searchDesignationControl = this.profileForm.get('searchDesignation');
    if (opened && searchDesignationControl) {
      searchDesignationControl.setValue('')
      this.designationsOffset = 0
      this.getdesignationsMeta()
      const searchInput = document.querySelector('.search-input') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
      this.checkCurrentDesignationPresent()
      const panel = document.querySelector('.mat-select-panel');
      if (panel) {
        // Add scroll event listener to the panel
        panel.addEventListener('scroll', this.onDesignationSelectScroll.bind(this));
      }
    }
  }

  onDesignationSelectScroll(event: any): void {
    const element = event.target;

    if (element.scrollTop + element.clientHeight >= element.scrollHeight - 5) {
      // Only load more if not already loading and if there are potentially more items
      if (!this.isLoadingMoreDesignations && this.designationsMeta.length < this.designationsTotalCount) {
          this.isLoadingMoreDesignations = true;
          this.designationsOffset += 1;
          this.getdesignationsMeta()
        }
    }
  }

  checkCurrentDesignationPresent() {

    // Get the current designation value
    const searchDesignationControl = this.profileForm.get('designation');
    const currentDesignation = searchDesignationControl ? searchDesignationControl.value : '';
    // Check if current designation exists in the list
    if (currentDesignation) {
      const designationExists = this.designationsMeta.some(
        (designation: any) => designation.designation.toLowerCase() === currentDesignation.toLowerCase()
      );

      // If designation doesn't exist in the list, add it
      if (!designationExists) {
        // Create a new designation object to match the structure of other items
        const newDesignation = {
          designation: currentDesignation,
          status: 'Active'
        };
        this.designationsMeta.unshift(newDesignation);
      }
    }
  }

  onDesignationDropdownClosed(): void {
    const searchDesignationControl = this.profileForm.get('searchDesignation');
    if (searchDesignationControl) {
      searchDesignationControl.setValue('')
      this.designationSearchText = ''
    }
    this.checkCurrentDesignationPresent()
  }

  // #endregion (end of primary details)

  private createAboutMeForm(): void {
    this.profileForm = this.fb.group({
      aboutme: [_.get(this.profileDetails, 'aboutme', ''), [Validators.maxLength(2000), Validators.pattern(/^[a-zA-Z0-9\s().,'-]*$/)]]
    });
    setTimeout(() => {
      this.initilisationInProgress = false;
    }, 10)
  }

  //#region (other details)
  private createOtherDetailsForm(): void {
    const dob = _.get(this.profileDetails, 'dob', '');
    this.profileForm = this.fb.group({
      employeeCode: [_.get(this.profileDetails, 'employeeCode', ''), [Validators.pattern(EMP_ID_PATTERN)]],
      primaryEmail: [_.get(this.profileDetails, 'primaryEmail', ''), [Validators.pattern(EMAIL_PATTERN)]],
      gender: [_.get(this.profileDetails, 'gender', ''), []],
      dob: [dob ? new Date(dob) : '', []],
      category: [_.get(this.profileDetails, 'category', ''), []],
      pinCode: [_.get(this.profileDetails, 'pinCode', ''), [Validators.minLength(6), Validators.maxLength(6), Validators.pattern(PIN_CODE_PATTERN)]],
      mobile: [_.get(this.profileDetails, 'mobile', ''), [Validators.minLength(10), Validators.maxLength(10), Validators.pattern(MOBILE_PATTERN)]],
      domicileMedium: [_.get(this.profileDetails, 'domicileMedium', ''), []],
      isCadre: [_.get(this.profileDetails, 'isCadre')],
      civilServiceType: [_.get(this.profileDetails, 'civilServiceType', ''), []],
      civilServiceName: [_.get(this.profileDetails, 'civilServiceName', ''), []],
      cadreName: [_.get(this.profileDetails, 'cadreName', ''), []],
      cadreBatch: [_.get(this.profileDetails, 'cadreBatch', ''), []],
      cadreControllingAuthorityName: [_.get(this.profileDetails, 'cadreControllingAuthorityName', ''), []],
    });
    this.civilServiceTypeId = _.get(this.profileDetails, 'civilServiceTypeId', '');
    this.civilServiceId = _.get(this.profileDetails, 'civilServiceId', '');
    this.cadreId = _.get(this.profileDetails, 'cadreId', '');
    this.cadreControllingAuthority = _.get(this.profileDetails, 'cadreControllingAuthorityName', '');
    this.isCadreStatus = _.get(this.profileDetails, 'isCadre', false);

    this.fetchCadreData();
    this.getMasterLanguage();
    this.valueCahngeMethosdsForOtherDetails();
    setTimeout(() => {
      this.initilisationInProgress = false;
    }, 10)
  }

  fetchCadreData() {
    if (!this.profileDetails.hasOwnProperty('cadreDetails')) {
      this.noCadreDetails = true
      // this.saveChanges = true
    } else if (this.profileDetails.cadreDetails == null) {
      this.noCadreDetails = false
    }
    else {
      this.noCadreDetails = true
    }
    const cadreControllingAuthorityControl = this.profileForm.get('cadreControllingAuthority')

    if (cadreControllingAuthorityControl) { cadreControllingAuthorityControl.reset() }
    this.profileV2RevampService.fetchCadre().subscribe({
      next: response => {
        this.civilServiceData = _.get(response, 'result.response.value.civilServiceType')
        this.civilServiceTypes = _.get(this.civilServiceData, 'civilServiceTypeList', []).map((service: any) => service.name)
        if (_.get(this.profileDetails, 'civilServiceType', '')) {
          this.getService(_.get(this.profileDetails, 'civilServiceType', ''), false);
        }
      },
      error: (err: HttpErrorResponse) => {
        if (err) {
          this.openSnackbar(this.handleTranslateTo('unableFetchCadreData'))
        }
      },
    })
  }
  getMasterLanguage(): void {
    this.profileV2RevampService.getMasterLanguages()
      .pipe(takeUntil(this.destroySubject$))
      .subscribe((res: any) => {
        this.masterLanguages = res.languages
        this.masterLanguageBackup = res.languages
        const domicileMediumControl = this.profileForm.get('domicileMedium');
        if (domicileMediumControl) {
          domicileMediumControl.patchValue(_.get(this.profileDetails, 'domicileMedium', ''));
          domicileMediumControl.updateValueAndValidity();
        }
      }, (error: HttpErrorResponse) => {
        if (!error.ok) {
          this.openSnackbar(this.handleTranslateTo('unableFetchMasterLanguageData'))
        }
      })
  }

  get primaryEmailControl() {
    return this.profileForm.get('primaryEmail');
  }
  get mobileControl() {
    const mobileControl = this.profileForm.get('mobile');
    return mobileControl;
  }

  get showCadreDetails(): boolean {
    const servicesList = [
      'Indian Administrative Service (IAS)',
      'Indian Police Service (IPS)',
      'Indian Forest Service (IFoS)'
    ]
    const serviceNameControl = this.profileForm.get('civilServiceName');
    const typeOfCivilServiceControl = this.profileForm.get('civilServiceType');
    const isCadreControl = this.profileForm.get('isCadre');
    if (typeOfCivilServiceControl && typeOfCivilServiceControl.value &&
      serviceNameControl && serviceNameControl.value &&
      isCadreControl && isCadreControl.value &&
      servicesList.includes(serviceNameControl.value)) {
      return true;
    }
    const cadreNameControl = this.profileForm.get('cadreName');
    if (cadreNameControl) {
      this.removeValidation(cadreNameControl);
    }
    return false;
  }

  get showBatchDetails(): boolean {
    const servicesList = [
      'Indian Administrative Service (IAS)',
      'Indian Police Service (IPS)',
      'Indian Forest Service (IFoS)'
    ]
    const serviceNameControl = this.profileForm.get('civilServiceName');
    const typeOfCivilServiceControl = this.profileForm.get('civilServiceType');
    const isCadreControl = this.profileForm.get('isCadre');
    const cadreNameControl = this.profileForm.get('cadreName');
    if (
      typeOfCivilServiceControl && typeOfCivilServiceControl.value &&
      serviceNameControl && serviceNameControl.value &&
      isCadreControl && isCadreControl.value && (
        (
          servicesList.includes(serviceNameControl.value) &&
          cadreNameControl && cadreNameControl.value
        ) || (
          !servicesList.includes(serviceNameControl.value)
        )
      )
    ) {
      return true;
    }
    return false
  }

  get showControllingAuthority(): boolean {
    const isCadreControl = this.profileForm.get('isCadre');
    const cadreBatchControl = this.profileForm.get('cadreBatch');
    if (isCadreControl && isCadreControl.value && cadreBatchControl && cadreBatchControl.value) {
      return true;
    }
    return false
  }

  valueCahngeMethosdsForOtherDetails(): void {
    const primaryEmailControl = this.primaryEmailControl;
    const mobileControl = this.mobileControl;
    const domicileMediumControl = this.profileForm.get('domicileMedium');

    if (primaryEmailControl) {
      primaryEmailControl.valueChanges.subscribe((value: string) => {
        if (value && value !== _.get(this.profileDetails, 'primaryEmail', '')) {
          if (EMAIL_PATTERN.test(value)) {
            this.verifyEmail = true
          } else {
            this.verifyEmail = false
          }
        } else if (!value) {
          this.verifyEmail = false;
        } else if (value === _.get(this.profileDetails, 'primaryEmail', '')) {
          this.verifyEmail = false
        }
      })
    }

    if (mobileControl) {
      mobileControl.valueChanges.subscribe((value: string) => {
        if (value && value !== _.get(this.profileDetails, 'mobile', '')) {
          if (MOBILE_PATTERN.test(value)) {
            this.verifyMobile = true
          } else {
            this.verifyMobile = false
          }
        } else if (!value || value === _.get(this.profileDetails, 'mobile', '')) {
          this.verifyMobile = false;
        }
      })
    }

    if (domicileMediumControl) {
      domicileMediumControl.valueChanges
        .pipe(
          debounceTime(250),
          distinctUntilChanged(),
          startWith(''),
        )
        .subscribe(res => {
          if (this.masterLanguageBackup) {
            this.masterLanguages = this.masterLanguageBackup.filter(item => item.name.toLowerCase().includes(res && res.toLowerCase()))
          }
        })
    }
  }

  getIsCadreStatus(value: boolean) {
    this.isCadreStatus = value
    const typeOfCivilServiceControl = this.profileForm.get('civilServiceType');
    const serviceNameControl = this.profileForm.get('civilServiceName');
    const cadreNameControl = this.profileForm.get('cadreName');
    const cadreBatchControl = this.profileForm.get('cadreBatch');
    const cadreControllingAuthorityControl = this.profileForm.get('cadreControllingAuthority');
    if (value) {
      this.addValidation(typeOfCivilServiceControl);
      this.addValidation(serviceNameControl);
      this.addValidation(cadreNameControl);
      this.addValidation(cadreBatchControl);
      this.addValidation(cadreControllingAuthorityControl);
      this.civilServiceTypeId = '';
      this.civilServiceId = '';
      this.cadreId = '';
    }
    else {
      this.showBatchForNoCadre = false
      this.removeValidation(typeOfCivilServiceControl);
      this.removeValidation(serviceNameControl);
      this.removeValidation(cadreNameControl);
      this.removeValidation(cadreBatchControl);
      this.removeValidation(cadreControllingAuthorityControl);
    }
  }

  addValidation(control: any) {
    if (control) {
      control.reset();
      control.setValidators([Validators.required]);
      control.updateValueAndValidity();
      control.markAsUntouched();
    }
  }

  removeValidation(control: any) {
    if (control) {
      control.reset();
      control.clearValidators();
      control.updateValueAndValidity();
      control.markAsUntouched();
    }
  }

  getService(event: any, isReset: boolean = true) {
    const serviceNameControl = this.profileForm.get('civilServiceName')
    const cadreControl = this.profileForm.get('cadreName')
    const batchControl = this.profileForm.get('cadreBatch')
    const cadreControllingAuthorityControl = this.profileForm.get('cadreControllingAuthority')
    if (isReset) {
      if (serviceNameControl) { serviceNameControl.reset() }
      if (cadreControl) { cadreControl.reset() }
      if (batchControl) { batchControl.reset() }
      if (cadreControllingAuthorityControl) { cadreControllingAuthorityControl.reset() }
    }

    this.serviceType = _.get(this.civilServiceData, 'civilServiceTypeList', []).find((element: any) => element.name === event)
    if (this.serviceType) {
      this.serviceListData = this.serviceType.serviceList
      this.serviceNamesList = this.serviceListData.map((service: any) => service.name)
      this.serviceId = this.serviceType.id
      if (!isReset && serviceNameControl && serviceNameControl.value) {
        serviceNameControl.updateValueAndValidity()
        this.onServiceSelect(serviceNameControl.value, false)
      }
    }
  }

  onServiceSelect(event: any, isReset: boolean = true) {
    const cadreControl = this.profileForm.get('cadreName')
    const batchControl = this.profileForm.get('cadreBatch')
    const cadreControllingAuthorityControl = this.profileForm.get('cadreControllingAuthority')
    if (isReset) {
      if (cadreControl) { cadreControl.reset() }
      if (batchControl) { batchControl.reset() }
      if (cadreControllingAuthorityControl) { cadreControllingAuthorityControl.reset() }
    }
    this.selectedServiceName = event
    if (this.serviceListData) {
      this.selectedService = this.serviceListData.find((service: any) => service.name === this.selectedServiceName)
      this.civilServiceName = this.selectedService.name
      this.civilServiceId = this.selectedService.id
      this.cadreList = this.selectedService.cadreList ? this.selectedService.cadreList.map((cadre: any) => cadre.name) : []
    }
    if (this.selectedService && this.selectedService.cadreControllingAuthority) {
      this.cadreControllingAuthority = this.selectedService.cadreControllingAuthority
    } else {
      this.cadreControllingAuthority = 'NA'
    }
    if (this.selectedService && this.selectedService.cadreList &&
      (this.selectedService.cadreList.length === 0 ||
        !isReset && batchControl && batchControl.value)
    ) {
      this.showBatchForNoCadre = true
      this.startBatch = this.selectedService.commonBatchStartYear
      this.endBatch = this.selectedService.commonBatchEndYear
      this.exclusionYear = this.selectedService.commonBatchExclusionYearList
      // tslint:disable
      this.yearArray = Array.from({ length: this.endBatch - this.startBatch + 1 }, (_, index) => this.startBatch + index)
        .filter(year => !this.exclusionYear.includes(year))
    } else {
      this.showBatchForNoCadre = false
    }
    if (!isReset && cadreControl && batchControl) {
      cadreControl.updateValueAndValidity()
      batchControl.updateValueAndValidity()
    }
  }

  onCadreSelect(event: any) {
    const batchControl = this.profileForm.get('cadreBatch')
    const cadreControllingAuthorityControl = this.profileForm.get('cadreControllingAuthority')

    if (batchControl) { batchControl.reset() }
    if (cadreControllingAuthorityControl) { cadreControllingAuthorityControl.reset() }
    this.selectedCadreName = event
    if (this.selectedService) {
      this.selectedCadre = this.selectedService.cadreList.find((cadre: any) => cadre.name === this.selectedCadreName)
      this.startBatch = this.selectedService.cadreList.find((cadre: any) => cadre.name === this.selectedCadreName).startBatchYear
      this.endBatch = this.selectedService.cadreList.find((cadre: any) => cadre.name === this.selectedCadreName).endBatchYear
      this.exclusionYear = this.selectedCadre.exculsionYearList
      // tslint:disable
      this.yearArray = Array.from({ length: this.endBatch - this.startBatch + 1 }, (_, index) => this.startBatch + index)
        .filter(year => !this.exclusionYear.includes(year))
      this.cadreId = this.selectedCadre.id
    }

  }

  handleGenerateEmailOTP(verifyType?: any): void {
    this.profileV2RevampService.getWhiteListDomain().subscribe((response: any) => {
      if (_.get(response, 'result.domains').length > 0) {
        this.approvedDomainList = response.result.domains
        if (this.approvedDomainList && this.approvedDomainList.length > 0) {
          if (this.primaryEmailControl && this.isEmailAllowed(this.primaryEmailControl.value)) {
            this.otpService.sendEmailOtp(this.primaryEmailControl.value)
              .pipe(takeUntil(this.destroySubject$))
              .subscribe((_res: any) => {
                this.openSnackbar(this.handleTranslateTo('otpSentEmail'))
                if (verifyType) {
                  this.handleVerifyOTP(verifyType, this.primaryEmailControl?.value)
                }
              }, (error: HttpErrorResponse) => {
                if (!error.ok) {
                  this.openSnackbar(this.handleTranslateTo('emailOTPSentFail'))
                }
              })
          } else {
            const dialogRef = this.dialog.open(ConfirmDialogComponent, {
              data: {
                title: ' ',
                from: 'approvedDomain',
                acceptButton: 'OK',
                width: '60%',
              },
            })
            dialogRef.afterClosed().subscribe(result => {
              if (result) {
              }
            })
          }
        }
      }
    })
  }

  handleVerifyOTP(verifyType: string, _value?: string): void {
    const dialogRef = this.dialog.open(VerifyOtpComponent, {
      data: { type: verifyType, value: _value },
      disableClose: true,
      panelClass: 'common-modal',
    })

    dialogRef.componentInstance.resendOTP.subscribe((data: any) => {
      this.handleResendOTP(data)
    })

    dialogRef.componentInstance.otpVerified.subscribe((data: any) => {
      this.contextToken = data.token
      if (data.type === 'email') {
        this.verifyEmail = false
      } else {
        this.verifyMobile = false
      }
    })
  }

  handleResendOTP(data: any): void {
    let otpValue$: any
    if (data.type === 'email') {
      otpValue$ = this.otpService.sendEmailOtp(data.value)
    } else {
      otpValue$ = this.otpService.resendOtp(data.value)
    }

    otpValue$.pipe(takeUntil(this.destroySubject$))
      .subscribe((_res: any) => {
        if (data.type === 'email') {
          this.openSnackbar(this.handleTranslateTo('otpSentEmail'))
        } else {
          this.openSnackbar(this.handleTranslateTo('otpSentMobile'))
        }
      }, (error: any) => {
        if (!error.ok) {
          this.openSnackbar(_.get(error, 'error.params.errmsg') || 'Unable to resend OTP, please try again later!')
        }
      })
  }

  isEmailAllowed(email: string): boolean {
    const domain = email.split('@')[1]
    return domain ? this.approvedDomainList.includes(domain) : false
  }

  handleGenerateOTP(verifyType?: string): void {
    if (this.mobileControl) {
      this.otpService.sendOtp(this.mobileControl.value)
        .pipe(takeUntil(this.destroySubject$))
        .subscribe((_res: any) => {
          this.openSnackbar(this.handleTranslateTo('otpSentMobile'))
          if (verifyType && this.mobileControl) {
            this.handleVerifyOTP(verifyType, this.mobileControl.value)
          }
        }, (error: HttpErrorResponse) => {
          if (!error.ok) {
            this.openSnackbar(this.handleTranslateTo('mobileOTPSentFail'))
          }
        })
    }
  }

  handleEmpty(type: string): void {
    if (type === 'mobile') {
      if (_.get(this.profileDetails, 'mobile', '') && this.mobileControl && !this.mobileControl.value) {
        this.profileForm.setErrors({ valid: false })
      }
    }

    if (type === 'primaryEmail') {
      if (!_.get(this.profileDetails, 'primaryEmail', '') && this.primaryEmailControl && !this.primaryEmailControl.value) {
        this.profileForm.setErrors({ valid: false })
      }
    }
  }

  onkeyDown(_event: any) {
    return this.isMatcompleteOpened
  }

  onAutoCompleteOpened() {
    this.isMatcompleteOpened = true
  }

  onAutoCompleteClosed() {
    this.isMatcompleteOpened = false
  }

  //#endregion (end of other details)

  handleSubmit(): void {
    if (this.profileForm) {
      if (this.canSaveChanges) {
        const profileData = this.profileForm.value;
        if (this.profileImageChanged) {
          profileData['profileImageUrl'] = this.profileImage;
          const firstNameControl = this.profileForm.get('firstName');
          if (firstNameControl && !firstNameControl.value) {
            profileData['firstName'] = this.profileDetails['firstName'];
          }
        }
        if (this.header === 'Other Details') {
          this.genrateOtehrDetailsForm()
        } else {
          this.dialogRef.close(this.profileForm.value);
        }
      } else {
        this.markFormGroupTouched(this.profileForm);
      }
    }
  }

  genrateOtehrDetailsForm(): void {
    const formBody: any = this.profileForm.value
    // if (this.primaryEmailControl && _.get(this.profileDetails, 'primaryEmail', '') !== this.primaryEmailControl.value) {
    //   this.updateEmail(this.primaryEmailControl.value)
    // }
    if (formBody && formBody.dob) {
      const dobDate = new Date(formBody.dob);
      formBody.dob = this.datePipe.transform(dobDate, 'dd-MM-yyyy')
    }
    const typeOfCivilServiceControl = this.profileForm.get('civilServiceType');
    const serviceNameControl = this.profileForm.get('civilServiceName');
    const isCadreControl = this.profileForm.get('isCadre');
    const cadreBatchControl = this.profileForm.get('cadreBatch');
    if (typeOfCivilServiceControl && serviceNameControl && isCadreControl && cadreBatchControl) {
      if ((
        typeOfCivilServiceControl.value &&
        serviceNameControl.value &&
        cadreBatchControl.value
      ) || isCadreControl.value) {
        formBody['civilServiceTypeId'] = this.serviceId || '';
        formBody['civilServiceId'] = this.civilServiceId || '';
        formBody['cadreId'] = this.cadreId || '';
        formBody['cadreControllingAuthorityName'] = this.cadreControllingAuthority || '';
      } else {
        formBody['civilServiceType'] = '';
        formBody['civilServiceName'] = '';
        formBody['isCadre'] = false;
        formBody['cadreBatch'] = '';
        formBody['cadreControllingAuthorityName'] = '';
        formBody['civilServiceTypeId'] = '';
        formBody['civilServiceId'] = '';
        formBody['cadreControllingAuthorityName'] = '';
        formBody['cadreBatch'] = '';
      }
    }
    this.dialogRef.close(formBody);
  }

  handleCancel(): void {
    this.dialogRef.close();
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
    const control = this.profileForm.get(controlName);
    return control?.touched && control?.hasError(errorName) || false;
  }

  get canSaveChanges(): boolean {
    if (!this.profileForm || this.initilisationInProgress) {
      return false;
    }
    const isFormValid = this.profileForm.valid;

    switch (this.header) {
      case 'Profile':
        if (isFormValid || this.profileImageChanged) {
          return true
        }
        return false
      case 'Primary Details':
        if (isFormValid) {
          return true
        }
        return false
      case 'About Me':
        if (isFormValid) {
          return true
        }
        return false
      case 'Other Details':
        if (isFormValid && !this.verifyEmail && !this.verifyMobile) {
          return true
        }
        return false
    }
    return true
  }

  get enableEditBtn(): boolean {
    const groupControl = this.profileForm.get('group');
    const designationControl = this.profileForm.get('designation');
    if (groupControl && designationControl) {
      if (
        (groupControl.value && groupControl.value !== _.get(this.profileDetails, 'group', '')) ||
        (designationControl.value && designationControl.value !== _.get(this.profileDetails, 'designation', ''))
      ) {
        return true
      }
    }
    return false
  }

  handleTranslateTo(menuName: string): string {
    return this.profileV2RevampService.handleTranslateTo(menuName)
  }

  openSnackbar(primaryMsg: string, duration: number = 5000) {
    this.snackBar.open(primaryMsg, 'X', {
      duration,
    })
  }

  ngOnDestroy() {
    this.destroySubject$.unsubscribe()
  }
}
