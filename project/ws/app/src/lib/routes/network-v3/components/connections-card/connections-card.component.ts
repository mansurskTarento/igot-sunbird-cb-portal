import { Component, Input, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { NetworkingService } from '../../services/networking.service';
import { HttpErrorResponse } from '@angular/common/http';
import { MatLegacySnackBar } from '@angular/material/legacy-snack-bar';

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

  constructor(
    private networkingSvc: NetworkingService,
    private snackBar: MatLegacySnackBar
  ) { }

  ngOnInit(): void {
    this.getInitials();
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

  acceptRequest() {
    
  }

  updateConnection(formBody: any) {
    this.networkingSvc.updateConnectionRequest(formBody).subscribe({
      next: (response) => {
        if (response) {
          
        }
      },
      error: (error: HttpErrorResponse) => {
        this.openSnackbar('Something went wrong please try again')
      }
    })
  }
  
  openSnackbar(primaryMsg: string, duration: number = 5000) {
    this.snackBar.open(primaryMsg, 'X', {
      duration,
    })
  }

}
