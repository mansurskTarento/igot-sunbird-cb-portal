import { Component } from '@angular/core';
import { routesData } from '../../models/network-v3.model';

@Component({
  selector: 'ws-app-network',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.scss']
})
export class NetworkComponent {

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

}
