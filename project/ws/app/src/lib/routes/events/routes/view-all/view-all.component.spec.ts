import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewAllComponent } from './view-all.component';

describe('ViewAllComponent', () => {
  let component: ViewAllComponent;
  let fixture: ComponentFixture<ViewAllComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ViewAllComponent]
    });
    fixture = TestBed.createComponent(ViewAllComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
