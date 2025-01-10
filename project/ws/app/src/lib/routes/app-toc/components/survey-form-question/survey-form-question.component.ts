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
      this.answerControl.valueChanges.subscribe((value: any) => {
        if(value !==  this.previesAnswer && value !== null) {
          if (this.fieldDetails['validatorsArray'] && this.questionForm.controls.isNA.value) {
            this.answerControl.setValidators(this.fieldDetails['validatorsArray'])
            this.questionForm.controls.isNA.patchValue(false)
            this.answerControl.markAllAsTouched()
            this.answerControl.updateValueAndValidity()
          }
          this.questionForm.updateValueAndValidity()
          this.emitAnswer()
        }
        this.previesAnswer = value
      })
    }
  }

  get answerControl() {
    return this.questionForm.controls.answer
  }

  sectionChange() {
    if(this.questionForm.controls.isNA.value) {
      this.answerControl.reset()
      this.answerControl.clearValidators()
      const validatorsArray = this.fieldDetails['validatorsArray'] ? this.fieldDetails['validatorsArray'].filter((validator: any) => validator !== Validators.required) : []
      this.answerControl.setValidators(validatorsArray)
      this.answerControl.updateValueAndValidity()
      this.emitAnswer()
    }
  }

  setRating(rating: number) {
    if(this.answerControl) {
      this.answerControl.patchValue(rating)
      this.emitAnswer()
    }
  }

  checkboxClicked(event: any) {
    let checkedList = this.answerControl.value ? this.answerControl.value : []
    if(event.checked) {
      checkedList.push(event.source.value)
    } else {
      checkedList = checkedList.filter((e: any) => e !== event.source.value)
    }
    this.answerControl.patchValue(checkedList)
    this.answerControl.updateValueAndValidity()
    this.questionForm.updateValueAndValidity()
    this.emitAnswer()
  }

  emitAnswer() {
    const answerDetails = this.questionForm.value
    this.questionValues.emit(answerDetails)
  }
}
