import { Component, Input } from '@angular/core';
import { person } from '../../../models/profile-revamp.model';

@Component({
  selector: 'ws-app-people-suggestions',
  templateUrl: './people-suggestions.component.html',
  styleUrls: ['./people-suggestions.component.scss']
})
export class PeopleSuggestionsComponent {
  //#region (global variables)
  @Input() peopleSuggestionsList: person[] = [];
  //#endregion

  connect(person: person): void {
    person.connectionStatus = 'pending';
  }
}
