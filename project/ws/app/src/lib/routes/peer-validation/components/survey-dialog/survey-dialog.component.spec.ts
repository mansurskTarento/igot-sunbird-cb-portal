import { of, throwError, Subject } from 'rxjs'
import { FormBuilder, FormArray } from '@angular/forms'
import { SurveyDialogComponent } from './survey-dialog.component'
import { NSPeerValidation } from '../../models/peer-validation.model'

// ─── helpers ─────────────────────────────────────────────────────────────────

const makeQuestion = (overrides: Partial<NSPeerValidation.ISurveyQuestion> = {}): NSPeerValidation.ISurveyQuestion => ({
  id: 'q1',
  text: 'Test question',
  type: 'textArea',
  required: false,
  ...overrides,
})

const makeSurveyData = (overrides: Partial<NSPeerValidation.ISurveyPopupData> = {}): NSPeerValidation.ISurveyPopupData => ({
  learnerName: 'Alice',
  courseName: 'Angular Basics',
  completionDate: '2024-01-10',
  formId: 'form1',
  contextId: 'ctx1',
  contextOrgId: 'org1',
  notificationId: 'notif1',
  createdAt: '2024-01-01',
  thumbnail: '',
  ...overrides,
})

// ─── test suite ──────────────────────────────────────────────────────────────

describe('SurveyDialogComponent', () => {
  let component: SurveyDialogComponent
  let dialogRefMock: any
  let peerValidationServiceMock: any
  let dialogMock: any
  let snackBarMock: any
  let renderer2Mock: any
  const fb = new FormBuilder()

  beforeEach(() => {
    dialogRefMock = { close: jest.fn() }
    peerValidationServiceMock = {
      dashboardRefresh$: new Subject<void>(),
      getSurveyQuestions: jest.fn().mockReturnValue(of([])),
      submitSurvey: jest.fn().mockReturnValue(of({ result: 'ok' })),
    }
    dialogMock = {
      open: jest.fn().mockReturnValue({ afterClosed: () => of(null) }),
    }
    snackBarMock = { open: jest.fn() }
    renderer2Mock = { setStyle: jest.fn(), removeStyle: jest.fn() }

    component = new SurveyDialogComponent(
      dialogRefMock,
      makeSurveyData(),
      document as any,
      fb,
      renderer2Mock,
      peerValidationServiceMock,
      dialogMock,
      snackBarMock
    )
  })

  // ─── ngOnInit ──────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('should set isSurveySubmitted to true', () => {
      component.ngOnInit()
      expect(component.data.isSurveySubmitted).toBe(true)
    })

    it('should call renderer.setStyle to hide overflow', () => {
      component.ngOnInit()
      expect(renderer2Mock.setStyle).toHaveBeenCalledWith(document.body, 'overflow', 'hidden')
    })

    it('should call loadSurveyQuestions and initializeForm', () => {
      component.ngOnInit()
      expect(peerValidationServiceMock.getSurveyQuestions).toHaveBeenCalledWith('form1')
      expect(component.questionForm).toBeDefined()
    })

    it('should set isLoadingQuestions to false after questions load', () => {
      // Pre-init form so buildQuestionForm can access questionForm.get('responses')
      component.initializeForm()
      peerValidationServiceMock.getSurveyQuestions.mockReturnValue(of([]))
      component.ngOnInit()
      expect(component.isLoadingQuestions).toBe(false)
    })
  })

  // ─── ngOnDestroy ──────────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should call renderer.removeStyle on destroy', () => {
      component.ngOnDestroy()
      expect(renderer2Mock.removeStyle).toHaveBeenCalledWith(document.body, 'overflow')
    })
  })

  // ─── loadSurveyQuestions ──────────────────────────────────────────────────

  describe('loadSurveyQuestions', () => {
    it('should populate surveyQuestions on success', () => {
      const questions = [makeQuestion({ id: 'q1', text: 'Q1' })]
      peerValidationServiceMock.getSurveyQuestions.mockReturnValue(of(questions))
      component.initializeForm()
      component.loadSurveyQuestions()
      expect(component.surveyQuestions).toEqual(questions)
      expect(component.isLoadingQuestions).toBe(false)
    })

    it('should set questionsError from err.message', () => {
      // Use a fake subscribe to bypass zone.js error interception
      peerValidationServiceMock.getSurveyQuestions.mockImplementation(() => ({
        subscribe: ({ error }: any) => error({ message: 'Server error' }),
      }))
      component.initializeForm()
      component.loadSurveyQuestions()
      expect(component.questionsError).toBe('Server error')
      expect(component.isLoadingQuestions).toBe(false)
    })

    it('should set questionsError for 502 status', () => {
      peerValidationServiceMock.getSurveyQuestions.mockImplementation(() => ({
        subscribe: ({ error }: any) => error({ status: 502 }),
      }))
      component.initializeForm()
      component.loadSurveyQuestions()
      expect(component.questionsError).toBe('Unable to reach the server. Please try again later.')
    })

    it('should set questionsError for 503 status', () => {
      peerValidationServiceMock.getSurveyQuestions.mockImplementation(() => ({
        subscribe: ({ error }: any) => error({ status: 503 }),
      }))
      component.initializeForm()
      component.loadSurveyQuestions()
      expect(component.questionsError).toBe('Unable to reach the server. Please try again later.')
    })

    it('should set questionsError for 504 status', () => {
      peerValidationServiceMock.getSurveyQuestions.mockImplementation(() => ({
        subscribe: ({ error }: any) => error({ status: 504 }),
      }))
      component.initializeForm()
      component.loadSurveyQuestions()
      expect(component.questionsError).toBe('Unable to reach the server. Please try again later.')
    })

    it('should set questionsError for 404 status', () => {
      peerValidationServiceMock.getSurveyQuestions.mockImplementation(() => ({
        subscribe: ({ error }: any) => error({ status: 404 }),
      }))
      component.initializeForm()
      component.loadSurveyQuestions()
      expect(component.questionsError).toBe('Survey form not found. Please contact support.')
    })

    it('should set generic questionsError for unknown errors', () => {
      peerValidationServiceMock.getSurveyQuestions.mockReturnValue(throwError(() => ({ status: 500 })))
      component.initializeForm()
      component.loadSurveyQuestions()
      expect(component.questionsError).toBe('Failed to load survey questions. Please try again.')
    })
  })

  // ─── initializeForm ───────────────────────────────────────────────────────

  describe('initializeForm', () => {
    it('should create a FormGroup with empty responses FormArray', () => {
      component.initializeForm()
      expect(component.questionForm).toBeDefined()
      expect((component.questionForm.get('responses') as FormArray).length).toBe(0)
    })
  })

  // ─── buildQuestionForm ────────────────────────────────────────────────────

  describe('buildQuestionForm', () => {
    beforeEach(() => { component.initializeForm() })

    it('should add a control for numericRating question', () => {
      component.surveyQuestions = [makeQuestion({ type: 'numericRating', required: true })]
      component.buildQuestionForm()
      expect((component.questionForm.get('responses') as FormArray).length).toBe(1)
    })

    it('should add a control for radio question', () => {
      component.surveyQuestions = [makeQuestion({ type: 'radio', required: false })]
      component.buildQuestionForm()
      expect((component.questionForm.get('responses') as FormArray).length).toBe(1)
    })

    it('should add a control for required checkbox question with custom validator', () => {
      component.surveyQuestions = [makeQuestion({ type: 'checkbox', required: true })]
      component.buildQuestionForm()
      const ctrl = (component.questionForm.get('responses') as FormArray).at(0)
      expect(ctrl).toBeDefined()
      // Empty array → required error
      expect(ctrl.invalid).toBe(true)
      ctrl.setValue(['A'])
      expect(ctrl.valid).toBe(true)
    })

    it('should add a control for optional checkbox question', () => {
      component.surveyQuestions = [makeQuestion({ type: 'checkbox', required: false })]
      component.buildQuestionForm()
      const ctrl = (component.questionForm.get('responses') as FormArray).at(0)
      expect(ctrl.valid).toBe(true)
    })

    it('should add a control for textArea question', () => {
      component.surveyQuestions = [makeQuestion({ type: 'textArea', required: false })]
      component.buildQuestionForm()
      expect((component.questionForm.get('responses') as FormArray).length).toBe(1)
    })

    it('should add controls for multiple questions', () => {
      component.surveyQuestions = [
        makeQuestion({ id: 'q1', type: 'textArea' }),
        makeQuestion({ id: 'q2', type: 'numericRating' }),
        makeQuestion({ id: 'q3', type: 'radio' }),
        makeQuestion({ id: 'q4', type: 'checkbox' }),
      ]
      component.buildQuestionForm()
      expect((component.questionForm.get('responses') as FormArray).length).toBe(4)
    })
  })

  // ─── responses getter ─────────────────────────────────────────────────────

  describe('responses getter', () => {
    it('should return the responses FormArray', () => {
      component.initializeForm()
      expect(component.responses).toBeInstanceOf(FormArray)
    })
  })

  // ─── onStepChange ─────────────────────────────────────────────────────────

  describe('onStepChange', () => {
    it('should update currentStep', () => {
      component.onStepChange({ selectedIndex: 2 })
      expect(component.currentStep).toBe(2)
    })
  })

  // ─── onDocumentsChanged ───────────────────────────────────────────────────

  describe('onDocumentsChanged', () => {
    it('should update uploadedDocuments', () => {
      const docs = [{ id: 'd1', name: 'file.pdf', type: 'pdf', size: 100, url: 'http://cdn/file.pdf', uploadedAt: new Date() }]
      component.onDocumentsChanged(docs)
      expect(component.uploadedDocuments).toEqual(docs)
    })
  })

  // ─── onPeersChanged ───────────────────────────────────────────────────────

  describe('onPeersChanged', () => {
    it('should update selectedPeers', () => {
      const peerData = { peers: [{ id: 'p1', name: 'Bob' }], isValid: true }
      component.onPeersChanged(peerData)
      expect(component.selectedPeers).toEqual(peerData)
    })
  })

  // ─── canProceedToStep2 ────────────────────────────────────────────────────

  describe('canProceedToStep2', () => {
    it('should return true when form is valid', () => {
      component.initializeForm()
      expect(component.canProceedToStep2()).toBe(true)
    })

    it('should return false when form has a required control that is empty', () => {
      component.surveyQuestions = [makeQuestion({ type: 'textArea', required: true })]
      component.initializeForm()
      component.buildQuestionForm()
      expect(component.canProceedToStep2()).toBe(false)
    })
  })

  // ─── isStepCompleted ──────────────────────────────────────────────────────

  describe('isStepCompleted', () => {
    it('should return form validity for step 0', () => {
      component.initializeForm()
      expect(component.isStepCompleted(0)).toBe(true)
    })

    it('should return isStep2Completed flag for step 1', () => {
      component.isStep2Completed = false
      expect(component.isStepCompleted(1)).toBe(false)
      component.isStep2Completed = true
      expect(component.isStepCompleted(1)).toBe(true)
    })

    it('should return false for other step indexes', () => {
      expect(component.isStepCompleted(2)).toBe(false)
      expect(component.isStepCompleted(99)).toBe(false)
    })
  })

  // ─── completeStep2 ────────────────────────────────────────────────────────

  describe('completeStep2', () => {
    it('should set isStep2Completed to true and call stepper.next', () => {
      jest.useFakeTimers()
      component.stepper = { next: jest.fn() } as any
      component.completeStep2()
      expect(component.isStep2Completed).toBe(true)
      jest.runAllTimers()
      expect(component.stepper.next).toHaveBeenCalled()
      jest.useRealTimers()
    })
  })

  // ─── canSubmit ────────────────────────────────────────────────────────────

  describe('canSubmit', () => {
    it('should return true when selectedPeers.isValid is true', () => {
      component.selectedPeers = { peers: [{ id: 'p1' }], isValid: true }
      expect(component.canSubmit()).toBe(true)
    })

    it('should return false when selectedPeers.isValid is false', () => {
      component.selectedPeers = { peers: [], isValid: false }
      expect(component.canSubmit()).toBe(false)
    })
  })

  // ─── onSubmit ─────────────────────────────────────────────────────────────

  describe('onSubmit', () => {
    const setupSubmittableForm = () => {
      component.initializeForm()
      component.surveyQuestions = [
        makeQuestion({ id: 'q1', type: 'textArea', required: false }),
        makeQuestion({ id: 'q2', type: 'numericRating', required: false }),
      ]
      component.buildQuestionForm()
      component.responses.at(0).setValue('Some answer')
      component.responses.at(1).setValue(4)
      component.selectedPeers = { peers: [{ id: 'peer1' }, { userId: 'peer2' }], isValid: true }
      component.uploadedDocuments = [
        { id: 'd1', name: 'doc.pdf', type: 'pdf', size: 100, url: 'http://cdn/doc.pdf', uploadedAt: new Date() },
      ]
    }

    it('should return early when canSubmit is false', () => {
      component.selectedPeers = { peers: [], isValid: false }
      component.initializeForm()
      component.onSubmit()
      expect(peerValidationServiceMock.submitSurvey).not.toHaveBeenCalled()
    })

    it('should return early when already submitting', () => {
      component.selectedPeers = { peers: [{ id: 'p1' }], isValid: true }
      component.isSubmitting = true
      component.initializeForm()
      component.onSubmit()
      expect(peerValidationServiceMock.submitSurvey).not.toHaveBeenCalled()
    })

    it('should call submitSurvey with correct payload', () => {
      setupSubmittableForm()
      component.onSubmit()
      expect(peerValidationServiceMock.submitSurvey).toHaveBeenCalledWith(
        expect.objectContaining({
          formId: 'form1',
          contextId: 'ctx1',
          contextOrgId: 'org1',
          peerIds: ['peer1', 'peer2'],
          attachments: ['http://cdn/doc.pdf'],
          responses: expect.arrayContaining([
            expect.objectContaining({ questionId: 'q1', answerType: 'textarea' }),
            expect.objectContaining({ questionId: 'q2', answerType: 'numericRating', answer: 4 }),
          ]),
        })
      )
    })

    it('should close dialog and emit dashboardRefresh$ on success', () => {
      setupSubmittableForm()
      const refreshSpy = jest.spyOn(peerValidationServiceMock.dashboardRefresh$, 'next')
      component.onSubmit()
      expect(dialogRefMock.close).toHaveBeenCalled()
      expect(refreshSpy).toHaveBeenCalled()
    })

    it('should open SuccessDialogComponent on success', () => {
      setupSubmittableForm()
      component.onSubmit()
      expect(dialogMock.open).toHaveBeenCalled()
    })

    it('should show snackBar when response has failed status', () => {
      setupSubmittableForm()
      peerValidationServiceMock.submitSurvey.mockReturnValue(
        of({ params: { status: 'failed', errMsg: 'Bad request error' } })
      )
      component.onSubmit()
      expect(snackBarMock.open).toHaveBeenCalledWith('Bad request error', 'Close', expect.objectContaining({ duration: 4000 }))
      expect(component.isSubmitting).toBe(false)
    })

    it('should show snackBar when responseCode is BAD_REQUEST', () => {
      setupSubmittableForm()
      peerValidationServiceMock.submitSurvey.mockReturnValue(
        of({ responseCode: 'BAD_REQUEST', params: {} })
      )
      component.onSubmit()
      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Failed to submit survey. Please try again.', 'Close', expect.objectContaining({ duration: 4000 })
      )
    })

    it('should show snackBar and reset isSubmitting on HTTP error', () => {
      setupSubmittableForm()
      // Bypass zone.js by using a fake subscribe that directly invokes the error callback
      peerValidationServiceMock.submitSurvey.mockImplementation(() => ({
        subscribe: ({ error }: any) => error({ error: { params: { errMsg: 'Network error' } } }),
      }))
      component.onSubmit()
      expect(snackBarMock.open).toHaveBeenCalledWith('Network error', 'Close', expect.objectContaining({ duration: 4000 }))
      expect(component.isSubmitting).toBe(false)
    })

    it('should show default message on error without errMsg', () => {
      setupSubmittableForm()
      peerValidationServiceMock.submitSurvey.mockReturnValue(throwError(() => ({})))
      component.onSubmit()
      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Failed to submit survey. Please try again.', 'Close', expect.anything()
      )
    })

    it('should include submission metadata with status SUBMITTED', () => {
      setupSubmittableForm()
      component.onSubmit()
      const payload = peerValidationServiceMock.submitSurvey.mock.calls[0][0]
      expect(payload.status).toBe('SUBMITTED')
      expect(payload.version).toBe(1)
      expect(payload.submissionMeta.submittedFrom).toBe('web')
    })
  })

  // ─── showSuccessDialog ────────────────────────────────────────────────────

  describe('showSuccessDialog', () => {
    it('should open a success dialog', () => {
      component.showSuccessDialog()
      expect(dialogMock.open).toHaveBeenCalled()
    })
  })

  // ─── onClose ──────────────────────────────────────────────────────────────

  describe('onClose', () => {
    it('should close the dialog ref', () => {
      component.onClose()
      expect(dialogRefMock.close).toHaveBeenCalled()
    })
  })

  // ─── buildQuestionForm – required variants ────────────────────────────────

  describe('buildQuestionForm – required field branches', () => {
    beforeEach(() => { component.initializeForm() })

    it('should apply Validators.required for required numericRating', () => {
      component.surveyQuestions = [makeQuestion({ type: 'numericRating', required: true })]
      component.buildQuestionForm()
      const ctrl = (component.questionForm.get('responses') as FormArray).at(0)
      expect(ctrl.valid).toBe(false) // null with required → invalid
    })

    it('should apply Validators.required for required radio', () => {
      component.surveyQuestions = [makeQuestion({ type: 'radio', required: true })]
      component.buildQuestionForm()
      const ctrl = (component.questionForm.get('responses') as FormArray).at(0)
      expect(ctrl.valid).toBe(false)
    })

    it('should apply Validators.required for required textArea', () => {
      component.surveyQuestions = [makeQuestion({ type: 'textArea', required: true })]
      component.buildQuestionForm()
      const ctrl = (component.questionForm.get('responses') as FormArray).at(0)
      expect(ctrl.valid).toBe(false) // empty string with required → invalid
    })
  })

  // ─── onSubmit – peer id fallbacks ─────────────────────────────────────────

  describe('onSubmit – peer id fallbacks', () => {
    it('should use userId when id is absent on a peer object', () => {
      component.initializeForm()
      component.surveyQuestions = [makeQuestion({ id: 'q1', type: 'textArea' })]
      component.buildQuestionForm()
      component.responses.at(0).setValue('answer')
      component.selectedPeers = { peers: [{ userId: 'peerByUserId' }], isValid: true }
      component.uploadedDocuments = []
      component.onSubmit()
      const payload = peerValidationServiceMock.submitSurvey.mock.calls[0][0]
      expect(payload.peerIds).toContain('peerByUserId')
    })

    it('should use the peer itself when neither id nor userId is present', () => {
      component.initializeForm()
      component.surveyQuestions = [makeQuestion({ id: 'q1', type: 'textArea' })]
      component.buildQuestionForm()
      component.responses.at(0).setValue('answer')
      component.selectedPeers = { peers: ['plainPeerId'], isValid: true }
      component.uploadedDocuments = []
      component.onSubmit()
      const payload = peerValidationServiceMock.submitSurvey.mock.calls[0][0]
      expect(payload.peerIds).toContain('plainPeerId')
    })
  })
})
