import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatLegacyDialogRef, MAT_LEGACY_DIALOG_DATA } from '@angular/material/legacy-dialog';
import * as _ from 'lodash';
import { EMAIL_PATTERN, EMP_ID_PATTERN, MOBILE_PATTERN, PIN_CODE_PATTERN } from '../../models/profile-revamp.model';

@Component({
  selector: 'ws-app-prfile-edit-v2',
  templateUrl: './prfile-edit-v2.component.html',
  styleUrls: ['./prfile-edit-v2.component.scss']
})

export class PrfileEditV2Component implements OnInit {
  header: string = '';
  profileDetials: any;

  profileForm!: FormGroup ;
  
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatLegacyDialogRef<PrfileEditV2Component>,
    @Inject(MAT_LEGACY_DIALOG_DATA) private data: any
  ) {
    this.header = _.get(this.data, 'header', '');
    this.profileDetials = _.get(this.data, 'profileDetails', {});
  }

  //#region (intialization)
  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    switch (this.header) {
      case 'Profile':
        this.createProfileForm();
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

  private createProfileForm(): void {
    this.profileForm = this.fb.group({
      name: [_.get(this.data, 'name', ''), Validators.required],
      state: [_.get(this.data, 'state', ''), Validators.required],
      district: [_.get(this.data, 'district', ''), Validators.required]
    });
  }

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
      mobile: ['', [Validators.minLength(10), Validators.maxLength(10), Validators.pattern(MOBILE_PATTERN)]],
      gender: ['', []],
      dob: ['', []],
      domicileMedium: ['', []],
      countryCode: ['', []],
      pincode: ['', [Validators.minLength(6), Validators.maxLength(6), Validators.pattern(PIN_CODE_PATTERN)]],
      category: ['', []],
      isCadre: [false, []],
      typeOfCivilService: [''],
      serviceType: [''],
      cadre: [''],
      batch: [''],
      cadreControllingAuthority: [''],
    });
  }
  //#endregion (end of initialization)

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
}
