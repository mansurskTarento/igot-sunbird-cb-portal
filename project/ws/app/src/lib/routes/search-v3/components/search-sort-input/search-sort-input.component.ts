import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Output,
  ViewChild,
} from '@angular/core';
import { SEARCH_SORT_DROPDOWN } from '../../../../../../../author/src/lib/constants/constant';

@Component({
  selector: 'ws-app-search-sort-input',
  templateUrl: './search-sort-input.component.html',
  styleUrls: ['./search-sort-input.component.scss'],
})
export class SearchSortInputComponent implements AfterViewInit {
  @Output() searchSorter = new EventEmitter();
  selectedOption = 'most_relevant';
  options = SEARCH_SORT_DROPDOWN;

  @ViewChild('sortSelect') sortSelect!: ElementRef;

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
