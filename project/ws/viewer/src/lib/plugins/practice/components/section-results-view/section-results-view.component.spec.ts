import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SectionResultsViewComponent } from './section-results-view.component';

describe('SectionResultsViewComponent', () => {
  let component: SectionResultsViewComponent;
  let fixture: ComponentFixture<SectionResultsViewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SectionResultsViewComponent]
    });
    fixture = TestBed.createComponent(SectionResultsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
