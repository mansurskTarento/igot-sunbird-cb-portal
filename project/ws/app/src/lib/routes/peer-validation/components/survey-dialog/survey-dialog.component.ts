import { Component, Inject, OnInit, ViewChild } from '@angular/core'
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog'
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms'
import { MatStepper } from '@angular/material/stepper'
import { NSPeerValidation } from '../../models/peer-validation.model'
import { PeerValidationService } from '../../services/peer-validation.service'
import { SuccessDialogComponent } from './components/success-dialog/success-dialog.component'

@Component({
  selector: 'ws-app-survey-dialog',
  templateUrl: './survey-dialog.component.html',
  styleUrls: ['./survey-dialog.component.scss'],
})
export class SurveyDialogComponent implements OnInit {
  @ViewChild('stepper') stepper!: MatStepper

  currentStep = 0
  surveyQuestions: NSPeerValidation.ISurveyQuestion[] = []
  questionForm!: FormGroup
  uploadedDocuments: NSPeerValidation.IUploadedDocument[] = []
  selectedPeers = {
    reportingOfficer: null,
    peer: null,
    subordinate: null,
  }

  constructor(
    public dialogRef: MatDialogRef<SurveyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NSPeerValidation.ISurveyPopupData,
    private fb: FormBuilder,
    private peerValidationService: PeerValidationService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.loadSurveyQuestions()
    this.initializeForm()
  }

  loadSurveyQuestions() {
    this.peerValidationService.getSurveyQuestions().subscribe({
      next: questions => {
        this.surveyQuestions = questions
        this.buildQuestionForm()
      },
    })
  }

  initializeForm() {
    this.questionForm = this.fb.group({
      responses: this.fb.array([]),
    })
  }

  buildQuestionForm() {
    const responsesArray = this.questionForm.get('responses') as FormArray
    this.surveyQuestions.forEach(question => {
      if (question.type === 'rating') {
        responsesArray.push(this.fb.control(null, Validators.required))
      } else if (question.type === 'multi-select') {
        // For multi-select, we need a custom validator to ensure at least one option is selected
        responsesArray.push(this.fb.control([], [Validators.required, (control) => {
          return control.value && control.value.length > 0 ? null : { required: true }
        }]))
      } else {
        responsesArray.push(this.fb.control('', Validators.required))
      }
    })
  }

  get responses(): FormArray {
    return this.questionForm.get('responses') as FormArray
  }

  onStepChange(event: any) {
    this.currentStep = event.selectedIndex
  }

  onDocumentsChanged(documents: NSPeerValidation.IUploadedDocument[]) {
    this.uploadedDocuments = documents
  }

  onPeersChanged(peers: any) {
    this.selectedPeers = peers
  }

  canProceedToStep2(): boolean {
    return this.questionForm.valid
  }

  isStep2Completed = false

  completeStep2() {
    this.isStep2Completed = true
    // Wait for view update
    setTimeout(() => {
      this.stepper.next()
    }, 0)
  }

  isStepCompleted(index: number): boolean {
    if (index === 0) {
      return this.questionForm.valid
    } else if (index === 1) {
      return this.isStep2Completed
    }
    return false
  }

  canSubmit(): boolean {
    return this.selectedPeers.reportingOfficer !== null && this.selectedPeers.peer !== null
  }

  onSubmit() {
    if (!this.canSubmit()) {
      return
    }

    const submission: NSPeerValidation.ISurveySubmission = {
      courseId: this.data.courseId,
      responses: this.surveyQuestions.map((q, index) => ({
        questionId: q.id,
        value: this.responses.at(index).value,
      })),
      documents: this.uploadedDocuments,
      reportingOfficer: this.selectedPeers.reportingOfficer,
      peer: this.selectedPeers.peer,
      subordinate: this.selectedPeers.subordinate,
    }
    console.log('Submitting survey:', submission)
    this.peerValidationService.submitSurvey(submission).subscribe({
      next: () => {
        this.dialogRef.close()
        this.showSuccessDialog()
      },
      error: err => {
        console.error('Submission error:', err)
        alert('Failed to submit survey. Please try again.')
      },
    })
  }

  showSuccessDialog() {
    this.dialog.open(SuccessDialogComponent, {
      width: '400px',
      disableClose: true,
    })
  }

  onClose() {
    this.dialogRef.close()
  }
}
