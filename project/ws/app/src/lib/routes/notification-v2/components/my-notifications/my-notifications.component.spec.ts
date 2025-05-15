import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyNotificationsComponent } from './my-notifications.component';

describe('MyNotificationsComponent', () => {
  let component: MyNotificationsComponent;
  let fixture: ComponentFixture<MyNotificationsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MyNotificationsComponent]
    });
    fixture = TestBed.createComponent(MyNotificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
