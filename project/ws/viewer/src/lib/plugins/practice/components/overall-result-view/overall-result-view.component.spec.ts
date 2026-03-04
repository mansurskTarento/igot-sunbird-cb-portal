import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverallResultViewComponent } from './overall-result-view.component';

describe('OverallResultViewComponent', () => {
  let component: OverallResultViewComponent;
  let fixture: ComponentFixture<OverallResultViewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OverallResultViewComponent]
    });
    fixture = TestBed.createComponent(OverallResultViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
