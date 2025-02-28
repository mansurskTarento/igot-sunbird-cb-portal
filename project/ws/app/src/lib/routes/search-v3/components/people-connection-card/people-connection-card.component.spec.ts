import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PeopleConnectionCardComponent } from './people-connection-card.component';

describe('PeopleConnectionCardComponent', () => {
  let component: PeopleConnectionCardComponent;
  let fixture: ComponentFixture<PeopleConnectionCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PeopleConnectionCardComponent]
    });
    fixture = TestBed.createComponent(PeopleConnectionCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
