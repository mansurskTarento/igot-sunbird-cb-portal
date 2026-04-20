import { FormBuilder, FormArray } from '@angular/forms'
import { SurveyQuestionsComponent } from './survey-questions.component'
import { NSPeerValidation } from '../../../../models/peer-validation.model'

const fb = new FormBuilder()

const makeQuestion = (overrides: Partial<NSPeerValidation.ISurveyQuestion> = {}): NSPeerValidation.ISurveyQuestion => ({
  id: 'q1',
  text: 'Test question',
  type: 'textArea',
  required: false,
  ...overrides,
})

const buildForm = (questions: NSPeerValidation.ISurveyQuestion[]) => {
  const responses = fb.array(
    questions.map(q => {
      if (q.type === 'checkbox') return fb.control([])
      if (q.type === 'numericRating') return fb.control(null)
      return fb.control('')
    })
  )
  return fb.group({ responses })
}

describe('SurveyQuestionsComponent', () => {
  let component: SurveyQuestionsComponent

  beforeEach(() => {
    component = new SurveyQuestionsComponent()
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  // ─── responses getter ─────────────────────────────────────────────────────

  describe('responses getter', () => {
    it('should return the responses FormArray from the form', () => {
      const questions = [makeQuestion()]
      component.form = buildForm(questions)
      expect(component.responses).toBeInstanceOf(FormArray)
    })
  })

  // ─── getRatingArray ───────────────────────────────────────────────────────

  describe('getRatingArray', () => {
    it('should return [1..n] for given count', () => {
      expect(component.getRatingArray(5)).toEqual([1, 2, 3, 4, 5])
    })

    it('should return [1..3] for count 3', () => {
      expect(component.getRatingArray(3)).toEqual([1, 2, 3])
    })

    it('should default to [1..5] when no argument is supplied', () => {
      expect(component.getRatingArray()).toEqual([1, 2, 3, 4, 5])
    })

    it('should return empty array for count 0', () => {
      expect(component.getRatingArray(0)).toEqual([])
    })
  })

  // ─── selectRating ─────────────────────────────────────────────────────────

  describe('selectRating', () => {
    beforeEach(() => {
      component.questions = [makeQuestion({ type: 'numericRating' })]
      component.form = buildForm(component.questions)
    })

    it('should set the control value at the given index', () => {
      component.selectRating(0, 4)
      expect(component.responses.at(0).value).toBe(4)
    })

    it('should overwrite a previous rating', () => {
      component.selectRating(0, 3)
      component.selectRating(0, 5)
      expect(component.responses.at(0).value).toBe(5)
    })
  })

  // ─── isRatingSelected ─────────────────────────────────────────────────────

  describe('isRatingSelected', () => {
    beforeEach(() => {
      component.questions = [makeQuestion({ type: 'numericRating' })]
      component.form = buildForm(component.questions)
    })

    it('should return true when rating matches control value', () => {
      component.selectRating(0, 3)
      expect(component.isRatingSelected(0, 3)).toBe(true)
    })

    it('should return false when rating does not match', () => {
      component.selectRating(0, 3)
      expect(component.isRatingSelected(0, 5)).toBe(false)
    })

    it('should return false when no rating selected yet', () => {
      expect(component.isRatingSelected(0, 1)).toBe(false)
    })
  })

  // ─── isOptionSelected ─────────────────────────────────────────────────────

  describe('isOptionSelected', () => {
    beforeEach(() => {
      component.questions = [makeQuestion({ type: 'checkbox', options: ['A', 'B', 'C'] })]
      component.form = buildForm(component.questions)
    })

    it('should return true when option is in the array value', () => {
      component.responses.at(0).setValue(['A', 'C'])
      expect(component.isOptionSelected(0, 'A')).toBe(true)
    })

    it('should return false when option is not in the array value', () => {
      component.responses.at(0).setValue(['A'])
      expect(component.isOptionSelected(0, 'B')).toBe(false)
    })

    it('should return false when value is not an array', () => {
      component.responses.at(0).setValue('A')
      expect(component.isOptionSelected(0, 'A')).toBe(false)
    })

    it('should return false when value is null', () => {
      component.responses.at(0).setValue(null)
      expect(component.isOptionSelected(0, 'A')).toBe(false)
    })
  })

  // ─── toggleOption ─────────────────────────────────────────────────────────

  describe('toggleOption', () => {
    beforeEach(() => {
      component.questions = [makeQuestion({ type: 'checkbox', options: ['A', 'B', 'C'] })]
      component.form = buildForm(component.questions)
    })

    it('should add option when checked is true and not already present', () => {
      component.toggleOption(0, 'A', true)
      expect(component.responses.at(0).value).toContain('A')
    })

    it('should NOT add option twice when checked is true and already present', () => {
      component.responses.at(0).setValue(['A'])
      component.toggleOption(0, 'A', true)
      expect(component.responses.at(0).value).toEqual(['A'])
    })

    it('should remove option when checked is false', () => {
      component.responses.at(0).setValue(['A', 'B'])
      component.toggleOption(0, 'A', false)
      expect(component.responses.at(0).value).toEqual(['B'])
    })

    it('should initialise from null and add option', () => {
      component.responses.at(0).setValue(null)
      component.toggleOption(0, 'X', true)
      expect(component.responses.at(0).value).toContain('X')
    })

    it('should initialise from non-array string and add option', () => {
      component.responses.at(0).setValue('old' as any)
      component.toggleOption(0, 'Y', true)
      expect(component.responses.at(0).value).toContain('Y')
    })

    it('should produce empty array when all options unchecked', () => {
      component.responses.at(0).setValue(['A'])
      component.toggleOption(0, 'A', false)
      expect(component.responses.at(0).value).toEqual([])
    })
  })
})
