import { Component, EventEmitter, Inject, Input, OnChanges, OnInit, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_LEGACY_DIALOG_DATA, MatLegacyDialogRef } from '@angular/material/legacy-dialog';
import { ProfileV2RevampService } from '../../../services/profile-v2-revamp.service';
import * as _ from 'lodash';
import { MatLegacySnackBar } from '@angular/material/legacy-snack-bar';

@Component({
  selector: 'ws-app-service-history',
  templateUrl: './service-history.component.html',
  styleUrls: ['./service-history.component.scss'],
  providers: [DatePipe]
})
export class ServiceHistoryComponent implements OnInit, OnChanges {
  //#region (global variables)
  @Input() serviceHistoryList: any[] = []
  @Input() isCurrentUser = false;
  @Input() currentDesignation = '';
  @Input() currentOrgName = '';
  @Output() openProfileEntryEditDialog = new EventEmitter();

  userId: string = '';
  isPopup: boolean = false;
  //#endregion (global variables)

  constructor(
    private datePipe: DatePipe,
    private dialogRef: MatLegacyDialogRef<ServiceHistoryComponent>,
        @Inject(MAT_LEGACY_DIALOG_DATA) private data: any,
    private profileV2RevampSvc: ProfileV2RevampService,
    private snackBar: MatLegacySnackBar,
  ) { 
    if (this.data && this.data.userId) {
      this.userId = data.userId;
      this.isPopup = true
      this.isCurrentUser = data.isCurrentUser || false;
      this.currentDesignation = data.currentDesignation || '';
      this.currentOrgName = data.currentOrgName || '';
    }
  }

  ngOnInit() {
    if(this.isPopup) {
      this.getServiceHistoryList();
    }
   }

  getServiceHistoryList() {
    if (this.userId) {
      this.profileV2RevampSvc.fetchProfileEntries(this.userId, 'serviceHistory').subscribe((res: any) => {
        if (res) {
          this.serviceHistoryList = _.get(res, 'result.response.serviceHistory', []);
          this.formateData();
        }
      }, (err: any) => {
        if(err) {
          this.openSnackbar('something went wrong while fetching service history please try again later', 5000);
        }
      });
    }
  }

  ngOnChanges() { 
    if(this.serviceHistoryList) {
      this.formateData();
    } 
  }

  formateData() {
    if(this.serviceHistoryList) {
      let hasCurrentOrgDetails = false
      this.serviceHistoryList.forEach((service: any) => {
        if(service.orgName === this.currentOrgName && service.designation === this.currentDesignation) {
          service['isCurrentOrgDetails'] = true
          hasCurrentOrgDetails = true
        }
        const orgDetails = `${service?.orgName}, ${service?.orgDistrict}, ${service?.orgState}`
        const startDate = service.startDate ? new Date(service.startDate) : null
        let endDate = service.currentlyWorking === 'true' ? null : service.endDate ? new Date(service.endDate) : null
        const formatedStartDate = startDate ? this.datePipe.transform(startDate, 'MMM yyyy') : ''
        const formatedEndDate = endDate ? this.datePipe.transform(endDate, 'MMM yyyy') : 'Present'
        endDate = endDate ? endDate : new Date()
        const yearGap = startDate ? endDate.getFullYear() - startDate.getFullYear() : 0
        service['orgDetails'] = orgDetails
        service['period'] = `${formatedStartDate} - ${formatedEndDate} - ${yearGap} year${yearGap === 1 ? 's' : ''}`
        service['showMore'] = false;
      })
      if(!hasCurrentOrgDetails) {
        const orgDetails: any = {
          orgName: this.currentOrgName,
          orgLogo: '',
          designation: this.currentDesignation,
          isCurrentOrgDetails: true,
          orgDetails: this.currentOrgName,
        }
        if(this.serviceHistoryList && this.serviceHistoryList.length > 0) {
          this.serviceHistoryList.unshift(orgDetails)
        } else {
          this.serviceHistoryList = [orgDetails]
        }

        if(!this.isPopup && this.serviceHistoryList && this.serviceHistoryList.length > 2) {
          this.serviceHistoryList = this.serviceHistoryList.slice(0, 2)
        }
      }
    } 
  }
  
  //#region (functions)
  openEditDialog(entry: any = {}): void {
    if(this.isPopup) { 
      this.dialogRef.close(entry);
    } else {
      this.openProfileEntryEditDialog.emit(entry);
    }
  }

  closePopup(): void {
    if(this.isPopup) {
      this.dialogRef.close();
    }
  }

  openSnackbar(primaryMsg: string, duration: number = 5000) {
    this.snackBar.open(primaryMsg, 'X', {
      duration,
    })
  }
  //#endregion (functions)
  
}
