import { Component, OnInit, Inject, ViewChild } from '@angular/core'
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms'
import { UserProfileService } from '../../../user-profile/services/user-profile.service'
import { takeUntil } from 'rxjs/operators'
import { HttpErrorResponse } from '@angular/common/http'
import { Subject } from 'rxjs'
import { NsUserProfileDetails } from '../../../user-profile/models/NsUserProfile'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { ProfileV2Service } from '../../../profile-v2/services/profile-v2.servive'
import { OtpService } from '../../../user-profile/services/otp.services'
import { NPSGridService } from '@sunbird-cb/collection/src/lib/grid-layout/nps-grid.service'
/* tslint:disable */
import _ from 'lodash'


const MOBILE_PATTERN = /^[0]?[6789]\d{9}$/
const PIN_CODE_PATTERN = /^[1-9][0-9]{5}$/
const EMP_ID_PATTERN = /^[a-z0-9]+$/i

@Component({
  selector: 'ws-app-enroll-questionnaire',
  templateUrl: './enroll-questionnaire.component.html',
  styleUrls: ['./enroll-questionnaire.component.scss'],
})
export class EnrollQuestionnaireComponent implements OnInit {
  public afterSubmitAction = this.checkAfterSubmit.bind(this)
  isReadOnly = false
  batchDetails: any
  customForm: boolean = false
  userDetailsForm: UntypedFormGroup
  groupData: any | undefined
  private destroySubject$ = new Subject()
  designationsMeta: any
  eUserGender = Object.keys(NsUserProfileDetails.EUserGender)
  currentDate = new Date()
  masterLanguages: any[] | undefined
  masterLanguageBackup: any[] | undefined
  eCategory = Object.keys(NsUserProfileDetails.ECategory)
  userProfileObject: any
  eligible: boolean = false
  isCadreStatus = false
  showBatchForNoCadre = true
  civilServiceData: any
  civilServiceTypes: any
  serviceName: any
  serviceType: any
  serviceListData: any
  serviceId: any
  errorMessage: any
  selectedServiceName: any
  selectedService: any
  civilServiceName: any
  civilServiceId: any
  cadreId: any
  cadre: any
  cadreControllingAuthority: any
  startBatch: any
  endBatch: any
  yearArray: any
  exclusionYear: any
  selectedCadreName: any
  selectedCadre: any
  verifyMobile: boolean = false
  otpSent: boolean = false
  otpEntered = ''
  mVerified :boolean = false
  @ViewChild('timerDiv', { static: false }) timerDiv !: any
  timeLeft = 150
  interval: any
  showResendOTP = false
  otpForm: UntypedFormGroup
  showname = false
  showDesignation = false
  showGroup = false
  showEmployeeCode = false
  showMobile = false
  showGender = false
  showDob = false
  showCategory = false
  showDecimalMedium = false
  showPinCode = false
  showCadreDetails = false
  updateProfile = false
  pendingFileds: any
  constructor(
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<EnrollQuestionnaireComponent>,
    private userProfileService: UserProfileService,
    private configSrc: ConfigurationsService,
    private profileV2Svc: ProfileV2Service,
    private otpService: OtpService,
    private npsSvc: NPSGridService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { 

    this.batchDetails = this.data.batchData
    this.userDetailsForm = new UntypedFormGroup({
      group: new UntypedFormControl(''),
      designation: new UntypedFormControl(''),
      employeeCode: new UntypedFormControl(''),
      // primaryEmail: new FormControl('', ),
      mobile: new UntypedFormControl(''),
      gender: new UntypedFormControl('', []),
      dob: new UntypedFormControl('', []),
      domicileMedium: new UntypedFormControl(''),
      category: new UntypedFormControl('', []),
      pincode: new UntypedFormControl(''),
      isCadre: new UntypedFormControl(false),
      typeOfCivilService: new UntypedFormControl(''),
      serviceType: new UntypedFormControl(''),
      cadreName: new UntypedFormControl(''),
      cadreBatch: new UntypedFormControl(''),
      cadreControllingAuthority: new UntypedFormControl(''),
    })
    this.getUserDetails()
    this.getPendingDetails()
    this.otpForm = new UntypedFormGroup({
      otp: new UntypedFormControl('', Validators.required)
    })

    if (this.userDetailsForm.get('mobile')) {
      this.userDetailsForm.get('mobile')!.valueChanges
        .subscribe(res => {
          if (res && !this.userProfileObject.profileDetails.personalDetails.phoneVerified) {
            if (MOBILE_PATTERN.test(res)) {
              this.verifyMobile = true
              this.mVerified = false
            } else {
              this.verifyMobile = false
            }
          } else {
            this.verifyMobile = false
          }
        })
    }
  }

  handleGenerateOTP(verifyType?: string): void {
    this.otpService.sendOtp(this.userDetailsForm.value['mobile'])
    .pipe(takeUntil(this.destroySubject$))
    .subscribe((_res: any) => {
      this.snackBar.open(this.handleTranslateTo('otpSentMobile'))
      if (verifyType) {
        this.otpSent = true
        this.startTimer()
        //this.handleVerifyOTP(verifyType, this.userDetailsForm.value['mobile'])
      }
    },         (error: HttpErrorResponse) => {
      if (!error.ok) {
        this.snackBar.open(this.handleTranslateTo('mobileOTPSentFail'))
      }
    })
  }

  handleResendOTP(): void {
    this.timeLeft = 150
    this.showResendOTP =true
    this.startTimer()
    let otpValue$: any
    otpValue$ = this.otpService.resendOtp(this.userDetailsForm.controls['mobile'].value)

    otpValue$.pipe(takeUntil(this.destroySubject$))
      .subscribe((_res: any) => {
        this.snackBar.open(this.handleTranslateTo('otpSentMobile'))
      },         (error: any) => {
        if (!error.ok) {
          this.snackBar.open(_.get(error, 'error.params.errmsg') || 'Unable to resend OTP, please try again later!')
        }
      })
  }

  verifyMobileOTP(): void {
    this.otpService.verifyOTP(this.otpForm.controls['otp'].value, this.userDetailsForm.controls['mobile'].value)
    .pipe(takeUntil(this.destroySubject$))
    .subscribe((_res: any) => {
      this.snackBar.open(this.handleTranslateTo('OTPSentSuccess'))
      this.verifyMobile = true
      this.mVerified = true
      this.otpSent = false
    }, (error: HttpErrorResponse) => {
      if (!error.ok) {
        this.snackBar.open(_.get(error, 'error.params.errmsg') || this.handleTranslateTo('OTPVerifyFailed'))
      }
    })
  }

  startTimer() {
    this.interval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft = this.timeLeft - 1
        if (this.timerDiv) {
          this.timerDiv.nativeElement.innerHTML = `${Math.floor(this.timeLeft / 60)}m: ${this.timeLeft % 60}s`
        }        
      } else {
        clearInterval(this.interval)
        this.showResendOTP = true
      }
    },                          1000)
  }

  public checkAfterSubmit(_e: any) {
    // this.renderSubject.next()
    // tslint:disable-next-line:no-console
    console.log('Form is submitted successfully')
    if (this.batchDetails.batchAttributes.userProfileFileds &&
        this.batchDetails.batchAttributes.userProfileFileds === "Available user filled iGOT profile") {
      this.submitSurevy()
    }
    if (this.batchDetails.batchAttributes.userProfileFileds && !this.updateProfile &&
      (this.batchDetails.batchAttributes.userProfileFileds === "Full iGOT profile" ||
      this.batchDetails.batchAttributes.userProfileFileds === "Custom iGOT profile")) {
      this.submitSurevy()
    }
    this.openSnackbar('Form is submitted successfully')
    this.dialogRef.close(true)
  }

  private openSnackbar(primaryMsg: string, duration: number = 5000) {
    this.snackBar.open(primaryMsg, 'X', {
      duration,
    })
  }

  ngOnInit() {
    this.getGroupData()
    this.loadDesignations()
    this.getMasterLanguage()
    this.fetchCadreData()
  }

  fetchCadreData(){
    this.profileV2Svc.fetchCadre().subscribe((response: any) => {
      this.civilServiceData = response.result.response.value.civilServiceType
      this.civilServiceTypes = this.civilServiceData.civilServiceTypeList.map((service: any) => service.name)
    })
  }

  getIsCadreStatus(value:boolean) {
    this.isCadreStatus = value    
    if(value) {
      this.userDetailsForm.patchValue({
        typeOfCivilService: '',
        serviceType: '',
        cadreName: '',
        cadreBatch: '',
        cadreControllingAuthority: '',
      })
      this.addValidators()
    }
    
    else {
    this.showBatchForNoCadre = false
    this.removeValidators()
    }
  }

  getAllErrors(): string[] {
    const errorMessages: string[] = [];
    Object.keys(this.userDetailsForm.controls).forEach((key) => {
      const controlErrors = this.userDetailsForm.controls[key].errors;
      if (controlErrors) {
        Object.keys(controlErrors).forEach((errorKey) => {
          switch (errorKey) {
            case 'required':
              errorMessages.push(`${key} is required.`);
              break;
            case 'minlength':
              const requiredLength = controlErrors['minlength'].requiredLength;
              errorMessages.push(`${key} must be at least ${requiredLength} characters long.`);
              break;
            case 'email':
              errorMessages.push(`Please enter a valid email address.`);
              break;
            // Add more cases for other validators as needed
          }
        });
      }
    });
    return errorMessages;
  }

  addValidators() {
    const fieldControl = this.userDetailsForm.get('typeOfCivilService')
    if (fieldControl) {
      fieldControl.setValidators([Validators.required]);
      fieldControl.updateValueAndValidity()
    }
    const fieldControl1 = this.userDetailsForm.get('serviceType')
    if (fieldControl1) {
      fieldControl1.setValidators([Validators.required]);
      fieldControl1.updateValueAndValidity()
    }
    const fieldControl2 = this.userDetailsForm.get('cadreName')
    if (fieldControl2) {
      fieldControl2.setValidators([Validators.required]);
      fieldControl2.updateValueAndValidity()
    }
    const fieldControl3 = this.userDetailsForm.get('cadreBatch')
    if (fieldControl3) {
      fieldControl3.setValidators([Validators.required]);
      fieldControl3.updateValueAndValidity()
    }
  }

  removeValidators() {
    const fieldControl = this.userDetailsForm.get('typeOfCivilService')    
    if (fieldControl) {
      fieldControl.clearValidators()
      fieldControl.updateValueAndValidity()
    }
    const fieldControl1 = this.userDetailsForm.get('serviceType')
    if (fieldControl1) {
      fieldControl1.clearValidators()
      fieldControl1.updateValueAndValidity()
    }
    const fieldControl2 = this.userDetailsForm.get('cadreName')
    if (fieldControl2) {
      fieldControl2.clearValidators()
      fieldControl2.updateValueAndValidity()
    }
    const fieldControl3 = this.userDetailsForm.get('cadreBatch')
    if (fieldControl3) {
      fieldControl3.clearValidators()
      fieldControl3.updateValueAndValidity()
    }
  }

  getService(event: any) {
    const serviceTypeControl = this.userDetailsForm.get('serviceType')
    const cadreControl = this.userDetailsForm.get('cadreName')
    const batchControl = this.userDetailsForm.get('cadreBatch')
    const cadreControllingAuthorityControl = this.userDetailsForm.get('cadreControllingAuthority')

    if (serviceTypeControl) { serviceTypeControl.reset() }
    if (cadreControl) { cadreControl.reset() }
    if (batchControl) { batchControl.reset() }
    if (cadreControllingAuthorityControl) { cadreControllingAuthorityControl.reset() }

    this.serviceType = this.civilServiceData.civilServiceTypeList.find((element: any) => element.name === event)
    this.serviceType = this.civilServiceData.civilServiceTypeList.find((element: any) => element.name === event)
    if (this.serviceType) {
      this.serviceListData = this.serviceType.serviceList
      this.serviceName = this.serviceListData.map((service: any) => service.name)
      this.serviceId = this.serviceType.id
      this.errorMessage = ''
    } else {
      this.errorMessage = 'Service Type not found'
    }
  }

  onServiceSelect(event: any) {
    const cadreControl = this.userDetailsForm.get('cadreName')
    const batchControl = this.userDetailsForm.get('cadreBatch')
    const cadreControllingAuthorityControl = this.userDetailsForm.get('cadreControllingAuthority')
    if (cadreControl) { cadreControl.reset() }
    if (batchControl) { batchControl.reset() }
    if (cadreControllingAuthorityControl) { cadreControllingAuthorityControl.reset() }
    this.selectedServiceName = event.value
    if (this.serviceListData) {
      this.selectedService = this.serviceListData.find((service: any) => service.name === this.selectedServiceName)
      this.civilServiceName =  this.selectedService.name
      this.civilServiceId = this.selectedService.id
      this.cadre = this.selectedService.cadreList.map((cadre: any) => cadre.name)
    }
    if (this.selectedService && this.selectedService.cadreControllingAuthority) {
      this.cadreControllingAuthority = this.selectedService.cadreControllingAuthority
    } else {
      this.cadreControllingAuthority = 'NA'
    }
    if (this.selectedService && this.selectedService.cadreList && this.selectedService.cadreList.length === 0) {
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
  }

  onCadreSelect(event: any) {
    const batchControl = this.userDetailsForm.get('cadreBatch')
    const cadreControllingAuthorityControl = this.userDetailsForm.get('cadreControllingAuthority')

    if (batchControl) { batchControl.reset() }
    if (cadreControllingAuthorityControl) { cadreControllingAuthorityControl.reset() }
    this.selectedCadreName = event
    if(this.selectedService) {
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

  getPendingDetails() {
    this.profileV2Svc.fetchApprovalDetails().subscribe((resp: any) => {
      if (resp && resp.result && resp.result.data) {
        this.pendingFileds = resp.result.data
        if (this.pendingFileds.length > 0) {
          this.pendingFileds.forEach((user: any) => {
            if (user['group']) {
              this.userDetailsForm.patchValue({group: user['group']})
            }
            if (user['designation']) {
              this.userDetailsForm.patchValue({designation: user['designation']})
            }
            console.log("userDetailsForm ", this.userDetailsForm)
          })
        }
      }
    })
  }

  getUserDetails(){
    this.profileV2Svc.fetchProfile(this.configSrc.unMappedUser.identifier).subscribe((resp: any) => {
      if (resp && resp.result && resp.result.response) {
        this.userProfileObject = resp.result.response
        this.defineFormAttributes()
      }      
    })
  }

  defineFormAttributes() {
    if (this.batchDetails.batchAttributes.userProfileFileds && 
        (this.batchDetails.batchAttributes.userProfileFileds === "Full iGOT profile" || 
        this.batchDetails.batchAttributes.userProfileFileds === "Custom iGOT profile") && 
        this.batchDetails.batchAttributes.bpEnrolMandatoryProfileFields) {
      let customAttr = this.batchDetails.batchAttributes.bpEnrolMandatoryProfileFields
      if (this.findAttr(customAttr, 'name')) {
        if (!this.findInProfile('name')) {
          this.showname = true
          this.customForm = true
        }
      }
      if (this.findAttr(customAttr, 'group')) {
        if (this.findInProfile('group')) {
          this.showGroup = true
          this.customForm = true
          const fieldControl = this.userDetailsForm.get('group')
          if (fieldControl) {
            fieldControl.setValidators([Validators.required]);
            fieldControl.updateValueAndValidity()
          }
        }
      }
      if (this.findAttr(customAttr, 'designation')) {
        if (this.findInProfile('designation')) {
          this.showDesignation = true
          this.customForm = true
          const fieldControl = this.userDetailsForm.get('designation')
          if (fieldControl) {
            fieldControl.setValidators([Validators.required]);
            fieldControl.updateValueAndValidity()
          }
        }
      }
      if (this.findAttr(customAttr, 'employeeCode')) {
        if (!this.findInProfile('employeeCode')) {
          this.showEmployeeCode = true
          this.customForm = true
          const fieldControl = this.userDetailsForm.get('employeeCode')
          if (fieldControl) {
            fieldControl.setValidators([Validators.pattern(EMP_ID_PATTERN)]);
            fieldControl.updateValueAndValidity()
          }
        }
      }
      if (this.findAttr(customAttr, 'mobile')) {
        if (!this.findInProfile('mobile')) {
          this.showMobile = true
          this.customForm = true
          const fieldControl = this.userDetailsForm.get('mobile')
          if (fieldControl) {
            fieldControl.setValidators([Validators.minLength(10), Validators.maxLength(10), Validators.pattern(MOBILE_PATTERN)]);
            fieldControl.updateValueAndValidity()
          }
        }
      }
      if (this.findAttr(customAttr, 'gender')) {
        if (!this.findInProfile('gender')) {
          this.showGender = true
          this.customForm = true
          const fieldControl = this.userDetailsForm.get('gender')
          if (fieldControl) {
            fieldControl.setValidators([Validators.required]);
            fieldControl.updateValueAndValidity()
          }
        }
      }
      if (this.findAttr(customAttr, 'dob')) {
        if (!this.findInProfile('dob')) {
          this.showDob= true
          this.customForm = true
          const fieldControl = this.userDetailsForm.get('dob')
          if (fieldControl) {
            fieldControl.setValidators([Validators.required]);
            fieldControl.updateValueAndValidity()
          }
        }
      }
      if (this.findAttr(customAttr, 'domicileMedium')) {
        if (!this.findInProfile('domicileMedium')) {
          this.showDecimalMedium = true
          this.customForm = true
          const fieldControl = this.userDetailsForm.get('domicileMedium')
          if (fieldControl) {
            fieldControl.setValidators([Validators.required]);
            fieldControl.updateValueAndValidity()
          }
        }
      }
      if (this.findAttr(customAttr, 'category')) {
        if (!this.findInProfile('category')) {
          this.showCategory= true
          this.customForm = true
          const fieldControl = this.userDetailsForm.get('category')
          if (fieldControl) {
            fieldControl.setValidators([Validators.required]);
            fieldControl.updateValueAndValidity()
          }
        }
      }
      if (this.findAttr(customAttr, 'pinCode')) {
        if (!this.findInProfile('pinCode')) {
          this.showPinCode = true
          this.customForm = true
          const fieldControl = this.userDetailsForm.get('pinCode')
          if (fieldControl) {
            fieldControl.setValidators([Validators.minLength(6), Validators.maxLength(6), Validators.pattern(PIN_CODE_PATTERN)]);
            fieldControl.updateValueAndValidity()
          }
        }
      }
      if (this.findAttr(customAttr, 'cadreDetails')) {
        if (!this.findInProfile('cadreDetails')) {
          this.showCadreDetails = true
          this.customForm = true
          const fieldControl = this.userDetailsForm.get('cadreDetails')
          if (fieldControl) {
            fieldControl.setValidators([Validators.required]);
            fieldControl.updateValueAndValidity()
          }
        }
      }
    }
  }

  findAttr(customAttr: any, fName: any) {
    if(fName === 'name') {
      return customAttr.find((_field: any) => _field.field === 'profileDetails.personalDetails.firstname')
    }
    if(fName === 'group') {
      return customAttr.find((_field: any) => _field.field === 'profileDetails.professionalDetails.group') 
    }
    if(fName === 'designation') {
      return customAttr.find((_field: any) => _field.field === 'profileDetails.professionalDetails.designation') 
    }
    if(fName === 'employeeCode') {
      return customAttr.find((_field: any) => _field.field === 'profileDetails.employmentDetails.employeeCode') 
    }
    if(fName === 'mobile') {
      return customAttr.find((_field: any) => _field.field === 'profileDetails.personalDetails.mobile') 
    }
    if(fName === 'gender') {
      return customAttr.find((_field: any) => _field.field === 'profileDetails.personalDetails.gender') 
    }
    if(fName === 'dob') {
      return customAttr.find((_field: any) => _field.field === 'profileDetails.personalDetails.dob') 
    }
    if(fName === 'domicileMedium') {
      return customAttr.find((_field: any) => _field.field === 'profileDetails.personalDetails.domicileMedium') 
    }
    if(fName === 'category') {
      return customAttr.find((_field: any) => _field.field === 'profileDetails.personalDetails.category') 
    }
    if(fName === 'pinCode') {
      return customAttr.find((_field: any) => _field.field === 'profileDetails.employmentDetails.pinCode') 
    }
    if(fName === 'cadreDetails') {
      return customAttr.find((_field: any) => _field.field === 'profileDetails.cadreDetails.civilServiceTypeName') 
    }
    
  }

  findInProfile(attr: string) {
    if (attr === 'name') {
      return this.userProfileObject.profileDetails.personalDetails.firstName || this.userProfileObject.profileDetails.personalDetails.firstname
    }
    if (attr === 'group') {
      return this.userProfileObject.profileDetails.profileGroupStatus === 'NOT-VERIFIED'
    }
    if (attr === 'designation') {
      return this.userProfileObject.profileDetails.profileDesignationStatus === 'NOT-VERIFIED'
    }
    if (attr === 'employeeCode') {
      return this.userProfileObject.profileDetails.employmentDetails.employeeCode
    }
    if (attr === 'mobile') {
      return this.userProfileObject.profileDetails.personalDetails.mobile && this.userProfileObject.profileDetails.personalDetails.phoneVerified
    }
    if (attr === 'gender') {
      return this.userProfileObject.profileDetails.personalDetails.gender
    }
    if (attr === 'dob') {
      return this.userProfileObject.profileDetails.personalDetails.dob
    }
    if (attr === 'domicileMedium') {
      return this.userProfileObject.profileDetails.personalDetails.domicileMedium
    }
    if (attr === 'category') {
      return this.userProfileObject.profileDetails.personalDetails.category
    }
    if (attr === 'pinCode') {
      return this.userProfileObject.profileDetails.employmentDetails.pinCode
    }
    if (attr === 'cadreDetails') {
      return this.userProfileObject.profileDetails.cadreDetails && this.userProfileObject.profileDetails.cadreDetails.civilServiceTypeName
    }
    
  }

  getGroupData(): void {
    this.userProfileService.getGroups()
      .pipe(takeUntil(this.destroySubject$))
      .subscribe((res: any) => {
        this.groupData = res.result && res.result.response.filter((ele: any) => ele !== 'Others')
      },         (error: HttpErrorResponse) => {
        if (!error.ok) {
          this.snackBar.open(this.handleTranslateTo('groupDataFaile'))
        }
      })
  }

  handleTranslateTo(menuName: string): string {
    return this.userProfileService.handleTranslateTo(menuName)
  }

  loadDesignations() {
    this.userProfileService.getDesignations({}).subscribe(
      (data: any) => {
        this.designationsMeta = data.responseData
      },
      (_err: any) => {
      })
  }

  getMasterLanguage(): void {
    this.userProfileService.getMasterLanguages()
      .pipe(takeUntil(this.destroySubject$))
      .subscribe((res: any) => {
        this.masterLanguages = res.languages
        this.masterLanguageBackup = res.languages
      },         (error: HttpErrorResponse) => {
        if (!error.ok) {
          this.snackBar.open(this.handleTranslateTo('unableFetchMasterLanguageData'))
        }
      })
  }

  handleEmpty(type: string): void {
    if (type === 'mobile') {
      if (!this.userDetailsForm.controls['mobile'].value) {
        this.userDetailsForm.controls['mobile'].setErrors({ valid: false })
      }
    }    
  }


  onSubmitForm(form: any) {
    /* tslint:disable */
    console.log(form)
    let payload = this.generateProfilePayload()
     if (this.updateProfile) {
      this.userProfileService.editProfileDetails(payload).subscribe((res: any) => {
        if (res.responseCode === 'OK') {
        }
      }, error => {
        /* tslint:disable */
        console.log(error)
        this.snackBar.open("something went wrong!")
      })
      this.submitSurevy()
     }
  }

  submitSurevy() {
    let surevyPayload = {
      dataObject: this.genereateSurveyPayload(),
        formId: this.data.surveyId,
        timestamp: new Date().getTime(),
    }
    this.npsSvc.submitBpFormWithProfileDetails(surevyPayload).subscribe((resp: any) => {
      if (resp && resp.statusInfo && resp.statusInfo.statusCode === 200) {
        this.customForm = false
      }
      if (resp && resp.statusCode && resp.statusCode !== 200) {
        this.customForm = false
        this.snackBar.open(resp.errorMessage)
      }
    }, error => {
      /* tslint:disable */
      console.log(error)
      this.snackBar.open("something went wrong!")
    }) 
  }

  generateProfilePayload() {
    let payload: any = {
      request: {
        userId: this.userProfileObject.identifier,
        profileDetails: {
          professionalDetails: [],
          employmentDetails: {},
          personalDetails: {},
          cadreDetails: {},
          //additionalProperties: {}
        }
      }
    }
    let _professionalDetails: any = {}
    if(this.showGroup && this.userDetailsForm.controls['group'].value) {
      _professionalDetails['group'] = this.userDetailsForm.controls['group'].value
      this.updateProfile = true
    }
    if(this.showDesignation && this.userDetailsForm.controls['designation'].value) {
      _professionalDetails['designation'] = this.userDetailsForm.controls['designation'].value
      this.updateProfile = true
    }
    payload.request.profileDetails.professionalDetails.push(_professionalDetails)
    if(this.showEmployeeCode && this.userDetailsForm.controls['employeeCode'].value) {
      payload.request.profileDetails.employmentDetails['employeeCode'] = this.userDetailsForm.controls['employeeCode'].value
      this.updateProfile = true
    }
    if(this.showMobile && this.userDetailsForm.controls['mobile'].value) {
      payload.request.profileDetails.personalDetails['mobile'] = this.userDetailsForm.controls['mobile'].value
      payload.request.profileDetails.personalDetails['phoneVerified'] = true
      this.updateProfile = true
    }
    if(this.showGender && this.userDetailsForm.controls['gender'].value) {
      payload.request.profileDetails.personalDetails['gender'] = this.userDetailsForm.controls['gender'].value
      this.updateProfile = true
    }
    if(this.showDob && this.userDetailsForm.controls['dob'].value) {
      payload.request.profileDetails.personalDetails['dob'] = this.userDetailsForm.controls['dob'].value
      this.updateProfile = true
    }
    if (this.showDecimalMedium && this.userDetailsForm.controls['domicileMedium'].value) {
      payload.request.profileDetails.personalDetails['domicileMedium'] = this.userDetailsForm.controls['domicileMedium'].value
      this.updateProfile = true
    }
    if (this.showCategory && this.userDetailsForm.controls['category'].value) {
      payload.request.profileDetails.personalDetails['category'] = this.userDetailsForm.controls['category'].value
      this.updateProfile = true
    }
    if(this.showPinCode && this.userDetailsForm.controls['pincode'].value) {
      payload.request.profileDetails.employmentDetails['pinCode'] = this.userDetailsForm.controls['pincode'].value
      this.updateProfile = true
    }
    if(this.showCadreDetails && this.userDetailsForm.controls['isCadre'].value) {
      let _cadreDetails: any = {}
      payload.request.profileDetails.personalDetails['isCadre'] = true
      this.updateProfile = true
      _cadreDetails['civilServiceType'] = this.userDetailsForm.controls['typeOfCivilService'].value
      _cadreDetails['civilServiceName'] = this.userDetailsForm.controls['serviceType'].value
      _cadreDetails['cadreName'] = this.userDetailsForm.controls['cadreName'].value
      _cadreDetails['cadreBatch'] = this.userDetailsForm.controls['cadreBatch'].value
      _cadreDetails['cadreControllingAuthorityName'] = this.cadreControllingAuthority
      _cadreDetails['cadreId'] = this.cadreId
      _cadreDetails['civilServiceId'] = this.civilServiceId
      _cadreDetails['civilServiceTypeId'] = this.serviceId
      payload.request.profileDetails.cadreDetails = _cadreDetails
    }
    return payload
  }

  genereateSurveyPayload() {
    let dataObject: any = {}
    this.batchDetails.batchAttributes.bpEnrolMandatoryProfileFields.forEach((_field: any)  => {
      if(_field.field === 'profileDetails.personalDetails.firstname') {
        dataObject[_field.displayName] = this.userProfileObject.profileDetails.personalDetails.firstName || this.userProfileObject.profileDetails.personalDetails.firstname
      }
      if(_field.field === 'profileDetails.employmentDetails.departmentName') {
        dataObject[_field.displayName] = this.userProfileObject.profileDetails.employmentDetails && this.userProfileObject.profileDetails.employmentDetails.departmentName ? 
          this.userProfileObject.profileDetails.employmentDetails.departmentName : "N/A"
      }
      if(_field.field === 'profileDetails.professionalDetails.group') {
        if (this.showGroup) {
          dataObject[_field.displayName] = this.userDetailsForm.controls['group'].value
        } else {
          dataObject[_field.displayName] = this.userProfileObject.profileDetails.professionalDetails && this.userProfileObject.profileDetails.professionalDetails[0].group ?
            this.userProfileObject.profileDetails.professionalDetails[0].group : "N/A"
        }
      }
      if(_field.field === 'profileDetails.professionalDetails.designation') {
        if (this.showDesignation) {
          dataObject[_field.displayName] = this.userDetailsForm.controls['designation'].value
        } else {
          dataObject[_field.displayName] = this.userProfileObject.profileDetails.professionalDetails && this.userProfileObject.profileDetails.professionalDetails[0].designation ?
            this.userProfileObject.profileDetails.professionalDetails[0].designation : "N/A"
        }
      }

      if(_field.field === 'profileDetails.employmentDetails.employeeCode') {
        if (this.showEmployeeCode) {
          dataObject[_field.displayName] = this.userDetailsForm.controls['employeeCode'].value
        } else {
          dataObject[_field.displayName] = this.userProfileObject.profileDetails.employmentDetails && this.userProfileObject.profileDetails.employmentDetails.employeeCode?
            this.userProfileObject.profileDetails.employmentDetails.employeeCode : "N/A"
        }
      }

      if(_field.field === 'profileDetails.personalDetails.primaryEmail') {
        dataObject[_field.displayName] = this.userProfileObject.profileDetails.personalDetails.primaryEmail
      }

      if(_field.field === 'profileDetails.personalDetails.mobile') {
        if (this.showMobile) {
          dataObject[_field.displayName] = this.userDetailsForm.controls['mobile'].value
        } else {
          dataObject[_field.displayName] = this.userProfileObject.profileDetails.personalDetails && this.userProfileObject.profileDetails.personalDetails.mobile?
            this.userProfileObject.profileDetails.personalDetails.mobile : "N/A"
        }
      }

      if(_field.field === 'profileDetails.personalDetails.dob') {
        if (this.showDob) {
          dataObject[_field.displayName] = this.userDetailsForm.controls['dob'].value
        } else {
          if (this.userProfileObject.profileDetails.personalDetails && this.userProfileObject.profileDetails.personalDetails.dob) {
            let _dob: any = this.userProfileObject.profileDetails.personalDetails.dob
            dataObject[_field.displayName] = `${new Date(_dob).getDate()}-${new Date(_dob).getMonth() + 1}-${new Date(_dob).getFullYear()}`
          } else {
            dataObject[_field.displayName] = "N/A"
          }
        }
      }

      if(_field.field === 'profileDetails.personalDetails.gender') {
        if (this.showGender) {
          dataObject[_field.displayName] = this.userDetailsForm.controls['gender'].value
        } else {
          dataObject[_field.displayName] = this.userProfileObject.profileDetails.personalDetails && this.userProfileObject.profileDetails.personalDetails.gender ?
            this.userProfileObject.profileDetails.personalDetails.gender : "N/A"
        }
      }

      if(_field.field === 'profileDetails.personalDetails.domicileMedium') {
        if (this.showDecimalMedium) {
          dataObject[_field.displayName] = this.userDetailsForm.controls['domicileMedium'].value
        } else {
          dataObject[_field.displayName] = this.userProfileObject.profileDetails.personalDetails && this.userProfileObject.profileDetails.personalDetails.domicileMedium ?
            this.userProfileObject.profileDetails.personalDetails.domicileMedium : "N/A"
        }
      }

      if(_field.field === 'profileDetails.personalDetails.category') {
        if (this.showCategory) {
          dataObject[_field.displayName] = this.userDetailsForm.controls['category'].value
        } else {
          dataObject[_field.displayName] = this.userProfileObject.profileDetails.personalDetails && this.userProfileObject.profileDetails.personalDetails.category ? 
          this.userProfileObject.profileDetails.personalDetails.category : "N/A"
        }
      }

      if(_field.field === 'profileDetails.employmentDetails.pinCode') {
        if (this.showCategory) {
          dataObject[_field.displayName] = this.userDetailsForm.controls['pincode'].value
        } else {
          dataObject[_field.displayName] = this.userProfileObject.profileDetails.employmentDetails && this.userProfileObject.profileDetails.employmentDetails.pinCode ?
          this.userProfileObject.profileDetails.employmentDetails.pinCode : "N/A"
        }
      }

      if(_field.field === 'profileDetails.cadreDetails') {
        if (this.showCadreDetails && this.userDetailsForm.controls['isCadre'].value) {
          dataObject[_field.displayName] = this.userDetailsForm.controls['isCadre'].value
        } else {
          dataObject[_field.displayName] = this.userProfileObject.profileDetails && this.userProfileObject.profileDetails.cadreDetails ? 'yes' : 'No'
        }
      }
      if(_field.field === 'profileDetails.cadreDetails.civilServiceTypeName') {
        if (this.showCadreDetails && this.userDetailsForm.controls['isCadre'].value) {
          dataObject[_field.displayName] = this.userDetailsForm.controls['typeOfCivilService'].value
        } else {
          dataObject[_field.displayName] = this.userProfileObject.profileDetails.cadreDetails && this.userProfileObject.profileDetails.cadreDetails.civilServiceType ?
            this.userProfileObject.profileDetails.cadreDetails.civilServiceType : 'N/A'
        }
      }

      if(_field.field === 'profileDetails.cadreDetails.civilServiceName') {
        if (this.showCadreDetails && this.userDetailsForm.controls['isCadre'].value) {
          dataObject[_field.displayName] = this.userDetailsForm.controls['serviceType'].value
        } else {
          dataObject[_field.displayName] = this.userProfileObject.profileDetails.cadreDetails && this.userProfileObject.profileDetails.cadreDetails.civilServiceName ?
            this.userProfileObject.profileDetails.cadreDetails.civilServiceName : 'N/A'
        }
      }

      if(_field.field === 'profileDetails.cadreDetails.cadreName') {
        if (this.showCadreDetails && this.userDetailsForm.controls['isCadre'].value) {
          dataObject[_field.displayName] = this.userDetailsForm.controls['cadreName'].value
        } else {
          dataObject[_field.displayName] = this.userProfileObject.profileDetails.cadreDetails  && this.userProfileObject.profileDetails.cadreDetails.cadreName ?
            this.userProfileObject.profileDetails.cadreDetails.cadreName : 'N/A'
        }
      }
      if(_field.field === 'profileDetails.cadreDetails.cadreBatch') {
        if (this.showCadreDetails && this.userDetailsForm.controls['isCadre'].value) {
          dataObject[_field.displayName] = this.userDetailsForm.controls['cadreBatch'].value
        } else {
          dataObject[_field.displayName] = this.userProfileObject.profileDetails.cadreDetails && this.userProfileObject.profileDetails.cadreDetails.cadreBatch ?
            this.userProfileObject.profileDetails.cadreDetails.cadreBatch : 'N/A'
        }
      }

      if(_field.field === 'profileDetails.cadreDetails.cadreControllingAuthorityName') {
        if (this.showCadreDetails && this.userDetailsForm.controls['isCadre'].value) {
          dataObject[_field.displayName] = this.cadreControllingAuthority
        } else {
          dataObject[_field.displayName] = this.userProfileObject.profileDetails.cadreDetails && this.userProfileObject.profileDetails.cadreDetails.cadreControllingAuthorityName ?
            this.userProfileObject.profileDetails.cadreDetails.cadreControllingAuthorityName : 'N/A'
        }
      }

      if(_field.field === 'profileDetails.additionalProperties.externalSystemId') {
        if (this.userProfileObject.profileDetails.additionalProperties && 
            this.userProfileObject.profileDetails.additionalProperties.externalSystemId) {
          dataObject[_field.displayName] = this.userProfileObject.profileDetails.additionalProperties && this.userProfileObject.profileDetails.additionalProperties.externalSystemId
            ? this.userProfileObject.profileDetails.additionalProperties.externalSystemId : "N/A"
        } else {
          dataObject[_field.displayName] = 'N/A'
        }
      }

      if(_field.field === 'profileDetails.additionalProperties.externalSystemDor') {
        if (this.userProfileObject.profileDetails.additionalProperties &&
            this.userProfileObject.profileDetails.additionalProperties.externalSystemDor) {
          dataObject[_field.displayName] = this.userProfileObject.profileDetails.additionalProperties && this.userProfileObject.profileDetails.additionalProperties.externalSystemDor
            ? this.userProfileObject.profileDetails.additionalProperties.externalSystemDor : "N/A"
        } else {
          dataObject[_field.displayName] = 'N/A'
        }
      }
    })

    return dataObject
  }

}
