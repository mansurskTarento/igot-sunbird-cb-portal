import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatLegacyDialogRef, MAT_LEGACY_DIALOG_DATA, MatLegacyDialog } from '@angular/material/legacy-dialog';
import * as _ from 'lodash';
import { HttpErrorResponse } from '@angular/common/http';
import { MatLegacySnackBar } from '@angular/material/legacy-snack-bar';
import { debounceTime, distinctUntilChanged, startWith, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { EMAIL_PATTERN, EMP_ID_PATTERN, MOBILE_PATTERN, PIN_CODE_PATTERN, state } from '../../models/profile-revamp.model';
import { ProfileV2RevampService } from '../../services/profile-v2-revamp.service';
import { ConfirmDialogComponent } from '@sunbird-cb/collection/src/lib/_common/confirm-dialog/confirm-dialog.component'
import { OtpService } from '../../../user-profile/services/otp.services';
import { VerifyOtpComponent } from '../../components/verify-otp/verify-otp.component'
import { NsUserProfileDetails } from '../../../user-profile/models/NsUserProfile'
import { DatePipe } from '@angular/common';
import { ImageCropComponent } from '@sunbird-cb/utils-v2';
import { NotificationComponent } from '@ws/author/src/lib/modules/shared/components/notification/notification.component'
import { IMAGE_MAX_SIZE, PROFILE_IMAGE_SUPPORT_TYPES } from '@ws/author/src/lib/constants/upload'
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
  userInitials = '';
  statesList: state[] = [];
  districtsList: string[] = [];

  groupsList: any[] = [];
  designationsMeta: any[] = [];
  filterDesignationsMeta: any = []
  isLoadingMoreDesignations = false;
  desigantionFilterEnable = false
  designationListLoadCount = 50
  designationDefaultLoadCount = 50

  verifyEmail: boolean = false;
  verifyMobile: boolean = false;
  approvedDomainList: any = []
  private destroySubject$ = new Subject()
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
  civilServiceData: any[] = []
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
    @Inject(MAT_LEGACY_DIALOG_DATA) private data: any,
    private profileV2RevampService: ProfileV2RevampService,
    private snackBar: MatLegacySnackBar,
    private otpService: OtpService,
    private dialog: MatLegacyDialog,
    private datePipe: DatePipe
  ) {
    this.header = _.get(this.data, 'header', '');
    this.profileDetails = _.get(this.data, 'profileDetails', {});
    this.profileImage = _.get(this.data, 'profileImage', null);
    this.groupsList = _.get(this.data, 'groupsList', []);
    this.designationsMeta = _.get(this.data, 'designationsMeta', []);
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
      firstname: [_.get(this.profileDetails, 'firstname', ''), Validators.required],
      state: [_.get(this.profileDetails, 'state', ''), Validators.required],
      district: [_.get(this.profileDetails, 'district', ''), Validators.required]
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
  
      if (file.size > IMAGE_MAX_SIZE) {
        this.snackBar.openFromComponent(NotificationComponent, {
          data: {
            type: Notify.PROFILE_IMG_SIZE_ERROR,
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
            reader.onload = (e: any) => {
              this.profileImage = e.target.result;
            };
            reader.readAsDataURL(result);
          }
        },
      })
    }
  uploadImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      this.handleUploadProfileImg(file);
      // if (file) {
      //   const reader = new FileReader();
      //   reader.onload = (e: any) => {
      //     this.profileImage = e.target.result;
      //   };
      //   reader.readAsDataURL(file);
      // }
    };
    input.click();
  }

  deleteImage() {
    this.profileImage = null;
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
      searchDesignationControl.valueChanges
        .pipe(
          debounceTime(250),
          distinctUntilChanged(),
          startWith(''),
        )
        .subscribe(searchText => {
          if (searchText) {
            this.desigantionFilterEnable = true
            this.filterDesignationsMeta = this.designationsMeta.filter((val: any) =>
              val && val.name.trim().toLowerCase().includes(searchText && searchText.toLowerCase())
            )
          } else {
            this.filterDesignationsMeta = this.designationsMeta.slice(0, this.designationDefaultLoadCount)
            this.desigantionFilterEnable = false
            this.designationListLoadCount = this.designationDefaultLoadCount;
            this.checkCurrentDesignationPresent()
          }
        })

      if(_.get(this.profileDetails, 'designation', '')){
        searchDesignationControl.setValue(_.get(this.profileDetails, 'designation', ''));
      }
      setTimeout(() => {
        const designationControl = this.profileForm.get('designation');
        if (designationControl) {
          designationControl.setValue(_.get(this.profileDetails, 'designation', ''));
        }
      }, 10)
    }
  }

  setupScrollListener(opened: boolean): void {
    const searchDesignationControl = this.profileForm.get('searchDesignation');
    if (opened && searchDesignationControl) {
      searchDesignationControl.setValue('')
      this.desigantionFilterEnable = false
      this.designationListLoadCount = this.designationDefaultLoadCount;
      this.filterDesignationsMeta = this.designationsMeta.slice(0, this.designationDefaultLoadCount);
      setTimeout(() => {
        const searchInput = document.querySelector('.search-input') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);
      this.checkCurrentDesignationPresent()
      // Wait for the panel to be rendered in the DOM
      setTimeout(() => {
        // Find the panel element
        const panel = document.querySelector('.mat-select-panel');
        if (panel) {
          // Add scroll event listener to the panel
          panel.addEventListener('scroll', this.onDesignationSelectScroll.bind(this));
        }
      }, 100);
    }
  }

  onDesignationSelectScroll(event: any): void {
    const element = event.target;

    if (!this.desigantionFilterEnable) {
      // Check if user has scrolled to the bottom (with a small threshold)
      if (element.scrollTop + element.clientHeight >= element.scrollHeight - 5) {
        // Only load more if not already loading and if there are potentially more items
        if (!this.isLoadingMoreDesignations && this.designationsMeta.length > this.filterDesignationsMeta.length) {
          this.isLoadingMoreDesignations = true;

          // Increase the load count by designationDefaultLoadCount
          this.designationListLoadCount += this.designationDefaultLoadCount;

          // Update the filtered list with more items
          setTimeout(() => {
            this.filterDesignationsMeta = this.designationsMeta.slice(0, this.designationListLoadCount);
            this.checkCurrentDesignationPresent()
            this.isLoadingMoreDesignations = false;
          }, 500); // Small timeout to simulate loading and prevent multiple triggers
        }
      }
    }
  }

  checkCurrentDesignationPresent() {

    // Get the current designation value
    const searchDesignationControl = this.profileForm.get('designation');
    const currentDesignation = searchDesignationControl ? searchDesignationControl.value : '';
    // Check if current designation exists in the list
    if (currentDesignation) {
      const designationExists = this.filterDesignationsMeta.some(
        (designation: any) => designation.name.toLowerCase() === currentDesignation.toLowerCase()
      );

      // If designation doesn't exist in the list, add it
      if (!designationExists) {
        // Create a new designation object to match the structure of other items
        const newDesignation = {
          name: currentDesignation,
          // Add any other required properties matching your data structure
          id: 'custom-' + Date.now(),
          status: 'Active'
        };
        // Make sure the custom designation appears in the filtered list
        if (this.filterDesignationsMeta.length >= this.designationListLoadCount) {
          // Replace the last item with the new one to maintain the same number of items
          this.filterDesignationsMeta.pop();
        }
        this.filterDesignationsMeta.unshift(newDesignation);
      }
    }
  }

  onDesignationDropdownClosed(): void {
    // Keep the designation value but clear the search input
    const currentDesignation = this.profileForm.get('designation')!.value;
    setTimeout(() => {
      if (this.profileForm.get('searchDesignation')) {
        this.profileForm.get('searchDesignation')!.setValue('');
      }
      // Ensure the designation value remains selected
      if (currentDesignation) {
        const designationControl = this.profileForm.get('designation');
        if (designationControl) {
          designationControl.setValue(currentDesignation);
        }
      }
    }, 100);
  }

  // #endregion (end of primary details)

  private createAboutMeForm(): void {
    this.profileForm = this.fb.group({
      aboutme: [_.get(this.profileDetails, 'aboutme', ''), [Validators.maxLength(2000), Validators.pattern(/^[a-zA-Z0-9\s.,'-]*$/)]]
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
      if (this.profileForm.valid) {
        const profileData = this.profileForm.value;
        if (this.profileImage) {
          profileData['profileImageUrl'] = this.profileImage;
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
        if (isFormValid || this.profileImage) {
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

  private openSnackbar(primaryMsg: string, duration: number = 5000) {
    this.snackBar.open(primaryMsg, 'X', {
      duration,
    })
  }

  ngOnDestroy() {
    this.destroySubject$.unsubscribe()
  }
}
