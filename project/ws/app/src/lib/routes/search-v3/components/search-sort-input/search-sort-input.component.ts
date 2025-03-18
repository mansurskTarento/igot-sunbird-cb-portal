import { Component, EventEmitter, Output } from '@angular/core';
import { SEARCH_SORT_DROPDOWN } from '@ws/author/src/lib/constants/constant';

@Component({
  selector: 'ws-app-search-sort-input',
  templateUrl: './search-sort-input.component.html',
  styleUrls: ['./search-sort-input.component.scss'],
})
export class SearchSortInputComponent {
  @Output() searchSorter = new EventEmitter();
  selectedOption = 'most_relevant';
  options = SEARCH_SORT_DROPDOWN;

  onChange(event: Event): void {
    this.selectedOption = (event.target as HTMLSelectElement).value;
    this.searchSorter.emit(this.selectedOption);
  }
}
