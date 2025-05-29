import { Component, Input, OnInit } from '@angular/core';
import { UserStats } from '../../../models/profile-revamp.model';

@Component({
  selector: 'ws-app-user-stats',
  templateUrl: './user-stats.component.html',
  styleUrls: ['./user-stats.component.scss']
})
export class UserStatsComponent implements OnInit {

  //#region (global variables)
  @Input() userStats: UserStats[] = [];
  //#endregion

  constructor() { }

  ngOnInit() {
  }

  viewAll(state: UserStats) {
    if (state.vewAllUrl) {
      console.log('state.vewAllUrl', state.vewAllUrl);
    }
  }

}
