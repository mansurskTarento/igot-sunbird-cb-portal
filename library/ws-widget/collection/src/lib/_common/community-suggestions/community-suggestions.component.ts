import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { EventService, WsEvents } from '@sunbird-cb/utils-v2';


@Component({
  selector: 'ws-app-community-suggestions',
  templateUrl: './community-suggestions.component.html',
  styleUrls: ['./community-suggestions.component.scss']
})
export class CommunitySuggestionsComponent {
  //#region (global variables)
  @Input() communitySuggestionsList: any[] = [];
  //#endregion

  constructor(
    private router: Router,
    private events: EventService,
  ) { 
  }

  viewCommunity(community: any): void {
    if (community && community.communityId) {
      this.raiseTelemetry(community.communityId)
      this.router.navigate(['/app/discussion-forum-v2/community/', community.communityId]);
    }
  }

  raiseTelemetry(communityId: string) {
    this.events.raiseInteractTelemetry(
      { // edata
        type: WsEvents.EnumInteractTypes.CLICK,
        id: 'comminuty-card'
      },
      {
        id: communityId,
        type: 'Community'
      }, // object details
      { // env
        module: WsEvents.EnumTelemetrymodules.NETWORK,
      })
  }
}
