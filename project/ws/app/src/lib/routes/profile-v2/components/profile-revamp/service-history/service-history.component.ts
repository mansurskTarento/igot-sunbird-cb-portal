import { Component, EventEmitter, Inject, Input, OnChanges, OnInit, Output } from '@angular/core';
import { serviceHistory } from '../../../models/profile-revamp.model';
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
  @Input() serviceHistoryList: serviceHistory[] = []
  @Input() isCurrentUser = false;
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
    if(this.serviceHistoryList && this.serviceHistoryList.length > 0) {
      this.formateData();
    } 
  }

  formateData() {
    if(this.serviceHistoryList && this.serviceHistoryList.length > 0) {
      this.serviceHistoryList.forEach((service: any) => {
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
        // service['description'] = 'isCurrentlyWorking something that is not real and is used for practice or to deceive: The device is not a real bomb but a dummy. UK. in some sports, especially football, an act of pretending to kick or hit the ball in a particular direction, in order to deceive the other players. something that is not real and is used for practice or to deceive: The device is not a real bomb but a dummy. UK. in some sports, especially football, an act of pretending to kick or hit the ball in a particular direction, in order to deceive the other players.'
      })
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
