import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchEventCardComponent } from './search-event-card.component';

describe('SearchEventCardComponent', () => {
  let component: SearchEventCardComponent;
  let fixture: ComponentFixture<SearchEventCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SearchEventCardComponent]
    });
    fixture = TestBed.createComponent(SearchEventCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
