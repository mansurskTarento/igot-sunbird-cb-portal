import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';


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
      private router: Router
    ) {}

    viewCommunity(community: any): void {
      if(community && community.communityId) {
        this.router.navigate(['/app/discussion-forum-v2/community/', community.communityId]);
      }
    }
}
