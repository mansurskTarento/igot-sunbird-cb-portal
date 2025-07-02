import { Component, OnInit } from '@angular/core';
import { tabDetails } from '../../models/network-v3.model';
import * as _ from 'lodash';
import { NetworkingService } from '../../services/networking.service';

@Component({
  selector: 'ws-app-connections',
  templateUrl: './connections.component.html',
  styleUrls: ['./connections.component.scss']
})
export class ConnectionsComponent implements OnInit {

  // selectedTabKey = 'connections';
  selectedTabIndex = 0;
  tabDetailsList: tabDetails[] = [
    { lable: 'Connections', key: 'connections', recordsCount: 21 },
    { lable: 'Requests', key: 'request', recordsCount: 32 },
    { lable: 'Sent', key: 'sent', recordsCount: 21 },
    { lable: 'Blocked', key: 'blocked', recordsCount: 2 }
  ]

  connectionsList: any = [
    {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      updatedAt: null,
      fullName: 'Jaydon Franci',
      departmentName: 'Employees State Insurance Post Graduate Institute of Management (ESI PGIM)',
      professionalDetails: [
        {
          profileStatus: 'VERIFIED',
          osid: 'c3153330-2fa0-42ae-bdc2-497f8c47a704',
          designation: 'Director General of Police (DGP) and Commandant General of Police (CGP)',
          organisationType: 'Government',
          group: 'Group A'
        }
      ],
      roles: ['MDO_ADMIN', 'PROGRAM_COORDINATOR', 'PUBLIC'],
      rootOrgId: '0132238763297177601',
      profileImageUrl: 'https://portal.dev.karmayogibharat.net/assets/public/profileImage/1748236292880_profile.png',
      recievedAt: Date.now() - 27 * 1000, // 27 seconds ago
      timeAgo: '27s'
    },
    {
      id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
      updatedAt: null,
      fullName: 'Jaydon Franci',
      departmentName: 'Employees State Insurance Post Graduate Institute of Management (ESI PGIM)',
      professionalDetails: [
        {
          profileStatus: 'VERIFIED',
          osid: 'd4153330-2fa0-42ae-bdc2-497f8c47a705',
          designation: 'Director General of Police (DGP) and Commandant General of Police (CGP)',
          organisationType: 'Government',
          group: 'Group A'
        }
      ],
      roles: ['MDO_ADMIN', 'PROGRAM_COORDINATOR', 'PUBLIC'],
      rootOrgId: '0132238763297177601',
      profileImageUrl: '',
      recievedAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
      timeAgo: '2 days'
    },
    {
      id: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
      updatedAt: null,
      fullName: 'Jaydon Franci',
      departmentName: 'Employees State Insurance Post Graduate Institute of Management (ESI PGIM)',
      professionalDetails: [
        {
          profileStatus: 'VERIFIED',
          osid: 'e5153330-2fa0-42ae-bdc2-497f8c47a706',
          designation: 'Director General of Police (DGP) and Commandant General of Police (CGP)',
          organisationType: 'Government',
          group: 'Group A'
        }
      ],
      roles: ['MDO_ADMIN', 'PROGRAM_COORDINATOR', 'PUBLIC'],
      rootOrgId: '0132238763297177601',
      profileImageUrl: '',
      recievedAt: Date.now() - 45 * 24 * 60 * 60 * 1000, // 1.5 months ago
      timeAgo: '1 month'
    }
  ];

  apiSubscription: any;

  constructor(
    private networkingSvc: NetworkingService
  ) { }

  ngOnInit() {
    // Initialization logic here
  }

  onTabChange(index: number) {
    this.selectedTabIndex = index;
    this.getTabData();
  }

  getTabData() {
    const key = _.get(this.tabDetailsList, `[${this.selectedTabIndex}].key`, '');
    if(this.apiSubscription) {
      this.apiSubscription.unsubscribe();
    }
    switch (key) {
      case 'connections':
        this.getConnectionsList();
        break;
      case 'request':
        this.getRequestsList();
        break;
      case 'sent':
        this.getSentRequsetsList
        break;
      case 'blocked':
        this.getBlockedList();
        break;
    }
  }

  getConnectionsList() {
    const formBody = {}
    this.apiSubscription = this.networkingSvc.getConnections(formBody).subscribe({
      next: (response) => {
        this.connectionsList = _.get(response, 'result.data', []);
      }
    })
  }

  getRequestsList() {
    this.apiSubscription = this.networkingSvc.getConnectionRequests().subscribe({
      next: (response) => {
        this.connectionsList = _.get(response, 'result.data', []);
      }
    })
  }

  getSentRequsetsList() {
    const formBody = {}
    this.apiSubscription = this.networkingSvc.getRequestSent(formBody).subscribe({
      next: (response) => {
        this.connectionsList = _.get(response, 'result.data', []);
      }
    })
  }

  getBlockedList() {
    const formBody = {}
    this.apiSubscription = this.networkingSvc.sendConnectionRequest(formBody).subscribe({
      next: (response) => {
        this.connectionsList = _.get(response, 'result.data', []);
      }
    })
  }

}
