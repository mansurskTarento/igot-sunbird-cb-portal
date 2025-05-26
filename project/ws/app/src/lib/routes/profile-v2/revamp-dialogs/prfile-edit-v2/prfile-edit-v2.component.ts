import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatLegacyDialogRef, MAT_LEGACY_DIALOG_DATA } from '@angular/material/legacy-dialog';
import * as _ from 'lodash';
import { EMAIL_PATTERN, EMP_ID_PATTERN, MOBILE_PATTERN, PIN_CODE_PATTERN, state } from '../../models/profile-revamp.model';
import { ProfileV2RevampService } from '../../services/profile-v2-revamp.service';
import { HttpErrorResponse } from '@angular/common/http';
import { MatLegacySnackBar } from '@angular/material/legacy-snack-bar';

@Component({
  selector: 'ws-app-prfile-edit-v2',
  templateUrl: './prfile-edit-v2.component.html',
  styleUrls: ['./prfile-edit-v2.component.scss']
})

export class PrfileEditV2Component implements OnInit {
  header: string = '';
  profileDetails: any;
  profileForm!: FormGroup ;
  profileImage: string | null = null;
  userInitials: string = '';
  statesList: state[] = [];
  districtsList: string[] = [];
  
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatLegacyDialogRef<PrfileEditV2Component>,
    @Inject(MAT_LEGACY_DIALOG_DATA) private data: any,
    private profileV2RevampService: ProfileV2RevampService,
    private snackBar: MatLegacySnackBar,
  ) {
    this.header = _.get(this.data, 'header', '');
    this.profileDetails = _.get(this.data, 'profileDetails', {});
    this.profileImage = _.get(this.data, 'profileImage', null);
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
    this.profileForm = this.fb.group({
      firstname: [_.get(this.data, 'firstname', ''), Validators.required],
      state: [_.get(this.data, 'state', ''), Validators.required],
      district: [_.get(this.data, 'district', ''), Validators.required]
    });
  }

  getInitials(): void {
      const userName = _.get(this.data, 'firstname', '');
      if(userName) {
        if( userName.split(' ').length > 1) {
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
        if(_.get(this.data, 'state', '')) {
          const stateControl = this.profileForm ? this.profileForm.get('state') : null;
          if(stateControl) {
            stateControl.patchValue(_.get(this.data, 'state', ''));
          }
          this.getDistrictsList(_.get(this.data, 'state', ''));
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
        this.districtsList = res;
        const districtControl = this.profileForm ? this.profileForm.get('district') : null;
        if(districtControl) {
          if (isFirstTime) {
            districtControl.patchValue(_.get(this.data, 'district', ''));
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
  uploadImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.profileImage = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

  deleteImage() {
    this.profileImage = null;
  }
  //#endregion (end of profile image)
  //#endregion (profile)

  private createPrimaryDetailsForm(): void {
    this.profileForm = this.fb.group({
      group: [_.get(this.data, 'group', ''), Validators.required],
      designation: [_.get(this.data, 'designation', ''), Validators.required],
      searchDesignation: [_.get(this.data, 'searchDesignation', ''), Validators.required],
    });
  }

  private createAboutMeForm(): void {
    this.profileForm = this.fb.group({
      about: [_.get(this.data, 'about', '')]
    });
  }

  private createOtherDetailsForm(): void {
    this.profileForm = this.fb.group({
      employeeCode: ['', [Validators.pattern(EMP_ID_PATTERN)]],
      primaryEmail: ['', [Validators.pattern(EMAIL_PATTERN)]],
      gender: ['', []],
      dob: ['', []],
      category: ['', []],
      pinCode: ['', [Validators.minLength(6), Validators.maxLength(6), Validators.pattern(PIN_CODE_PATTERN)]],
      mobile: ['', [Validators.minLength(10), Validators.maxLength(10), Validators.pattern(MOBILE_PATTERN)]],
      domicileMedium: ['', []],
      externalSystemId: ['', []],
      retirementDate: ['', []],
      isCadreStatus: ['', []],
      typeOfCivilService: ['', []],
      serviceType: ['', []],
      cadre: ['', []],
      cadreBatch: ['', []]
    });
  }

  handleSubmit(): void {
    if (this.profileForm) {
      if (this.profileForm.valid) {
        this.dialogRef.close(this.profileForm.value);
      } else {
        this.markFormGroupTouched(this.profileForm);
      }
    }
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

  private openSnackbar(primaryMsg: string, duration: number = 5000) {
    this.snackBar.open(primaryMsg, 'X', {
      duration,
    })
  }
}
