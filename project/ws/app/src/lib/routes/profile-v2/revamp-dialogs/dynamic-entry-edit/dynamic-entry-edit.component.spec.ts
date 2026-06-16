import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ReactiveFormsModule } from '@angular/forms'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'

import { MatButtonModule } from '@angular/material/button'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatNativeDateModule } from '@angular/material/core'
import { MatRadioModule } from '@angular/material/radio'
import { MatSelectModule } from '@angular/material/select'
import { MatTooltipModule } from '@angular/material/tooltip'

import {
  DynamicEntryEditComponent,
  FieldConfig,
} from './dynamic-entry-edit.component'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function createComponent(
  editConfig: FieldConfig[],
  entryDetails: any = null,
  header = 'Test Form',
): ComponentFixture<DynamicEntryEditComponent> {
  TestBed.configureTestingModule({
    declarations: [DynamicEntryEditComponent],
    imports: [
      ReactiveFormsModule,
      NoopAnimationsModule,
      MatButtonModule,
      MatCheckboxModule,
      MatDatepickerModule,
      MatNativeDateModule,
      MatFormFieldModule,
      MatIconModule,
      MatInputModule,
      MatRadioModule,
      MatSelectModule,
      MatTooltipModule,
    ],
    providers: [
      { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
      {
        provide: MAT_DIALOG_DATA,
        useValue: { header, entryDetails, editConfig },
      },
      { provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } },
    ],
  }).compileComponents()

  const fixture = TestBed.createComponent(DynamicEntryEditComponent)
  fixture.detectChanges()
  return fixture
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('DynamicEntryEditComponent', () => {

  afterEach(() => TestBed.resetTestingModule())

  // ── Initialisation ─────────────────────────────────────────────────────────

  describe('initialisation', () => {
    it('should create the component', () => {
      const fixture = createComponent([])
      expect(fixture.componentInstance).toBeTruthy()
    })

    it('should set header from dialog data', () => {
      const fixture = createComponent([], null, 'My Header')
      expect(fixture.componentInstance.header).toBe('My Header')
    })

    it('should deep-clone entryDetails', () => {
      const entry = { title: 'original' }
      const fixture = createComponent([], entry)
      expect(fixture.componentInstance.entryDetails).toEqual(entry)
      // Mutation on component should not affect original
      fixture.componentInstance.entryDetails.title = 'mutated'
      expect(entry.title).toBe('original')
    })
  })

  // ── Form building ──────────────────────────────────────────────────────────

  describe('buildForm()', () => {
    it('should create a form control for each non info-text field', () => {
      const config: FieldConfig[] = [
        { type: 'text', key: 'name', label: 'Name' },
        { type: 'textarea', key: 'bio', label: 'Bio' },
        { type: 'info-text', key: '_note', text: 'Some note' },
      ]
      const fixture = createComponent(config)
      const form = fixture.componentInstance.entryForm
      expect(form.get('name')).toBeTruthy()
      expect(form.get('bio')).toBeTruthy()
      expect(form.get('_note')).toBeNull()
    })

    it('should patch entryDetails value into the control', () => {
      const config: FieldConfig[] = [{ type: 'text', key: 'title', label: 'Title' }]
      const fixture = createComponent(config, { title: 'Prefilled' })
      expect(fixture.componentInstance.entryForm.get('title')?.value).toBe('Prefilled')
    })

    it('should use defaultValue when entryDetails is null', () => {
      const config: FieldConfig[] = [{ type: 'text', key: 'mode', defaultValue: 'Online' }]
      const fixture = createComponent(config, null)
      expect(fixture.componentInstance.entryForm.get('mode')?.value).toBe('Online')
    })

    it('should use valueKey dot-path to resolve value', () => {
      const config: FieldConfig[] = [
        { type: 'text', key: 'courseTitle', valueKey: 'contextData.title' },
      ]
      const fixture = createComponent(config, { contextData: { title: 'Deep Value' } })
      expect(fixture.componentInstance.entryForm.get('courseTitle')?.value).toBe('Deep Value')
    })

    it('should create Hours and Minutes controls for duration type', () => {
      const config: FieldConfig[] = [{ type: 'duration', key: 'learningTime' }]
      const fixture = createComponent(config)
      const form = fixture.componentInstance.entryForm
      expect(form.get('learningTimeHours')).toBeTruthy()
      expect(form.get('learningTimeMinutes')).toBeTruthy()
    })

    it('should create a search control for searchable-select', () => {
      const config: FieldConfig[] = [
        { type: 'searchable-select', key: 'org', options: [] },
      ]
      const fixture = createComponent(config)
      expect(fixture.componentInstance.entryForm.get('_search_org')).toBeTruthy()
    })

    it('should add Validators.required when required is true', () => {
      const config: FieldConfig[] = [{ type: 'text', key: 'fname', required: true }]
      const fixture = createComponent(config)
      const ctrl = fixture.componentInstance.entryForm.get('fname')!
      ctrl.setValue('')
      ctrl.markAsTouched()
      expect(ctrl.hasError('required')).toBeTrue()
    })

    it('should add maxLength validator', () => {
      const config: FieldConfig[] = [{ type: 'text', key: 'bio', maxLength: 5 }]
      const fixture = createComponent(config)
      const ctrl = fixture.componentInstance.entryForm.get('bio')!
      ctrl.setValue('toolongvalue')
      ctrl.markAsTouched()
      expect(ctrl.hasError('maxlength')).toBeTrue()
    })

    it('should add URL pattern validator for url type', () => {
      const config: FieldConfig[] = [{ type: 'url', key: 'link' }]
      const fixture = createComponent(config)
      const ctrl = fixture.componentInstance.entryForm.get('link')!
      ctrl.setValue('not-a-url')
      ctrl.markAsTouched()
      expect(ctrl.hasError('pattern')).toBeTrue()
    })
  })

  // ── groupedFields ──────────────────────────────────────────────────────────

  describe('groupedFields', () => {
    it('should group fields sharing the same row value together', () => {
      const config: FieldConfig[] = [
        { type: 'text', key: 'a', row: 'r1' },
        { type: 'text', key: 'b', row: 'r1' },
        { type: 'text', key: 'c' },
      ]
      const fixture = createComponent(config)
      const groups = fixture.componentInstance.groupedFields
      const rowGroup = groups.find(g => g.length === 2)
      expect(rowGroup).toBeTruthy()
      expect(rowGroup!.map(f => f.key)).toEqual(['a', 'b'])
    })

    it('should place fields without a row in their own solo group', () => {
      const config: FieldConfig[] = [
        { type: 'text', key: 'solo1' },
        { type: 'text', key: 'solo2' },
      ]
      const fixture = createComponent(config)
      const groups = fixture.componentInstance.groupedFields
      expect(groups.length).toBe(2)
      groups.forEach(g => expect(g.length).toBe(1))
    })
  })

  // ── isFieldVisible ─────────────────────────────────────────────────────────

  describe('isFieldVisible()', () => {
    it('should return true when no conditionalOn is set', () => {
      const config: FieldConfig[] = [{ type: 'text', key: 'field' }]
      const fixture = createComponent(config)
      expect(fixture.componentInstance.isFieldVisible(config[0])).toBeTrue()
    })

    it('should show field when === condition matches', () => {
      const config: FieldConfig[] = [
        { type: 'select', key: 'degree', options: [] },
        {
          type: 'text', key: 'otherDegree',
          conditionalOn: { key: 'degree', value: 'Other', operator: '===' },
        },
      ]
      const fixture = createComponent(config)
      fixture.componentInstance.entryForm.get('degree')!.setValue('Other')
      expect(fixture.componentInstance.isFieldVisible(config[1])).toBeTrue()
    })

    it('should hide field when === condition does not match', () => {
      const config: FieldConfig[] = [
        { type: 'select', key: 'degree', options: [] },
        {
          type: 'text', key: 'otherDegree',
          conditionalOn: { key: 'degree', value: 'Other', operator: '===' },
        },
      ]
      const fixture = createComponent(config)
      fixture.componentInstance.entryForm.get('degree')!.setValue('MBA')
      expect(fixture.componentInstance.isFieldVisible(config[1])).toBeFalse()
    })

    it('should apply !== operator correctly', () => {
      const config: FieldConfig[] = [
        { type: 'checkbox', key: 'working' },
        {
          type: 'date', key: 'endDate',
          conditionalOn: { key: 'working', value: true, operator: '!==' },
        },
      ]
      const fixture = createComponent(config)
      fixture.componentInstance.entryForm.get('working')!.setValue(false)
      expect(fixture.componentInstance.isFieldVisible(config[1])).toBeTrue()
      fixture.componentInstance.entryForm.get('working')!.setValue(true)
      expect(fixture.componentInstance.isFieldVisible(config[1])).toBeFalse()
    })
  })

  // ── getYearsForField ───────────────────────────────────────────────────────

  describe('getYearsForField()', () => {
    it('should return years from current year down to yearFrom', () => {
      const field: FieldConfig = { type: 'year-select', key: 'y', yearFrom: 2020 }
      const fixture = createComponent([field])
      const years = fixture.componentInstance.getYearsForField(field)
      expect(years[0]).toBe(String(new Date().getFullYear()))
      expect(years[years.length - 1]).toBe('2020')
    })

    it('should default yearFrom to 1900 when not specified', () => {
      const field: FieldConfig = { type: 'year-select', key: 'y' }
      const fixture = createComponent([field])
      const years = fixture.componentInstance.getYearsForField(field)
      expect(years[years.length - 1]).toBe('1900')
    })
  })

  // ── File upload ────────────────────────────────────────────────────────────

  describe('file upload', () => {
    function makeFile(name: string, sizeMB = 1, type = 'image/png'): File {
      const bytes = new Uint8Array(sizeMB * 1024 * 1024)
      return new File([bytes], name, { type })
    }

    it('should reject unsupported file types', () => {
      const config: FieldConfig[] = [{ type: 'image', key: 'doc', accept: '.png,.pdf' }]
      const fixture = createComponent(config)
      const snackBar: jasmine.Spy = TestBed.inject(MatSnackBar).open as jasmine.Spy

      const files = { 0: makeFile('test.exe', 0.1, 'application/x-msdownload'), length: 1 } as unknown as FileList
      fixture.componentInstance.onFileSelected(config[0], files)
      expect(snackBar).toHaveBeenCalled()
    })

    it('should reject files exceeding maxSizeMB', () => {
      const config: FieldConfig[] = [{ type: 'image', key: 'doc', accept: '.png', maxSizeMB: 1 }]
      const fixture = createComponent(config)
      const snackBar: jasmine.Spy = TestBed.inject(MatSnackBar).open as jasmine.Spy

      const files = { 0: makeFile('big.png', 2, 'image/png'), length: 1 } as unknown as FileList
      fixture.componentInstance.onFileSelected(config[0], files)
      expect(snackBar).toHaveBeenCalled()
    })

    it('should accept valid file and store it', () => {
      const config: FieldConfig[] = [{ type: 'image', key: 'doc', accept: '.png', maxSizeMB: 5 }]
      const fixture = createComponent(config)

      const files = { 0: makeFile('photo.png', 1, 'image/png'), length: 1 } as unknown as FileList
      fixture.componentInstance.onFileSelected(config[0], files)

      expect(fixture.componentInstance.getFileName(config[0])).toBe('photo.png')
      expect(fixture.componentInstance.entryForm.get('doc')?.value).toBeInstanceOf(File)
    })

    it('should clear file on removeFile()', () => {
      const config: FieldConfig[] = [{ type: 'image', key: 'doc', accept: '.png', maxSizeMB: 5 }]
      const fixture = createComponent(config)

      const files = { 0: makeFile('photo.png', 1, 'image/png'), length: 1 } as unknown as FileList
      fixture.componentInstance.onFileSelected(config[0], files)
      fixture.componentInstance.removeFile(config[0])

      expect(fixture.componentInstance.getFileName(config[0])).toBe('')
    })
  })

  // ── hasError / getFirstError ───────────────────────────────────────────────

  describe('error helpers', () => {
    it('hasError() should return false when control is untouched', () => {
      const config: FieldConfig[] = [{ type: 'text', key: 'f', required: true }]
      const fixture = createComponent(config)
      expect(fixture.componentInstance.hasError('f', 'required')).toBeFalse()
    })

    it('hasError() should return true when control is touched and invalid', () => {
      const config: FieldConfig[] = [{ type: 'text', key: 'f', required: true }]
      const fixture = createComponent(config)
      const ctrl = fixture.componentInstance.entryForm.get('f')!
      ctrl.markAsTouched()
      expect(fixture.componentInstance.hasError('f', 'required')).toBeTrue()
    })

    it('getFirstError() should return null for valid untouched control', () => {
      const config: FieldConfig[] = [{ type: 'text', key: 'f' }]
      const fixture = createComponent(config)
      expect(fixture.componentInstance.getFirstError(config[0])).toBeNull()
    })

    it('getFirstError() should return custom errorMessage when provided', () => {
      const config: FieldConfig[] = [
        {
          type: 'text', key: 'f', required: true,
          errorMessages: { required: 'Custom required message' },
        },
      ]
      const fixture = createComponent(config)
      const ctrl = fixture.componentInstance.entryForm.get('f')!
      ctrl.markAsTouched()
      expect(fixture.componentInstance.getFirstError(config[0])).toBe('Custom required message')
    })
  })

  // ── handleSubmit ───────────────────────────────────────────────────────────

  describe('handleSubmit()', () => {
    it('should mark all controls touched and NOT close dialog when form is invalid', () => {
      const config: FieldConfig[] = [{ type: 'text', key: 'name', required: true }]
      const fixture = createComponent(config)
      const dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<DynamicEntryEditComponent>>

      fixture.componentInstance.handleSubmit()
      expect(dialogRef.close).not.toHaveBeenCalled()
      expect(fixture.componentInstance.entryForm.get('name')!.touched).toBeTrue()
    })

    it('should close dialog with formValue when form is valid', () => {
      const config: FieldConfig[] = [{ type: 'text', key: 'name' }]
      const fixture = createComponent(config)
      const dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<DynamicEntryEditComponent>>
      fixture.componentInstance.entryForm.get('name')!.setValue('Alice')

      fixture.componentInstance.handleSubmit()
      expect(dialogRef.close).toHaveBeenCalledWith(
        jasmine.objectContaining({ formValue: jasmine.objectContaining({ name: 'Alice' }) }),
      )
    })
  })

  // ── handleCancel ───────────────────────────────────────────────────────────

  describe('handleCancel()', () => {
    it('should close dialog without a value', () => {
      const fixture = createComponent([])
      const dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<DynamicEntryEditComponent>>
      fixture.componentInstance.handleCancel()
      expect(dialogRef.close).toHaveBeenCalledWith()
    })
  })

  // ── getCharCount ───────────────────────────────────────────────────────────

  describe('getCharCount()', () => {
    it('should return the character length of the control value', () => {
      const config: FieldConfig[] = [{ type: 'text', key: 'bio' }]
      const fixture = createComponent(config)
      fixture.componentInstance.entryForm.get('bio')!.setValue('hello')
      expect(fixture.componentInstance.getCharCount('bio')).toBe(5)
    })

    it('should return 0 for empty value', () => {
      const config: FieldConfig[] = [{ type: 'text', key: 'bio' }]
      const fixture = createComponent(config)
      expect(fixture.componentInstance.getCharCount('bio')).toBe(0)
    })
  })

})
