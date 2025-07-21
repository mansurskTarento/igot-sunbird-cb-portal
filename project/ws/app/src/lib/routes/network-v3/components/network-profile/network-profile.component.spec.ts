import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkProfileComponent } from './network-profile.component';

describe('NetworkProfileComponent', () => {
  let component: NetworkProfileComponent;
  let fixture: ComponentFixture<NetworkProfileComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NetworkProfileComponent]
    });
    fixture = TestBed.createComponent(NetworkProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
