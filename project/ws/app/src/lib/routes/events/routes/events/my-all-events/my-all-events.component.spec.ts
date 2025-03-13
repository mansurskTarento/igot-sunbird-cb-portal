import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyAllEventsComponent } from './my-all-events.component';

describe('MyAllEventsComponent', () => {
  let component: MyAllEventsComponent;
  let fixture: ComponentFixture<MyAllEventsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MyAllEventsComponent]
    });
    fixture = TestBed.createComponent(MyAllEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
