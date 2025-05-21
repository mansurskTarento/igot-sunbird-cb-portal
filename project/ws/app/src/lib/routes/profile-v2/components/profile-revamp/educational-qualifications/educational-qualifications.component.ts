import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { educationalQualifications } from '../../../models/profile-revamp.model';

@Component({
  selector: 'ws-app-educational-qualifications',
  templateUrl: './educational-qualifications.component.html',
  styleUrls: ['./educational-qualifications.component.scss']
})
export class EducationalQualificationsComponent implements OnInit {
  //#region (global variables)
  @Input() educationalQualificationsList: educationalQualifications[] = []
  @Output() openProfileEntryEditDialog = new EventEmitter();
  //#endregion (global variables)

  constructor() { }

  ngOnInit() { }

  //#region (functions)
  openEditDialog(entry: any = {}): void {
    this.openProfileEntryEditDialog.emit(entry);
  }
  //#endregion (functions)
}
