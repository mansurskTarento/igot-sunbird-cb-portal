import { Component, Input } from '@angular/core';
import { Community } from '../../../models/profile-revamp.model';

@Component({
  selector: 'ws-app-recommended-communities',
  templateUrl: './recommended-communities.component.html',
  styleUrls: ['./recommended-communities.component.scss']
})
export class RecommendedCommunitiesComponent {
  //#region (global variables)
  @Input() recommendedCommunities: Community[] = [];
  //#endregion (global variables)

  constructor() { }

}
