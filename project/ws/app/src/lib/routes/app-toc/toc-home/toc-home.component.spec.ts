import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TocHomeComponent } from './toc-home.component';

describe('TocHomeComponent', () => {
  let component: TocHomeComponent;
  let fixture: ComponentFixture<TocHomeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TocHomeComponent]
    });
    fixture = TestBed.createComponent(TocHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
