import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'ws-app-survey-form-question',
  templateUrl: './survey-form-question.component.html',
  styleUrls: ['./survey-form-question.component.scss']
})
export class SurveyFormQuestionComponent implements OnInit {
  @Input() questionForm!: FormGroup;
  @Input() fieldDetails: any

  otherFieldType = ['radio', 'boolean', 'rating']
  stars = Array(5).fill(0)

  ngOnInit(): void {
    if (this.questionForm) {
      this.questionForm.controls.answer.valueChanges.subscribe((value: any) => {
        if(value) {
          this.questionForm.controls.isNA.patchValue(false)
          this.questionForm.controls.answer.setValidators([Validators.required])
          this.questionForm.controls.answer.updateValueAndValidity()
        }
      })
    }
  }

  sectionChange() {
    if(this.questionForm.controls.isNA.value) {
      this.questionForm.controls.answer.reset()
      this.questionForm.controls.answer.clearValidators()
      this.questionForm.controls.answer.updateValueAndValidity()
    }
  }

  setRating(rating: number) {
    if(this.questionForm.controls.answer) {
      this.questionForm.controls.answer.patchValue(rating)
    }
  }
}
