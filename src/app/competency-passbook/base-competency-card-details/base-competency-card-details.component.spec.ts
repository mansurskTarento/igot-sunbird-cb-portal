import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseCompetencyCardDetailsComponent } from './base-competency-card-details.component';

describe('BaseCompetencyCardDetailsComponent', () => {
  let component: BaseCompetencyCardDetailsComponent;
  let fixture: ComponentFixture<BaseCompetencyCardDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BaseCompetencyCardDetailsComponent]
    });
    fixture = TestBed.createComponent(BaseCompetencyCardDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
