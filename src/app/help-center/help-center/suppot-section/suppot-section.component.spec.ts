import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuppotSectionComponent } from './suppot-section.component';

describe('SuppotSectionComponent', () => {
  let component: SuppotSectionComponent;
  let fixture: ComponentFixture<SuppotSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuppotSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuppotSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
