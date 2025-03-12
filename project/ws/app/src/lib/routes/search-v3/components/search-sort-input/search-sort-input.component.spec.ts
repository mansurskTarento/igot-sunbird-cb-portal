import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchSortInputComponent } from './search-sort-input.component';

describe('SearchSortInputComponent', () => {
  let component: SearchSortInputComponent;
  let fixture: ComponentFixture<SearchSortInputComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SearchSortInputComponent]
    });
    fixture = TestBed.createComponent(SearchSortInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
