import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaResultsViewComponent } from './ca-results-view.component';

describe('CaResultsViewComponent', () => {
  let component: CaResultsViewComponent;
  let fixture: ComponentFixture<CaResultsViewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CaResultsViewComponent]
    });
    fixture = TestBed.createComponent(CaResultsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
