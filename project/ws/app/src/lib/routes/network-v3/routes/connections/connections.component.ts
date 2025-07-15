import { Component, OnInit } from '@angular/core';
import { connectionUpdates, tabDetails } from '../../models/network-v3.model';
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
    { lable: 'Connections', key: 'Approved', recordsCount: 0 },
    { lable: 'Requests', key: 'Requested', recordsCount: 0 },
    { lable: 'Sent', key: 'Pending', recordsCount: 0 },
    { lable: 'Blocked', key: 'Blocked', recordsCount: 0 }
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
  allStatesList = ['Approved', 'Requested', 'Pending', 'Blocked'];
  satesListToGetCount: string[] = [];

  constructor(
    private networkingSvc: NetworkingService,
    private snackBar: MatLegacySnackBar,
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit() {
    this.getParamsData();
  }

  getParamsData() {
    const tab = _.get(this.activatedRoute, 'snapshot.queryParams.tab', 'Approved');
    this.selectedTabIndex = this.tabDetailsList.findIndex(tabDetail => tabDetail.key === tab);
    this.initialization();
  }

  initialization() {
    this.getTabData();
    this.getConnectionsCount();
  }

  getConnectionsCount() {
    const formBody = {
      request: {
        filter: {
          status: this.satesListToGetCount && this.satesListToGetCount.length ? this.satesListToGetCount : this.allStatesList
        },
        facets: [
          "status"
        ]
      }
    }

    this.networkingSvc.getConnectionsCount(formBody).subscribe({
      next: (response) => {
        if(response) {
          const facets = _.get(response, 'result.facets[0].values', []);
          const responseMap = new Map(facets.map((item: any) => [item.name.toLowerCase(), item.count]));
          this.satesListToGetCount = [];
          this.tabDetailsList.forEach(tab => {
            const count = responseMap.get(tab.key.toLowerCase()) as number;
            if (count !== undefined && count !== null) {
              tab.recordsCount = count as number;
            } else if (this.satesListToGetCount.indexOf(tab.key) > -1) {
              tab.recordsCount = 0;
            }
            if(tab.key === 'Requested') {
              const connectionsUpdate: connectionUpdates = {
                routeId: 'connections',
                showUpdate: count > 0 ? true : false
              }
              this.networkingSvc.sendConnectionUpdates(connectionsUpdate);
            }
          });
        }
      }
    })
  }

  onTabChange(index: number) {
    this.selectedTabIndex = index;
    this.resetPagination();
    if(this.satesListToGetCount && this.satesListToGetCount.length) {
      this.getConnectionsCount();
    }
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
      case 'Approved':
        this.getConnectionsList();
        this.noDataMessage = 'No connections found';
        break;
      case 'Requested':
        this.getRequestsList();
        this.noDataMessage = 'No Requests found';
        break;
      case 'Pending':
        this.getSentRequsetsList();
        this.noDataMessage = 'No Requests sent';
        break;
      case 'Blocked':
        this.getBlockedList();
        this.noDataMessage = 'No connections found';
        break;
    }
  }

  getConnectionsList() {
    const pageNo = this.paginationPage - 1;
    const pageSize = this.paginationSize;
    this.connectionsLoading = true;
    this.apiSubscription = this.networkingSvc.getConnections(pageNo, pageSize).subscribe({
      next: (response) => {
        this.connectionsLoading = false;
        this.totalItemsCount = _.get(response, 'result.count', 0);
        this.connectionsList = _.get(response, 'result.data', []);
      },
      error: () => {
        this.connectionsLoading = false;
        this.connectionsList = [];
        this.openSnackBar('Error while fetching connections', 'X');
      }
    });
  }

  getRequestsList() {
    const pageNo = this.paginationPage - 1;
    const pageSize = this.paginationSize;
    this.connectionsLoading = true;
    this.apiSubscription = this.networkingSvc.getConnectionRequests(pageNo, pageSize).subscribe({
      next: (response) => {
          this.connectionsLoading = false;
          this.totalItemsCount = _.get(response, 'result.count', 0);
          this.connectionsList = _.get(response, 'data', []);
      },
      error: () => {
        this.connectionsLoading = false;
        this.connectionsList = [];
        this.openSnackBar('Error while fetching connection requests', 'X');
      }
    });
  }

  getSentRequsetsList() {
    const pageNo = this.paginationPage - 1;
    const pageSize = this.paginationSize;
    this.connectionsLoading = true;
    this.apiSubscription = this.networkingSvc.getRequestSent(pageNo, pageSize).subscribe({
      next: (response) => {
          this.connectionsLoading = false;
          this.totalItemsCount = _.get(response, 'result.count', 0);
          this.connectionsList = _.get(response, 'result.data', []);
      },
      error: () => {
        this.connectionsLoading = false;
        this.connectionsList = [];
        this.openSnackBar('Error while fetching sent requests', 'X');
      }
    });
  }

  getBlockedList() {
    const formBody = {
      offset: this.paginationPage - 1,
      size: this.paginationSize
    };
    this.connectionsLoading = true;
    this.apiSubscription = this.networkingSvc.getBlockedUsers(formBody).subscribe({
      next: (response) => {
        this.connectionsLoading = false;
        this.totalItemsCount = _.get(response, 'result.count', 0);
        this.connectionsList = _.get(response, 'result.response', []);
      },
      error: () => {
        this.connectionsLoading = false;
        this.connectionsList = [];
        this.openSnackBar('Error while fetching blocked users', 'X');
      }
    });
  }

  setSatesListGet(stateList: string[]) {
    const set = new Set(this.satesListToGetCount);
    stateList.forEach(state => set.add(state));
    this.satesListToGetCount = Array.from(set);
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 3000,
    });
  }

}
