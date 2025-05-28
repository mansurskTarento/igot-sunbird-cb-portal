import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PeopleSuggestionsComponent } from './people-suggestions.component';

describe('PeopleSuggestionsComponent', () => {
  let component: PeopleSuggestionsComponent;
  let fixture: ComponentFixture<PeopleSuggestionsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PeopleSuggestionsComponent]
    });
    fixture = TestBed.createComponent(PeopleSuggestionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
