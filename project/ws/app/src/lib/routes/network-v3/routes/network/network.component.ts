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
      imageUrl: './assets/icons/person_search.svg'
    },
    // {
    //   name: 'Updates',
    //   navigationUrl: '/app/network-v2/updates',
    //   routeId: 'updates',
    //   imageUrl: './assets/icons/update.svg'
    // },
    {
      name: 'Connections',
      navigationUrl: '/app/network-v2/connections',
      routeId: 'connections',
      imageUrl: './assets/icons/connection.svg'
    },
    // {
    //   name: 'Recommendations',
    //   navigationUrl: '/app/network-v2/recommendations',
    //   routeId: 'recommendations',
    //   icon: 'groups',
    //   queryParams: { pageSize: 20 }
    //   // imageUrl: './assets/icons/.svg'
    // },
    {

      name: 'Recommendations',
      navigationUrl: 'recommendations/all',
      routeId: 'recommendations',
      icon: 'groups',
      queryParams: { pageSize: 50, offset: 0, type: 'peopleYouMayKnow' }
      // imageUrl: './assets/icons/.svg'
    },
    {
      name: 'Mentors',
      navigationUrl: 'mentors',
      routeId: 'mentors',
      imageUrl: './assets/icons/FRAC_dictionaries.svg',
      queryParams: { pageSize: 50, offset: 0 }
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
      }
      if (_.get(data, 'profileDetails.data')) {
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
