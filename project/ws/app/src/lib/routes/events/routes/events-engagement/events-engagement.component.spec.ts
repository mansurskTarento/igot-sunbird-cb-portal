import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventsEngagementComponent } from './events-engagement.component';

describe('EventsEngagementComponent', () => {
  let component: EventsEngagementComponent;
  let fixture: ComponentFixture<EventsEngagementComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EventsEngagementComponent]
    });
    fixture = TestBed.createComponent(EventsEngagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
