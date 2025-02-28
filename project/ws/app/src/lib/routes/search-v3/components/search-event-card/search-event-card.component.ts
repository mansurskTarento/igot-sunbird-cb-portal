import { Component } from '@angular/core';

@Component({
  selector: 'ws-app-search-event-card',
  templateUrl: './search-event-card.component.html',
  styleUrls: ['./search-event-card.component.scss'],
})
export class SearchEventCardComponent {
  content: any;
  contentBookmarked = false;
}
