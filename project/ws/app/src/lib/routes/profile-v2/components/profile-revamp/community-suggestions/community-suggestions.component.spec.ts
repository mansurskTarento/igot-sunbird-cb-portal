import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommunitySuggestionsComponent } from './community-suggestions.component';

describe('CommunitySuggestionsComponent', () => {
  let component: CommunitySuggestionsComponent;
  let fixture: ComponentFixture<CommunitySuggestionsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CommunitySuggestionsComponent]
    });
    fixture = TestBed.createComponent(CommunitySuggestionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
