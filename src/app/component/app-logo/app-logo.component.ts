import { Component, Input, OnInit } from '@angular/core'

@Component({
    selector: 'ws-app-logo',
    templateUrl: './app-logo.component.html',
    styleUrls: ['./app-logo.component.scss'],
    standalone: false
})
export class AppLogoComponent implements OnInit {
  @Input() classList = ''
  @Input() path = ''
  @Input() logoSrc = ''
  constructor() { }

  ngOnInit() {
  }

}
