import { Component, Input, OnInit } from '@angular/core';
import { achievement } from '../../../models/profile-revamp.model';

@Component({
  selector: 'ws-app-achievements',
  templateUrl: './achievements.component.html',
  styleUrls: ['./achievements.component.scss']
})
export class AchievementsComponent implements OnInit {
  //#region (global variables)
  @Input() achievementsList: achievement[] = [];
  //#endregion
  constructor() { }

  ngOnInit() { }

}
