import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventsHomeV2Component } from './events-home-v2.component';

describe('EventsHomeV2Component', () => {
  let component: EventsHomeV2Component;
  let fixture: ComponentFixture<EventsHomeV2Component>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EventsHomeV2Component]
    });
    fixture = TestBed.createComponent(EventsHomeV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
