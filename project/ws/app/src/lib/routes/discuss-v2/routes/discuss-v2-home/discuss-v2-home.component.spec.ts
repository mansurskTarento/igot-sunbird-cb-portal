import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscussV2HomeComponent } from './discuss-v2-home.component';

describe('DiscussV2HomeComponent', () => {
  let component: DiscussV2HomeComponent;
  let fixture: ComponentFixture<DiscussV2HomeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DiscussV2HomeComponent]
    });
    fixture = TestBed.createComponent(DiscussV2HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
