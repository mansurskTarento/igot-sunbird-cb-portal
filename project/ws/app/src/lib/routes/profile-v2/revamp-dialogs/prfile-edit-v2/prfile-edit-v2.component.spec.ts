import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrfileEditV2Component } from './prfile-edit-v2.component';

describe('PrfileEditV2Component', () => {
  let component: PrfileEditV2Component;
  let fixture: ComponentFixture<PrfileEditV2Component>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PrfileEditV2Component]
    });
    fixture = TestBed.createComponent(PrfileEditV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
