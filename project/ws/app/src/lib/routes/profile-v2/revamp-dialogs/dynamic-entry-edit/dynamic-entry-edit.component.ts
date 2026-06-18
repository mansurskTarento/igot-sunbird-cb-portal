import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import * as _ from 'lodash'
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { generateYears, URL_PATRON } from '../../models/profile-revamp.model'
import { ProfileV2RevampService } from '../../services/profile-v2-revamp.service'
import { NsUserProfileDetails } from '../../../user-profile/models/NsUserProfile'
import { ConfigDetails } from '@sunbird-cb/consumption'
import { HttpErrorResponse } from '@angular/common/http'

// ─────────────────────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export type FieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'searchable-select'
  | 'designation-select'   // loads designations via ProfileV2RevampService (igot or default)
  | 'organisation-select'  // loads MDO organisations via UserProfileService.getOrganizationData
  | 'date'
  | 'checkbox'
  | 'radio'
  | 'image'
  | 'url'
  | 'year-select'
  | 'number'
  | 'duration'
  | 'info-text'
  | 'degree-select'         // loads degrees via ProfileV2RevampService.getEducationsQualificationsSearch
  | 'institution-select'   // loads institutions via ProfileV2RevampService.getEducationsQualificationsSearch

export interface SelectOption {
  label: string
  value: any
  disabled?: boolean
}

/**
 * When `operator` is '===' (default): show this field when referenced key === value
 * When `operator` is '!=='            : show this field when referenced key !== value
 * When `operator` is 'includes'       : show this field when referenced key (array) includes value
 */
export interface ConditionalConfig {
  key: string
  value: any
  operator?: '===' | '!==' | 'includes'
}

// date must be less than given dependent date (e.g. startDate < endDate)
export function dateDependencySmallerValidator(dependentControlName: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const endDate = control?.parent?.get(dependentControlName)?.value
    const startDate = control?.value

    if (!startDate) {
      return null // Skip validation if startDate is not set
    }

    if (endDate && new Date(startDate) > new Date(endDate)) {
      return { dateGreaterThanGivenDate: true }
    }

    return null // Valid
  }
}

// date must be greater than given dependent date (e.g. endDate > startDate)
export function dateDependencyGreaterValidator(dependentControlName: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const endDate = control?.parent?.get(dependentControlName)?.value
    const startDate = control?.value

    if (!startDate) {
      return null // Skip validation if startDate is not set
    }

    if (endDate && new Date(startDate) < new Date(endDate)) {
      return { dateLesserThanGivenDate: true }
    }

    return null // Valid
  }
}

/**
 * FieldConfig — describes a single form control rendered by DynamicEntryEditComponent.
 *
 * Common properties
 * -----------------
 * type        : controls the rendered widget (text / textarea / select / etc.)
 * key         : FormControl name — also used to read/write entryDetails unless valueKey is set
 * label       : display label shown above the field
 * placeholder : placeholder shown inside the field
 * required    : adds Validators.required
 * disabled    : disables the control
 * defaultValue: fallback value when entryDetails has no value for this key
 * valueKey    : dot-notation path into entryDetails (e.g. 'contextData.title')
 * maxLength   : adds Validators.maxLength
 * minLength   : adds Validators.minLength
 * hint        : hint text shown below the field
 * infoText    : shown as a tooltip on an info icon next to the label
 * row         : fields sharing the same row value appear side-by-side
 * conditionalOn: show this field only when another field meets a condition
 * validators  : extra ValidatorFn[] appended after built-in validators
 * errorMessages: key→message map for overriding default error messages
 *
 * Type-specific properties
 * ------------------------
 * options          (select / searchable-select / radio): list of choices
 * searchPlaceholder(searchable-select): placeholder inside the search input
 * minDate / maxDate(date): min/max date constraints
 * readonly         (date): prevents manual keyboard input into date field
 * accept           (image): accepted file extensions e.g. '.png,.jpg,.pdf'
 * maxSizeMB        (image): max file size in MB (default 5)
 * yearFrom         (year-select): earliest year (default 1900)
 * text             (info-text): static text to display
 */
export interface FieldConfig {
  type: FieldType
  key: string
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  defaultValue?: any
  /**
   * valuePath — dot-notation path in entryDetails to READ the initial value from (for patching).
   * Takes precedence over valueKey and key when resolving the initial form value.
   * Example: 'professionalDetails[0].designation'
   */
  valuePath?: string
  /** @deprecated use valuePath instead */
  valueKey?: string
  options?: SelectOption[]
  maxLength?: number
  minLength?: number
  hint?: string
  infoText?: string
  row?: number | string
  conditionalOn?: ConditionalConfig
  validators?: ValidatorFn[]
  readonly?: boolean
  // date
  minDate?: Date | null
  maxDate?: Date | null
  // image / file
  accept?: string
  maxSizeMB?: number
  // searchable-select
  searchPlaceholder?: string
  // year-select
  yearFrom?: number
  // info-text
  text?: string
  // error message overrides
  errorMessages?: Record<string, string>
  /**
   * dependencyField — key of another field this field depends on.
   * - For designation-select: if the org field has no value, designation stays disabled.
   *   When org is selected, uses that org's rootOrgId to check/load designations.
   * - For select with optionsSource 'districts': loads districts when this state field changes.
   */
  dependencyField?: string
  /**
   * optionsSource — name of a built-in function that provides options for a 'select' field.
   * Supported values:
   *   'states'    → calls ProfileV2RevampService.getStatesList() → populates as { label, value }
   *   'districts' → calls ProfileV2RevampService.getDistrictsList(dependencyField value)
   *                 Requires dependencyField pointing to the state key.
   *                 Disables the control when the state field is empty.
   */
  optionsSource?: 'states' | 'districts'
  /**
   * pattern — regex string for Validators.pattern(). Use this instead of `validators` for JSON configs
   * where actual ValidatorFn objects cannot be serialized.
   * Example: '^[a-zA-Z0-9\\s.,\'-]*$'
   */
  pattern?: string
  dateDependencySmallerValidator?: string
  dateDependencyGreaterValidator?: string
  /**
   * disableDependency — keep this field visible but disable (and reset) it when the condition is met.
   * When the condition is no longer met the field is re-enabled.
   * Example: { key: 'currentlyWorking', value: true } disables endDate while checkbox is checked.
   */
  disableDependency?: ConditionalConfig
  /**
   * canUpdate — if false and editing (entryDetails exists), this field will be disabled and read-only.
   * Useful for fields that should not be editable after creation.
   * Example: canUpdate: false prevents editing of designation once set.
   */
  canUpdate?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────


@Component({
  selector: 'ws-app-dynamic-entry-edit',
  templateUrl: './dynamic-entry-edit.component.html',
  styleUrls: ['./dynamic-entry-edit.component.scss'],
  standalone: false,
})
export class DynamicEntryEditComponent implements OnInit {

  // ── Dependency Injection ────────────────────────────────────────
  private readonly fb = inject(FormBuilder)
  private readonly dialogRef = inject(MatDialogRef<DynamicEntryEditComponent>)
  private readonly data = inject<any>(MAT_DIALOG_DATA)
  private readonly snackBar = inject(MatSnackBar)
  private readonly destroyRef = inject(DestroyRef)
  private readonly profileV2RevampSvc = inject(ProfileV2RevampService)
  private readonly configSvc = inject(ConfigurationsService)

  // ── Config — received once, never changes ───────────────────────────
  readonly header: string = _.get(this.data, 'header', '')
  readonly entryDetails: any = _.cloneDeep(_.get(this.data, 'entryDetails', _.get(this.data, 'profileDetails', null)))
  readonly editConfig: ReadonlyArray<FieldConfig> = _.get(this.data, 'editConfig.fields', [])
  readonly apiConfig = _.get(this.data, 'editConfig.apiConfig', null)
  readonly todayDate = new Date()

  /** Rows computed once at construction — config never changes after open. */
  readonly groupedFields: ReadonlyArray<ReadonlyArray<FieldConfig>> = this.computeGroupedFields()

  // ── Signals ─────────────────────────────────────────────────────────
  /**
   * Filtered option lists for searchable-select fields.
   * Wrapped in a signal so OnPush change detection picks up every update.
   */
  readonly filteredOptions = signal<Record<string, SelectOption[]>>(
    (this.editConfig as FieldConfig[])
      .filter(f => f.type === 'searchable-select')
      .reduce<Record<string, SelectOption[]>>((acc, f) => {
        acc[f.key] = [...(f.options ?? [])]
        return acc
      }, {})
  )

  // ── Form ────────────────────────────────────────────────────────────
  entryForm!: FormGroup

  private readonly yearListCache = new Map<number, ReadonlyArray<string>>()

  // ── Designation-select state (one entry per designation-select field key) ─
  orgHasDesignations = false
  /** Cache: rootOrgId → whether that org has igot designations. Avoids re-checking on every dropdown open. */
  private orgDesignationFlagCache: Record<string, boolean> = {}
  /** Set to true before programmatic searchCtrl.setValue('') to suppress the search listener. */
  private designationSearchOpenClear: Record<string, boolean> = {}
  designationsMeta: Record<string, any[]> = {}
  designationsTotalCount: Record<string, number> = {}
  designationsOffset: Record<string, number> = {}
  designationSearchText: Record<string, string> = {}
  isLoadingMoreDesignations: Record<string, boolean> = {}
  readonly designationListLoadCount = 50

  // ── Organisation-select state (one entry per organisation-select field key) ─
  orgSelectData: Record<string, any[]> = {}
  orgSelectTotalCount: Record<string, number> = {}
  orgSelectSearchText: Record<string, string> = {}
  isLoadingMoreOrg: Record<string, boolean> = {}
  selectedOrgId: Record<string, string> = {}
  /** rootOrgId of the selected org — used by dependent designation fields */
  selectedOrgRootOrgId: Record<string, string> = {}
  readonly orgDefaultLoadCount = 50

  // ── optionsSource: states / districts ────────────────────────────────────
  /** Dynamic options loaded via optionsSource for 'select' fields */
  dynamicOptions: Record<string, SelectOption[]> = {}

  // ── Degree-select state (one entry per degree-select field key) ──────────
  degreesMeta: Record<string, any[]> = {}
  degreesTotalCount: Record<string, number> = {}
  degreesOffset: Record<string, number> = {}
  degreesSearchText: Record<string, string> = {}
  isLoadingMoreDegrees: Record<string, boolean> = {}
  private degreeScrollHandlers: Record<string, EventListener> = {}
  private activeDegreeField: FieldConfig | null = null
  readonly degreeListLoadCount = 50

  // ── Institution-select state (one entry per institution-select field key) ─
  institutionsMeta: Record<string, any[]> = {}
  institutionsTotalCount: Record<string, number> = {}
  institutionsOffset: Record<string, number> = {}
  institutionsSearchText: Record<string, string> = {}
  isLoadingMoreInstitutions: Record<string, boolean> = {}
  private institutionScrollHandlers: Record<string, EventListener> = {}
  private activeInstitutionField: FieldConfig | null = null
  readonly institutionListLoadCount = 50
  eUserGender = Object.keys(NsUserProfileDetails.EUserGender)
  eCategory = Object.keys(NsUserProfileDetails.ECategory)
  masterLanguageBackup: any
  isMatcompleteOpened: boolean = false

  // ── Lifecycle ────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.buildForm()
    this.setupSearchListeners()
    this.initDesignationFields()
    this.initOrganisationFields()
    this.initOptionSourceFields()
    this.initEducationalQualFields()
    this.setupDependencyWatchers()
    this.setupDisableDependencyWatchers()
  }

  // ── Form Building ──────────────────────────────────────────────────────────

  private buildForm(): void {
    const controls: Record<string, any> = {}
    const isEditMode = !!this.entryDetails

    for (const field of this.editConfig) {
      if (field.type === 'info-text') {
        continue
      }

      const value = this.resolveValue(field)
      const validators = this.buildValidators(field)
      const shouldDisable = field.disabled || (isEditMode && field.canUpdate === false)

      if (field.type === 'duration') {
        const hoursVal = _.get(this.entryDetails, `${field.valuePath}Hours`,
          _.get(field.defaultValue, 'hours', null))
        const minsVal = _.get(this.entryDetails, `${field.valuePath}Minutes`,
          _.get(field.defaultValue, 'minutes', null))
        controls[`${field.key}Hours`] = [this.wrapControlValue(hoursVal, shouldDisable), [Validators.pattern(/^\d+$/), Validators.min(0), Validators.max(100)]]
        controls[`${field.key}Minutes`] = [this.wrapControlValue(minsVal, shouldDisable), [Validators.pattern(/^\d+$/), Validators.min(0), Validators.max(59)]]

      } else if (field.type === 'searchable-select' || field.type === 'designation-select' || field.type === 'organisation-select' || field.type === 'degree-select' || field.type === 'institution-select') {
        controls[field.key] = [this.wrapControlValue(value, shouldDisable), validators]
        controls[`_search_${field.key}`] = ['']
        if (field.type === 'searchable-select') {
          // pre-populate filteredOptions for static options
          this.filteredOptions.update(prev => ({ ...prev, [field.key]: [...(field.options ?? [])] }))
        } else if (this.isDesignationField(field)) {
          // designation-select: options loaded via API after init
          this.designationsMeta[field.key] = []
          this.designationsTotalCount[field.key] = 0
          this.designationsOffset[field.key] = 0
          this.designationSearchText[field.key] = ''
          this.isLoadingMoreDesignations[field.key] = false
        } else if (this.isOrgField(field)) {
          // organisation-select: options loaded via API after init
          this.orgSelectData[field.key] = []
          this.orgSelectTotalCount[field.key] = 0
          this.orgSelectSearchText[field.key] = ''
          this.isLoadingMoreOrg[field.key] = false
          this.selectedOrgId[field.key] = ''
        } else if (this.isDegreeField(field)) {
          this.degreesMeta[field.key] = []
          this.degreesTotalCount[field.key] = 0
          this.degreesOffset[field.key] = 0
          this.degreesSearchText[field.key] = ''
          this.isLoadingMoreDegrees[field.key] = false
        } else if (this.isInstitutionField(field)) {
          this.institutionsMeta[field.key] = []
          this.institutionsTotalCount[field.key] = 0
          this.institutionsOffset[field.key] = 0
          this.institutionsSearchText[field.key] = ''
          this.isLoadingMoreInstitutions[field.key] = false
        }
      } else if (field.type === 'image') {
        const required = !shouldDisable && field.required ? [Validators.required] : []
        controls[field.key] = [this.wrapControlValue(value || '', shouldDisable), required]
        controls[`_fileName_${field.key}`] = [_.get(this.entryDetails, 'fileName', '') || '']

      } else {
        controls[field.key] = [this.wrapControlValue(value, shouldDisable), validators]
      }
    }

    this.entryForm = this.fb.group(controls)
  }

  private wrapControlValue(value: any, shouldDisable: boolean): any {
    return shouldDisable ? { value, disabled: true } : value
  }

  private resolveValue(field: FieldConfig): any {
    if (this.entryDetails) {
      // valuePath takes precedence — explicit dot-notation path in entryDetails
      if (field.valuePath) {
        const val = _.get(this.entryDetails, field.valuePath)
        if (val !== undefined && val !== null && val !== '') { return val }
      }
      // legacy valueKey fallback
      if (field.valueKey) {
        const val = _.get(this.entryDetails, field.valueKey)
        if (val !== undefined && val !== null && val !== '') { return val }
      }
      // try the control key directly
      const direct = _.get(this.entryDetails, field.key)
      if (direct !== undefined && direct !== null) { return direct }
    }
    return field.defaultValue !== undefined ? field.defaultValue : ''
  }

  private buildValidators(field: FieldConfig): ValidatorFn[] {
    const v: ValidatorFn[] = []
    if (field.required) { v.push(Validators.required) }
    if (field.maxLength) { v.push(Validators.maxLength(field.maxLength)) }
    if (field.minLength) { v.push(Validators.minLength(field.minLength)) }
    if (field.type === 'url') { v.push(Validators.pattern(URL_PATRON)) }
    // pattern string (JSON-serializable alternative to validators: [Validators.pattern(...)])
    if (field.pattern) { v.push(Validators.pattern(new RegExp(field.pattern))) }
    // validators array: only include actual ValidatorFn functions — skip plain JSON objects
    if (field.validators) {
      const fns = (field.validators as any[]).filter(fn => typeof fn === 'function')
      v.push(...(fns as ValidatorFn[]))
    }
    if (field.type === 'date') {
      if (field.dateDependencyGreaterValidator) {
        v.push(dateDependencyGreaterValidator(field.dateDependencyGreaterValidator))
      }
      if (field.dateDependencySmallerValidator) {
        v.push(dateDependencySmallerValidator(field.dateDependencySmallerValidator))
      }
    }
    return v
  }

  // ── Field type helpers ─────────────────────────────────────────────────────

  /** Returns true for a field that should load designations from API. */
  isDesignationField(field: FieldConfig): boolean {
    return field.type === 'designation-select'
  }

  /** Returns true for a field that should load MDO organisations from API. */
  isOrgField(field: FieldConfig): boolean {
    return field.type === 'organisation-select'
  }

  /** Returns true for a degree-select field. */
  isDegreeField(field: FieldConfig): boolean {
    return field.type === 'degree-select'
  }

  /** Returns true for an institution-select field. */
  isInstitutionField(field: FieldConfig): boolean {
    return field.type === 'institution-select'
  }

  // ── Value Change Listeners ─────────────────────────────────────────────────

  private setupSearchListeners(): void {
    for (const field of this.editConfig) {
      if (field.type !== 'searchable-select') { continue }
      const searchCtrl = this.entryForm.get(`_search_${field.key}`)
      if (!searchCtrl) { continue }
      searchCtrl.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe((query: string) => this.filterOptions(field as FieldConfig, query))
    }
  }

  private filterOptions(field: FieldConfig, query: string): void {
    const all = field.options ?? []
    const filtered = query?.trim()
      ? all.filter(o => o.label.toLowerCase().includes(query.trim().toLowerCase()))
      : [...all]
    this.filteredOptions.update(prev => ({ ...prev, [field.key]: filtered }))
  }

  // ── Designation-select ─────────────────────────────────────────────────────

  /** Called once in ngOnInit for each designation-select field. */
  private initDesignationFields(): void {
    const designationFields = (this.editConfig as FieldConfig[]).filter(f => this.isDesignationField(f))
    if (!designationFields.length) { return }

    // Pre-populate with the saved value so edit mode shows it immediately (before API responds)
    designationFields.forEach(field => {
      const current = this.entryForm.get(field.key)?.value
      if (current) {
        this.designationsMeta[field.key] = [{ designation: current, status: 'Active' }]
      }
    })

    // Wire search input per field — no initial load here; loaded when org is selected or dropdown opens
    designationFields.forEach(field => {
      const searchCtrl = this.entryForm.get(`_search_${field.key}`)
      if (!searchCtrl) { return }
      let isSettingInitial = true
      searchCtrl.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe((text: string) => {
        if (isSettingInitial) { isSettingInitial = false; return }
        // Suppress load when dropdown open programmatically clears the search input
        if (this.designationSearchOpenClear[field.key]) {
          this.designationSearchOpenClear[field.key] = false
          return
        }
        this.designationsOffset[field.key] = 0
        if (text && text.length > 1) {
          this.designationSearchText[field.key] = text
          this.loadDesignations(field)
        } else if (!text) {
          this.designationSearchText[field.key] = ''
          this.loadDesignations(field)
          this.ensureCurrentDesignationInList(field)
        }
      })
    })

    // If no dependencyField, load immediately (no org dependency)
    designationFields.filter(f => !f.dependencyField).forEach(f => {
      this.checkOrgHasDesignationsAndLoad(f, null)
    })
  }

  /**
   * Checks if the org (identified by rootOrgId) has custom igot designations,
   * then loads accordingly. rootOrgId=null → uses global configSvc rootOrgId.
   */
  private checkOrgHasDesignationsAndLoad(field: FieldConfig, rootOrgId: string | null): void {
    const orgId = rootOrgId || _.get(this.configSvc, 'userProfile.rootOrgId', '')

    if (!orgId) {
      this.orgHasDesignations = false
      this.loadDesignations(field, orgId)
      return
    }

    // Use cached result — avoids a redundant igot check API call on every dropdown open
    if (orgId in this.orgDesignationFlagCache) {
      this.orgHasDesignations = this.orgDesignationFlagCache[orgId]
      this.loadDesignations(field, orgId)
      return
    }

    const checkBody: any = {
      request: {
        filters: {
          status: 'Live', category: 'designation',
          categories: [`${orgId}_odcs_designation`],
          objectType: 'Term',
        },
        fields: ['name'], offset: 0, limit: 1,
        sort_by: { lastUpdatedOn: 'desc', objectType: 'Term' }, facets: [],
      },
    }
    const configDetails: ConfigDetails = this.getConfigDetails('sunbirdigotV4Search')
    this.profileV2RevampSvc.searchIgotDesignation(checkBody, configDetails).subscribe({
      next: (res: any) => {
        const hasDesig = _.get(res, 'result.count', 0) > 0
        this.orgDesignationFlagCache[orgId] = hasDesig
        this.orgHasDesignations = hasDesig
        this.loadDesignations(field, orgId)
      },
      error: () => {
        this.orgDesignationFlagCache[orgId] = false
        this.orgHasDesignations = false
        this.loadDesignations(field, orgId)
      },
    })
  }

  loadDesignations(field: FieldConfig, rootOrgId?: string | null): void {
    this.isLoadingMoreDesignations[field.key] = true
    // Determine rootOrgId to use
    const depKey = field.dependencyField
    const orgRootId = rootOrgId !== undefined
      ? rootOrgId
      : (depKey ? this.selectedOrgRootOrgId[depKey] : null) ||
      _.get(this.configSvc, 'userProfile.rootOrgId', '')

    // igot designations require a rootOrgId; default designations do not
    if (this.orgHasDesignations) {
      if (!orgRootId) {
        this.isLoadingMoreDesignations[field.key] = false
        return
      }
      this.loadIgotDesignations(field, orgRootId)
    } else {
      this.loadDefaultDesignations(field)
    }
  }

  private loadIgotDesignations(field: FieldConfig, rootOrgId: string): void {
    const body: any = {
      request: {
        filters: {
          status: 'Live', category: 'designation',
          categories: [`${rootOrgId}_odcs_designation`],
          objectType: 'Term',
        },
        fields: ['name'],
        offset: this.designationsOffset[field.key] || 0,
        limit: this.designationListLoadCount,
        sort_by: { lastUpdatedOn: 'desc', objectType: 'Term' }, facets: [],
      },
    }
    if (this.designationSearchText[field.key]) { body.request.query = this.designationSearchText[field.key] }
    const configDetails: ConfigDetails = this.getConfigDetails('sunbirdigotV4Search')
    this.profileV2RevampSvc.searchIgotDesignation(body, configDetails).subscribe({
      next: (res: any) => {
        // Old profile-entry-edit returns result.Term with {name, status}
        const raw = _.get(res, 'result.Term', [])
        const data = raw.map((item: any) => ({
          designation: item.name || item.designation || item,
          status: item.status || 'Active',
        }))
        this.setDesignationResults(field, data, _.get(res, 'result.count', data.length))
      },
      error: () => { this.isLoadingMoreDesignations[field.key] = false },
    })
  }

  private loadDefaultDesignations(field: FieldConfig): void {
    const body: any = {
      filterCriteriaMap: { status: 'Active' },
      requestedFields: [],
      pageNumber: this.designationsOffset[field.key] || 0,
      pageSize: this.designationListLoadCount,
    }
    if (this.designationSearchText[field.key]) { body.searchString = this.designationSearchText[field.key] }
    const configDetails: ConfigDetails = this.getConfigDetails('v8DesignationSearch')
    this.profileV2RevampSvc.searchDesignation(body, configDetails).subscribe({
      next: (res: any) => {
        const raw = _.get(res, 'result.result.data', [])
        const data = raw.map((item: any) => ({
          designation: item.designation || item.name || '',
          status: item.status || 'Active',
        }))
        this.setDesignationResults(field, data, _.get(res, 'result.result.totalCount', 0))
      },
      error: () => { this.isLoadingMoreDesignations[field.key] = false },
    })
  }

  private setDesignationResults(field: FieldConfig, data: any[], total: number): void {
    const offset = this.designationsOffset[field.key] || 0
    this.designationsMeta[field.key] = offset === 0
      ? data
      : [...(this.designationsMeta[field.key] || []), ...data]
    this.designationsTotalCount[field.key] = total
    this.isLoadingMoreDesignations[field.key] = false
    this.ensureCurrentDesignationInList(field)
  }

  private ensureCurrentDesignationInList(field: FieldConfig): void {
    const current = this.entryForm.get(field.key)?.value
    if (!current) { return }
    const list: any[] = this.designationsMeta[field.key] || []
    const exists = list.some(d => (d.designation || d.name || '')?.toLowerCase() === current.toLowerCase())
    if (!exists) {
      this.designationsMeta[field.key] = [{ designation: current, status: 'Active' }, ...list]
    }
  }

  private activeDesignationField: FieldConfig | null = null
  private designationScrollHandlers: Record<string, EventListener> = {}

  onDesignationDropdownOpened(field: FieldConfig, opened: boolean): void {
    if (opened) {
      this.activeDesignationField = field
      const searchCtrl = this.entryForm.get(`_search_${field.key}`)
      if (searchCtrl) {
        // Flag tells the search listener to skip this programmatic clear
        this.designationSearchOpenClear[field.key] = true
        searchCtrl.setValue('')
      }
      this.designationsOffset[field.key] = 0
      this.designationsMeta[field.key] = []
      const depKey = field.dependencyField
      const rootOrgId = depKey ? this.selectedOrgRootOrgId[depKey] : null
      this.checkOrgHasDesignationsAndLoad(field, rootOrgId)
      setTimeout(() => {
        // Angular Material v15+ MDC uses mat-mdc-select-panel
        const panel = document.querySelector('.mat-mdc-select-panel')
        if (panel) {
          // Remove any previous listener before adding a new one
          if (this.designationScrollHandlers[field.key]) {
            panel.removeEventListener('scroll', this.designationScrollHandlers[field.key])
          }
          this.designationScrollHandlers[field.key] = this.onDesignationSelectScroll.bind(this) as EventListener
          panel.addEventListener('scroll', this.designationScrollHandlers[field.key])
        }
        const searchInput = document.querySelector('.search-input') as HTMLInputElement
        if (searchInput) { searchInput.focus() }
      }, 200)
    } else {
      this.activeDesignationField = null
    }
  }

  onDesignationDropdownClosed(field: FieldConfig): void {
    const searchCtrl = this.entryForm.get(`_search_${field.key}`)
    if (searchCtrl) { searchCtrl.setValue('') }
    this.designationSearchText[field.key] = ''
    this.ensureCurrentDesignationInList(field)
    // Clean up scroll listener
    if (this.designationScrollHandlers[field.key]) {
      const panel = document.querySelector('.mat-mdc-select-panel')
      if (panel) { panel.removeEventListener('scroll', this.designationScrollHandlers[field.key]) }
      delete this.designationScrollHandlers[field.key]
    }
    this.activeDesignationField = null
  }

  onDesignationSelectScroll(event: any): void {
    const field = this.activeDesignationField
    if (!field) { return }
    const element = event.target
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - 5) {
      const list = this.designationsMeta[field.key] || []
      const total = this.designationsTotalCount[field.key] || 0
      if (!this.isLoadingMoreDesignations[field.key] && list.length < total) {
        this.isLoadingMoreDesignations[field.key] = true
        this.designationsOffset[field.key] = (this.designationsOffset[field.key] || 0) + 1
        this.loadDesignations(field)
      }
    }
  }

  // ── Organisation-select ────────────────────────────────────────────────────

  private activeOrgField: FieldConfig | null = null
  private orgApiSubscriptions: Record<string, any> = {}
  private orgScrollHandlers: Record<string, EventListener> = {}

  /** Called once in ngOnInit for each organisation-select field. */
  private initOrganisationFields(): void {
    const orgFields = (this.editConfig as FieldConfig[]).filter(f => this.isOrgField(f))
    if (!orgFields.length) { return }

    orgFields.forEach(field => {
      // Restore existing org from entryDetails so it shows in the dropdown
      const existingOrg = this.entryForm.get(field.key)?.value
      if (existingOrg) {
        this.orgSelectData[field.key] = [{
          orgName: existingOrg,
          identifier: _.get(this.entryDetails, 'orgId', ''),
          rootOrgId: _.get(this.entryDetails, 'rootOrgId', ''),
          imgUrl: _.get(this.entryDetails, 'orgLogo', ''),
        }]
        this.selectedOrgRootOrgId[field.key] = _.get(this.entryDetails, 'rootOrgId', '')
        this.selectedOrgId[field.key] = _.get(this.entryDetails, 'orgId', '')

        // Edit mode: load designation list for dependent fields immediately
        // (valueChanges won't fire because orgCtrl already has its value from buildForm)
        const savedRootOrgId = this.selectedOrgRootOrgId[field.key] || null
        const dependentDesigFields = (this.editConfig as FieldConfig[]).filter(
          f => this.isDesignationField(f) && f.dependencyField === field.key
        )
        dependentDesigFields.forEach(depField => {
          this.checkOrgHasDesignationsAndLoad(depField, savedRootOrgId)
        })
      }

      // Wire search control — debounced API search
      const searchCtrl = this.entryForm.get(`_search_${field.key}`)
      if (searchCtrl) {
        searchCtrl.valueChanges.pipe(
          debounceTime(300),
          distinctUntilChanged(),
          takeUntilDestroyed(this.destroyRef),
        ).subscribe((searchText: string) => {
          this.orgSelectData[field.key] = []
          this.getAllOrgData(field, true, 0, searchText || '')
        })
      }

      // Watch org value changes → update selctedOrgDetails, reset & reload designations
      const orgCtrl = this.entryForm.get(field.key)
      if (orgCtrl) {
        orgCtrl.valueChanges.pipe(
          takeUntilDestroyed(this.destroyRef),
        ).subscribe((value: string) => {
          if (value) {
            const found = (this.orgSelectData[field.key] || []).find((o: any) => o.orgName === value)
            if (found) {
              this.selectedOrgId[field.key] = found.identifier || ''
              this.selectedOrgRootOrgId[field.key] = found.rootOrgId || ''
            }
            // Enable + reload dependent designation fields
            const dependents = (this.editConfig as FieldConfig[]).filter(
              f => this.isDesignationField(f) && f.dependencyField === field.key
            )
            dependents.forEach(depField => {
              const ctrl = this.entryForm.get(depField.key)
              if (ctrl) {
                ctrl.enable()
                ctrl.reset()
                const searchCtrl2 = this.entryForm.get(`_search_${depField.key}`)
                if (searchCtrl2) { searchCtrl2.setValue('') }
                this.designationsMeta[depField.key] = []
                this.designationsOffset[depField.key] = 0
                this.designationSearchText[depField.key] = ''
                this.checkOrgHasDesignationsAndLoad(depField, this.selectedOrgRootOrgId[field.key])
              }
            })
          }
        })
      }
    })
  }

  private buildOrgRequest(offsetValue: number, searchText: string): any {
    const req: any = {
      request: {
        filters: { isTenant: true, status: 1, isMdo: true, isCbp: true },
        fields: ['orgName', 'imgUrl', 'identifier', 'rootOrgId'],
        limit: this.orgDefaultLoadCount,
        offset: offsetValue,
      },
    }
    if (searchText && searchText.trim()) { req.request.query = searchText }
    return req
  }

  /** Uses ProfileV2RevampService.getOrgSearch — same as profile-entry-edit */
  getAllOrgData(field: FieldConfig, onLoad: boolean, offsetValue: number, searchText: string): void {
    this.isLoadingMoreOrg[field.key] = true
    if (this.orgApiSubscriptions[field.key]) {
      this.orgApiSubscriptions[field.key].unsubscribe()
    }
    const configDetails: ConfigDetails = this.getConfigDetails('orgV1Search')
    this.orgApiSubscriptions[field.key] = this.profileV2RevampSvc.getOrgSearch(
      this.buildOrgRequest(offsetValue, searchText), configDetails
    ).subscribe({
      next: (res: any) => {
        const content = _.get(res, 'result.response.content', [])
        const total = _.get(res, 'result.response.count', 0)
        if (onLoad) {
          this.orgSelectData[field.key] = content.length ? content : []
          this.orgSelectTotalCount[field.key] = total
        } else {
          this.orgSelectData[field.key] = [...(this.orgSelectData[field.key] || []), ...content]
        }
        this.isLoadingMoreOrg[field.key] = false
        this.ensureCurrentOrgInList(field)
      },
      error: () => { this.isLoadingMoreOrg[field.key] = false },
    })
  }

  private ensureCurrentOrgInList(field: FieldConfig): void {
    const current = this.entryForm.get(field.key)?.value
    if (!current) { return }
    const list: any[] = this.orgSelectData[field.key] || []
    const exists = list.some(o => o.orgName?.toLowerCase() === current.toLowerCase())
    if (!exists) {
      this.orgSelectData[field.key] = [{
        orgName: current,
        identifier: this.selectedOrgId[field.key] || '',
        rootOrgId: this.selectedOrgRootOrgId[field.key] || '',
        imgUrl: '',
      }, ...list]
    }
  }

  /** Exact equivalent of profile-entry-edit's setupScrollListenerForOrg */
  onOrgDropdownOpened(field: FieldConfig, opened: boolean): void {
    this.activeOrgField = opened ? field : null
    if (opened) {
      const searchCtrl = this.entryForm.get(`_search_${field.key}`)
      if (searchCtrl) {
        searchCtrl.setValue('')
        this.getAllOrgData(field, true, 0, '')
      }
      setTimeout(() => {
        // Angular Material v15+ MDC uses mat-mdc-select-panel
        const panel = document.querySelector('.mat-mdc-select-panel')
        if (panel) {
          // Remove any previous listener before adding a new one
          if (this.orgScrollHandlers[field.key]) {
            panel.removeEventListener('scroll', this.orgScrollHandlers[field.key])
          }
          this.orgScrollHandlers[field.key] = this.onOrgSelectScroll.bind(this) as EventListener
          panel.addEventListener('scroll', this.orgScrollHandlers[field.key])
        }
        const searchInput = document.querySelector('.search-input') as HTMLInputElement
        if (searchInput) { searchInput.focus() }
      }, 100)
    }
  }

  onOrgDropdownClosed(field: FieldConfig): void {
    const searchCtrl = this.entryForm.get(`_search_${field.key}`)
    if (searchCtrl) { searchCtrl.setValue('') }
    this.ensureCurrentOrgInList(field)
    // Clean up scroll listener
    if (this.orgScrollHandlers[field.key]) {
      const panel = document.querySelector('.mat-mdc-select-panel')
      if (panel) { panel.removeEventListener('scroll', this.orgScrollHandlers[field.key]) }
      delete this.orgScrollHandlers[field.key]
    }
    this.activeOrgField = null
  }

  onOrgSelectScroll(event: any): void {
    const field = this.activeOrgField
    if (!field) { return }
    const element = event.target
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - 5) {
      const list = this.orgSelectData[field.key] || []
      const total = this.orgSelectTotalCount[field.key] || 0
      if (!this.isLoadingMoreOrg[field.key] && list.length < total) {
        this.isLoadingMoreOrg[field.key] = true
        this.getAllOrgData(field, false, list.length,
          this.entryForm.get(`_search_${field.key}`)?.value || '')
      }
    }
  }

  onOrgSelectionChange(field: FieldConfig, org: any): void {
    if (org && org.identifier) { this.selectedOrgId[field.key] = org.identifier }
    if (org && org.rootOrgId) { this.selectedOrgRootOrgId[field.key] = org.rootOrgId }
  }

  trackByOrgFn(_index: number, item: any): string {
    return item.orgName || item.identifier || item.channel
  }

  // ── optionsSource: states / districts ──────────────────────────────────────

  private initOptionSourceFields(): void {
    const stateFields: FieldConfig[] = []
    const districtFields = [] as FieldConfig[]

    (this.editConfig as FieldConfig[]).forEach((field: any) => {
      switch (field.optionsSource) {
        case 'states':
          stateFields.push(field)
          break

        case 'districts':
          districtFields.push(field)
          break

        case 'eUserGender':
          this.dynamicOptions[field.key] = this.eUserGender.map(g => ({ label: g, value: g }))
          break

        case 'eCategory':
          this.dynamicOptions[field.key] = this.eCategory.map(c => ({ label: c, value: c }))
          break
        case 'languages':
          this.getMasterLanguage(field)
          const domicileMediumControl = this.entryForm.get(field.key)
          if (domicileMediumControl) {
            domicileMediumControl.valueChanges
              .pipe(
                debounceTime(250),
                distinctUntilChanged(),
                startWith(''),
              )
              .subscribe(res => {
                if (this.masterLanguageBackup) {
                  if (res) {
                    this.dynamicOptions[field.key] = this.masterLanguageBackup.filter((item: any) => item.label.toLowerCase().includes(res && res.toLowerCase()))
                  } else {
                    this.dynamicOptions[field.key] = this.masterLanguageBackup
                  }
                }
              })
          }
          break

        default:
          break
      }
    })

    stateFields.forEach(field => {
      this.dynamicOptions[field.key] = []

      const configDetails: ConfigDetails = this.getConfigDetails('extendedProfileListStates')
      this.profileV2RevampSvc.getStatesList(configDetails).subscribe({
        next: (res: any) => {
          const states = _.get(res, 'result.statesList', [])
          this.dynamicOptions[field.key] = states.map((s: any) => ({
            label: s.stateName || s,
            value: s.stateName || s,
          }))
          // Load districts for any district field depending on this state (edit mode)
          // Do NOT re-patch the state control here — value is already set in buildForm.
          // Re-patching triggers valueChanges which calls loadDistrictsForField with
          // isFirstTime=false, resetting the saved district value.
          const savedState = this.resolveValue(field)
          if (savedState) {
            districtFields.filter(d => d.dependencyField === field.key).forEach(distField => {
              this.loadDistrictsForField(distField, savedState, true)
            })
          }
        },
        error: () => { },
      })

      // Watch for state changes to reload districts
      const stateCtrl = this.entryForm.get(field.key)
      if (stateCtrl) {
        stateCtrl.valueChanges.pipe(
          debounceTime(300),
          distinctUntilChanged(),
          takeUntilDestroyed(this.destroyRef),
        ).subscribe((stateValue: string) => {
          districtFields.filter(d => d.dependencyField === field.key).forEach(distField => {
            if (stateValue) {
              this.loadDistrictsForField(distField, stateValue, false)
            } else {
              this.dynamicOptions[distField.key] = []
              this.entryForm.get(distField.key)?.disable()
              this.entryForm.get(distField.key)?.reset()
            }
          })
        })
      }
    })

    // Initial disable for district fields when state is empty
    districtFields.forEach(field => {
      this.dynamicOptions[field.key] = []
      const depKey = field.dependencyField
      const stateVal = depKey ? this.entryForm.get(depKey)?.value : ''
      if (!stateVal) {
        this.entryForm.get(field.key)?.disable()
      }
    })
  }

  getMasterLanguage(field: FieldConfig): void {
    const configDetails: ConfigDetails = this.getConfigDetails('profileRegistryGetMasterLanguages')
    this.profileV2RevampSvc.getMasterLanguages(configDetails)
      // .pipe(takeUntil(this.destroySubject$))
      .subscribe((res: any) => {
        const languages: any[] = _.get(res, 'languages', []).map((l: any) => ({ label: l.name, value: l.name }))
        this.dynamicOptions[field.key] = languages
        this.masterLanguageBackup = languages
        const domicileMediumControl = this.entryForm.get(field.key)
        if (domicileMediumControl) {
          domicileMediumControl.patchValue(this.resolveValue(field))
          domicileMediumControl.updateValueAndValidity()
        }
      }, (error: HttpErrorResponse) => {
        if (!error.ok) {
          this.openSnackbar(this.handleTranslateTo('unableFetchMasterLanguageData'))
        }
      })
  }

  private loadDistrictsForField(field: FieldConfig, state: string, isFirstTime: boolean): void {
    const districtCtrl = this.entryForm.get(field.key)
    if (districtCtrl) { districtCtrl.enable() }
    const configDetails: ConfigDetails = this.getConfigDetails('extendedProfileListDistricts')
    this.profileV2RevampSvc.getDistrictsList(configDetails, state).subscribe({
      next: (res: any) => {
        const districts: string[] = _.get(res, 'result.districtsList[0].districts', [])
        this.dynamicOptions[field.key] = districts.map((d: string) => ({ label: d, value: d }))
        if (districtCtrl) {
          if (isFirstTime) {
            districtCtrl.patchValue(this.resolveValue(field))
          } else {
            districtCtrl.reset()
          }
        }
      },
      error: () => { this.dynamicOptions[field.key] = [] },
    })
  }

  // ── Educational Qualifications (degree-select / institution-select) ───────

  private initEducationalQualFields(): void {
    const degreeFields = (this.editConfig as FieldConfig[]).filter(f => this.isDegreeField(f))
    const institutionFields = (this.editConfig as FieldConfig[]).filter(f => this.isInstitutionField(f))

    // Pre-populate with the saved value so edit mode shows it immediately (before dropdown is opened)
    degreeFields.forEach(field => {
      const current = this.entryForm.get(field.key)?.value
      if (current && current !== 'Other') {
        this.degreesMeta[field.key] = [{ name: current }]
      }
    })
    institutionFields.forEach(field => {
      const current = this.entryForm.get(field.key)?.value
      if (current && current !== 'Other') {
        this.institutionsMeta[field.key] = [{ name: current }]
      }
    })

    degreeFields.forEach(field => {
      const searchCtrl = this.entryForm.get(`_search_${field.key}`)
      if (!searchCtrl) { return }
      // Only fire for real user input — programmatic setValue uses {emitEvent:false}
      searchCtrl.valueChanges.pipe(
        debounceTime(300), takeUntilDestroyed(this.destroyRef),
      ).subscribe((text: string) => {
        this.degreesOffset[field.key] = 0
        if (text && text.length > 1) {
          this.degreesSearchText[field.key] = text
          this.getEducationalQualifications('degree', field, 0, text)
        } else if (!text) {
          this.degreesSearchText[field.key] = ''
          this.getEducationalQualifications('degree', field, 0, '')
          this.ensureCurrentDegreeInList(field)
        }
      })
    })

    institutionFields.forEach(field => {
      const searchCtrl = this.entryForm.get(`_search_${field.key}`)
      if (!searchCtrl) { return }
      // Only fire for real user input — programmatic setValue uses {emitEvent:false}
      searchCtrl.valueChanges.pipe(
        debounceTime(300), takeUntilDestroyed(this.destroyRef),
      ).subscribe((text: string) => {
        this.institutionsOffset[field.key] = 0
        if (text && text.length > 1) {
          this.institutionsSearchText[field.key] = text
          this.getEducationalQualifications('institute', field, 0, text)
        } else if (!text) {
          this.institutionsSearchText[field.key] = ''
          this.getEducationalQualifications('institute', field, 0, '')
          this.ensureCurrentInstitutionInList(field)
        }
      })
    })
  }

  getEducationalQualifications(type: 'degree' | 'institute', field: FieldConfig, pageNumber: number, searchText: string): void {
    const isDegree = type === 'degree'
    const listLoadCount = isDegree ? this.degreeListLoadCount : this.institutionListLoadCount

    if (isDegree) { this.isLoadingMoreDegrees[field.key] = true } else { this.isLoadingMoreInstitutions[field.key] = true }

    const payload: any = {
      type,
      request: {
        pageNumber,
        pageSize: listLoadCount,
        filters: { status: 1 },
        sortBy: 'name',
        orderBy: 'ASC',
      },
    }
    if (searchText && searchText.trim()) {
      payload.request.searchString = searchText
      delete payload.request.sortBy
      delete payload.request.orderBy
    }
    const configDetails: ConfigDetails = this.getConfigDetails('masterdataV1Search')
    this.profileV2RevampSvc.getEducationsQualificationsSearch(payload, configDetails).subscribe({
      next: (res: any) => {
        const content = _.get(res, 'result.result', []) as any[]
        const total = _.get(res, 'result.count', 0)
        // Append "Other" only on first page
        const items = pageNumber === 0 ? [...content, { name: 'Other' }] : content

        if (isDegree) {
          this.degreesTotalCount[field.key] = total
          this.degreesMeta[field.key] = pageNumber === 0
            ? items
            : [...(this.degreesMeta[field.key] || []).filter(d => d.name !== 'Other'), ...items]
          this.isLoadingMoreDegrees[field.key] = false
          this.ensureCurrentDegreeInList(field)
        } else {
          this.institutionsTotalCount[field.key] = total
          this.institutionsMeta[field.key] = pageNumber === 0
            ? items
            : [...(this.institutionsMeta[field.key] || []).filter(i => i.name !== 'Other'), ...items]
          this.isLoadingMoreInstitutions[field.key] = false
          this.ensureCurrentInstitutionInList(field)
        }
      },
      error: () => {
        if (isDegree) { this.isLoadingMoreDegrees[field.key] = false } else { this.isLoadingMoreInstitutions[field.key] = false }
      },
    })
  }

  private ensureCurrentDegreeInList(field: FieldConfig): void {
    const current = this.entryForm.get(field.key)?.value
    if (!current || current === 'Other') { return }
    const list: any[] = this.degreesMeta[field.key] || []
    const exists = list.some(d => d.name?.toLowerCase() === current.toLowerCase())
    if (!exists) {
      this.degreesMeta[field.key] = [{ name: current }, ...list]
    }
  }

  onDegreeDropdownOpened(field: FieldConfig, opened: boolean): void {
    if (opened) {
      this.activeDegreeField = field
      const searchCtrl = this.entryForm.get(`_search_${field.key}`)
      if (searchCtrl) { searchCtrl.setValue('', { emitEvent: false }) }
      this.degreesOffset[field.key] = 0
      this.degreesMeta[field.key] = []
      this.getEducationalQualifications('degree', field, 0, '')
      setTimeout(() => {
        const panel = document.querySelector('.mat-mdc-select-panel')
        if (panel) {
          if (this.degreeScrollHandlers[field.key]) {
            panel.removeEventListener('scroll', this.degreeScrollHandlers[field.key])
          }
          this.degreeScrollHandlers[field.key] = this.onDegreeSelectScroll.bind(this) as EventListener
          panel.addEventListener('scroll', this.degreeScrollHandlers[field.key])
        }
        const searchInput = document.querySelector('.search-input') as HTMLInputElement
        if (searchInput) { searchInput.focus() }
      }, 200)
    } else {
      this.activeDegreeField = null
    }
  }

  onDegreeDropdownClosed(field: FieldConfig): void {
    const searchCtrl = this.entryForm.get(`_search_${field.key}`)
    if (searchCtrl) { searchCtrl.setValue('', { emitEvent: false }) }
    this.degreesSearchText[field.key] = ''
    this.ensureCurrentDegreeInList(field)
    if (this.degreeScrollHandlers[field.key]) {
      const panel = document.querySelector('.mat-mdc-select-panel')
      if (panel) { panel.removeEventListener('scroll', this.degreeScrollHandlers[field.key]) }
      delete this.degreeScrollHandlers[field.key]
    }
    this.activeDegreeField = null
  }

  onDegreeSelectScroll(event: any): void {
    const field = this.activeDegreeField
    if (!field) { return }
    const element = event.target
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - 5) {
      const list = (this.degreesMeta[field.key] || []).filter(d => d.name !== 'Other')
      const total = this.degreesTotalCount[field.key] || 0
      if (!this.isLoadingMoreDegrees[field.key] && list.length < total) {
        const nextPage = (this.degreesOffset[field.key] || 0) + 1
        this.degreesOffset[field.key] = nextPage
        this.getEducationalQualifications('degree', field, nextPage, this.degreesSearchText[field.key] || '')
      }
    }
  }

  private ensureCurrentInstitutionInList(field: FieldConfig): void {
    const current = this.entryForm.get(field.key)?.value
    if (!current || current === 'Other') { return }
    const list: any[] = this.institutionsMeta[field.key] || []
    const exists = list.some(i => i.name?.toLowerCase() === current.toLowerCase())
    if (!exists) {
      this.institutionsMeta[field.key] = [{ name: current }, ...list]
    }
  }

  onInstitutionDropdownOpened(field: FieldConfig, opened: boolean): void {
    if (opened) {
      this.activeInstitutionField = field
      const searchCtrl = this.entryForm.get(`_search_${field.key}`)
      if (searchCtrl) { searchCtrl.setValue('', { emitEvent: false }) }
      this.institutionsOffset[field.key] = 0
      this.institutionsMeta[field.key] = []
      this.getEducationalQualifications('institute', field, 0, '')
      setTimeout(() => {
        const panel = document.querySelector('.mat-mdc-select-panel')
        if (panel) {
          if (this.institutionScrollHandlers[field.key]) {
            panel.removeEventListener('scroll', this.institutionScrollHandlers[field.key])
          }
          this.institutionScrollHandlers[field.key] = this.onInstitutionSelectScroll.bind(this) as EventListener
          panel.addEventListener('scroll', this.institutionScrollHandlers[field.key])
        }
        const searchInput = document.querySelector('.search-input') as HTMLInputElement
        if (searchInput) { searchInput.focus() }
      }, 200)
    } else {
      this.activeInstitutionField = null
    }
  }

  onInstitutionDropdownClosed(field: FieldConfig): void {
    const searchCtrl = this.entryForm.get(`_search_${field.key}`)
    if (searchCtrl) { searchCtrl.setValue('', { emitEvent: false }) }
    this.institutionsSearchText[field.key] = ''
    this.ensureCurrentInstitutionInList(field)
    if (this.institutionScrollHandlers[field.key]) {
      const panel = document.querySelector('.mat-mdc-select-panel')
      if (panel) { panel.removeEventListener('scroll', this.institutionScrollHandlers[field.key]) }
      delete this.institutionScrollHandlers[field.key]
    }
    this.activeInstitutionField = null
  }

  onInstitutionSelectScroll(event: any): void {
    const field = this.activeInstitutionField
    if (!field) { return }
    const element = event.target
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - 5) {
      const list = (this.institutionsMeta[field.key] || []).filter(i => i.name !== 'Other')
      const total = this.institutionsTotalCount[field.key] || 0
      if (!this.isLoadingMoreInstitutions[field.key] && list.length < total) {
        const nextPage = (this.institutionsOffset[field.key] || 0) + 1
        this.institutionsOffset[field.key] = nextPage
        this.getEducationalQualifications('institute', field, nextPage, this.institutionsSearchText[field.key] || '')
      }
    }
  }

  // ── Dependency watchers (designation disabled when org is empty) ─────────────

  private setupDependencyWatchers(): void {
    const dependentFields = (this.editConfig as FieldConfig[]).filter(
      f => (this.isDesignationField(f) && !!f.dependencyField) || f.dateDependencySmallerValidator || f.dateDependencyGreaterValidator
    )
    if (!dependentFields.length) { return }

    dependentFields.forEach(field => {
      if (field.dependencyField) {
        const depCtrl = this.entryForm.get(field.dependencyField!)
        const desigCtrl = this.entryForm.get(field.key)
        if (!depCtrl || !desigCtrl) { return }

        const updateDesignationState = (): void => {
          // Priority 1: If in edit mode and canUpdate is false, always disable
          const isEditMode = !!this.entryDetails
          if (isEditMode && field.canUpdate === false) {
            desigCtrl.disable()
            return
          }

          // Priority 2: Check if this designation field has a disableDependency that's currently active
          const hasActiveDisableDependency = field.disableDependency
            ? this.isDisableDependencyActive(field.disableDependency)
            : false

          // If org has no value, always disable designation
          if (!depCtrl.value) {
            desigCtrl.disable()
          }
          // If org has value AND there's NO active disableDependency, enable designation
          else if (!hasActiveDisableDependency) {
            desigCtrl.enable()
          }
          // If org has value BUT there IS an active disableDependency, explicitly disable it
          else {
            desigCtrl.disable()
          }
        }

        // Set initial disabled state
        updateDesignationState()

        // Watch for organisation changes
        depCtrl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
          updateDesignationState()
        })
      }
      if (field.dateDependencySmallerValidator) {
        const depCtrl = this.entryForm.get(field.dateDependencySmallerValidator)
        const dateCtrl = this.entryForm.get(field.key)
        if (!depCtrl || !dateCtrl) { return }

        depCtrl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value: any) => {
          if (value) {
            field.maxDate = new Date(value)
          }
        })

      }

      if (field.dateDependencyGreaterValidator) {
        const depCtrl = this.entryForm.get(field.dateDependencyGreaterValidator)
        const dateCtrl = this.entryForm.get(field.key)
        if (!depCtrl || !dateCtrl) { return }

        depCtrl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value: any) => {
          if (value) {
            field.minDate = new Date(value)
          }
        })
      }
    })
  }

  private isDisableDependencyActive(config: ConditionalConfig): boolean {
    const { key, value, operator = '===' } = config
    const ctrl = this.entryForm.get(key)
    if (!ctrl) { return false }

    const toBool = (v: any): boolean => {
      if (typeof v === 'boolean') return v
      if (typeof v === 'string') return v.toLowerCase() === 'true'
      if (typeof v === 'number') return v === 1 || v > 0
      return !!v
    }

    const ctrlVal = ctrl.value
    const normalizedCtrlVal = toBool(ctrlVal)
    const normalizedValue = toBool(value)

    switch (operator) {
      case '===': return normalizedCtrlVal === normalizedValue
      case '!==': return normalizedCtrlVal !== normalizedValue
      case 'includes': return Array.isArray(ctrlVal)
        ? ctrlVal.includes(value)
        : String(ctrlVal || '').toLowerCase().includes(String(value).toLowerCase())
      default: return normalizedCtrlVal === normalizedValue
    }
  }

  // ── Grouped Fields (for template layout) ──────────────────────────────────

  /** Called once at construction — config is immutable after dialog open. */
  private computeGroupedFields(): ReadonlyArray<ReadonlyArray<FieldConfig>> {
    const rowMap = new Map<any, FieldConfig[]>()
    let soloIdx = 0
    for (const field of this.editConfig) {
      if (field.row !== undefined && field.row !== null) {
        if (!rowMap.has(field.row)) { rowMap.set(field.row, []) }
        rowMap.get(field.row)!.push(field)
      } else {
        rowMap.set(`__solo_${soloIdx++}`, [field])
      }
    }
    return Array.from(rowMap.values())
  }

  trackByRowIndex(index: number): number {
    return index
  }

  trackByFieldKey(_index: number, field: FieldConfig): string {
    return field.key
  }

  // ── Disable Dependency watchers ───────────────────────────────────────────

  /** Watches disableDependency conditions — field stays visible but is disabled+reset when met. */
  private setupDisableDependencyWatchers(): void {
    const fields = (this.editConfig as FieldConfig[]).filter(f => !!f.disableDependency)
    if (!fields.length) { return }

    fields.forEach(field => {
      const ctrl = this.entryForm.get(field.key)
      const { key: depKey, value, operator = '===' } = field.disableDependency!
      const depCtrl = this.entryForm.get(depKey)
      if (!ctrl || !depCtrl) { return }

      const conditionMet = (depVal: any): boolean => {
        // Normalize boolean/string comparisons for checkboxes
        const toBool = (v: any): boolean => {
          if (typeof v === 'boolean') return v
          if (typeof v === 'string') return v.toLowerCase() === 'true'
          if (typeof v === 'number') return v === 1 || v > 0
          return !!v
        }

        const normalizedDepVal = toBool(depVal)
        const normalizedValue = toBool(value)

        switch (operator) {
          case '===': return normalizedDepVal === normalizedValue
          case '!==': return normalizedDepVal !== normalizedValue
          case 'includes': return Array.isArray(depVal)
            ? depVal.includes(value)
            : String(depVal || '').toLowerCase().includes(String(value).toLowerCase())
          default: return normalizedDepVal === normalizedValue
        }
      }

      // Apply initial state — disable without resetting to preserve existing value on edit
      if (conditionMet(depCtrl.value)) { ctrl.disable() } else { ctrl.enable() }

      depCtrl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((depVal: any) => {
        if (conditionMet(depVal)) { ctrl.reset(); ctrl.disable() } else { ctrl.enable() }
      })
    })
  }

  // ── Conditional Visibility ─────────────────────────────────────────────────

  isFieldVisible(field: FieldConfig): boolean {
    if (!field.conditionalOn) { return true }
    const { key, value, operator = '===' } = field.conditionalOn
    const ctrlVal = this.entryForm.get(key)?.value
    switch (operator) {
      case '===': return ctrlVal === value
      case '!==': return ctrlVal !== value
      case 'includes':
        return Array.isArray(ctrlVal)
          ? ctrlVal.includes(value)
          : String(ctrlVal || '').toLowerCase().includes(String(value).toLowerCase())
      default: return ctrlVal === value
    }
  }

  // ── Year List ──────────────────────────────────────────────────────────────

  getYearsForField(field: FieldConfig): ReadonlyArray<string> {
    const from = field.yearFrom ?? 1900
    if (!this.yearListCache.has(from)) {
      this.yearListCache.set(from, generateYears(from))
    }
    return this.yearListCache.get(from)!
  }

  // ── File Upload ────────────────────────────────────────────────────────────

  onFileSelected(field: FieldConfig, files: FileList | null): void {
    if (!files?.length) { return }
    const file = files[0]
    const accepted = (field.accept ?? '.png,.jpg,.jpeg,.pdf').split(',').map(e => e.trim().toLowerCase())
    const ext = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`
    if (!accepted.includes(ext)) {
      this.openSnackbar(`Unsupported file type. Allowed: ${field.accept}`)
      return
    }
    const maxBytes = (field.maxSizeMB ?? 5) * 1024 * 1024
    if (file.size > maxBytes) {
      this.openSnackbar(`File size exceeds ${field.maxSizeMB ?? 5} MB.`)
      return
    }

    this.entryForm.get(`_fileName_${field.key}`)?.setValue(file.name)
    // Store the File object; caller handles the actual upload after dialog closes
    this.entryForm.get(field.key)?.setValue(file)
    this.entryForm.get(field.key)?.updateValueAndValidity()
  }

  removeFile(field: FieldConfig): void {
    this.entryForm.get(field.key)?.setValue('')
    this.entryForm.get(`_fileName_${field.key}`)?.setValue('')
  }

  getFileName(field: FieldConfig): string {
    return this.entryForm.get(`_fileName_${field.key}`)?.value || ''
  }

  isPdf(field: FieldConfig): boolean {
    return this.getFileName(field).toLowerCase().endsWith('.pdf')
  }

  preventDefaultCDK(event: DragEvent, enter = ''): void {
    event.preventDefault()
    event.stopPropagation()
    if (enter) {
      const el = event.target as HTMLElement
      el.style.opacity = enter === 'enter' ? '0.5' : '1'
    }
  }

  onDrop(field: FieldConfig, event: DragEvent): void {
    this.preventDefaultCDK(event, 'leave')
    const files = event.dataTransfer?.files ?? null
    if (files) { this.onFileSelected(field, files) }
  }

  // ── Searchable Select Helpers ──────────────────────────────────────────────

  onSearchableSelectOpened(field: FieldConfig, opened: boolean): void {
    if (opened) {
      this.entryForm.get(`_search_${field.key}`)?.setValue('')
      this.filteredOptions.update(prev => ({ ...prev, [field.key]: [...(field.options ?? [])] }))
    }
  }

  onSearchableSelectClosed(field: FieldConfig): void {
    this.entryForm.get(`_search_${field.key}`)?.setValue('')
    this.filteredOptions.update(prev => ({ ...prev, [field.key]: [...(field.options ?? [])] }))
  }

  // ── Error Helpers ──────────────────────────────────────────────────────────

  hasError(controlName: string, errorName: string): boolean {
    const ctrl = this.entryForm?.get(controlName)
    return !!(ctrl?.touched && ctrl.hasError(errorName))
  }

  /**
   * Returns the highest-priority error message string for a field,
   * or null if the control is valid / untouched.
   */
  getFirstError(field: FieldConfig, keySuffix = ''): string | null {
    const controlKey = keySuffix ? `${field.key}${keySuffix}` : field.key
    const ctrl = this.entryForm?.get(controlKey)
    if (!ctrl?.touched || ctrl.valid) { return null }
    const errors = ctrl.errors ?? {}
    const priority = ['required', 'minlength', 'maxlength', 'min', 'max', 'pattern', 'matDatepickerParse']
    for (const errKey of priority) {
      if (errors[errKey]) { return this.getErrorMessage(field, errKey) }
    }
    const firstKey = Object.keys(errors)[0]
    return firstKey ? this.getErrorMessage(field, firstKey) : null
  }

  getErrorMessage(field: FieldConfig, errorKey: string): string {
    if (field.errorMessages?.[errorKey]) { return field.errorMessages[errorKey] }
    const defaults: Record<string, string> = {
      required: `${field.label ?? 'This field'} is required.`,
      maxlength: `Maximum ${field.maxLength} characters allowed.`,
      minlength: `Minimum ${field.minLength} characters required.`,
      pattern: 'Invalid format.',
      min: 'Value is too small.',
      max: 'Value is too large.',
      matDatepickerParse: 'Please enter a valid date.',
    }
    return defaults[errorKey] ?? 'Invalid value.'
  }

  getCharCount(key: string): number {
    const val = this.entryForm?.get(key)?.value
    return val ? String(val).length : 0
  }

  preventNonNumericInput(event: KeyboardEvent): void {
    const allowed = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']
    if (!allowed.includes(event.key) && !/^\d$/.test(event.key)) {
      event.preventDefault()
    }
  }

  // ── Submit / Cancel ────────────────────────────────────────────────────────

  handleSubmit(): void {
    if (this.entryForm.invalid) {
      this.markAllTouched()
      return
    }

    // Get raw value to include disabled fields
    const formValue = this.entryForm.getRawValue()

    // Remove all internal helper controls (prefixed with _)
    Object.keys(formValue).forEach(key => {
      if (key.startsWith('_')) { delete formValue[key] }
    })

    // Achievements header — specific transformations
    if (this.header === 'Achievements') {
      if (formValue.uploadedDocumentUrl) {
        formValue.url = ''
      } else if (formValue.url) {
        formValue.uploadedDocumentUrl = ''
        formValue.fileName = ''
      }
      if (formValue.learningHours) { formValue.learningHours = Number(formValue.learningHours) }
      if (formValue.learningMinutes) { formValue.learningMinutes = Number(formValue.learningMinutes) }
    }

    // Service History header — populate org details from selected org
    if (this.header === 'Service History') {
      const orgField = (this.editConfig as FieldConfig[]).find(f => this.isOrgField(f))
      if (orgField && formValue.orgName) {
        const selectedOrg = (this.orgSelectData[orgField.key] || []).find(
          (o: any) => o.orgName === formValue.orgName
        )
        if (selectedOrg) {
          formValue.orgLogo = selectedOrg.imgUrl || ''
          formValue.orgId = selectedOrg.identifier || ''
          formValue.rootOrgId = selectedOrg.rootOrgId || ''
        }
      }
    }

    // Close with plain formValue — parent (profile-view-v2) handles header-specific
    // post-processing (e.g. Educational qualifications Other degree/institute API calls)
    this.dialogRef.close(formValue)
  }

  handleCancel(): void {
    this.dialogRef.close()
  }

  private markAllTouched(): void {
    Object.values(this.entryForm.controls).forEach(ctrl => {
      ctrl.markAsTouched()
      if ((ctrl as any).controls) {
        Object.values((ctrl as FormGroup).controls).forEach(c => c.markAsTouched())
      }
    })
  }

  getConfigDetails(configKey: string): ConfigDetails {
    return {
      apiConfig: this.apiConfig,
      urlConfigPath: configKey,
      defaultUrl: '',
    }
  }

  handleTranslateTo(menuName: string): string {
    return this.profileV2RevampSvc.handleTranslateTo(menuName)
  }

  onkeyDown(_event: any) {
    return this.isMatcompleteOpened
  }

  onAutoCompleteOpened() {
    this.isMatcompleteOpened = true
  }

  onAutoCompleteClosed() {
    this.isMatcompleteOpened = false
  }

  private openSnackbar(msg: string, duration = 5000): void {
    this.snackBar.open(msg, 'X', { duration })
  }
}
