import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseCompetencyListComponent } from './base-competency-list.component';

describe('BaseCompetencyListComponent', () => {
  let component: BaseCompetencyListComponent;
  let fixture: ComponentFixture<BaseCompetencyListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BaseCompetencyListComponent]
    });
    fixture = TestBed.createComponent(BaseCompetencyListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
