import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllRecommendationsComponent } from './all-recommendations.component';

describe('AllRecommendationsComponent', () => {
  let component: AllRecommendationsComponent;
  let fixture: ComponentFixture<AllRecommendationsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AllRecommendationsComponent]
    });
    fixture = TestBed.createComponent(AllRecommendationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
