import { Component, Input } from '@angular/core';

@Component({
  selector: 'ws-app-events-engagement',
  templateUrl: './events-engagement.component.html',
  styleUrls: ['./events-engagement.component.scss']
})
export class EventsEngagementComponent {

  @Input() engagementDetails: any

}
