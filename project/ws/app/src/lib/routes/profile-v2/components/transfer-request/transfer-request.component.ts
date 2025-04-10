import { Component, OnInit, Inject, OnDestroy, Output, EventEmitter } from '@angular/core'
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog'
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms'
import { HttpErrorResponse } from '@angular/common/http'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'

// import { Observable, Subject } from 'rxjs'
import { debounceTime, distinctUntilChanged, startWith, takeUntil } from 'rxjs/operators'

import { UserProfileService } from '../../../user-profile/services/user-profile.service'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { Subject } from 'rxjs'

@Component({
  selector: 'ws-transfer-request',
  templateUrl: './transfer-request.component.html',
  styleUrls: ['./transfer-request.component.scss'],
})

export class TransferRequestComponent implements OnInit, OnDestroy {

  @Output() enableWithdraw = new EventEmitter<boolean>()
  transferRequestForm = new UntypedFormGroup({
    organization: new UntypedFormControl('', [Validators.required]),
    group: new UntypedFormControl('', [Validators.required]),
    designation: new UntypedFormControl('', [Validators.required]),
    searchDesignation: new UntypedFormControl(''),
  })
  departmentData: any[] = []
  otherDetails = false
  deptFilterData: any[] = []
  // deptFilterData  : Observable<string[]>
  designationData: any[] = []
  private destroySubject$ = new Subject()
  isInValidOrgSelection = false
  onLoad = true
  designationListLoadCount = 50
  designationDefaultLoadCount =  50
  isLoadingMoreDesignations = false;
  desigantionFilterEnable = false

  constructor(
    public dialogRef: MatDialogRef<TransferRequestComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private userProfileService: UserProfileService,
    private matSnackBar: MatSnackBar,
    private configService: ConfigurationsService
  ) {
    if (this.data.portalProfile.professionalDetails && this.data.portalProfile.professionalDetails.length) {
      this.transferRequestForm.controls.group.setValue(this.data.portalProfile.professionalDetails[0].group)
      this.transferRequestForm.controls.designation.setValue(this.data.portalProfile.professionalDetails[0].designation || '')
    }
    if (this.data.portalProfile.employmentDetails) {
      this.transferRequestForm.controls.organization.setValue(this.data.portalProfile.employmentDetails.departmentName)
    }

    this.transferRequestForm.get('organization')!.valueChanges
      .subscribe((value: string) => {
        if (value !== this.data && this.data.portalProfile &&  this.data.portalProfile.employmentDetails
           && this.data.portalProfile.employmentDetails.departmentName) {
          this.otherDetails = true
        } else {
          this.otherDetails = false
        }
      })

    if (this.transferRequestForm.get('organization')) {
      this.transferRequestForm.get('organization')!.valueChanges
        .pipe(
          debounceTime(250),
          distinctUntilChanged(),
          startWith(''),
        )
        .subscribe(res => {
          if (res) {
            this.deptFilterData = this.departmentData &&
             this.departmentData.filter(item => item.toLowerCase().includes(res && res.toLowerCase()))
             const orgSearchVal = this.transferRequestForm.controls['organization']
             if (this.deptFilterData && this.deptFilterData.length && this.deptFilterData.length > 0) {
              orgSearchVal.setErrors(null)
             } else {
            orgSearchVal.setErrors({ invalidSelection: true })
             }
          } else {
            this.deptFilterData = this.departmentData
          }
        })
    }
    if (this.transferRequestForm.get('searchDesignation')) {
      this.transferRequestForm.get('searchDesignation')!.valueChanges
        .pipe(
          debounceTime(250),
          distinctUntilChanged(),
          startWith(''),
        )
        .subscribe(res => {
          if (res) {
            const designonData = this.data && this.data.designationsMeta
            this.designationData = designonData.filter((val: any) =>
              val && val.name.trim().toLowerCase().includes(res && res.toLowerCase())
            )
            const designationSearchVal = this.transferRequestForm.controls['designation']
            if (this.designationData && this.designationData.length && this.designationData.length > 0) {
              designationSearchVal.setErrors(null)
             } else {
            designationSearchVal.setErrors({ invalidSelection: true })
             }
          } else {
            this.designationData = this.data &&  this.data.designationsMeta.slice(0, this.designationDefaultLoadCount);
            this.checkCurrentDesignationPresent()
           }
        })
    }
  }

  ngOnInit() {
    this.getAllDeptData()

  }

  handleCloseModal(): void {
    this.dialogRef.close()
  }

  organizationSearch(value: string) {
    const filterVal = value.toLowerCase()
    return this.departmentData.filter(option => option.toLowerCase().includes(filterVal))
  }

  searchOrg(value: any) {
    if (value && value.length) {
      this.departmentData = this.organizationSearch(value)
    } else {
      this.getAllDeptData()
    }
  }

  handleSubmitRequest(): void {
    if (this.transferRequestForm.valid) {
    const data: any = {
      'name': this.transferRequestForm.value['organization'],
      'designation': this.transferRequestForm.value['designation'],
      'group': this.transferRequestForm.value['group'],
    }
    const postData: any = {
      'request': {
        'userId': this.configService.unMappedUser.id,
        'employmentDetails': {
          'departmentName': this.transferRequestForm.value['organization'],
        },
        'profileDetails': {
          'professionalDetails': [],
        },
      },
    }
    postData.request.profileDetails.professionalDetails.push(data)
    this.userProfileService.editProfileDetails(postData)
      .pipe(takeUntil(this.destroySubject$))
      .subscribe((_res: any) => {
        this.matSnackBar.open('Your transfer request has been sent for approval')
        // this.matSnackBar.open(this.handleTranslateTo('transferRequestSent'))
        this.enableWithdraw.emit(true)
        this.handleCloseModal()
      },         (error: HttpErrorResponse) => {
        if (!error.ok) {
          this.matSnackBar.open(this.handleTranslateTo('transferRequestFailed'))
        }
      })
    }
  }

  getAllDeptData(): void {
    this.userProfileService.getAllDepartments()
      .pipe(takeUntil(this.destroySubject$))
      .subscribe((res: any) => {
        this.departmentData = res.sort((a: any, b: any) => {
          return a.toLowerCase().localeCompare(b.toLowerCase())
        })
      },         (error: HttpErrorResponse) => {
        if (!error.ok) {
          this.matSnackBar.open(this.handleTranslateTo('orgFetchDataFailed'))
        }
      })
  }

  handleTranslateTo(menuName: string): string {
    return this.userProfileService.handleTranslateTo(menuName)
  }

  ngOnDestroy(): void {
    this.destroySubject$.unsubscribe()
  }

  assignValue(): void {
    if (this.onLoad) {
      this.deptFilterData = this.departmentData
      this.onLoad = false
    }
  }


  checkCurrentDesignationPresent() {
       
    // Get the current designation value
    const currentDesignation = this.transferRequestForm.get('designation')!.value;
    // Check if current designation exists in the list
    if (currentDesignation) {
      const designationExists = this.designationData.some(
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
        if (this.designationData.length >= this.designationListLoadCount) {
          // Replace the last item with the new one to maintain the same number of items
          this.designationData.pop();
        }
        this.designationData.unshift(newDesignation);
      }
    }
  }

  setupScrollListener(opened: boolean): void {
    if (opened) {
      this.desigantionFilterEnable = false
      this.designationListLoadCount = this.designationDefaultLoadCount; // Reset the load count
      this.designationData = this.data.designationsMeta.slice(0, this.designationDefaultLoadCount);

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
    
    if(!this.desigantionFilterEnable){
      // Check if user has scrolled to the bottom (with a small threshold)
      if (element.scrollTop + element.clientHeight >= element.scrollHeight - 5) {
        // Only load more if not already loading and if there are potentially more items
        if (!this.isLoadingMoreDesignations && this.data.designationsMeta.length > this.designationData.length) {
          this.isLoadingMoreDesignations = true;
          
          // Increase the load count by designationDefaultLoadCount
          this.designationListLoadCount += this.designationDefaultLoadCount;
          
          // Update the filtered list with more items
          setTimeout(() => {
            this.designationData = this.data.designationsMeta.slice(0, this.designationListLoadCount);
            this.checkCurrentDesignationPresent()
            this.isLoadingMoreDesignations = false;
          }, 500); // Small timeout to simulate loading and prevent multiple triggers
        }
      }
    }
  }
}
