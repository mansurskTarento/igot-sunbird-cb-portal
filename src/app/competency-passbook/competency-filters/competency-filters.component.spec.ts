import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompetencyFiltersComponent } from './competency-filters.component';

describe('CompetencyFiltersComponent', () => {
  let component: CompetencyFiltersComponent;
  let fixture: ComponentFixture<CompetencyFiltersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CompetencyFiltersComponent]
    });
    fixture = TestBed.createComponent(CompetencyFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
