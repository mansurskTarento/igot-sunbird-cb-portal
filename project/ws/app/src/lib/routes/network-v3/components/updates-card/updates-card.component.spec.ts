import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdatesCardComponent } from './updates-card.component';

describe('UpdatesCardComponent', () => {
  let component: UpdatesCardComponent;
  let fixture: ComponentFixture<UpdatesCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UpdatesCardComponent]
    });
    fixture = TestBed.createComponent(UpdatesCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
