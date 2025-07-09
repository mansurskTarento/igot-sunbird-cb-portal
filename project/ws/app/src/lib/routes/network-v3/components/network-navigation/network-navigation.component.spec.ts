import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkNavigationComponent } from './network-navigation.component';

describe('NetworkNavigationComponent', () => {
  let component: NetworkNavigationComponent;
  let fixture: ComponentFixture<NetworkNavigationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NetworkNavigationComponent]
    });
    fixture = TestBed.createComponent(NetworkNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
