import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileEntryEditComponent } from './profile-entry-edit.component';

describe('ProfileEntryEditComponent', () => {
  let component: ProfileEntryEditComponent;
  let fixture: ComponentFixture<ProfileEntryEditComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProfileEntryEditComponent]
    });
    fixture = TestBed.createComponent(ProfileEntryEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
