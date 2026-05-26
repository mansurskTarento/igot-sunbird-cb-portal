import { Component, OnInit, Inject, OnDestroy, Output, EventEmitter, ViewChild, ElementRef, PLATFORM_ID, HostListener } from '@angular/core'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms'
import { HttpErrorResponse } from '@angular/common/http'
import { MatSnackBar } from '@angular/material/snack-bar'
import { isPlatformBrowser } from '@angular/common'

// import { Observable, Subject } from 'rxjs'
import { debounceTime, distinctUntilChanged, startWith, takeUntil, map, finalize } from 'rxjs/operators'

import { UserProfileService } from '../../../user-profile/services/user-profile.service'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { Subject } from 'rxjs'
import { ProfileV2RevampService } from '../../services/profile-v2-revamp.service'
import { SignupService } from 'src/app/routes/public/public-signup/signup.service'
import * as _ from 'lodash'
import { environment } from 'src/environments/environment'

@Component({
  selector: 'ws-transfer-request',
  templateUrl: './transfer-request.component.html',
  styleUrls: ['./transfer-request.component.scss'],
  standalone: false
})

export class TransferRequestComponent implements OnInit, OnDestroy {

  @Output() enableWithdraw = new EventEmitter<boolean>()
  @ViewChild('ministry', { read: ElementRef }) ministryRef?: ElementRef
  @ViewChild('state', { read: ElementRef }) stateRef?: ElementRef
  @ViewChild('department', { read: ElementRef }) departmentRef?: ElementRef
  @ViewChild('organisation', { read: ElementRef }) organisationRef?: ElementRef
  @ViewChild('group', { read: ElementRef }) groupRef?: ElementRef
  @ViewChild('designation', { read: ElementRef }) designationRef?: ElementRef

  transferRequestForm = new UntypedFormGroup({
    type: new UntypedFormControl('ministry', [Validators.required]),
    ministry: new UntypedFormControl('', []),
    searchMinistry: new UntypedFormControl(''),
    state: new UntypedFormControl(''),
    searchState: new UntypedFormControl(''),
    department: new UntypedFormControl(''),
    searchDepartment: new UntypedFormControl(''),
    organisation: new UntypedFormControl('', [Validators.required]),
    searchOrganisation: new UntypedFormControl(''),
    group: new UntypedFormControl('', [Validators.required]),
    designation: new UntypedFormControl('', [Validators.required]),
    searchDesignation: new UntypedFormControl(''),
  })

  // Data variables
  masterData: any = {}
  masterGroup: any = []
  currentMinistry: any = {}

  // Organization variables
  organizationData: any[] = []
  otherDetails = false
  deptFilterData: any[] = []
  organizationListLoadCount = 20
  organizationDefaultLoadCount = 20
  isLoadingMoreOrganization = false
  organizationDataTotalCount = 0
  selectedOrgId: string = ''

  // Designation variables
  designationData: any[] = []
  designationsTotalCount = 0
  designationSearchText = ''
  designationsOffset = 0
  designationListLoadCount = 50
  designationDefaultLoadCount = 50
  isLoadingMoreDesignations = false
  desigantionFilterEnable = false
  selectedOrgHasDesignations = false
  scrollListenerAttached = false
  noMoreLegacyDesignations = false
  designationInitInProgress = false
  defaultSearchDesignationCount = 0

  // Ministry variables
  ministryFilterEnable = false
  isLoadingMoreMinistrys = false
  ministryOffset = 0
  defaultSearchMinistryCount = 0
  ministryListLoadCount = 50
  ministryDefaultLoadCount = 50
  noMoreLegacyMinistrys = false
  ministrySearchText = ''
  ministryInitInProgress = false
  private ministrySearchSubject = new Subject<any>()

  // State variables
  stateFilterEnable = false
  isLoadingMoreStates = false
  stateOffset = 0
  defaultSearchStateCount = 0
  stateListLoadCount = 50
  stateDefaultLoadCount = 50
  noMoreLegacyStates = false
  stateSearchText = ''
  stateInitInProgress = false

  // Department variables
  departmentFilterEnable = false
  isLoadingMoreDepartments = false
  departmentOffset = 0
  defaultSearchDepartmentCount = 0
  departmentListLoadCount = 50
  departmentDefaultLoadCount = 50
  noMoreLegacyDepartments = false
  departmentSearchText = ''
  departmentInitInProgress = false

  // Organisation variables
  organisationFilterEnable = false
  isLoadingMoreOrganisations = false
  organisationOffset = 0
  defaultSearchOrganisationCount = 0
  organisationListLoadCount = 50
  organisationDefaultLoadCount = 50
  noMoreLegacyOrganisations = false
  organisationSearchText = ''
  organisationInitInProgress = false
  private organisationSearchSubject = new Subject<any>()

  private destroySubject$ = new Subject()
  isInValidOrgSelection = false
  onLoad = true
  currentOrg: any = ''
  environment: any
  private isOrganisationConditionInitialized = false
  isOrganisationMandatory = true

  // Store current login user's org ID to exclude from organisation dropdown
  loginUserRootOrgId: string = ''

  // Progressive disclosure visibility flags
  showTypeSpecificField = true    // ministry (center) or state field
  showDepartmentField = false     // only for state flow, after state is selected
  showOrganisationField = false   // after ministry / department is selected
  showGroupField = false          // after org is selected or no org options available
  showDesignationField = false    // after group is selected

  constructor(
    public dialogRef: MatDialogRef<TransferRequestComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private userProfileService: UserProfileService,
    private matSnackBar: MatSnackBar,
    private configService: ConfigurationsService,
    private profileV2RevampService: ProfileV2RevampService,
    private signupSvc: SignupService,
    @Inject(PLATFORM_ID) private _platformId: any
  ) {
    if (this.data.portalProfile.professionalDetails && this.data.portalProfile.professionalDetails.length) {
      this.transferRequestForm.controls.designation.setValue(this.data.portalProfile.professionalDetails[0].designation || '')
    }

    if (this.data.portalProfile.employmentDetails) {
      this.currentOrg = this.data.portalProfile.employmentDetails?.departmentName || ''
    }
    // Get the login user's root org ID for filtering
    if (this.configService?.unMappedUser &&
      this.configService?.unMappedUser?.rootOrg &&
      this.configService?.unMappedUser?.rootOrg?.id) {
      this.loginUserRootOrgId = this.configService?.unMappedUser?.rootOrg?.id
    }

    // Setup search subject subscriptions for debouncing
    this.organisationSearchSubject.pipe(
      map((evt: any) => evt?.target?.value || ''),
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroySubject$)
    ).subscribe((searchText: string) => {
      this.performOrganisationSearch(searchText)
    })

    this.ministrySearchSubject.pipe(
      map((evt: any) => evt?.target?.value || ''),
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroySubject$)
    ).subscribe((searchText: string) => {
      this.performMinistrySearch(searchText)
    })

    // Setup search field value changes for filtering
    if (this.transferRequestForm.get('searchDesignation')) {
      this.transferRequestForm.get('searchDesignation')!.valueChanges
        .pipe(
          debounceTime(100),
          distinctUntilChanged(),
          startWith(''),
        )
        .subscribe(res => {
          const txt = res?.toString()?.trim() ?? ''
          if (txt?.length) {
            this.desigantionFilterEnable = true
            if (this.masterData && this.masterData?.designationBackup) {
              this.masterData.designation = this.masterData?.designationBackup?.filter((item: any) =>
                item?.name?.toLowerCase()?.includes(txt?.toLowerCase()))
            }
          } else {
            if (this.masterData && this.masterData?.designationBackup) {
              this.masterData.designation = this.masterData?.designationBackup?.slice(0, this.designationDefaultLoadCount)
              this.desigantionFilterEnable = false
              this.checkCurrentDesignationPresent()
            }
          }
        })
    }

    if (this.transferRequestForm.get('searchMinistry')) {
      this.transferRequestForm.get('searchMinistry')!.valueChanges
        .pipe(
          debounceTime(100),
          distinctUntilChanged(),
          startWith(''),
        )
        .subscribe(res => {
          const txt = res?.toString()?.trim() ?? ''
          if (txt?.length) {
            this.ministryFilterEnable = true
            if (this.masterData && this.masterData?.ministryBackup) {
              this.masterData.ministry = this.masterData?.ministryBackup?.filter((item: any) =>
                item?.identifier?.toLowerCase()?.includes(txt?.toLowerCase()))
              if (!this.masterData.ministry?.length) {
                this.markMandatoryFieldTouched('ministry')
              }
            }
          } else {
            if (this.masterData && this.masterData.ministryBackup) {
              this.masterData.ministry = this.masterData.ministryBackup.slice(0, this.ministryDefaultLoadCount)
              this.ministryFilterEnable = false
              this.checkCurrentMinistryPresent()
              this.markMandatoryFieldTouched('ministry')
            }
          }
        })
    }

    if (this.transferRequestForm.get('searchState')) {
      this.transferRequestForm.get('searchState')!.valueChanges
        .pipe(
          debounceTime(100),
          distinctUntilChanged(),
          startWith(''),
        )
        .subscribe(res => {
          const txt = res?.toString()?.trim() ?? ''
          if (txt?.length) {
            this.stateFilterEnable = true
            if (this.masterData && this.masterData?.stateBackup) {
              this.masterData.state = this.masterData?.stateBackup?.filter((item: any) =>
                item?.identifier?.toLowerCase()?.includes(txt?.toLowerCase()))
            }
          } else {
            if (this.masterData && this.masterData?.stateBackup) {
              this.masterData.state = this.masterData?.stateBackup?.slice(0, this.stateDefaultLoadCount)
              this.stateFilterEnable = false
              this.checkCurrentStatePresent()
            }
          }
        })
    }

    if (this.transferRequestForm.get('searchDepartment')) {
      this.transferRequestForm.get('searchDepartment')!.valueChanges
        .pipe(
          debounceTime(100),
          distinctUntilChanged(),
          startWith(''),
        )
        .subscribe(res => {
          const txt = res?.toString()?.trim() ?? ''
          if (txt?.length) {
            this.departmentFilterEnable = true
            if (this.masterData && this.masterData?.departmentBackup) {
              this.masterData.department = this.masterData?.departmentBackup?.filter((item: any) =>
                item?.identifier?.toLowerCase()?.includes(txt?.toLowerCase()))
            }
          } else {
            if (this.masterData && this.masterData?.departmentBackup) {
              this.masterData.department = this.masterData?.departmentBackup?.slice(0, this.departmentDefaultLoadCount)
              this.departmentFilterEnable = false
              this.checkCurrentDepartmentPresent()
            }
          }
        })
    }

    if (this.transferRequestForm.get('searchOrganisation')) {
      this.transferRequestForm.get('searchOrganisation')!.valueChanges
        .pipe(
          debounceTime(100),
          distinctUntilChanged(),
          startWith(''),
        )
        .subscribe(res => {
          const txt = res?.toString()?.trim() ?? ''
          if (txt?.length) {
            this.organisationFilterEnable = true
            if (this.masterData && this.masterData?.organisationBackup) {
              this.masterData.organisation = this.masterData?.organisationBackup?.filter((item: any) =>
                item?.identifier?.toLowerCase().includes(txt?.toLowerCase()))
            }
          } else {
            if (this.masterData && this.masterData?.organisationBackup) {
              this.masterData.organisation = this.masterData?.organisationBackup?.slice(0, this.organisationDefaultLoadCount)
              this.organisationFilterEnable = false
              this.checkCurrentOrganisationPresent()
            }
          }
        })
    }
  }

  checkOrgHasDesignations(): void {
    if (this.selectedOrgId) {
      const igotDesignationBody: any = {
        request: {
          filters: {
            status: 'Live',
            category: 'designation',
            categories: [
              this.selectedOrgId + '_odcs_designation',
            ],
            objectType: 'Term',
          },
          fields: ['name'],
          offset: 0,
          limit: 1,
          sort_by: {
            lastUpdatedOn: 'desc',
            objectType: 'Term',
          },
          facets: [],
        },
      }
      this.profileV2RevampService.searchIgotDesignation(igotDesignationBody).subscribe({
        next: (res: any) => {
          const count = _.get(res, 'result.count', 0)
          this.selectedOrgHasDesignations = count > 0
          this.getdesignationsMeta()
        },
        error: () => {
          this.selectedOrgHasDesignations = false
          this.getdesignationsMeta()
        },
      })
    } else {
      this.selectedOrgHasDesignations = false
      this.getdesignationsMeta()
    }
  }

  getdesignationsMeta() {
    this.isLoadingMoreDesignations = true
    if (this.selectedOrgHasDesignations) {
      this.getIgotDesignations()
    } else {
      this.getDefaultDesignations()
    }
  }

  getIgotDesignations() {
    const apiOffset = this.designationsOffset * this.designationListLoadCount
    const igotDesignationBody: any = {
      request: {
        filters: {
          status: 'Live',
          category: 'designation',
          categories: [
            this.selectedOrgId + '_odcs_designation',
          ],
          objectType: 'Term',
        },
        fields: ['name'],
        offset: apiOffset,
        limit: this.designationListLoadCount,
        sort_by: {
          lastUpdatedOn: 'desc',
          objectType: 'Term',
        },
        facets: [],
      },
    }
    if (this.designationSearchText) {
      igotDesignationBody['request']['query'] = this.designationSearchText
    }
    this.profileV2RevampService.searchIgotDesignation(igotDesignationBody).pipe(
      finalize(() => {
        this.isLoadingMoreDesignations = false
      })
    ).subscribe({
      next: (res: any) => {
        const igotData = _.get(res, 'result.Term', [])
        const data = igotData.map((item: any) => ({ designation: item.name, status: 'Active' }))
        const totalCount = _.get(res, 'result.count', igotData.length)
        this.setDesignationResults(data, totalCount)
      },
      error: () => {
        this.matSnackBar.open('Something went wrong. Please refresh or try again later.')
      },
    })
  }

  getDefaultDesignations() {
    const requestBody: any = {
      filterCriteriaMap: {
        status: 'Active',
      },
      requestedFields: [],
      pageNumber: this.designationsOffset,
      pageSize: this.designationListLoadCount,
    }
    if (this.designationSearchText) {
      requestBody['searchString'] = this.designationSearchText
    }
    this.isLoadingMoreDesignations = true
    this.profileV2RevampService.searchDesignation(requestBody).pipe(
      finalize(() => {
        this.isLoadingMoreDesignations = false
      })
    ).subscribe({
      next: (res: any) => {
        let data = _.get(res, 'result.result.data', [])
        let totalCount = _.get(res, 'result.result.totalCount', 0)
        this.setDesignationResults(data, totalCount)
      }, error: (error: HttpErrorResponse) => {
        if (error) {
          this.matSnackBar.open('Something went wrong. Please try again later.')
        }
      },
    })
  }

  setDesignationResults(data: any[], totalCount: number) {
    const validData = (data || [])?.filter((item: any) =>
      !!(item?.designation && item?.designation?.toString()?.trim())
    )

    if (this.designationsOffset === 0) {
      this.designationData = validData
    } else {
      this.designationData = _.uniqBy([...this.designationData, ...validData], (item: any) =>
        (item?.designation || '')?.toLowerCase()
      )
    }
    this.designationsTotalCount = totalCount
    this.isLoadingMoreDesignations = false
    this.checkCurrentDesignationPresent()
    this.adjustDesignationPanelViewport()
    if (!this.designationData?.length && this.designationSearchText?.length) {
      this.markMandatoryFieldTouched('designation')
    }
  }

  private adjustDesignationPanelViewport(): void {
    if (!isPlatformBrowser(this._platformId)) {
      return
    }

    // Recalculate and nudge the pane inside viewport after async option rendering.
    const applyViewportBounds = () => {
      const panel = document.querySelector('.mat-select-panel.search-panel') as HTMLElement | null
      if (!panel) {
        return
      }

      const viewportPadding = 12
      const rect = panel?.getBoundingClientRect()
      let nextMaxHeight = rect?.height || 0

      if (rect?.bottom > window.innerHeight - viewportPadding) {
        nextMaxHeight = window.innerHeight - rect?.top - viewportPadding
      } else if (rect?.top < viewportPadding) {
        nextMaxHeight = rect?.bottom - viewportPadding
      }

      panel.style.maxHeight = `${Math?.max(96, Math.floor(nextMaxHeight))}px`
      panel.style.overflowY = 'auto'

      const pane = panel?.closest('.cdk-overlay-pane') as HTMLElement | null
      if (pane) {
        const paneRect = pane.getBoundingClientRect()
        if (paneRect?.bottom > window?.innerHeight - viewportPadding) {
          const overflowBottom = paneRect?.bottom - (window?.innerHeight - viewportPadding)
          pane.style.top = `${Math.max(viewportPadding, paneRect?.top - overflowBottom)}px`
        }
      }
    }

    setTimeout(() => applyViewportBounds(), 0)
    setTimeout(() => applyViewportBounds(), 120)
  }

  ngOnInit() {
    // Initialize masterData
    this.masterData = {
      designationBackup: [],
      designation: [],
      ministryBackup: [],
      ministry: [],
      stateBackup: [],
      state: [],
      departmentBackup: [{
        identifier: '-1',
        orgName: 'N/A',
      }],
      department: [],
      organisationBackup: [{
        identifier: '-1',
        orgName: 'N/A',
      }],
      organisation: []
    }

    // Initialize group data from dialog payload first, fallback to groups API.
    const dialogGroupData = _.get(this.data, 'groupData', _.get(this.data, 'groupsList', _.get(this.data, 'groups', [])))
    if (Array.isArray(dialogGroupData) && dialogGroupData?.length) {
      this.masterGroup = dialogGroupData?.filter((ele: any) => ele !== 'Others')
    } else {
      this.masterGroup = []
      this.getGroupData()
    }

    const currentGroupValue = _.get(this.data, 'portalProfile.professionalDetails[0].group', '')
    if (currentGroupValue && Array.isArray(this.masterGroup) && !this.masterGroup?.includes(currentGroupValue)) {
      this.masterGroup = [currentGroupValue, ...this.masterGroup]
    }

    // Setup form change listeners after initialization
    this.setupFormChangeListeners()

    // Load initial data
    this.getDesignationSafe()
    this.getMinistryData()
  }

  getGroupData(): void {
    this.userProfileService.getGroups()
      .pipe(takeUntil(this.destroySubject$))
      .subscribe((res: any) => {
        this.masterGroup = _.get(res, 'result.response', []).filter((ele: any) => ele !== 'Others')
        const selectedGroup = this.transferRequestForm.get('group')?.value
        if (selectedGroup && !this.masterGroup.includes(selectedGroup)) {
          this.masterGroup = [selectedGroup, ...this.masterGroup]
        }
      }, (error: HttpErrorResponse) => {
        if (!error.ok) {
          this.matSnackBar.open(this.handleTranslateTo('groupDataFaile'))
        }
      })
  }

  setupFormChangeListeners(): void {
    this.transferRequestForm.get('type')?.valueChanges.subscribe((type) => {
      this.isOrganisationConditionInitialized = false
      // Reset downstream progressive visibility on type change
      this.showDepartmentField = false
      this.showOrganisationField = false
      this.showGroupField = false
      this.showDesignationField = false
      // Reset group and designation on type change
      this.transferRequestForm.get('group')?.setValue('', { emitEvent: false })
      this.transferRequestForm.get('designation')?.setValue('', { emitEvent: false })

      if (type === 'state') {
        this.transferRequestForm.get('ministry')?.setValue('', { emitEvent: false })
        this.transferRequestForm.get('state')?.setValue('', { emitEvent: false })
        this.transferRequestForm.get('department')?.setValue('', { emitEvent: false })
        this.transferRequestForm.get('organisation')?.setValue('', { emitEvent: false })
        this.transferRequestForm.get('searchOrganisation')?.setValue('', { emitEvent: false })
        this.organisationSearchText = ''
        this.masterData['departmentBackup'] = []
        this.masterData['department'] = []
        this.resetOrganisationBackup()
        this.getStateData(undefined, 0)
      } else {
        this.transferRequestForm.get('state')?.setValue('', { emitEvent: false })
        this.transferRequestForm.get('department')?.setValue('', { emitEvent: false })
        this.transferRequestForm.get('organisation')?.setValue('', { emitEvent: false })
        this.transferRequestForm.get('searchOrganisation')?.setValue('', { emitEvent: false })
        this.organisationSearchText = ''
        this.masterData['departmentBackup'] = []
        this.masterData['department'] = []
        this.resetOrganisationBackup()
        this.getMinistryData(undefined, 0)
      }

      this.applyConditionalControlState()
    })

    this.transferRequestForm.get('state')?.valueChanges.subscribe((state) => {
      this.isOrganisationConditionInitialized = false
      if (state) {
        this.showDepartmentField = true
        this.showOrganisationField = false
        this.showGroupField = false
        this.showDesignationField = false
        this.transferRequestForm.get('group')?.setValue('', { emitEvent: false })
        this.transferRequestForm.get('department')?.setValue('', { emitEvent: false })
        this.transferRequestForm.get('organisation')?.setValue('', { emitEvent: false })
        this.transferRequestForm.get('searchOrganisation')?.setValue('', { emitEvent: false })
        this.organisationSearchText = ''
        this.transferRequestForm.get('designation')?.setValue('', { emitEvent: false })
        this.masterData['departmentBackup'] = []
        this.masterData['department'] = []
        this.resetOrganisationBackup()
        this.getDepartmentData(undefined, 0)
      }
      this.applyConditionalControlState()
    })

    this.transferRequestForm.get('ministry')?.valueChanges.subscribe((ministry) => {
      this.isOrganisationConditionInitialized = false
      if (ministry) {
        this.showOrganisationField = true
        this.showGroupField = false
        this.showDesignationField = false
        this.transferRequestForm.get('group')?.setValue('', { emitEvent: false })
        this.transferRequestForm.get('organisation')?.setValue('', { emitEvent: false })
        this.transferRequestForm.get('searchOrganisation')?.setValue('', { emitEvent: false })
        this.organisationSearchText = ''
        this.transferRequestForm.get('designation')?.setValue('', { emitEvent: false })
        this.resetOrganisationBackup()
        this.getOrganisationData(undefined, 0)
      }
      this.applyConditionalControlState()
    })

    this.transferRequestForm.get('department')?.valueChanges.subscribe((department) => {
      this.isOrganisationConditionInitialized = false
      if (department && department !== '-1') {
        this.showOrganisationField = true
        this.showGroupField = false
        this.showDesignationField = false
        this.transferRequestForm.get('group')?.setValue('', { emitEvent: false })
        this.transferRequestForm.get('organisation')?.setValue('', { emitEvent: false })
        this.transferRequestForm.get('searchOrganisation')?.setValue('', { emitEvent: false })
        this.organisationSearchText = ''
        this.transferRequestForm.get('designation')?.setValue('', { emitEvent: false })
        this.resetOrganisationBackup()
        this.getOrganisationData(undefined, 0)
      }
      this.applyConditionalControlState()
    })

    this.transferRequestForm.get('organisation')?.valueChanges.subscribe(() => {
      this.transferRequestForm.get('designation')?.setValue('', { emitEvent: false })
      this.applyConditionalControlState()
    })

    this.transferRequestForm.get('group')?.valueChanges.subscribe((group) => {
      if (group) {
        this.showDesignationField = true
      }
    })

    this.applyConditionalControlState()
  }

  private applyConditionalControlState(): void {
    const type = this.transferRequestForm.get('type')?.value
    const ministry = this.transferRequestForm.get('ministry')?.value
    const state = this.transferRequestForm.get('state')?.value
    const department = this.transferRequestForm.get('department')?.value

    const ministryControl = this.transferRequestForm.get('ministry')
    const stateControl = this.transferRequestForm.get('state')
    const departmentControl = this.transferRequestForm.get('department')
    const organisationControl = this.transferRequestForm.get('organisation')
    const groupControl = this.transferRequestForm.get('group')
    const designationControl = this.transferRequestForm.get('designation')
    const hasOrganisationOptions = this.hasSelectableOrganisation()

    // Default behavior: organisation is mandatory, but remains disabled until parent selection is complete.
    organisationControl?.setValidators([Validators.required])
    organisationControl?.disable({ emitEvent: false })
    this.isOrganisationMandatory = true

    if (type === 'state') {
      ministryControl?.clearValidators()
      stateControl?.setValidators([Validators.required])
      departmentControl?.setValidators([Validators.required])

      ministryControl?.disable({ emitEvent: false })
      stateControl?.enable({ emitEvent: false })

      if (state) {
        departmentControl?.enable({ emitEvent: false })
        groupControl?.enable({ emitEvent: false })
      } else {
        departmentControl?.disable({ emitEvent: false })
        groupControl?.disable({ emitEvent: false })
        designationControl?.disable({ emitEvent: false })
      }

      if (state && department && department !== '-1') {
        // After state+department selection: mandatory+enabled when options exist, else non-mandatory+disabled.
        if (hasOrganisationOptions) {
          organisationControl?.setValidators([Validators.required])
          organisationControl?.enable({ emitEvent: false })
          this.isOrganisationMandatory = true
        } else {
          organisationControl?.clearValidators()
          organisationControl?.setValue('', { emitEvent: false })
          organisationControl?.disable({ emitEvent: false })
          this.isOrganisationMandatory = false
        }
      } else {
        designationControl?.disable({ emitEvent: false })
      }

      if (state && department && department !== '-1') {
        designationControl?.enable({ emitEvent: false })
      } else {
        designationControl?.disable({ emitEvent: false })
      }
    } else {
      ministryControl?.setValidators([Validators.required])
      stateControl?.clearValidators()
      departmentControl?.clearValidators()

      ministryControl?.enable({ emitEvent: false })
      stateControl?.disable({ emitEvent: false })
      departmentControl?.disable({ emitEvent: false })

      if (ministry) {
        groupControl?.enable({ emitEvent: false })
        // After ministry selection: mandatory+enabled when options exist, else non-mandatory+disabled.
        if (hasOrganisationOptions) {
          organisationControl?.setValidators([Validators.required])
          organisationControl?.enable({ emitEvent: false })
          this.isOrganisationMandatory = true
        } else {
          organisationControl?.clearValidators()
          organisationControl?.setValue('', { emitEvent: false })
          organisationControl?.disable({ emitEvent: false })
          this.isOrganisationMandatory = false
        }
      } else {
        groupControl?.disable({ emitEvent: false })
        designationControl?.disable({ emitEvent: false })
      }

      if (ministry) {
        designationControl?.enable({ emitEvent: false })
      } else {
        designationControl?.disable({ emitEvent: false })
      }
    }

    ministryControl?.updateValueAndValidity({ emitEvent: false })
    stateControl?.updateValueAndValidity({ emitEvent: false })
    departmentControl?.updateValueAndValidity({ emitEvent: false })
    organisationControl?.updateValueAndValidity({ emitEvent: false })
    groupControl?.updateValueAndValidity({ emitEvent: false })
    designationControl?.updateValueAndValidity({ emitEvent: false })
  }

  isOrganisationMandatoryByDefaultOrOptions(): boolean {
    return !this.isOrganisationConditionInitialized || this.hasSelectableOrganisation()
  }

  handleCloseModal(): void {
    this.dialogRef.close()
  }

  handleSubmitRequest(): void {
    this.applyConditionalControlState()
    const type = this.transferRequestForm.get('type')?.value
    const ministry = this.transferRequestForm.get('ministry')?.value
    const state = this.transferRequestForm.get('state')?.value
    const department = this.transferRequestForm.get('department')?.value
    const organisation = this.transferRequestForm.get('organisation')?.value || ''
    const group = this.transferRequestForm.get('group')?.value
    const designation = this.transferRequestForm.get('designation')?.value

    if (type === 'ministry' && !ministry) {
      this.matSnackBar.open('Please select ministry/center')
      return
    }

    if (type === 'state' && !state) {
      this.matSnackBar.open('Please select state')
      return
    }

    if (type === 'state' && (!department || department === '-1')) {
      this.matSnackBar.open('Please select department')
      return
    }

    if (!group) {
      this.matSnackBar.open('Please select group')
      return
    }

    if (!designation) {
      this.matSnackBar.open('Please select designation')
      return
    }

    if (!this.transferRequestForm.valid) {
      this.matSnackBar.open('Please fill all required fields')
      return
    }

    const selectedOrganisation = (this.masterData?.organisation || []).find((org: any) => org?.identifier === organisation)
    const selectedMinistry = (this.masterData?.ministryBackup || []).find((org: any) => org?.identifier === ministry)
    const selectedDepartment = (this.masterData?.departmentBackup || []).find((org: any) => org?.identifier === department)

    const isNAOrganisation = !organisation || organisation === '-1' || selectedOrganisation?.orgName === 'N/A'
    const organisationName = selectedOrganisation?.orgName || organisation
    const ministryName = selectedMinistry?.orgName || selectedMinistry?.identifier || ministry
    const departmentName = selectedDepartment?.orgName || selectedDepartment?.identifier || department

    // If organisation is NA/not selected, submit only ministry (center flow) or department (state flow).
    const resolvedDepartmentName = isNAOrganisation
      ? (type === 'state' ? departmentName : ministryName)
      : organisationName

    const data: any = {
      'name': resolvedDepartmentName,
      'designation': designation,
      'group': group,
    }
    const postData: any = {
      'request': {
        'userId': this.configService.unMappedUser.id,
        'employmentDetails': {
          'departmentName': resolvedDepartmentName,
        },
        'profileDetails': {
          'professionalDetails': [],
        },
      },
    }
    postData.request.profileDetails.professionalDetails.push(data)
    this.userProfileService.editProfileDetails(postData)
      .pipe(takeUntil(this.destroySubject$))
      .subscribe((_res: any) => {
        this.matSnackBar.open('Your transfer request has been sent for approval')
        this.enableWithdraw.emit(true)
        this.handleCloseModal()
      }, (error: HttpErrorResponse) => {
        if (!error.ok) {
          this.matSnackBar.open(this.handleTranslateTo('transferRequestFailedNew'))
        }
      })
  }

  getOrgRequest(_newCall: boolean, offsetValue: number, searchText: string): any {
    const request: any = {
      'request': {
        'filters': {
          'isTenant': true,
          'status': 1,
          'isMdo': true,
          'isCbp': true,
        },
        'fields': ['channel', 'rootOrgId'],
        'limit': this.organizationDefaultLoadCount,
        'offset': offsetValue,
      },
    }

    if (searchText && searchText.trim() !== '') {
      request.request.query = searchText
    }
    return request
  }

  getAllDeptData(onLoad: boolean, offsetValue: number, searchText: string): void {
    // let user_org = this.data.portalProfile?.professionalDetails[0]['osid']

    this.userProfileService.getOrganizationData(this.getOrgRequest(onLoad, offsetValue, searchText))
      .pipe(takeUntil(this.destroySubject$))
      .subscribe((res: any) => {
        // Check if we have valid response data
        if (res && res.result && res.result.response && res.result.response.content && res.result.response.content.length) {
          // If onLoad is true, replace the existing data
          if (onLoad) {
            this.organizationData = [...res.result.response.content]
            this.organizationDataTotalCount = res.result.response.count
          } else {
            // Otherwise append the new data
            this.organizationData = [...this.organizationData, ...res.result.response.content]
          }

          // Update the filtered data for display
          this.deptFilterData = this.organizationData
        } else {
          if (onLoad) {
            this.organizationData = []
            this.deptFilterData = []
          }
        }
        this.isLoadingMoreOrganization = false
      }, (error: HttpErrorResponse) => {
        if (!error.ok) {
          this.matSnackBar.open(this.handleTranslateTo('orgFetchDataFailed'))
        }
      })
  }

  handleTranslateTo(menuName: string): string {
    return this.userProfileService.handleTranslateTo(menuName)
  }

  /**
   * Generic method to set panel width matching the trigger width
   * This handles responsive width calculation for all select panels
   */
  private setPanelWidthDynamic(_panelClass: string, triggerRef: ElementRef | null | undefined): void {
    if (!triggerRef || !isPlatformBrowser(this._platformId)) {
      return
    }
    // Keep runtime behavior stable by relying on Angular Material's native panel sizing.
    // Width is normalized through component SCSS for all custom panels.
    return
  }

  /**
   * Close all open panels on outside click
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!isPlatformBrowser(this._platformId)) {
      return
    }

    const target = event.target as HTMLElement

    // Check if click is on the sticky search container (inside the panel)
    if (target.closest('.sticky-search-container')) {
      return
    }

    // Check if click is on the mat-select trigger or its children
    if (target.closest('mat-select') || target.closest('.mat-select-trigger')) {
      return
    }

    // Check if click is inside any open mat-select-panel
    if (target.closest('.mat-select-panel')) {
      return
    }

    // Check if click is within the CDK overlay pane that contains the panel
    if (target.closest('.cdk-overlay-pane')) {
      const pane = target.closest('.cdk-overlay-pane') as HTMLElement
      // Don't close if the pane contains a mat-select-panel
      if (pane.querySelector('.mat-select-panel')) {
        return
      }
    }

    // All open panels should close - use triggering through pressing Escape key
    // This is a cleaner approach that works with Angular Material's built-in close behavior
    const openSelectTriggers = document.querySelectorAll('.mat-select.mat-focused')
    openSelectTriggers.forEach((trigger: Element) => {
      const selectElement = trigger as HTMLElement

      // Trigger Escape key event to properly close the select
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        keyCode: 27,
        bubbles: true,
        cancelable: true,
      })
      selectElement.dispatchEvent(escapeEvent)
    })
  }

  ngOnDestroy(): void {
    this.destroySubject$.unsubscribe()
  }

  submitTransferRequest(): void {
    if (this.transferRequestForm.invalid) {
      this.matSnackBar.open('Please fill all required fields')
      return
    }

    const formData = {
      type: this.transferRequestForm.get('type')?.value,
      ministry: this.transferRequestForm.get('ministry')?.value,
      state: this.transferRequestForm.get('state')?.value,
      department: this.transferRequestForm.get('department')?.value,
      organisation: this.transferRequestForm.get('organisation')?.value,
      group: this.transferRequestForm.get('group')?.value,
      designation: this.transferRequestForm.get('designation')?.value
    }

    // Validate required fields based on type
    if (formData.type === 'ministry' && !formData?.ministry) {
      this.matSnackBar.open('Please select a ministry/center')
      return
    }

    if (formData.type === 'state' && (!formData?.state || !formData?.department)) {
      this.matSnackBar.open('Please select state and department')
      return
    }

    // Organisation is required only if it has selectable options
    if (this.hasSelectableOrganisation() && !formData?.organisation) {
      this.matSnackBar.open('Please select an organisation')
      return
    }

    if (!formData?.group || !formData?.designation) {
      this.matSnackBar.open('Please select group and designation')
      return
    }

    // Close the dialog and emit the transfer request data
    this.dialogRef.close(formData)
  }

  assignValue(): void {
    if (this.onLoad) {
      this.deptFilterData = this.organizationData
      this.onLoad = false
    }
  }

  checkCurrentDesignationPresent() {

    // Get the current designation value
    const currentDesignation = this.transferRequestForm.get('designation')!.value
    // Check if current designation exists in the list
    if (currentDesignation) {
      const currentDesignationLabel = currentDesignation?.toString()?.trim()
      if (!currentDesignationLabel) {
        return
      }
      const currentDesignationText = currentDesignationLabel.toLowerCase()
      this.designationData = (this.designationData || [])?.filter((designation: any) =>
        !!(designation?.designation && designation?.designation?.toString()?.trim())
      )

      const designationExists = this.designationData.some(
        (designation: any) => designation?.designation?.toString()?.trim()?.toLowerCase() === currentDesignationText
      )

      if (!designationExists) {
        this.designationData?.unshift({
          designation: currentDesignationLabel,
          status: 'Active',
        })
      }
    }
  }

  setupScrollListener(opened: boolean): void {
    if (opened) {
      if (this.transferRequestForm.get('searchDesignation')) {
        this.transferRequestForm.get('searchDesignation')!.setValue('')
      }
      this.designationsOffset = 0
      this.getdesignationsMeta()

      // this.desigantionFilterEnable = false
      // this.designationListLoadCount = this.designationDefaultLoadCount; // Reset the load count
      // this.designationData = this.data.designationsMeta.slice(0, this.designationDefaultLoadCount);

      this.checkCurrentDesignationPresent()
      this.adjustDesignationPanelViewport()
      setTimeout(() => {
        const searchInput = document.querySelector('.search-input') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      }, 100)

      // Set panel width to match the select trigger width
      this.setPanelWidthDynamic('search-panel', this.designationRef)

      // Add scroll event listener to the panel
      setTimeout(() => {
        const panel = document.querySelector('.mat-select-panel.search-panel')
        if (panel) {
          panel.addEventListener('scroll', this.onDesignationSelectScroll.bind(this), { passive: true })
        }
      }, 150)
    }
  }

  setupScrollListenerForGroup(opened: boolean): void {
    if (opened) {
      // Set panel width to match the select trigger width
      // Group field doesn't have a search, so we just set the width
      this.setPanelWidthDynamic('mat-select-panel.group', this.groupRef)
    } else {
      this.markMandatoryFieldTouched('group')
    }
  }




  onDesignationSelectScroll(event: any): void {
    const element = event.target

    // if(!this.desigantionFilterEnable){
    // Check if user has scrolled to the bottom (with a small threshold)
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - 5) {
      // Only load more if not already loading and if there are potentially more items
      if (!this.isLoadingMoreDesignations && this.designationData.length < this.designationsTotalCount) {
        this.isLoadingMoreDesignations = true
        this.designationsOffset += 1
        this.getdesignationsMeta()

        // // Increase the load count by designationDefaultLoadCount
        // this.designationListLoadCount += this.designationDefaultLoadCount;

        // // Update the filtered list with more items
        // setTimeout(() => {
        //   this.designationData = this.data.designationsMeta.slice(0, this.designationListLoadCount);
        //   this.checkCurrentDesignationPresent()
        //   this.isLoadingMoreDesignations = false;
        // }, 500); // Small timeout to simulate loading and prevent multiple triggers
      }
    }
    // }
  }

  onDesignationDropdownClosed(): void {
    const searchDesignationControl = this.transferRequestForm.get('searchDesignation')
    if (searchDesignationControl) {
      searchDesignationControl.setValue('', { emitEvent: false })
      this.designationSearchText = ''
    }
    this.desigantionFilterEnable = false
    this.designationsOffset = 0
    this.getdesignationsMeta()
    this.checkCurrentDesignationPresent()
    this.markMandatoryFieldTouched('designation')
    // Keep the designation value but clear the search input
    // const currentDesignation = this.transferRequestForm.get('designation')!.value;
    // setTimeout(() => {
    //   if (this.transferRequestForm.get('searchDesignation')) {
    //     this.transferRequestForm.get('searchDesignation')!.setValue('');
    //   }
    //   // Ensure the designation value remains selected
    //   if (currentDesignation) {
    //     const designationControl = this.transferRequestForm.get('designation');
    //     if (designationControl) {
    //       designationControl.setValue(currentDesignation);
    //     }
    //   }
    // }, 100);
  }

  onOrgSelectionChange(org: any) {
    if (org && org?.channel) {
      this.selectedOrgId = org?.rootOrgId
      this.checkOrgHasDesignations()
      this.transferRequestForm.controls.organisation.setValue(org?.channel)
    }
  }

  // ========== TYPE CHANGE HANDLER ==========
  onTypeChange(_event: any) {
    // Reveal type-specific field on first radio interaction
    this.showTypeSpecificField = true
    // Data loading on type switch is handled by type valueChanges listener.
    this.applyConditionalControlState()
  }

  // ========== MINISTRY METHODS ==========
  getMinistryData(searchText?: string, offset?: number): void {
    if (!isPlatformBrowser(this._platformId)) {
      return
    }

    const reqOffset = (typeof offset === 'number') ? offset : this.ministryOffset
    const reqLimit = this.ministryDefaultLoadCount
    const pageIndex = reqLimit > 0 ? Math.floor(reqOffset / reqLimit) : 0
    if (pageIndex === 0) {
      this.noMoreLegacyMinistrys = false
    }

    const requestBody: any = {
      request: {
        query: '',
        limit: reqLimit,
        offset: reqLimit > 0 ? pageIndex * reqLimit : this.ministryDefaultLoadCount,
        fields: [
          'identifier',
          'orgName',
          'description',
          'orgHierarchyFrameworkId',
          'orgHierarchyFrameworkStatus',
          'sbOrgType',
          'sbOrgSubType',
          'channel',
          'hierarchyLevel',
          'parentPathId',
          'ministryOrStateId'
        ]
      }
    }

    if (searchText?.length) {
      requestBody['request']['query'] = searchText
      this.noMoreLegacyMinistrys = false
    }

    this.isLoadingMoreMinistrys = true
    this.signupSvc.getMinistryForRegistration(requestBody).pipe(
      finalize(() => {
        this.isLoadingMoreMinistrys = false
        this.ministryInitInProgress = false
      })
    ).subscribe({
      next: (res: any) => {
        const content = _.get(res, 'result.response.content', [])
        const mapped = (content || [])?.slice().sort((a: any, b: any) =>
          (a?.orgName || '')?.localeCompare((b?.orgName || ''), undefined, { sensitivity: 'base' })
        )
        const total = _.get(res, 'result.response.count', 0)
        this.defaultSearchMinistryCount = total

        if (!this.masterData['ministryBackup'] || reqOffset === 0) {
          this.masterData['ministryBackup'] = mapped
        } else {
          const combined = (this.masterData['ministryBackup'] || []).concat(mapped)
          this.masterData['ministryBackup'] = _.uniqBy(combined, (it: any) => (it?.identifier || '')?.toLowerCase())
        }

        if (!mapped || mapped?.length === 0) {
          this.noMoreLegacyMinistrys = true
          if (searchText?.length) {
            this.markMandatoryFieldTouched('ministry')
          }
        }
        if (this.defaultSearchMinistryCount && (this.masterData['ministryBackup'] || []).length >= this.defaultSearchMinistryCount) {
          this.noMoreLegacyMinistrys = true
        }

        this.masterData['ministry'] = (this.masterData['ministryBackup'] || []).slice(0, this.ministryListLoadCount)
        this.checkCurrentMinistryPresent()
      },
      error: () => {
        this.noMoreLegacyMinistrys = true
      }
    })
  }

  setupScrollListenerForMinistry(opened: boolean): void {
    let scrollListenerAttached = false
    if (opened) {
      if (!scrollListenerAttached) {
        scrollListenerAttached = true
        this.ministryFilterEnable = false
        this.ministryListLoadCount = this.ministryDefaultLoadCount
        this.ministryOffset = 0
        this.isLoadingMoreMinistrys = true
        this.getMinistryData(undefined, 0)

        if (this.transferRequestForm.get('searchMinistry')) {
          this.transferRequestForm.get('searchMinistry')!.setValue('')
        }

        setTimeout(() => {
          const searchInput = document.querySelector('.search-input-ministry') as HTMLInputElement
          if (searchInput) {
            searchInput.focus()
          }
        }, 100)

        // Set panel width to match the select trigger width
        this.setPanelWidthDynamic('search-panel-ministry', this.ministryRef)

        // Add scroll event listener to the panel
        setTimeout(() => {
          const panel = document.querySelector('.mat-select-panel.search-panel-ministry') as HTMLElement | null
          if (panel) {
            const scrollHandler = this.onMinistrySelectScroll.bind(this)
            panel.addEventListener('scroll', scrollHandler, { passive: true })
          }
        }, 150)
      }
    } else {
      scrollListenerAttached = false
      this.onMinistryDropdownClosed()
    }
  }

  onMinistrySelectScroll(event: any): void {
    const element = event?.target
    if (!this.ministryFilterEnable) {
      if (element.scrollTop + element?.clientHeight >= element?.scrollHeight - 5) {
        if (!this.isLoadingMoreMinistrys) {
          if (this.masterData?.ministryBackup?.length > this.masterData?.ministry?.length) {
            this.isLoadingMoreMinistrys = true
            this.ministryListLoadCount += this.ministryDefaultLoadCount
            setTimeout(() => {
              this.masterData.ministry = this.masterData?.ministryBackup?.slice(0, this.ministryListLoadCount)
              this.checkCurrentMinistryPresent()
              this.isLoadingMoreMinistrys = false
            }, 500)
          } else {
            const loadedLegacy = (this.masterData?.ministryBackup || []).length
            if (!this.noMoreLegacyMinistrys && this.defaultSearchMinistryCount && loadedLegacy < this.defaultSearchMinistryCount) {
              this.isLoadingMoreMinistrys = true
              this.ministryOffset = (this.ministryOffset || 0) + this.ministryDefaultLoadCount
              this.ministryListLoadCount += this.ministryDefaultLoadCount
              this.getMinistryData(undefined, this.ministryOffset)
            }
          }
        }
      }
    }
  }

  checkCurrentMinistryPresent() {
    const currentMinistry = this.transferRequestForm.get('ministry')!.value
    if (currentMinistry) {
      const ministryExists = this.masterData?.ministry.some(
        (ministry: any) => ministry?.identifier?.toLowerCase() === currentMinistry?.toLowerCase()
      )

      if (!ministryExists) {
        const existingMinistry = (this.masterData?.ministryBackup || []).find(
          (ministry: any) => ministry?.identifier?.toLowerCase() === currentMinistry?.toLowerCase()
        )
        if (existingMinistry) {
          if (this.masterData?.ministry?.length >= this.ministryListLoadCount) {
            this.masterData?.ministry.pop()
          }
          this.masterData?.ministry?.unshift(existingMinistry)
        }
        this.isLoadingMoreMinistrys = false
      }
    }
  }

  ministrySearch(evt: any) {
    this.ministrySearchSubject.next(evt)
  }

  performMinistrySearch(searchText: string) {
    const txt = (searchText || '')?.toString()?.trim()
    if (this.isLoadingMoreMinistrys) return

    this.ministrySearchText = txt
    if (txt?.length >= 3) {
      this.ministryFilterEnable = true
      this.isLoadingMoreMinistrys = true
      this.getMinistryData(txt, 0)
    } else if (txt?.length > 0 && this.masterData && this.masterData?.ministryBackup) {
      this.ministryFilterEnable = true
      this.masterData.ministry = this.masterData.ministryBackup.filter((item: any) =>
        (item?.orgName || item?.identifier || '')?.toLowerCase()?.includes(txt?.toLowerCase())
      )
      this.checkCurrentMinistryPresent()
      this.clearInvalidSelectedValue('ministry', this.masterData?.ministry, 'identifier')
      if (!this.masterData?.ministry?.length) {
        this.markMandatoryFieldTouched('ministry')
      }
    } else if (this.masterData && this.masterData?.ministryBackup) {
      this.masterData.ministry = this.masterData?.ministryBackup.slice(0, this.ministryDefaultLoadCount)
      this.ministryFilterEnable = false
      this.checkCurrentMinistryPresent()
      this.clearInvalidSelectedValue('ministry', this.masterData?.ministry, 'identifier')
      this.markMandatoryFieldTouched('ministry')
    }
  }

  private onMinistryDropdownClosed(): void {
    this.ministrySearchText = ''
    this.ministryFilterEnable = false
    this.transferRequestForm.get('searchMinistry')?.setValue('', { emitEvent: false })
    if (this.masterData?.ministryBackup) {
      this.masterData.ministry = this.masterData?.ministryBackup?.slice(0, this.ministryDefaultLoadCount)
      this.checkCurrentMinistryPresent()
      this.clearInvalidSelectedValue('ministry', this.masterData?.ministry, 'identifier')
    } else {
      this.getMinistryData(undefined, 0)
    }
    this.markMandatoryFieldTouched('ministry')
  }

  onMinistryChange(event: any) {
    if (event && event?.value) {
      if (this.masterData['ministryBackup'] && this.masterData['ministryBackup']?.length) {
        this.currentMinistry = _.find(this.masterData.ministryBackup, { identifier: event?.value })
      }
    }
    // Reset and reload organisations when ministry changes
    if (this.transferRequestForm.get('organisation')) {
      this.transferRequestForm.get('organisation')!.setValue('')
    }
    this.resetOrganisationBackup()
    this.getOrganisationData(undefined, 0)
  }

  // ========== STATE METHODS ==========
  getStateData(searchText?: string, offset?: number): void {
    if (!isPlatformBrowser(this._platformId)) {
      return
    }

    const reqOffset = (typeof offset === 'number') ? offset : this.stateOffset
    const reqLimit = this.stateDefaultLoadCount
    const pageIndex = reqLimit > 0 ? Math.floor(reqOffset / reqLimit) : 0
    if (pageIndex === 0) {
      this.noMoreLegacyStates = false
    }

    const requestBody: any = {
      request: {
        query: '',
        limit: reqLimit,
        offset: reqLimit > 0 ? pageIndex * reqLimit : this.stateDefaultLoadCount,
        fields: [
          'identifier',
          'orgName',
          'description',
          'orgHierarchyFrameworkId',
          'orgHierarchyFrameworkStatus',
          'sbOrgType',
          'sbOrgSubType',
          'channel',
          'hierarchyLevel',
          'parentPathId',
          'ministryOrStateId'
        ]
      }
    }

    if (searchText?.length) {
      requestBody['request']['query'] = searchText
      this.noMoreLegacyStates = false
    }

    this.isLoadingMoreStates = true
    this.signupSvc.getStateForRegistration(requestBody).pipe(
      finalize(() => {
        this.isLoadingMoreStates = false
        this.stateInitInProgress = false
      })
    ).subscribe({
      next: (res: any) => {
        const content = _.get(res, 'result.response.content', [])
        const mapped = content
        const total = _.get(res, 'result.response.count', 0)
        this.defaultSearchStateCount = total

        if (!this.masterData['stateBackup'] || reqOffset === 0) {
          this.masterData['stateBackup'] = mapped
        } else {
          const combined = (this.masterData['stateBackup'] || [])?.concat(mapped)
          this.masterData['stateBackup'] = _.uniqBy(combined, (it: any) => (it?.identifier || '')?.toLowerCase())
        }

        if (!mapped || mapped?.length === 0) {
          this.noMoreLegacyStates = true
          if (searchText?.length) {
            this.markMandatoryFieldTouched('state')
          }
        }
        if (this.defaultSearchStateCount && (this.masterData['stateBackup'] || [])?.length >= this.defaultSearchStateCount) {
          this.noMoreLegacyStates = true
        }

        this.masterData['state'] = (this.masterData['stateBackup'] || [])?.slice(0, this.stateListLoadCount)
        this.checkCurrentStatePresent()
        if (searchText?.length) {
          this.clearInvalidSelectedValue('state', this.masterData?.state, 'identifier')
        }
      },
      error: () => {
        this.noMoreLegacyStates = true
      }
    })
  }

  setupScrollListenerForState(opened: boolean): void {
    let scrollListenerAttached = false
    if (opened) {
      if (!scrollListenerAttached) {
        scrollListenerAttached = true
        this.stateFilterEnable = false
        this.stateListLoadCount = this.stateDefaultLoadCount
        this.stateOffset = 0
        this.isLoadingMoreStates = true
        this.getStateData(undefined, 0)

        if (this.transferRequestForm.get('searchState')) {
          this.transferRequestForm.get('searchState')!.setValue('')
        }

        setTimeout(() => {
          const searchInput = document.querySelector('.search-input-state') as HTMLInputElement
          if (searchInput) {
            searchInput.focus()
          }
        }, 100)

        // Set panel width to match the select trigger width
        this.setPanelWidthDynamic('search-panel-state', this.stateRef)

        // Add scroll event listener to the panel
        setTimeout(() => {
          const panel = document.querySelector('.mat-select-panel.search-panel-state') as HTMLElement | null
          if (panel) {
            const scrollHandler = this.onStateSelectScroll.bind(this)
            panel.addEventListener('scroll', scrollHandler, { passive: true })
          }
        }, 150)
      }
    } else {
      scrollListenerAttached = false
      this.onStateDropdownClosed()
    }
  }

  onStateSelectScroll(event: any): void {
    const element = event?.target
    if (!this.stateFilterEnable) {
      if (element.scrollTop + element?.clientHeight >= element?.scrollHeight - 5) {
        if (!this.isLoadingMoreStates) {
          if (this.masterData?.stateBackup?.length > this.masterData?.state?.length) {
            this.isLoadingMoreStates = true
            this.stateListLoadCount += this.stateDefaultLoadCount
            setTimeout(() => {
              this.masterData.state = this.masterData?.stateBackup?.slice(0, this.stateListLoadCount)
              this.checkCurrentStatePresent()
              this.isLoadingMoreStates = false
            }, 500)
          } else {
            const loadedLegacy = (this.masterData?.stateBackup || [])?.length
            if (!this.noMoreLegacyStates && this.defaultSearchStateCount && loadedLegacy < this.defaultSearchStateCount) {
              this.isLoadingMoreStates = true
              this.stateOffset = (this.stateOffset || 0) + this.stateDefaultLoadCount
              this.stateListLoadCount += this.stateDefaultLoadCount
              this.getStateData(undefined, this.stateOffset)
            }
          }
        }
      }
    }
  }

  checkCurrentStatePresent() {
    const currentState = this.transferRequestForm.get('state')!.value
    if (currentState) {
      const stateExists = this.masterData?.state.some(
        (state: any) => state?.identifier.toLowerCase() === currentState?.toLowerCase()
      )

      if (!stateExists) {
        const existingState = (this.masterData?.stateBackup || []).find(
          (state: any) => state?.identifier?.toLowerCase() === currentState?.toLowerCase()
        )
        if (existingState) {
          if (this.masterData?.state?.length >= this.stateListLoadCount) {
            this.masterData?.state.pop()
          }
          this.masterData?.state?.unshift(existingState)
        }
        this.isLoadingMoreStates = false
      }
    }
  }

  stateSearch(evt: any) {
    const searchText = evt?.target?.value
    const txt = (searchText || '')?.toString()?.trim()
    if (this.isLoadingMoreStates) return

    this.stateSearchText = txt
    if (txt?.length >= 3) {
      this.stateFilterEnable = true
      this.isLoadingMoreStates = true
      this.getStateData(txt, 0)
    } else if (txt?.length > 0 && this.masterData && this.masterData?.stateBackup) {
      this.stateFilterEnable = true
      this.masterData.state = this.masterData?.stateBackup?.filter((item: any) =>
        (item?.orgName || item?.identifier || '')?.toLowerCase()?.includes(txt?.toLowerCase())
      )
      this.checkCurrentStatePresent()
      this.clearInvalidSelectedValue('state', this.masterData?.state, 'identifier')
      if (!this.masterData?.state?.length) {
        this.markMandatoryFieldTouched('state')
      }
    } else if (this.masterData && this.masterData?.stateBackup) {
      this.masterData.state = this.masterData?.stateBackup?.slice(0, this.stateDefaultLoadCount)
      this.stateFilterEnable = false
      this.checkCurrentStatePresent()
    }
  }

  private onStateDropdownClosed(): void {
    this.stateSearchText = ''
    this.stateFilterEnable = false
    this.transferRequestForm.get('searchState')?.setValue('', { emitEvent: false })
    if (this.masterData?.stateBackup) {
      this.masterData.state = this.masterData?.stateBackup?.slice(0, this.stateDefaultLoadCount)
      this.checkCurrentStatePresent()
    } else {
      this.getStateData(undefined, 0)
    }
    this.markMandatoryFieldTouched('state')
  }

  onStateChanged(event: any) {
    if (event && event?.value) {
      if (this.masterData['stateBackup'] && this.masterData['stateBackup'].length) {
        this.currentMinistry = _.find(this.masterData.stateBackup, { identifier: event?.value })
      }
    }
    // Reset and reload departments when state changes
    this.transferRequestForm.get('department')?.setValue('')
    this.transferRequestForm.get('organisation')?.setValue('')
    this.masterData['departmentBackup'] = [{
      identifier: '-1',
      orgName: 'N/A',
    }]
    this.masterData['department'] = []
    this.getDepartmentData(undefined, 0)
  }

  // ========== DEPARTMENT METHODS ==========
  getDepartmentData(searchText?: string, offset?: number): void {
    if (!isPlatformBrowser(this._platformId)) {
      return
    }

    const reqOffset = (typeof offset === 'number') ? offset : this.departmentOffset
    const reqLimit = this.departmentDefaultLoadCount
    const pageIndex = reqLimit > 0 ? Math.floor(reqOffset / reqLimit) : 0
    if (pageIndex === 0) {
      this.noMoreLegacyDepartments = false
    }

    const requestBody: any = {
      request: {
        filters: {
          status: 1,
          sbOrgType: this.transferRequestForm?.controls?.type?.value,
          levelZeroOrgId: this.transferRequestForm?.controls?.state?.value,
        },
        query: '',
        limit: reqLimit,
        offset: reqLimit > 0 ? pageIndex * reqLimit : this.departmentDefaultLoadCount,
        fields: [
          'identifier',
          'orgName',
          'description',
          'orgHierarchyFrameworkId',
          'orgHierarchyFrameworkStatus',
          'sbOrgType',
          'sbOrgSubType',
          'channel'
        ]
      }
    }

    if (searchText?.length) {
      requestBody['request']['query'] = searchText
      this.noMoreLegacyDepartments = false
    }

    this.isLoadingMoreDepartments = true
    this.signupSvc.getStateOrMinistyForRegistration(requestBody).pipe(
      finalize(() => {
        this.isLoadingMoreDepartments = false
      })
    ).subscribe({
      next: (res: any) => {
        const content = _.get(res, 'result.response.content', [])
        const mapped = content
        this.masterData['departmentBackup'] = this.masterData['departmentBackup'].filter((item: any) => item?.orgName !== 'N/A')

        const total = _.get(res, 'result.response.count', 0)
        this.defaultSearchDepartmentCount = total

        if (searchText?.length && reqOffset === 0) {
          // For active search, show only current API-result set.
          this.masterData['departmentBackup'] = mapped
        } else if (!this.masterData['departmentBackup'] || reqOffset === 0) {
          const combined = (this.masterData['departmentBackup'] || [])?.concat(mapped)
          this.masterData['departmentBackup'] = _.uniqBy(combined, (it: any) => (it?.identifier || '')?.toLowerCase())
        } else {
          const combined = (this.masterData['departmentBackup'] || [])?.concat(mapped)
          this.masterData['departmentBackup'] = _.uniqBy(combined, (it: any) => (it?.identifier || '')?.toLowerCase())
        }

        // Exclude N/A from the department list
        this.masterData['departmentBackup'] = (this.masterData['departmentBackup'] || []).filter(
          (item: any) => item?.orgName !== 'N/A'
        )

        if (!mapped || mapped?.length === 0) {
          this.noMoreLegacyDepartments = true
          if (searchText?.length) {
            this.markMandatoryFieldTouched('department')
          }
        }
        if (this.defaultSearchDepartmentCount && (this.masterData['departmentBackup'] || []).length >= this.defaultSearchDepartmentCount) {
          this.noMoreLegacyDepartments = true
        }

        this.masterData['department'] = (this.masterData['departmentBackup'] || []).slice(0, this.departmentListLoadCount)
        this.isLoadingMoreDepartments = false
        this.checkCurrentDepartmentPresent()
        if (searchText?.length) {
          this.clearInvalidSelectedValue('department', this.masterData?.department, 'identifier')
        }
      },
      error: () => {
        this.noMoreLegacyDepartments = true
      }
    })
  }

  setupScrollListenerForDepartment(opened: boolean): void {
    let scrollListenerAttached = false
    if (opened) {
      if (!scrollListenerAttached) {
        scrollListenerAttached = true
        this.departmentFilterEnable = false
        this.departmentListLoadCount = this.departmentDefaultLoadCount
        this.departmentOffset = 0
        this.isLoadingMoreDepartments = true
        this.getDepartmentData(undefined, 0)

        if (this.transferRequestForm.get('searchDepartment')) {
          this.transferRequestForm.get('searchDepartment')!.setValue('')
        }

        setTimeout(() => {
          const searchInput = document.querySelector('.search-input-department') as HTMLInputElement
          if (searchInput) {
            searchInput.focus()
          }
        }, 100)

        // Set panel width to match the select trigger width
        this.setPanelWidthDynamic('search-panel-department', this.departmentRef)

        // Add scroll event listener to the panel
        setTimeout(() => {
          const panel = document.querySelector('.mat-select-panel.search-panel-department') as HTMLElement | null
          if (panel) {
            const scrollHandler = this.onDepartmentSelectScroll.bind(this)
            panel.addEventListener('scroll', scrollHandler, { passive: true })
          }
        }, 150)
      }
    } else {
      scrollListenerAttached = false
      this.onDepartmentDropdownClosed()
    }
  }

  onDepartmentSelectScroll(event: any): void {
    const element = event?.target
    if (!this.departmentFilterEnable) {
      if (element.scrollTop + element?.clientHeight >= element?.scrollHeight - 5) {
        if (!this.isLoadingMoreDepartments) {
          if (this.masterData?.departmentBackup?.length > this.masterData?.department?.length) {
            this.isLoadingMoreDepartments = true
            this.departmentListLoadCount += this.departmentDefaultLoadCount
            setTimeout(() => {
              this.masterData.department = this.masterData?.departmentBackup?.slice(0, this.departmentListLoadCount)
              this.checkCurrentDepartmentPresent()
              this.isLoadingMoreDepartments = false
            }, 500)
          } else {
            const loadedLegacy = (this.masterData?.departmentBackup || []).length
            if (!this.noMoreLegacyDepartments && this.defaultSearchDepartmentCount && loadedLegacy < this.defaultSearchDepartmentCount) {
              this.isLoadingMoreDepartments = true
              this.departmentOffset = this.departmentOffset + this.departmentDefaultLoadCount
              this.departmentListLoadCount += this.departmentDefaultLoadCount
              this.getDepartmentData(undefined, this.departmentOffset)
            }
          }
        }
      }
    }
  }

  checkCurrentDepartmentPresent() {
    const currentDepartment = this.transferRequestForm.get('department')!.value
    if (currentDepartment) {
      const departmentExists = this.masterData?.department.some(
        (department: any) => department?.identifier.toLowerCase() === currentDepartment?.toLowerCase()
      )

      if (!departmentExists) {
        const existingDepartment = (this.masterData?.departmentBackup || []).find(
          (department: any) => department?.identifier?.toLowerCase() === currentDepartment?.toLowerCase()
        )
        if (existingDepartment) {
          if (this.masterData?.department?.length >= this.departmentListLoadCount) {
            this.masterData?.department.pop()
          }
          this.masterData?.department?.unshift(existingDepartment)
        }
        this.isLoadingMoreDepartments = false
      }
    }
  }
  mdoRedirect() {
    this.environment = environment
    const sitePath = this.environment?.sitePath
    const domain = sitePath?.split('.')?.slice(1)?.join('.')
    const newUrl = `https://${domain}/#/mdoList#mdoUserList`
    window.location.href = newUrl
  }

  departmentSearch(evt: any) {
    const searchText = evt?.target?.value
    const txt = (searchText || '')?.toString()?.trim()
    if (this.isLoadingMoreDepartments) return

    this.departmentSearchText = txt
    if (txt?.length >= 3) {
      this.departmentFilterEnable = true
      this.isLoadingMoreDepartments = true
      this.getDepartmentData(txt, 0)
    } else if (txt?.length > 0 && this.masterData && this.masterData?.departmentBackup) {
      this.departmentFilterEnable = true
      this.masterData.department = this.masterData?.departmentBackup?.filter((item: any) =>
        (item?.orgName || item?.identifier || '').toLowerCase()?.includes(txt?.toLowerCase())
      )
      this.checkCurrentDepartmentPresent()
      this.clearInvalidSelectedValue('department', this.masterData?.department, 'identifier')
      if (!this.masterData?.department?.length) {
        this.markMandatoryFieldTouched('department')
      }
    } else if (this.masterData && this.masterData?.departmentBackup) {
      this.masterData.department = this.masterData?.departmentBackup?.slice(0, this.departmentDefaultLoadCount)
      this.departmentFilterEnable = false
      this.checkCurrentDepartmentPresent()
    }
  }

  private onDepartmentDropdownClosed(): void {
    this.departmentSearchText = ''
    this.departmentFilterEnable = false
    this.transferRequestForm.get('searchDepartment')?.setValue('', { emitEvent: false })
    if (this.masterData?.departmentBackup) {
      this.masterData.department = this.masterData?.departmentBackup?.slice(0, this.departmentDefaultLoadCount)
      this.checkCurrentDepartmentPresent()
    } else {
      this.getDepartmentData(undefined, 0)
    }
    this.markMandatoryFieldTouched('department')
  }

  onDepartmentChange(event: any) {
    if (event && event?.value && event?.value !== '-1') {
      if (this.masterData['departmentBackup'] && this.masterData['departmentBackup']?.length) {
        this.currentMinistry = _.find(this.masterData.departmentBackup, { identifier: event?.value })
      }
    }
    // Reset and reload organisations when department changes
    this.transferRequestForm.get('organisation')?.setValue('')
    this.getOrganisationData(undefined, 0)
  }

  // ========== ORGANISATION METHODS ==========
  getOrganisationData(searchText?: string, offset?: number): void {
    if (!isPlatformBrowser(this._platformId)) {
      return
    }

    const reqOffset = (typeof offset === 'number') ? offset : this.organisationOffset
    const reqLimit = this.organisationDefaultLoadCount
    const pageIndex = reqLimit > 0 ? Math?.floor(reqOffset / reqLimit) : 0
    if (pageIndex === 0) {
      this.noMoreLegacyOrganisations = false
    }

    let requestBody: any = {}
    if (this.transferRequestForm?.controls?.type?.value === 'ministry') {
      let filters: any = {
        status: 1,
        levelZeroOrgId: this.transferRequestForm?.controls?.ministry?.value,
        hierarchyRequestType: 'All'
      }
      for (let i = 0; i < this.masterData['ministryBackup']?.length; i++) {
        if (this.masterData['ministryBackup'][i]?.['identifier'] === this.transferRequestForm?.controls?.ministry?.value) {
          if (this.masterData['ministryBackup'][i]?.['hierarchyLevel'] === 'levelOne') {
            filters = {
              status: 1,
              levelZeroOrgId: this.masterData['ministryBackup'][i]['ministryOrStateId'],
              levelOneOrgId: this.masterData['ministryBackup'][i]['identifier'],
              hierarchyRequestType: 'All'
            }
          }
        }
      }
      requestBody = {
        request: {
          filters: filters,
          query: '',
          limit: reqLimit,
          offset: reqLimit > 0 ? pageIndex * reqLimit : this.organisationDefaultLoadCount,
          fields: [
            'identifier',
            'orgName',
            'description',
            'parentOrgName',
            'orgHierarchyFrameworkId',
            'orgHierarchyFrameworkStatus',
            'sbOrgType',
            'sbOrgSubType',
            'channel'
          ]
        }
      }
    } else if (this.transferRequestForm?.controls?.type?.value === 'state') {
      requestBody = {
        request: {
          filters: {
            status: 1,
            levelZeroOrgId: this.transferRequestForm?.controls?.state?.value,
            levelOneOrgId: this.transferRequestForm?.controls?.department?.value,
            hierarchyRequestType: 'All'
          },
          query: '',
          limit: reqLimit,
          offset: reqLimit > 0 ? pageIndex * reqLimit : this.organisationDefaultLoadCount,
          fields: [
            'identifier',
            'orgName',
            'description',
            'parentOrgName',
            'orgHierarchyFrameworkId',
            'orgHierarchyFrameworkStatus',
            'sbOrgType',
            'sbOrgSubType',
            'channel'
          ]
        }
      }
    }

    const queryText = (searchText !== undefined ? searchText : '')?.toString()?.trim()
    if (!requestBody?.request) {
      this.isLoadingMoreOrganisations = false
      return
    }
    requestBody['request']['query'] = queryText
    if (queryText?.length) {
      this.noMoreLegacyOrganisations = false
    }

    this.isLoadingMoreOrganisations = true
    this.signupSvc.getStateOrMinistyForRegistration(requestBody).pipe(
      finalize(() => {
        this.isLoadingMoreOrganisations = false
        this.organisationInitInProgress = false
      })
    ).subscribe({
      next: (res: any) => {
        const content = _.get(res, 'result.response.content', [])
        const mapped = content

        if (mapped?.length === 0 || queryText?.length) {
          this.masterData['organisationBackup'] = this.masterData['organisationBackup'].filter(
            (item: any) => item?.orgName === 'N/A'
          )
        }

        const total = _.get(res, 'result.response.count', 0)
        this.defaultSearchOrganisationCount = total

        if (!this.masterData['organisationBackup'] || reqOffset === 0) {
          const combined = (this.masterData['organisationBackup'] || []).concat(mapped)
          this.masterData['organisationBackup'] = _.uniqBy(combined, (it: any) => (it?.identifier || '')?.toLowerCase())
        } else {
          const combined = (this.masterData['organisationBackup'] || []).concat(mapped)
          this.masterData['organisationBackup'] = _.uniqBy(combined, (it: any) => (it?.identifier || '')?.toLowerCase())
        }

        if (!mapped || mapped?.length === 0) {
          this.noMoreLegacyOrganisations = true
          if (queryText?.length) {
            this.markMandatoryFieldTouched('organisation')
          }
        }
        if (this.defaultSearchOrganisationCount && (this.masterData['organisationBackup'] || [])?.length >= this.defaultSearchOrganisationCount) {
          this.noMoreLegacyOrganisations = true
        }

        this.masterData['organisation'] = (this.masterData['organisationBackup'] || [])?.slice(0, this.organisationListLoadCount)
        this.isLoadingMoreOrganisations = false
        this.checkCurrentOrganisationPresent()
        if (queryText?.length && this.transferRequestForm?.controls?.type?.value === 'state') {
          this.clearInvalidSelectedValue('organisation', this.masterData?.organisation, 'identifier')
        }
        this.isOrganisationConditionInitialized = true
        const hasOrganisationOptions = this.hasSelectableOrganisation()
        // Show/hide organisation only on base load (not active search) to avoid flicker while typing.
        if (!queryText?.length) {
          this.showOrganisationField = hasOrganisationOptions
          if (!hasOrganisationOptions) {
            this.showGroupField = true
            this.showDesignationField = false
          }
        }
        // Do not toggle enable/disable while user is typing in organisation search.
        if (!queryText?.length) {
          this.applyConditionalControlState()
        }
      },
      error: () => {
        this.noMoreLegacyOrganisations = true
        this.isOrganisationConditionInitialized = true
        // On error, hide organisation and continue to Group so flow isn't blocked.
        this.showOrganisationField = false
        this.showGroupField = true
        this.showDesignationField = false
        if (!queryText?.length) {
          this.applyConditionalControlState()
        }
      }
    })
  }

  setupScrollListenerForOrganisation(opened: boolean): void {
    let scrollListenerAttached = false
    if (opened) {
      if (!scrollListenerAttached) {
        scrollListenerAttached = true
        this.organisationFilterEnable = false
        this.organisationListLoadCount = this.organisationDefaultLoadCount
        this.organisationOffset = 0
        this.isLoadingMoreOrganisations = true
        this.getOrganisationData(undefined, 0)

        if (this.transferRequestForm.get('searchOrganisation')) {
          this.transferRequestForm.get('searchOrganisation')!.setValue('')
        }

        setTimeout(() => {
          const searchInput = document.querySelector('.search-input-organisation') as HTMLInputElement
          if (searchInput) {
            searchInput.focus()
          }
        }, 100)

        // Set panel width to match the select trigger width
        this.setPanelWidthDynamic('search-panel-organisation', this.organisationRef)

        // Add scroll event listener to the panel
        setTimeout(() => {
          const panel = document.querySelector('.mat-select-panel.search-panel-organisation') as HTMLElement | null
          if (panel) {
            const scrollHandler = this.onOrganisationSelectScroll.bind(this)
            panel.addEventListener('scroll', scrollHandler, { passive: true })
          }
        }, 150)
      }
    } else {
      scrollListenerAttached = false
      this.onOrganisationDropdownClosed()
    }
  }

  onOrganisationSelectScroll(event: any): void {
    const element = event?.target
    if (element.scrollTop + element?.clientHeight >= element?.scrollHeight - 5) {
      if (!this.isLoadingMoreOrganisations) {
        if (this.masterData?.organisationBackup?.length > this.masterData?.organisation?.length) {
          this.isLoadingMoreOrganisations = true
          this.organisationListLoadCount += this.organisationDefaultLoadCount
          setTimeout(() => {
            this.masterData.organisation = this.masterData?.organisationBackup?.slice(0, this.organisationListLoadCount)
            this.checkCurrentOrganisationPresent()
            this.isLoadingMoreOrganisations = false
          }, 500)
        } else {
          const loadedLegacy = (this.masterData?.organisationBackup || [])?.length
          if (!this.noMoreLegacyOrganisations && this.defaultSearchOrganisationCount && loadedLegacy < this.defaultSearchOrganisationCount) {
            this.isLoadingMoreOrganisations = true
            this.organisationOffset = this.organisationOffset + this.organisationDefaultLoadCount
            this.organisationListLoadCount += this.organisationDefaultLoadCount
            this.getOrganisationData(this.organisationSearchText || '', this.organisationOffset)
          }
        }
      }
    }
  }

  checkCurrentOrganisationPresent() {
    const currentOrganisation = this.transferRequestForm.get('organisation')!.value
    if (currentOrganisation) {
      const organisationExists = this.masterData?.organisation.some(
        (organisation: any) => organisation?.identifier?.toLowerCase() === currentOrganisation?.toLowerCase()
      )

      if (!organisationExists) {
        const existingOrganisation = (this.masterData?.organisationBackup || []).find(
          (organisation: any) => organisation?.identifier?.toLowerCase() === currentOrganisation?.toLowerCase()
        )
        if (existingOrganisation) {
          if (this.masterData?.organisation?.length >= this.organisationListLoadCount) {
            this.masterData?.organisation.pop()
          }
          this.masterData?.organisation?.unshift(existingOrganisation)
        }
        this.isLoadingMoreOrganisations = false
      }
    }
  }

  organisationSearch(evt: any) {
    this.organisationSearchSubject.next(evt)
  }

  performOrganisationSearch(searchText: string) {
    const txt = (searchText || '')?.toString()?.trim()
    if (this.isLoadingMoreOrganisations) return

    this.organisationSearchText = txt
    if (txt?.length >= 3) {
      this.organisationFilterEnable = true
      this.isLoadingMoreOrganisations = true
      this.getOrganisationData(txt, 0)
    } else if (txt?.length > 0 && this.masterData && this.masterData?.organisationBackup) {
      this.organisationFilterEnable = true
      this.masterData.organisation = this.masterData.organisationBackup.filter((item: any) =>
        (item?.orgName || item?.identifier || '')?.toLowerCase()?.includes(txt?.toLowerCase())
      )
      this.checkCurrentOrganisationPresent()
      this.clearInvalidSelectedValue('organisation',
        (this.masterData?.organisation || [])?.filter((item: any) => this.isSelectableOrganisation(item)), 'identifier')
      if (!this.hasSelectableOrganisation()) {
        this.markMandatoryFieldTouched('organisation')
      }
    } else if (this.masterData && this.masterData?.organisationBackup) {
      this.masterData.organisation = this.masterData?.organisationBackup?.slice(0, this.organisationDefaultLoadCount)
      this.organisationFilterEnable = false
      this.checkCurrentOrganisationPresent()
      this.clearInvalidSelectedValue('organisation',
        (this.masterData?.organisation || [])?.filter((item: any) => this.isSelectableOrganisation(item)), 'identifier')
    }
  }

  private onOrganisationDropdownClosed(): void {
    this.organisationSearchText = ''
    this.organisationFilterEnable = false
    this.transferRequestForm.get('searchOrganisation')?.setValue('', { emitEvent: false })
    if (this.masterData?.organisationBackup) {
      this.masterData.organisation = this.masterData?.organisationBackup?.slice(0, this.organisationDefaultLoadCount)
      this.checkCurrentOrganisationPresent()
      this.clearInvalidSelectedValue('organisation',
        (this.masterData?.organisation || [])?.filter((item: any) => this.isSelectableOrganisation(item)), 'identifier')
    } else {
      this.getOrganisationData(undefined, 0)
    }
    this.markMandatoryFieldTouched('organisation')
  }

  onOrganisationChanged(event: any) {
    this.transferRequestForm.get('group')?.setValue('', { emitEvent: false })
    if (event.value && event.value !== '-1') {
      this.currentMinistry = _.find(this.masterData?.organisation, { identifier: event?.value })
      // Extract the selectedOrgId for ODCS designation lookup
      this.selectedOrgId = event?.value
      // Check if org has ODCS designations and load them
      this.checkOrgHasDesignations()
    } else {
      this.selectedOrgId = ''
      this.checkOrgHasDesignations()
    }
    // Reveal Group field after an org is selected
    this.showGroupField = true
    this.showDesignationField = false
    this.applyConditionalControlState()
  }

  isSelectableOrganisation(org: any): boolean {
    return !!org && org?.identifier !== '-1' && org?.orgName !== 'N/A'
  }

  hasSelectableOrganisation(): boolean {
    const organisationList = Array.isArray(this.masterData?.organisation) ? this.masterData?.organisation : []
    const organisationBackupList = Array.isArray(this.masterData?.organisationBackup) ? this.masterData?.organisationBackup : []

    // Prefer backup list because it holds the full option set and remains stable during local filtering/search.
    const source = organisationBackupList.length ? organisationBackupList : organisationList
    return source.some((item: any) => this.isSelectableOrganisation(item))
  }

  resetOrganisationBackup() {
    this.masterData.organisationBackup = [{
      identifier: '-1',
      orgHierarchyFrameworkStatus: null,
      orgName: 'N/A',
      sbOrgType: null,
      description: null,
      sbOrgSubType: null,
      orgHierarchyFrameworkId: null
    }]
  }

  // ========== DESIGNATION METHODS ==========
  private getDesignationSafe(): void {
    if (this.designationInitInProgress || this.isLoadingMoreDesignations) {
      return
    }
    this.designationInitInProgress = true
    this.getDesignation()
  }

  getDesignation(searchText?: string, offset?: number): void {
    if (!isPlatformBrowser(this._platformId)) {
      return
    }

    const reqOffset = (typeof offset === 'number') ? offset : this.designationsOffset
    let reqLimit = this.designationDefaultLoadCount
    const pageIndex = reqLimit > 0 ? Math.floor(reqOffset / reqLimit) : 0
    if (pageIndex === 0) {
      this.noMoreLegacyDesignations = false
      reqLimit = 50
    }
    const requestBody: any = {
      filterCriteriaMap: {
        status: 'Active'
      },
      requestedFields: [],
      pageNumber: pageIndex,
      pageSize: reqLimit,
    }
    if (searchText?.length) {
      requestBody['searchString'] = searchText
      requestBody.pageNumber = 0
      requestBody.pageSize = pageIndex === 0 ? 50 : this.designationListLoadCount
      this.noMoreLegacyDesignations = false
    }

    this.isLoadingMoreDesignations = true
    this.userProfileService.searchPublicDesignation(requestBody).pipe(
      finalize(() => {
        this.isLoadingMoreDesignations = false
        this.designationInitInProgress = false
      })
    ).subscribe({
      next: (res: any) => {
        const content = _.get(res, 'result.result.data', [])
        const mapped = content.map((item: any) => ({
          name: item?.designation || '',
          status: item?.status || 'Active',
        }))

        const total = _.get(res, 'result.result.totalcount', _.get(res, 'result.result.data.totalCount', _.get(res, 'result.result.totalCount', 0)))
        this.defaultSearchDesignationCount = total

        if (!this.masterData['designationBackup'] || reqOffset === 0) {
          this.masterData['designationBackup'] = mapped
        } else {
          const combined = (this.masterData['designationBackup'] || []).concat(mapped)
          this.masterData['designationBackup'] = _.uniqBy(combined, (it: any) => (it?.name || '')?.toLowerCase())
        }

        if (!mapped || mapped?.length === 0) {
          this.noMoreLegacyDesignations = true
        }

        if (this.defaultSearchDesignationCount && (this.masterData['designationBackup'] || []).length >= this.defaultSearchDesignationCount) {
          this.noMoreLegacyDesignations = true
        }

        this.masterData['designation'] = (this.masterData['designationBackup'] || []).slice(0, this.designationListLoadCount)
        this.checkCurrentDesignationPresent()
      },
      error: () => {
        this.noMoreLegacyDesignations = true
      }
    })
  }

  designationSearch(evt: any) {
    const searchText = evt?.target?.value
    const txt = (searchText || '')?.toString()?.trim()
    if (this.isLoadingMoreDesignations) return

    this.designationSearchText = txt
    if (txt.length >= 3) {
      this.desigantionFilterEnable = true
      this.isLoadingMoreDesignations = true
      this.designationsOffset = 0
      this.getdesignationsMeta()
    } else if (txt.length > 0 && this.designationData?.length) {
      this.desigantionFilterEnable = true
      this.designationData = this.designationData.filter((item: any) =>
        (item?.designation || item?.name || '')?.toLowerCase()?.includes(txt?.toLowerCase())
      )
      this.checkCurrentDesignationPresent()
      if (!this.designationData?.length) {
        this.markMandatoryFieldTouched('designation')
      }
    } else {
      this.desigantionFilterEnable = false
      this.designationsOffset = 0
      this.getdesignationsMeta()
      this.checkCurrentDesignationPresent()
    }
  }

  private markMandatoryFieldTouched(controlName: string): void {
    const control = this.transferRequestForm.get(controlName)
    if (!control || control.disabled) {
      return
    }

    if (!control?.value) {
      control?.markAsTouched()
      control?.updateValueAndValidity({ emitEvent: false })
    }
  }

  private clearInvalidSelectedValue(controlName: string, options: any[], valueKey: string): void {
    const control = this.transferRequestForm.get(controlName)
    if (!control) {
      return
    }

    const selectedValue = (control?.value || '')?.toString()?.trim()?.toLowerCase()
    if (!selectedValue) {
      return
    }

    // Allow explicit N/A selection for organisation.
    if (controlName === 'organisation' && selectedValue === '-1') {
      return
    }

    const exists = (options || [])?.some((item: any) =>
      (item?.[valueKey] || '')?.toString()?.trim()?.toLowerCase() === selectedValue
    )

    if (!exists) {
      control?.setValue('', { emitEvent: false })
      this.markMandatoryFieldTouched(controlName)
    }
  }
  setupOrgScrollListener(opened: boolean): void {
    if (opened) {
      if (this.transferRequestForm.get('searchOrganization')?.value) {
        this.transferRequestForm.get('searchOrganization')?.setValue('')
      } else {
        this.getAllDeptData(true, 0, '')
      }
      // this.organizationFilterEnable = false
      this.organizationListLoadCount = this.organizationDefaultLoadCount

      setTimeout(() => {
        const searchInput = document.querySelector('.search-org-input') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      }, 100)
      // Wait for the panel to be rendered in the DOM
      setTimeout(() => {
        // Find the panel element
        const panel = document.querySelector('.mat-select-panel')
        if (panel) {
          // Add scroll event listener to the panel
          panel.addEventListener('scroll', this.onOrgSelectScroll.bind(this))
        }

      }, 100)
    }
  }

  onOrgSelectScroll(event: any): void {
    const element = event.target

    // Check if user has scrolled to the bottom (with a small threshold)
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - 5) {
      // Only load more if:
      // 1. Not already loading
      // 2. We haven't reached the total available count yet
      if (!this.isLoadingMoreOrganization && this.organizationData.length < this.organizationDataTotalCount) {
        this.isLoadingMoreOrganization = true

        // Calculate the next offset
        const nextOffset = this.organizationData.length

        // Call API to get more data
        this.getAllDeptData(false, nextOffset, this.transferRequestForm.get('searchOrganization')?.value || '')

        // Increase the load count
        this.organizationListLoadCount += this.organizationDefaultLoadCount
      }
    }
  }
  trackByFn(_index: number, item: any): number {
    return item.channel
  }
}
