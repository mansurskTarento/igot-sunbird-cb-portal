import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectionPeopleCardComponent } from './connection-people-card.component';

describe('ConnectionPeopleCardComponent', () => {
  let component: ConnectionPeopleCardComponent;
  let fixture: ComponentFixture<ConnectionPeopleCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConnectionPeopleCardComponent]
    });
    fixture = TestBed.createComponent(ConnectionPeopleCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
