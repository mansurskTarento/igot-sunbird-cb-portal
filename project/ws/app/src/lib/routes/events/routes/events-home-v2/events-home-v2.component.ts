import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'ws-app-events-home-v2',
  templateUrl: './events-home-v2.component.html',
  styleUrls: ['./events-home-v2.component.scss']
})
export class EventsHomeV2Component implements OnInit {
  isFullScreen: boolean = false

  constructor(
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isFullScreen = event.url.includes('home/do_')
      }
    })
  }

}
