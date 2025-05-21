import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { achievement } from '../../../models/profile-revamp.model';

@Component({
  selector: 'ws-app-achievements',
  templateUrl: './achievements.component.html',
  styleUrls: ['./achievements.component.scss']
})
export class AchievementsComponent implements OnInit {
  //#region (global variables)
  @Input() achievementsList: achievement[] = [];
    @Output() openProfileEntryEditDialog = new EventEmitter();
  //#endregion
  constructor() { }

  ngOnInit() { }

  //#region (functions)
  openEditDialog(entry: any = {}): void {
    this.openProfileEntryEditDialog.emit(entry);
  }
  //#endregion (functions)

}
