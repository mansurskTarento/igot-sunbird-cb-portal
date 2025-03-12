import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventsV2Component } from './events-v2.component';

describe('EventsV2Component', () => {
  let component: EventsV2Component;
  let fixture: ComponentFixture<EventsV2Component>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EventsV2Component]
    });
    fixture = TestBed.createComponent(EventsV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
