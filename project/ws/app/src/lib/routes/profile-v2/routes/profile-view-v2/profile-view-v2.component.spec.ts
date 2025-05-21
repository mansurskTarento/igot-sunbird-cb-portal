import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileViewV2Component } from './profile-view-v2.component';

describe('ProfileViewV2Component', () => {
  let component: ProfileViewV2Component;
  let fixture: ComponentFixture<ProfileViewV2Component>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProfileViewV2Component]
    });
    fixture = TestBed.createComponent(ProfileViewV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
