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
    { lable: 'Connections', key: 'connections', recordsCount: 0 },
    { lable: 'Requests', key: 'request', recordsCount: 0 },
    { lable: 'Sent', key: 'sent', recordsCount: 0 },
    { lable: 'Blocked', key: 'blocked', recordsCount: 0 }
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
  paginationSize = 50;
  paginationSizeOptions = [50, 100, 150, 200];
  paginationPage = 0;
  totalItemsCount = 500;

  constructor(
    private networkingSvc: NetworkingService
  ) { }

  ngOnInit() {
    this.initialization();
  }

  initialization() {
    const getCount = true;
    this.getConnectionsList(getCount);
    this.getRequestsList(getCount);
    this.getSentRequsetsList(getCount);
    this.getBlockedList(getCount);
  }

  onTabChange(index: number) {
    this.selectedTabIndex = index;
    this.resetPagination();
  }

  resetPagination() {
    this.paginationPage = 0;
    this.paginationSize = 50;
    this.totalItemsCount = 0;
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
        this.getSentRequsetsList();
        break;
      case 'blocked':
        this.getBlockedList();
        break;
    }
  }

  getConnectionsList(getCount = false) {
    const pageNo = getCount ? 0 : this.paginationPage;
    const pageSize = getCount ? 1 : this.paginationSize;
    this.apiSubscription = this.networkingSvc.getConnections(pageNo, pageSize).subscribe({
      next: (response) => {
        this.connectionsList = _.get(response, 'result.data', []);
        this.setCountOfTab('connections', _.get(response, 'result.count', 0));
        if(!getCount) {
          this.totalItemsCount = _.get(response, 'result.count', 0) 
        }
      }
    })
  }

  getRequestsList(getCount = false) {
    const pageNo = getCount ? 0 : this.paginationPage;
    const pageSize = getCount ? 1 : this.paginationSize;
    this.apiSubscription = this.networkingSvc.getConnectionRequests(pageNo, pageSize).subscribe({
      next: (response) => {
        this.connectionsList = _.get(response, 'data', []);
        this.setCountOfTab('request', _.get(response, 'count', 0));
        if(!getCount) {
          this.totalItemsCount = _.get(response, 'result.count', 0) 
        }
      }
    })
  }

  getSentRequsetsList(getCount = false) {
    const pageNo = getCount ? 0 : this.paginationPage;
    const pageSize = getCount ? 1 : this.paginationSize;
    this.apiSubscription = this.networkingSvc.getRequestSent(pageNo, pageSize).subscribe({
      next: (response) => {
        this.connectionsList = _.get(response, 'result.data', []);
        this.setCountOfTab('sent', _.get(response, 'result.count', 0));
        if(!getCount) {
          this.totalItemsCount = _.get(response, 'result.count', 0) 
        }
      }
    })
  }

  getBlockedList(getCount = false) {
    const formBody = {
      offset: getCount ? 0 : this.paginationPage,
      size: getCount ? 1 : this.paginationSize
    }
    this.apiSubscription = this.networkingSvc.getBlockedUsers(formBody).subscribe({
      next: (response) => {
        this.connectionsList = _.get(response, 'result.response', []);
        this.setCountOfTab('blocked', _.get(response, 'result.count', 0));
        if(!getCount) {
          this.totalItemsCount = _.get(response, 'result.count', 0) 
        }
      }
    })
  }

  setCountOfTab(tabKey: string, count: number) {
    const tabIndex = this.tabDetailsList.findIndex(tab => tab.key === tabKey);
    if (tabIndex !== -1) {
      this.tabDetailsList[tabIndex]['recordsCount'] = count;
    }
  }

}
