import { Component, OnInit } from '@angular/core';
import { routesData } from '../../models/network-v3.model';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
// import { ConfigurationsService } from '@sunbird-cb/utils-v2';


@Component({
  selector: 'ws-app-network',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.scss']
})
export class NetworkComponent implements OnInit {

  //#region (global variables)
  communitySuggestionsList: any[] = [];
  navigationItems: routesData[] = [
    {
      name: 'Explore Network',
      navigationUrl: '/app/network-v2/home',
      routeId: 'home',
      icon: 'person_search'
    },
    {
      name: 'Updates',
      navigationUrl: '/app/network-v2/updates',
      routeId: 'updates',
      icon: 'mark_unread_chat_alt'
    },
    {
      name: 'Connections',
      navigationUrl: '/app/network-v2/connections',
      routeId: 'connections',
      icon: 'groups'
    },
    {
      name: 'Recommendations',
      navigationUrl: '/app/network-v2/recommendations',
      routeId: 'recommendations',
      icon: 'star'
    },
    {
      name: 'Mentors',
      navigationUrl: 'mentors',
      routeId: 'mentors',
      icon: 'supervisor_account'
    }
  ]
  userDetails: any = {};
  //#endregion (global variables)

  constructor(
    private activatedRoute: ActivatedRoute,
    // private configSvc: ConfigurationsService,
  ) { }

  //#region (initialization)
  ngOnInit() {
    this.getDetailsFromRoutes();
  }

  getDetailsFromRoutes() {
    this.activatedRoute.data.subscribe(data => {
      if (_.get(data, 'recamendedCommunity.data')) {
        this.patchRecamendedCommunity(_.get(data, 'recamendedCommunity.data'))
        this.patchProfileDetails(_.get(data, 'profileDetails.data'))
      }
    })
  }
  patchRecamendedCommunity(communities: any) {
    this.communitySuggestionsList = communities
  }

  patchProfileDetails(profileDetails: any) {
    this.userDetails = profileDetails;
  }
    
  //#endregion (initialization)


}
