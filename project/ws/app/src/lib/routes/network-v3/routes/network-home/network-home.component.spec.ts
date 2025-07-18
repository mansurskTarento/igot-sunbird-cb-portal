import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkHomeComponent } from './network-home.component';

describe('NetworkHomeComponent', () => {
  let component: NetworkHomeComponent;
  let fixture: ComponentFixture<NetworkHomeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NetworkHomeComponent]
    });
    fixture = TestBed.createComponent(NetworkHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
