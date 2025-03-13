import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import * as _ from 'lodash'

@Component({
  selector: 'ws-app-events-engagement',
  templateUrl: './events-engagement.component.html',
  styleUrls: ['./events-engagement.component.scss']
})
export class EventsEngagementComponent implements OnInit {

  @Input() myEngagements: any
  @Input() engagementDetails: any

  constructor(
    private bottomSheetRef: MatBottomSheetRef<any>,
    @Inject(MAT_BOTTOM_SHEET_DATA) @Optional() public data: any,
  ) {
    if(this.data) {
      this.myEngagements = this.data.engagements
      this.engagementDetails = this.data.engagementDetails
    }
  }

  ngOnInit(): void {
    
  }

  getValue(key: string) : string {
    let value = ''
    if(key && this.engagementDetails) {
      value = _.get(this.engagementDetails, key, '')
    }
    return value
  }

  closeDiaolg() {
    this.bottomSheetRef.dismiss()
  }

}
