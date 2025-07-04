import { Component, Input, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { NetworkingService } from '../../services/networking.service';
import { HttpErrorResponse } from '@angular/common/http';
import { MatLegacySnackBar } from '@angular/material/legacy-snack-bar';
import { ConfigurationsService, NsUser } from '@sunbird-cb/utils-v2';

@Component({
  selector: 'ws-app-connections-card',
  templateUrl: './connections-card.component.html',
  styleUrls: ['./connections-card.component.scss']
})
export class ConnectionsCardComponent implements OnInit {
  
  @Input() otherUserProfile: any;
  @Input() currentTab = 'request'
  @Input() showBorder = true;
  nameInitials = '';
  currentUserDetails: NsUser.IUserProfile | null = null;

  constructor(
    private networkingSvc: NetworkingService,
    private snackBar: MatLegacySnackBar,
    private configSvc: ConfigurationsService
  ) { }

  ngOnInit(): void {
    this.getInitials();
    this.getCurrentUserDetails();
  }

  getInitials(): void {
    const userName = _.get(this.otherUserProfile, 'fullName', '');
    if (userName) {
      if (userName.split(' ').length > 1) {
        const nameArr = userName.split(' ')
        this.nameInitials = nameArr[0].charAt(0) + nameArr[1].charAt(0)
      } else {
        this.nameInitials = userName.charAt(0)
      }
    }
  }

  getCurrentUserDetails() {
    this.currentUserDetails = this.configSvc.userProfileV2;
  }

  copyProfile() {
  }

  acceptRequest() {
    
  }

  updateConnection(action: string | 'Approved' | 'Rejected' | 'Withdrawn' | 'Unblocked' | 'Removed') {
    if(this.otherUserProfile && this.currentUserDetails) {
      const formBody = {
        connectionId: this.otherUserProfile.id || this.otherUserProfile.identifier || this.otherUserProfile.wid,
        userIdFrom: this.currentUserDetails.userId,
        userNameFrom: this.currentUserDetails.firstName,
        userDepartmentFrom: this.currentUserDetails.departmentName,
        userIdTo: this.otherUserProfile.id,
        userNameTo: this.otherUserProfile.fullName,
        userDepartmentTo: this.otherUserProfile.departmentName,
        status: action
      }
      this.otherUserProfile['connectionStatus'] = action // need to remove when apis working
      this.networkingSvc.updateConnectionRequest(formBody).subscribe({
        next: (response) => {
          if (response) {
            this.otherUserProfile['connectionStatus'] = action
          }
        },
        error: (error: HttpErrorResponse) => {
          if(error) {
            this.openSnackbar('Something went wrong please try again')
          }
        }
      })
    }
  }
  
  openSnackbar(primaryMsg: string, duration: number = 5000) {
    this.snackBar.open(primaryMsg, 'X', {
      duration,
    })
  }

}
