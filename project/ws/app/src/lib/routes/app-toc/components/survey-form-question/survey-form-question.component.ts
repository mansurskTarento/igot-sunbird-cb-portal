import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'ws-app-survey-form-question',
  templateUrl: './survey-form-question.component.html',
  styleUrls: ['./survey-form-question.component.scss']
})
export class SurveyFormQuestionComponent implements OnInit {
  @Input() questionForm!: FormGroup;
  @Input() fieldDetails: any

  @Output() questionValues = new EventEmitter()

  otherFieldType = ['radio', 'boolean', 'rating']
  stars = Array(5).fill(0)
  previesAnswer: string = ''

  ngOnInit(): void {
    if (this.questionForm) {
      this.questionForm.controls.answer.valueChanges.subscribe((value: any) => {
        if(value !==  this.previesAnswer && value !== null) {
          if (this.fieldDetails['validatorsArray'] && this.questionForm.controls.isNA.value) {
            this.questionForm.controls.answer.setValidators(this.fieldDetails['validatorsArray'])
            this.questionForm.controls.isNA.patchValue(false)
            this.questionForm.controls.answer.updateValueAndValidity()
          }
          this.questionForm.updateValueAndValidity()
          this.emitAnswer()
        }
        this.previesAnswer = value
      })
    }
  }

  sectionChange() {
    if(this.questionForm.controls.isNA.value) {
      this.questionForm.controls.answer.reset()
      this.questionForm.controls.answer.clearValidators()
      // debugger
      const validatorsArray = this.fieldDetails['validatorsArray'] ? this.fieldDetails['validatorsArray'].filter((validator: any) => validator !== Validators.required) : []
      this.questionForm.controls.answer.setValidators(validatorsArray)
      this.questionForm.controls.answer.updateValueAndValidity()
      this.emitAnswer()
    }
  }

  setRating(rating: number) {
    if(this.questionForm.controls.answer) {
      this.questionForm.controls.answer.patchValue(rating)
      this.emitAnswer()
    }
  }

  emitAnswer() {
    const answerDetails = this.questionForm.value
    this.questionValues.emit(answerDetails)
  }
}
