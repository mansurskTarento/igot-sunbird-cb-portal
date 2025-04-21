import { Component, Input, OnInit } from '@angular/core';
import { serviceHistory } from '../../../models/profile-revamp.model';

@Component({
  selector: 'ws-app-service-history',
  templateUrl: './service-history.component.html',
  styleUrls: ['./service-history.component.scss']
})
export class ServiceHistoryComponent implements OnInit {
  //#region (global variables)
  @Input() serviceHistoryList: serviceHistory[] = []
  //#endregion (global variables)

  constructor() { }

  ngOnInit() { }
  
}
