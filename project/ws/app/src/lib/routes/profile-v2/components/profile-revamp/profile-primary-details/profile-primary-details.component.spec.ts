import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfilePrimaryDetailsComponent } from './profile-primary-details.component';

describe('ProfilePrimaryDetailsComponent', () => {
  let component: ProfilePrimaryDetailsComponent;
  let fixture: ComponentFixture<ProfilePrimaryDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProfilePrimaryDetailsComponent]
    });
    fixture = TestBed.createComponent(ProfilePrimaryDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
