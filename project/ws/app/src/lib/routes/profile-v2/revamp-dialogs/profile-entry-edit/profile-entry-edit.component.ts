import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatLegacyDialogRef, MAT_LEGACY_DIALOG_DATA } from '@angular/material/legacy-dialog';
import * as _ from 'lodash';

@Component({
  selector: 'ws-app-profile-entry-edit',
  templateUrl: './profile-entry-edit.component.html',
  styleUrls: ['./profile-entry-edit.component.scss']
})
export class ProfileEntryEditComponent implements OnInit {
  header: string = '';
  entryDetails: any;
  entryForm!: FormGroup;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatLegacyDialogRef<ProfileEntryEditComponent>,
    @Inject(MAT_LEGACY_DIALOG_DATA) private data: any
  ) {
    this.header = _.get(this.data, 'header', '');
    this.entryDetails = _.get(this.data, 'profileDetails', {});
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
        this.createEducationalQualificationsForm();
        break;
      case 'Achievements':
        this.createAchievementsForm();
        break;
    }
  }

  private createServiceHistoryForm(): void {
    this.entryForm = this.fb.group({
      organisation: [_.get(this.data, 'organisation', ''), [Validators.required]],
      designation: [_.get(this.data, 'designation', ''), [Validators.required]],
      state: [_.get(this.data, 'state', ''), [Validators.required]],
      district: [_.get(this.data, 'district', ''), [Validators.required]],
      startDate: [_.get(this.data, 'startDate', ''), [Validators.required]],
      endDate: [_.get(this.data, 'endDate', ''), [Validators.required]],
      currentlyWorking: [_.get(this.data, 'currentlyWorking', false)],
      description: [_.get(this.data, 'description', ''), [Validators.maxLength(1000)]],
    });
  }

  private createEducationalQualificationsForm(): void {
    this.entryForm = this.fb.group({
      degree: [_.get(this.data, 'degree', ''), [Validators.required]],
      fieldOfStudy: [_.get(this.data, 'fieldOfStudy', ''), [Validators.required]],
      instituteName: [_.get(this.data, 'instituteName', ''), [Validators.required]],
      startYear: [_.get(this.data, 'startYear', ''), [Validators.required]],
      endYear: [_.get(this.data, 'endYear', ''), [Validators.required]],
    });
  }

  private createAchievementsForm(): void {
    this.entryForm = this.fb.group({
      title: [_.get(this.data, 'title', ''), [Validators.required]],
      issuingOrganisation: [_.get(this.data, 'issuingOrganisation', '')],
      issueDate: [_.get(this.data, 'issueDate', '')],
      uploadUrl: [_.get(this.data, 'uploadUrl', '')],
      url: [_.get(this.data, 'url', '')],
      description: [_.get(this.data, 'description', ''), [Validators.maxLength(1000)]],
    });
  }
  //#endregion (intialization)

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
    return control?.touched && control?.hasError(errorName) || false;
  }

  handleCancel(): void {
    this.dialogRef.close();
  }
}
