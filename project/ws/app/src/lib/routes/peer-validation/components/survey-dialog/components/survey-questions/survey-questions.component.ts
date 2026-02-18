import { Component, Input } from '@angular/core'
import { FormGroup, FormArray } from '@angular/forms'
import { NSPeerValidation } from '../../../../models/peer-validation.model'

@Component({
  selector: 'ws-app-survey-questions',
  templateUrl: './survey-questions.component.html',
  styleUrls: ['./survey-questions.component.scss'],
})
export class SurveyQuestionsComponent {
  @Input() questions: NSPeerValidation.ISurveyQuestion[] = []
  @Input() form!: FormGroup

  get responses(): FormArray {
    return this.form.get('responses') as FormArray
  }

  getRatingArray(max: number): number[] {
    return Array.from({ length: max }, (_, i) => i + 1)
  }

  selectRating(index: number, rating: number) {
    this.responses.at(index).setValue(rating)
  }

  isRatingSelected(index: number, rating: number): boolean {
    return this.responses.at(index).value === rating
  }

  // Methods for single-select and multi-select questions
  isOptionSelected(index: number, option: string): boolean {
    const value = this.responses.at(index).value
    return Array.isArray(value) && value.includes(option)
  }

  toggleOption(index: number, option: string, checked: boolean) {
    const control = this.responses.at(index)
    let currentValue = control.value || []

    if (!Array.isArray(currentValue)) {
      currentValue = []
    }

    if (checked) {
      if (!currentValue.includes(option)) {
        control.setValue([...currentValue, option])
      }
    } else {
      control.setValue(currentValue.filter((v: string) => v !== option))
    }
  }
}
