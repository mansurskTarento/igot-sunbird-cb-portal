import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
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
    @Inject(MAT_BOTTOM_SHEET_DATA) @Optional() public data: any,
    // private bottomSheetRef: MatBottomSheetRef<any>
  ) {
    if(this.data) {
      this.myEngagements = this.data
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

}
