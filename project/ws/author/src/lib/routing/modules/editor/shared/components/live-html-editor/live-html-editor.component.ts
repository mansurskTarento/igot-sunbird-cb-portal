import {
  Component,
  Input,
  Self,
  Optional,
  ElementRef,
  SimpleChanges,
  OnChanges,
  DoCheck,
  OnDestroy,
} from '@angular/core'

import {
  NgControl,
  NgForm,
  FormGroupDirective,
  UntypedFormControl,
} from '@angular/forms'

import { ErrorStateMatcher } from '@angular/material/core'
import { MatFormFieldControl } from '@angular/material/form-field'

import { Subject } from 'rxjs'

import { QuillComponent } from '../rich-text-editor/quill.component'

let nextUniqueId = 0

@Component({
  selector: 'ws-auth-root-live-html-editor',
  template: '',
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: LiveHtmlEditorComponent,
    },
  ],
  standalone: false,
})
export class LiveHtmlEditorComponent
  extends QuillComponent
  implements
  OnChanges,
  DoCheck,
  OnDestroy,
  MatFormFieldControl<string> {
  @Input()
  public placeholder = ''

  @Input()
  public required = false

  public errorStateMatcher: ErrorStateMatcher

  public errorState = false

  public readonly stateChanges = new Subject<void>()

  public readonly shouldLabelFloat = true

  private _disabled = false

  private _id = ''

  private _uid = `live-html-editor-${++nextUniqueId}`

  constructor(
    el: ElementRef,
    private _defaultErrorStateMatcher: ErrorStateMatcher,
    @Optional() private _parentForm: NgForm,
    @Optional() private _parentFormGroup: FormGroupDirective,
    @Self() @Optional() public readonly ngControl: NgControl,
  ) {
    super(el)

    this.errorStateMatcher = this._defaultErrorStateMatcher

    if (this.ngControl) {
      this.ngControl.valueAccessor = this
    }
  }

  @Input()
  get value(): any {
    return this.getValue()
  }

  set value(value: any) {
    if (this.editor && value !== this.value) {
      this.editor.setContents(value)
      this.stateChanges.next()
    }
  }

  @Input()
  get disabled(): boolean {
    if (this.ngControl?.disabled != null) {
      return this.ngControl.disabled
    }

    return this._disabled
  }

  set disabled(disabled: boolean) {
    this._disabled = disabled
    this.stateChanges.next()
  }

  @Input()
  get id(): string {
    return this._id
  }

  set id(id: string) {
    this._id = id || this._uid
    this.stateChanges.next()
  }

  get empty(): boolean {
    return !this.value
  }

  get focused(): boolean {
    return !!this.editor?.hasFocus()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] || changes['required']) {
      this.stateChanges.next()
    }
  }

  ngDoCheck(): void {
    if (this.ngControl) {
      this.updateErrorState()
    }
  }

  ngOnDestroy(): void {
    this.stateChanges.complete()
  }

  onContainerClick(): void {
    if (!this.focused) {
      this.focus()
    }
  }

  focus(): void {
    if (this.editor) {
      this.editor.focus()
      this.stateChanges.next()
    }
  }

  updateErrorState(): void {
    const oldState = this.errorState

    const parent = this._parentFormGroup || this._parentForm

    const control = this.ngControl
      ? (this.ngControl.control as UntypedFormControl)
      : null

    const newState = this.errorStateMatcher.isErrorState(
      control,
      parent,
    )

    if (newState !== oldState) {
      this.errorState = newState
      this.stateChanges.next()
    }
  }

  setDescribedByIds(): void {
    // Required by MatFormFieldControl
  }
}