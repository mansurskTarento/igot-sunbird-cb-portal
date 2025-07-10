import { Component, OnInit } from '@angular/core';
import { tabDetails } from '../../models/network-v3.model';
import * as _ from 'lodash';
import { MatLegacySnackBar } from '@angular/material/legacy-snack-bar';
import { NetworkingService } from '../../services/networking.service';
import { ActivatedRoute } from '@angular/router';

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
  connectionsList: any = [];
  connectionsLoading = false;
  apiSubscription: any;
  paginationSize = 50;
  paginationSizeOptions = [50, 100, 150, 200];
  paginationPage = 1;
  totalItemsCount = 0;
  defaultPaginationSize = 50;
  noDataMessage = 'No connections found';

  constructor(
    private networkingSvc: NetworkingService,
    private snackBar: MatLegacySnackBar,
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit() {
    this.getParamsData();
  }

  getParamsData() {
    const tab = _.get(this.activatedRoute, 'snapshot.queryParams.tab', 'connections');
    this.selectedTabIndex = this.tabDetailsList.findIndex(tabDetail => tabDetail.key === tab);
    this.initialization(tab);
  }

  initialization(tab = 'connections') {
    const getCount = true;
    this.getConnectionsList(tab === 'connections' ? false : getCount);
    this.getRequestsList(tab === 'request' ? false : getCount);
    this.getSentRequsetsList(tab === 'sent' ? false : getCount);
    this.getBlockedList(tab === 'blocked' ? false : getCount);
  }

  onTabChange(index: number) {
    this.selectedTabIndex = index;
    this.resetPagination();
  }

  resetPagination() {
    this.paginationPage = 1;
    this.paginationSize = 50;
    this.totalItemsCount = 0;
    this.getTabData();
  }

  getTabData() {
    const key = _.get(this.tabDetailsList, `[${this.selectedTabIndex}].key`, '');
    if (this.apiSubscription) {
      this.apiSubscription.unsubscribe();
    }
    switch (key) {
      case 'connections':
        this.getConnectionsList();
        this.noDataMessage = 'No connections found';
        break;
      case 'request':
        this.getRequestsList();
        this.noDataMessage = 'No Requests found';
        break;
      case 'sent':
        this.getSentRequsetsList();
        this.noDataMessage = 'No Requests sent';
        break;
      case 'blocked':
        this.getBlockedList();
        this.noDataMessage = 'No connections found';
        break;
    }
  }

  getConnectionsList(getCount = false) {
    const pageNo = getCount ? 0 : this.paginationPage - 1;
    const pageSize = getCount ? 1 : this.paginationSize;
    if (!getCount) {
      this.connectionsLoading = true;
    }
    this.apiSubscription = this.networkingSvc.getConnections(pageNo, pageSize).subscribe({
      next: (response) => {
        if (!getCount) {
          this.connectionsLoading = false;
          this.totalItemsCount = _.get(response, 'result.count', 0);
          this.connectionsList = _.get(response, 'result.data', []);
        }
        this.setCountOfTab('connections', _.get(response, 'result.count', 0));
      },
      error: () => {
        this.connectionsLoading = false;
        this.connectionsList = [];
        this.openSnackBar('Error while fetching connections', 'X');
      }
    });
  }

  getRequestsList(getCount = false) {
    const pageNo = getCount ? 0 : this.paginationPage - 1;
    const pageSize = getCount ? 1 : this.paginationSize;
    if (!getCount) {
      this.connectionsLoading = true;
    }
    this.apiSubscription = this.networkingSvc.getConnectionRequests(pageNo, pageSize).subscribe({
      next: (response) => {
        if (!getCount) {
          this.connectionsLoading = false;
          this.totalItemsCount = _.get(response, 'result.count', 0);
          this.connectionsList = _.get(response, 'data', []);
        }
        this.setCountOfTab('request', _.get(response, 'count', 0));
      },
      error: () => {
        this.connectionsLoading = false;
        this.connectionsList = [];
        this.openSnackBar('Error while fetching connection requests', 'X');
      }
    });
  }

  getSentRequsetsList(getCount = false) {
    const pageNo = getCount ? 0 : this.paginationPage - 1;
    const pageSize = getCount ? 1 : this.paginationSize;
    if (!getCount) {
      this.connectionsLoading = true;
    }
    this.apiSubscription = this.networkingSvc.getRequestSent(pageNo, pageSize).subscribe({
      next: (response) => {
        if (!getCount) {
          this.connectionsLoading = false;
          this.totalItemsCount = _.get(response, 'result.count', 0);
          this.connectionsList = _.get(response, 'result.data', []);
        }
        this.setCountOfTab('sent', _.get(response, 'result.count', 0));
      },
      error: () => {
        this.connectionsLoading = false;
        this.connectionsList = [];
        this.openSnackBar('Error while fetching sent requests', 'X');
      }
    });
  }

  getBlockedList(getCount = false) {
    const formBody = {
      offset: getCount ? 0 : this.paginationPage - 1,
      size: getCount ? 1 : this.paginationSize
    };
    if (!getCount) {
      this.connectionsLoading = true;
    }
    this.apiSubscription = this.networkingSvc.getBlockedUsers(formBody).subscribe({
      next: (response) => {
        if (!getCount) {
          this.connectionsLoading = false;
          this.totalItemsCount = _.get(response, 'result.count', 0);
          this.connectionsList = _.get(response, 'result.response', []);
        }
        this.setCountOfTab('blocked', _.get(response, 'result.count', 0));
      },
      error: () => {
        this.connectionsLoading = false;
        this.connectionsList = [];
        this.openSnackBar('Error while fetching blocked users', 'X');
      }
    });
  }

  setCountOfTab(tabKey: string, count: number) {
    const tabIndex = this.tabDetailsList.findIndex(tab => tab.key === tabKey);
    if (tabIndex !== -1) {
      this.tabDetailsList[tabIndex]['recordsCount'] = count;
    }
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 3000,
    });
  }

}
