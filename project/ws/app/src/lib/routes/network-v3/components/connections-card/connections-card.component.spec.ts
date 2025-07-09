import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectionsCardComponent } from './connections-card.component';

describe('ConnectionsCardComponent', () => {
  let component: ConnectionsCardComponent;
  let fixture: ComponentFixture<ConnectionsCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConnectionsCardComponent]
    });
    fixture = TestBed.createComponent(ConnectionsCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
