import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { serviceHistory } from '../../../models/profile-revamp.model';

@Component({
  selector: 'ws-app-service-history',
  templateUrl: './service-history.component.html',
  styleUrls: ['./service-history.component.scss']
})
export class ServiceHistoryComponent implements OnInit {
  //#region (global variables)
  @Input() serviceHistoryList: serviceHistory[] = []
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
