import { Component, Input, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { HttpErrorResponse } from '@angular/common/http';
import { MatLegacySnackBar } from '@angular/material/legacy-snack-bar';
import { ConfigurationsService, NsUser } from '@sunbird-cb/utils-v2';
import { Router } from '@angular/router';
import { NetworkingService } from '../../services/networking.service';
import { MatLegacyDialog } from '@angular/material/legacy-dialog';
import { ConfirmationDialogComponent } from '@sunbird-cb/consumption'

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
    private snackBar: MatLegacySnackBar,
    private router: Router,
    private configSvc: ConfigurationsService,
    private networkingSvc: NetworkingService,
    private dialog: MatLegacyDialog,
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
    if (this.otherUserProfile && this.otherUserProfile.id) {
      const userId = this.otherUserProfile.id
      const url = `${window.location.origin}/app/person-profile/${userId}#profileInfo`
      navigator.clipboard.writeText(url).then(() => {
        this.openSnackbar('Profile link copied to clipboard')
      }).catch(() => {
        this.openSnackbar('Failed to copy link')
      })
    }
  }

  viewProfile() {
    if(this.otherUserProfile && this.otherUserProfile.id) {
      const userId = this.otherUserProfile.id
      this.router.navigate(['/app/person-profile', (userId)], { fragment: 'profileInfo' })
    }
  }

  openConformationPopup(action: string | 'Approved' | 'Rejected' | 'Withdrawn' | 'Unblocked' | 'Removed') {
    let message = ''
    switch(action) {
    case 'Rejected':
      message = 'Are you sure you want to ignore this request?'
      break;
    case 'Withdrawn':
      message = 'Are you sure you want to withdraw this request?'
      break;
    case 'Removed':
      message = 'Are you sure you want to remove this connection?'
      break;
    case 'Unblocked':
      message = 'Are you sure you want to unblock this user?'
      break;
    }
    if(message) {
      const dialgoData = {
        description: message,
        iconName: 'info',
        type: 'warning',
        buttonsPositionClass: 'justify-center items-center',
        buttons: [
          {
            classes: 'btn-out-line',
            text: 'No',
            response: false
          },
          {
            classes: 'succes-button',
            text: 'yes',
            response: true
          }
        ]
      }
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        data: dialgoData,
        disableClose: true,
        width: '400px',
        maxWidth: '90vw'
      })
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.updateConnection(action)
        }
      })
    } else {
      this.updateConnection(action)
    }
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
      this.otherUserProfile['connectionStatus'] = 'progress'
      this.networkingSvc.updateConnectionRequest(formBody).subscribe({
        next: (response) => {
          if (response) {
            this.otherUserProfile['connectionStatus'] = action
          }
        },
        error: (error: HttpErrorResponse) => {
          if(error) {
            this.otherUserProfile['connectionStatus'] = ''
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
