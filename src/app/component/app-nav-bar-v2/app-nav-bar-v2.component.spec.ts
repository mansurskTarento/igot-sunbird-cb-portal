import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppNavBarV2Component } from './app-nav-bar-v2.component';

describe('AppNavBarV2Component', () => {
  let component: AppNavBarV2Component;
  let fixture: ComponentFixture<AppNavBarV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppNavBarV2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppNavBarV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
