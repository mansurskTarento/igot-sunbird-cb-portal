import { Component } from '@angular/core';

@Component({
  selector: 'ws-app-my-notifications',
  templateUrl: './my-notifications.component.html',
  styleUrls: ['./my-notifications.component.scss']
})
export class MyNotificationsComponent {

  tabs: any[] = [
    { id: 'all', title: 'All', count: 123 },
    { id: 'alerts', title: 'Alerts', count: 10 },
    { id: 'updates', title: 'Updates', count: 23 },
    { id: 'engagement', title: 'Engagement', count: 5 },
    { id: 'promotions', title: 'Promotions', count: 19 },
  ]

}
