import { Component, Input, OnInit } from '@angular/core';
import { educationalQualifications } from '../../../models/profile-revamp.model';

@Component({
  selector: 'ws-app-educational-qualifications',
  templateUrl: './educational-qualifications.component.html',
  styleUrls: ['./educational-qualifications.component.scss']
})
export class EducationalQualificationsComponent implements OnInit {
  //#region (global variables)
  @Input() educationalQualificationsList: educationalQualifications[] = []
  //#endregion (global variables)

  constructor() { }

  ngOnInit() { }
}
