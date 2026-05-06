import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MandatoryNotificationModalComponent } from './mandatory-notification-modal.component';

describe('MandatoryNotificationModalComponent', () => {
  let component: MandatoryNotificationModalComponent;
  let fixture: ComponentFixture<MandatoryNotificationModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MandatoryNotificationModalComponent]
    });
    fixture = TestBed.createComponent(MandatoryNotificationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
