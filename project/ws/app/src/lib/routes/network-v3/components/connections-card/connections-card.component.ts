import { Component, Input, OnInit } from '@angular/core';
import * as _ from 'lodash';

@Component({
  selector: 'ws-app-connections-card',
  templateUrl: './connections-card.component.html',
  styleUrls: ['./connections-card.component.scss']
})
export class ConnectionsCardComponent implements OnInit {
  
  @Input() otherUserProfile: any;
  @Input() currentTab = 'request'
  nameInitials = '';

  ngOnInit(): void {
    this.getInitials();
  }

  getInitials(): void {
    const userName = _.get(this.otherUserProfile, 'firstName', '');
    if (userName) {
      if (userName.split(' ').length > 1) {
        const nameArr = userName.split(' ')
        this.nameInitials = nameArr[0].charAt(0) + nameArr[1].charAt(0)
      } else {
        this.nameInitials = userName.charAt(0)
      }
    }
  }

  acceptRequest() {
    
  }
  

}
