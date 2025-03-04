import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'ws-app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss'],
})
export class PaginationComponent implements OnInit {
  currentPage: number = 1;
  pagination: any = [];
  rangeWithDots: any;
  showingArray: any[] = [];
  totalSearchedProducts = 100;
  ngOnInit(): void {
    this.paginationInListing();
  }

  public paginationInListing() {
    let lower = 0;
    let upper = 0;
    let limit = 12;
    let items = this.totalSearchedProducts;
    this.showingArray = [];

    for (let i = 0; i < items; i++) {
      if (upper !== items && upper < items) {
        lower = upper;
        if (upper != items && (upper = lower + limit) <= items) {
          upper = lower + limit;
        } else {
          upper = items;
        }
        this.showingArray.push([lower, upper]);
      }
    }
    let dividedPagination = Math.ceil(this.totalSearchedProducts / limit);
    let paginationLength = this.paginationDup(
      this.currentPage,
      dividedPagination
    );

    let currentIndex = this.showingArray[this.currentPage - 1];

    let lowerPagination =
      this.totalSearchedProducts > 0 ? currentIndex[0] + 1 : '';
    let upperPagination = this.totalSearchedProducts > 0 ? currentIndex[1] : '';

    this.pagination = {
      dividedPagination: dividedPagination,
      paginationLength: paginationLength,
      lower: lowerPagination,
      upper: upperPagination,
    };
  }

  public paginationDup(c: any, m: any) {
    let current = c;
    let last = m;
    let delta = 5;
    let left = current - delta;
    let right = current + delta + 1;
    let range = [];
    let l;
    this.rangeWithDots = [];

    for (let i = 1; i <= last; i++) {
      if (i == 1 || i == last || (i >= left && i < right)) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          this.rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          this.rangeWithDots.push('...');
        }
      }
      this.rangeWithDots.push(i);
      l = i;
    }
    return this.rangeWithDots;
  }
}
