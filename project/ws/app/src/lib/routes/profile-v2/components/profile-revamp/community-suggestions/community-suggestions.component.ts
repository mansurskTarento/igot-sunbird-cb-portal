import { Component, Input } from '@angular/core';

@Component({
  selector: 'ws-app-community-suggestions',
  templateUrl: './community-suggestions.component.html',
  styleUrls: ['./community-suggestions.component.scss']
})
export class CommunitySuggestionsComponent {
  //#region (global variables)
    @Input() communitySuggestionsList: any[] = [];
    //#endregion

    viewCommunity(community: any): void {
      if(community) {}
    }
}
