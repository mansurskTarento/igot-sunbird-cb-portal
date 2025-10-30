import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompletionSurveyFormComponent } from './completion-survey-form.component';

describe('CompletionSurveyFormComponent', () => {
  let component: CompletionSurveyFormComponent;
  let fixture: ComponentFixture<CompletionSurveyFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CompletionSurveyFormComponent]
    });
    fixture = TestBed.createComponent(CompletionSurveyFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
