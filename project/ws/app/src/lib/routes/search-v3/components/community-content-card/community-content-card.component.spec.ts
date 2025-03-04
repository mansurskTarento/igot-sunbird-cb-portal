import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommunityContentCardComponent } from './community-content-card.component';

describe('CommunityContentCardComponent', () => {
  let component: CommunityContentCardComponent;
  let fixture: ComponentFixture<CommunityContentCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CommunityContentCardComponent]
    });
    fixture = TestBed.createComponent(CommunityContentCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
