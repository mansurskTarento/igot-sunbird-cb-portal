import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ViewChild,
} from '@angular/core';
import {
  SEARCH_SORT_DROPDOWN,
  SEARCH_SORT_PEOPLES,
} from '../../../../../../../author/src/lib/constants/constant';
import { SearchCategory, SortType } from '../../models/search-v3.model';

@Component({
  selector: 'ws-app-search-sort-input',
  templateUrl: './search-sort-input.component.html',
  styleUrls: ['./search-sort-input.component.scss'],
})
export class SearchSortInputComponent implements AfterViewInit, OnChanges {
  @Output() searchSorter = new EventEmitter();
  @Input() category!: string;
  selectedOption: string = SortType.MostRelevent;
  options = SEARCH_SORT_DROPDOWN;

  @ViewChild('sortSelect') sortSelect!: ElementRef;

  constructor() {}

  ngOnChanges(): void {
    if (this.category === SearchCategory.People) {
      this.options = SEARCH_SORT_PEOPLES;
      this.selectedOption = SortType.Ascending;
    } else if(this.category === SearchCategory.Communities || this.category === SearchCategory.Events) {
      this.options = SEARCH_SORT_DROPDOWN.filter((option) => option.value !== SortType.HighestRated);
      this.selectedOption = SortType.MostRelevent;
    } else {
      this.options = SEARCH_SORT_DROPDOWN;
      this.selectedOption = SortType.MostRelevent;
    }
  }
  ngAfterViewInit() {
    // this.adjustSelectWidth();
  }

  onChange(event: Event): void {
    this.selectedOption = (event.target as HTMLSelectElement).value;
    this.searchSorter.emit(this.selectedOption);
    // this.adjustSelectWidth();
  }

  adjustSelectWidth() {
    setTimeout(() => {
      const select = this.sortSelect.nativeElement;
      const selectedOption = select.options[select.selectedIndex];
      const tempSpan = document.createElement('span');

      tempSpan.style.font = window.getComputedStyle(select).font;
      tempSpan.style.visibility = 'hidden';
      tempSpan.style.position = 'absolute';
      tempSpan.textContent = selectedOption.textContent;

      document.body.appendChild(tempSpan);
      const width = tempSpan.getBoundingClientRect().width;
      document.body.removeChild(tempSpan);

      select.style.width = `${width + 40}px`;
    });
  }
}
