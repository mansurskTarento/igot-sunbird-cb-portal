import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventVideoPlayerComponent } from './event-video-player.component';

describe('EventVideoPlayerComponent', () => {
  let component: EventVideoPlayerComponent;
  let fixture: ComponentFixture<EventVideoPlayerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EventVideoPlayerComponent]
    });
    fixture = TestBed.createComponent(EventVideoPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
