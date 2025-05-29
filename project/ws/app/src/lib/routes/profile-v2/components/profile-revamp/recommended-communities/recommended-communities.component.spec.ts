import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecommendedCommunitiesComponent } from './recommended-communities.component';

describe('RecommendedCommunitiesComponent', () => {
  let component: RecommendedCommunitiesComponent;
  let fixture: ComponentFixture<RecommendedCommunitiesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RecommendedCommunitiesComponent]
    });
    fixture = TestBed.createComponent(RecommendedCommunitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
