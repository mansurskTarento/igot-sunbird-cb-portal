import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileVisibilitySettingsComponent } from './profile-visibility-settings.component';

describe('ProfileVisibilitySettingsComponent', () => {
  let component: ProfileVisibilitySettingsComponent;
  let fixture: ComponentFixture<ProfileVisibilitySettingsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProfileVisibilitySettingsComponent]
    });
    fixture = TestBed.createComponent(ProfileVisibilitySettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
