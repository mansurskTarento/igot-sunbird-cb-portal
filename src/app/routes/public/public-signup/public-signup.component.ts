import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ViewChild, ElementRef } from '@angular/core'
import { Subscription, Observable, interval } from 'rxjs'
import { UntypedFormGroup, UntypedFormControl, Validators, AbstractControl, ValidatorFn } from '@angular/forms'
import { SignupService } from './signup.service'
import { LoggerService, ConfigurationsService, NsInstanceConfig, MultilingualTranslationsService, WsEvents, EventService, TelemetryService } from '@sunbird-cb/utils-v2'
import { startWith, map, pairwise, debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators'
import { environment } from 'src/environments/environment'
import { ReCaptchaV3Service } from 'ng-recaptcha'
import { SignupSuccessDialogueComponent } from './signup-success-dialogue/signup-success-dialogue/signup-success-dialogue.component'
import { DOCUMENT, isPlatformBrowser } from '@angular/common'
// tslint:disable-next-line: import-name
import _ from 'lodash'
import { ActivatedRoute, Router } from '@angular/router'
import { TermsAndConditionComponent } from './terms-and-condition/terms-and-condition.component'
import { TranslateService } from '@ngx-translate/core'
import { HttpClient } from '@angular/common/http'
import { DomSanitizer } from '@angular/platform-browser'
import { DialogBoxComponent as ZohoDialogComponent } from '@ws/app/src/lib/routes/profile-v3/components/dialog-box/dialog-box.component'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { UserProfileService } from '@ws/app/src/lib/routes/user-profile/services/user-profile.service'

// export function forbiddenNamesValidator(optionsArray: any): ValidatorFn {
//   return (control: AbstractControl): { [key: string]: any } | null => {
//     if (!optionsArray) {
//       return null
//       // tslint:disable-next-line: no-else-after-return
//     } else {
//       const index = optionsArray.findIndex((op: any) => {
//         // tslint:disable-next-line: prefer-template
//         // return new RegExp('^' + op.channel + '$').test(control.channel)
//         // return op.channel === control.value.channel
//         return op.channel === control.value.channel
//       })
//       return index < 0 ? { forbiddenNames: { value: control.value.channel } } : null
//     }
//   }
// }

export function forbiddenNamesValidator(optionsArray: any): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (!optionsArray) {
      return null
      // tslint:disable-next-line: no-else-after-return
    } else {
      if (control.value) {
        const index = optionsArray.findIndex((op: any) => {
          // tslint:disable-next-line: prefer-template
          // return new RegExp('^' + op.orgname + '$').test(control.orgname)
          return op.orgname === control.value.orgname
        })
        return index < 0 ? { forbiddenNames: { value: control.value.orgname } } : null
      }
      return null
    }
  }
}

export function forbiddenNamesValidatorNonEmpty(optionsArray: any): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (!optionsArray) {
      return null
      // tslint:disable-next-line: no-else-after-return
    } else {
      const index = optionsArray.findIndex((op: any) => {
        // tslint:disable-next-line: prefer-template
        // return new RegExp('^' + op.orgname + '$').test(control.orgname)
        return op.orgname === control.value.orgname
      })
      return index < 0 ? { forbiddenNames: { value: control.value.orgname } } : null
    }
  }
}

// export function forbiddenNamesValidatorPosition(optionsArray: any): ValidatorFn {
//   return (control: AbstractControl): { [key: string]: any } | null => {
//     if (!optionsArray) {
//       return null
//       // tslint:disable-next-line: no-else-after-return
//     } else {
//       const index = optionsArray.findIndex((op: any) => {
//         // tslint:disable-next-line: prefer-template
//         // return new RegExp('^' + op.channel + '$').test(control.channel)
//         return op.name === control.value.name
//       })
//       return index < 0 ? { forbiddenNames: { value: control.value && control.value.name ? control.value.name : null} } : null
//     }
//   }
// }

@Component({
  selector: 'ws-public-signup',
  templateUrl: './public-signup.component.html',
  styleUrls: ['./public-signup.component.scss'],
})

export class PublicSignupComponent implements OnInit, OnDestroy {
  @ViewChild('designation', { read: ElementRef }) designationRef?: ElementRef
  registrationForm!: UntypedFormGroup
  // namePatern = `^[a-zA-Z']{1,32}$`
  namePatern = `[a-zA-Z\\s\\']{1,32}$`
  // emailWhitelistPattern = `^[a-zA-Z0-9._-]{3,}\\b@\\b[a-zA-Z0-9]*|\\b(.gov|.nic)\b\\.\\b(in)\\b$`
  customCharsPattern = `^[a-zA-Z0-9 \\w\-\&\(\)]*$`
  positionsOriginal!: []
  postions!: any
  // masterPositions!: Observable<any> | undefined
  masterGroup: any
  telemetryConfig: NsInstanceConfig.ITelemetryConfig | null = null
  portalID = ''
  confirm = false
  confirmTerms = false
  disableBtn = false
  disableVerifyBtn = false
  orgRequired = false
  ministeries: any[] = []
  masterMinisteries!: Observable<any> | undefined
  orgs: any[] = []
  masterOrgs!: Observable<any> | undefined
  emailLengthVal = false
  phoneNumberPattern = '^((\\+91-?)|0)?[0-9]{10}$'
  isMobileVerified = false
  isEmailVerified = false
  otpSend = false
  otpEmailSend = false
  otpVerified = false
  OTP_TIMER = environment.resendOTPTIme
  timerSubscription: Subscription | null = null
  timeLeftforOTP = 0
  timeLeftforOTPEmail = 0
  timerSubscriptionEmail: Subscription | null = null
  OTP_TIMER_EMAIL = environment.resendOTPTIme
  filteredOrgList!: any
  orgList: any
  resultFetched = false
  heirarchyObject: any
  hideOrg = false
  emailPattern = `^[\\w\-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$`
  zohoHtml: any
  zohoUrl: any = '/assets/static-data/zoho-code.html'
  environment!: any
  desigantionFilterEnable = false
  isLoadingMoreDesignations = false;
  designationOffset = 0
  odcsDesignationCount = 0
  defaultSearchDesignationCount = 0
  designationListLoadCount = 50
  designationDefaultLoadCount = 50
  noMoreLegacyDesignations = false
  designationSearchText = ''
  designationInitInProgress = false
  scrollListenerAttached = false
  nodalRedirectionUrl = ''
  private subscriptionContact: Subscription | null = null
  private recaptchaSubscription!: Subscription
  private userdataSubscription!: Subscription
  searching = false
  groupsOriginal: any = []

  selectedLanguage = 'en'
  multiLang: any = []
  isMultiLangEnabled: any
  masterData: any = {}

  constructor(
    private signupSvc: SignupService,
    private usersService: UserProfileService,
    private loggerSvc: LoggerService,
    private configSvc: ConfigurationsService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private recaptchaV3Service: ReCaptchaV3Service,
    private router: Router,
    @Inject(DOCUMENT) private _document: any,
    @Inject(PLATFORM_ID) private _platformId: any,
    private translate: TranslateService,
    private langtranslations: MultilingualTranslationsService,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private eventService: EventService,
    private telemetrySvc: TelemetryService,
  ) {
    if (localStorage.getItem('websiteLanguage')) {
      this.translate.setDefaultLang('en')
      let lang = JSON.stringify(localStorage.getItem('websiteLanguage'))
      lang = lang.replace(/\"/g, '')
      this.selectedLanguage = lang
      this.translate.use(lang)
    } else {
      this.translate.setDefaultLang('en')
      localStorage.setItem('websiteLanguage', 'en')
    }

    let userData: any = {}
    this.userdataSubscription = this.signupSvc.updateSignupDataObservable.subscribe((res: any) => {
      userData = res
    })
    this.isMobileVerified = userData && userData.isMobileVerified || false
    this.isEmailVerified = userData && userData.isEmailVerified || false
    this.registrationForm = new UntypedFormGroup({
      firstname: new UntypedFormControl(userData && userData.firstname || '', [Validators.required, Validators.pattern(this.namePatern)]),
      // lastname: new FormControl('', [Validators.required, Validators.pattern(this.namePatern)]),
      // tslint:disable-next-line:max-line-length
      // position: new FormControl('', [Validators.required,  Validators.pattern(this.customCharsPattern), forbiddenNamesValidatorPosition(this.masterPositions)]),
      // tslint:disable-next-line:max-line-length
      group: new UntypedFormControl('', [Validators.required]),
      // tslint:disable-next-line:max-line-length
      email: new UntypedFormControl(userData && userData.email || '', [Validators.required, Validators.pattern(this.emailPattern)]),
      // department: new FormControl('', [Validators.required, forbiddenNamesValidator(this.masterDepartments)]),
      mobile: new UntypedFormControl(userData && userData.mobile || '', [Validators.required,
        Validators.pattern(this.phoneNumberPattern), Validators.maxLength(12)]),
      confirmBox: new UntypedFormControl(false, [Validators.required]),
      confirmTermsBox: new UntypedFormControl(false, [Validators.required]),
      type: new UntypedFormControl('ministry', [Validators.required]),
      // ministry: new FormControl('', [Validators.required, forbiddenNamesValidator(this.masterMinisteries)]),
      // department: new FormControl('', [forbiddenNamesValidator(this.masterDepartments)]),
      // organisation: new FormControl('', [Validators.required, Validators.pattern(this.customCharsPattern)]),
      organisation: new UntypedFormControl('', [Validators.required]),
      // recaptchaReactive: new FormControl(null, [Validators.required]),
      position: new UntypedFormControl('', [Validators.required]),
      searchDesignation: new UntypedFormControl('', [])
    })
    if (this.configSvc.instanceConfig && this.configSvc.instanceConfig.isMultilingualEnabled) {
      this.isMultiLangEnabled = this.configSvc.instanceConfig.isMultilingualEnabled
    }
        if (this.registrationForm.get('searchDesignation')) {
      // tslint:disable-next-line
      this.registrationForm.get('searchDesignation')!.valueChanges
        .pipe(
          debounceTime(100),
          distinctUntilChanged(),
          startWith(''),
        )
        .subscribe(res => {
          const txt = res?.toString()?.trim() ?? ''
          if (txt?.length) {
            this.desigantionFilterEnable = true
            // If org has IGOT designations, call the IGOT API; otherwise filter from local backup
            if (this.masterData && this.masterData.designationBackup) {
              this.masterData.designation = this.masterData.designationBackup.filter((item: any) =>
                item.name.toLowerCase().includes(txt.toLowerCase()))
            }
          } else {
            if (this.masterData && this.masterData.designationBackup) {
              this.masterData.designation = this.masterData.designationBackup.slice(0, this.designationDefaultLoadCount)
              this.desigantionFilterEnable = false
              this.checkCurrentDesignationPresent()
            }
          }
        })
    }
  }

  ngOnInit() {
    // this.fetchDropDownValues('ministry')
    const instanceConfig = this.configSvc.instanceConfig
    this.positionsOriginal = this.activatedRoute.snapshot.data.positions.data || []
    if (this.activatedRoute.snapshot.data.group.data) {
      this.groupsOriginal = this.activatedRoute.snapshot.data.group.data.filter((ele: any) => ele !== 'Others')
      this.masterGroup = this.groupsOriginal
    } else {
      this.groupsOriginal = []
    }

    this.OrgsSearchChange()
    // this.onPositionsChange()
    // this.onGroupChange()
    this.onPhoneChange()
    this.onEmailChange()
    if (instanceConfig) {
      this.telemetryConfig = instanceConfig.telemetryConfig
      this.portalID = `${this.telemetryConfig.pdata.id}`
      this.multiLang = instanceConfig.websitelanguages
    }

    if (isPlatformBrowser(this._platformId)) {
      this._document.body.classList.add('cs-recaptcha')
    }
    this.http.get(this.zohoUrl, { responseType: 'text' }).subscribe(res => {
      this.zohoHtml = this.sanitizer.bypassSecurityTrustHtml(res)
    })
     if (!this.masterData['designationBackup']) {
      this.getDesignationSafe()
    }
  }
private getDesignationSafe(): void {
  if (this.designationInitInProgress || this.isLoadingMoreDesignations) {
    return
  }
  this.designationInitInProgress = true
  this.getDesignation()
}

    getDesignation(searchText?: string, offset?: number): void {
      // avoid running on server-side render
      if (!isPlatformBrowser(this._platformId)) {
        return
      }

      // clear any previous debug hooks
      if (!searchText || searchText?.length === 0) {
        // noop
      }

      const reqOffset = (typeof offset === 'number') ? offset : this.designationOffset
      const reqLimit = this.designationDefaultLoadCount
    const pageIndex = reqLimit > 0 ? Math.floor(reqOffset / reqLimit) : 0
    // if we're requesting from first page, clear the no-more-data guard
    if (pageIndex === 0) {
      this.noMoreLegacyDesignations = false
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
      // when searching, start from first page
      requestBody.pageNumber = 0
      // allow larger page for search if needed
      requestBody.pageSize = this.designationListLoadCount
      // reset guard when performing a fresh search
      this.noMoreLegacyDesignations = false
    }

    // indicate loading state so scroll handlers don't trigger parallel calls
    this.isLoadingMoreDesignations = true

    this.usersService.searchPublicDesignation(requestBody).pipe(finalize(() => {
      this.isLoadingMoreDesignations = false
      this.designationInitInProgress = false
    }))
      .subscribe({
        next: (res: any) => {
        const content = _.get(res, 'result.result.data', [])
        const mapped = content.map((item: any) => ({
          name: item?.designation || '',
          status: item?.status || 'Active',
        }))

        // total count may be present in different keys depending on API version.
        // Prefer 'result.result.totalcount' (legacy lower-case) then data.totalCount, then totalCount
        const total = _.get(res, 'result.result.totalcount', _.get(res, 'result.result.data.totalCount', _.get(res, 'result.result.totalCount', 0)))
        this.defaultSearchDesignationCount = total

        // If offset is zero (first page) replace backup, otherwise append + dedupe
        if (!this.masterData['designationBackup'] || reqOffset === 0) {
          this.masterData['designationBackup'] = mapped
        } else {
          const combined = (this.masterData['designationBackup'] || []).concat(mapped)
          this.masterData['designationBackup'] = _.uniqBy(combined, (it: any) => (it?.name || '').toLowerCase())
        }

        // If server returned no new items, mark as no-more-data to stop further scroll requests
        if (!mapped || mapped?.length === 0) {
          this.noMoreLegacyDesignations = true
        }

        // If we've loaded at least the total count, mark no-more-data
        if (this.defaultSearchDesignationCount && (this.masterData['designationBackup'] || []).length >= this.defaultSearchDesignationCount) {
          this.noMoreLegacyDesignations = true
        }

        // Ensure visible list matches the requested display count
        this.masterData['designation'] = (this.masterData['designationBackup'] || []).slice(0, this.designationListLoadCount)
        // loading flag cleared in finalize()
        this.checkCurrentDesignationPresent()
      },
      error: () => {
        // Stop further automatic calls on repeated errors to avoid tight loops
        // loading flag cleared in finalize()
        this.noMoreLegacyDesignations = true
        // this.matSnackBar.open('Unable to fetch designation details, please try again later!')
      }
    })
  }
   checkCurrentDesignationPresent() {
    // Get the current designation value
    const currentDesignation = this.registrationForm.get('position')!.value
    // Check if current designation exists in the list
    if (currentDesignation) {
      const designationExists = this.masterData?.designation.some(
        (designation: any) => designation?.name.toLowerCase() === currentDesignation.toLowerCase()
      )

      // If designation doesn't exist in the list, add it
      if (!designationExists) {
        // Create a new designation object to match the structure of other items
        const newDesignation = {
          name: currentDesignation,
          // Add any other required properties matching your data structure
          id: 'custom-' + Date.now(),
          description: currentDesignation
        }
        // Make sure the custom designation appears in the filtered list
        if (this.masterData?.designation?.length >= this.designationListLoadCount) {
          // Replace the last item with the new one to maintain the same number of items
          this.masterData?.designation.pop()
        }
        this.masterData?.designation?.unshift(newDesignation)
        this.isLoadingMoreDesignations = false
      }
    }
  }
    onDesignationDropdownClosed(): void {
    // Keep the designation value but clear the search input
    const currentDesignation = this.registrationForm.get('position')!.value
    setTimeout(() => {
      if (this.registrationForm.get('searchDesignation')) {
        this.registrationForm.get('searchDesignation')!.setValue('')
      }
      // Ensure the designation value remains selected
      if (currentDesignation) {
        const designationControl = this.registrationForm.get('designation')
        if (designationControl) {
          designationControl.setValue(currentDesignation)
        }
      }
    }, 100)
  }

 designationSearch(evt: any) {
  const searchText = evt?.target?.value
  const txt = (searchText || '').toString().trim()
  if (this.isLoadingMoreDesignations) return

  this.designationSearchText = txt
  if (txt?.length) {
    this.desigantionFilterEnable = true
    this.isLoadingMoreDesignations = true
    this.getDesignation(txt, 0)
  } else if (this.masterData && this.masterData?.designationBackup) {
    this.masterData.designation = this.masterData?.designationBackup.slice(0, this.designationDefaultLoadCount)
    this.desigantionFilterEnable = false
    this.checkCurrentDesignationPresent()
  }
}
setupScrollListener(opened: boolean): void {
  if (opened) {
    if (!this.scrollListenerAttached) {
      this.scrollListenerAttached = true

      this.desigantionFilterEnable = false
      this.designationListLoadCount = this.designationDefaultLoadCount
      this.designationOffset = 0

      this.isLoadingMoreDesignations = true
      this.getDesignation(undefined, 0)

      // Clear search box once
      if (this.registrationForm.get('searchDesignation')) {
        this.registrationForm.get('searchDesignation')!.setValue('')
      }

      setTimeout(() => {
        const searchInput = document.querySelector('.search-input') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      }, 100)

      // Attach scroll listener safely
      setTimeout(() => {
        const panel = document.querySelector('.mat-select-panel.search-panel') as HTMLElement | null
        if (panel) {
          // align panel width to trigger
          try {
            const triggerEl = this.designationRef && this.designationRef.nativeElement as HTMLElement
            if (triggerEl) {
              const rect = triggerEl.getBoundingClientRect()
              // set width and left so panel aligns exactly below the trigger
              panel.style.width = `${Math.round(rect.width)}px`
              // leave left to overlay positioning but nudge if necessary
              // compute left relative to viewport and apply to panel
              const overlayLeft = rect.left
              panel.style.left = `${Math.round(overlayLeft)}px`
            }
          } catch (e) {
            // ignore DOM errors in SSR or unexpected cases
          }

          const scrollHandler = this.onDesignationSelectScroll.bind(this)
          panel.addEventListener('scroll', scrollHandler, { passive: true })
        }
      }, 150)
    }
  } else {
    // Dropdown closed — reset scroll flag so it can reattach next time
    this.scrollListenerAttached = false
  }
}

   onDesignationSelectScroll(event: any): void {
    const element = event?.target
    if (!this.desigantionFilterEnable) {
      // Check if user has scrolled to the bottom (with a small threshold)
      if (element.scrollTop + element?.clientHeight >= element?.scrollHeight - 5) {
        // Only load more if not already loading and if there are potentially more items
        if (!this.isLoadingMoreDesignations) {
          // If org uses IGOT designation taxonomy, request more from the API by increasing the limit
          if (this.masterData?.designationBackup?.length > this.masterData?.designation?.length) {
            // Local pagination: expand the sliced list
            this.isLoadingMoreDesignations = true
            this.designationListLoadCount += this.designationDefaultLoadCount
            // Update the filtered list with more items
            setTimeout(() => {
              this.masterData.designation = this.masterData?.designationBackup?.slice(0, this.designationListLoadCount)
              this.checkCurrentDesignationPresent()
              this.isLoadingMoreDesignations = false
            }, 500) // Small timeout to simulate loading and prevent multiple triggers
          } else {
            // Legacy (server) pagination: request next page if total not reached
            const loadedLegacy = (this.masterData?.designationBackup || []).length
            if (!this.noMoreLegacyDesignations && this.defaultSearchDesignationCount && loadedLegacy < this.defaultSearchDesignationCount) {
              this.isLoadingMoreDesignations = true
              this.designationOffset = (this.designationOffset || 0) + this.designationDefaultLoadCount
              // increase display count to include newly fetched items
              this.designationListLoadCount += this.designationDefaultLoadCount
              this.getDesignation(undefined, this.designationOffset)
            }
          }
        }
      }
    }
  }

  get typeValueStartCase() {
    // tslint:disable-next-line: no-non-null-assertion
    return _.startCase(this.registrationForm.get('type')!.value)
  }

  get typeValue() {
    // tslint:disable-next-line: no-non-null-assertion
    return this.registrationForm.get('type')!.value
  }

  emailVerification(emailId: string) {
    this.emailLengthVal = false
    if (emailId && emailId.length > 0) {
      const email = emailId.split('@')
      if (email && email.length === 2) {
        if ((email[0] && email[0].length > 64) || (email[1] && email[1].length > 255)) {
          this.emailLengthVal = true
        }
      } else {
        this.emailLengthVal = false
      }
    }
  }

  clearValues() {
    // tslint:disable-next-line: no-non-null-assertion
    this.registrationForm.get('organisation')!.setValue('')
    this.heirarchyObject = null
  }
  mdoRedirect() {
    this.environment = environment
    const sitePath = this.environment.sitePath
    const domain = sitePath.split('.').slice(1).join('.')
    const newUrl = `https://${domain}/#/mdoList#mdoUserList`
    window.location.href = newUrl
  }

  // onPositionsChange() {
  //   // tslint:disable-next-line: no-non-null-assertion
  //   this.masterPositions = this.registrationForm.get('position')!.valueChanges
  //     .pipe(
  //       debounceTime(500),
  //       distinctUntilChanged(),
  //       startWith(''),
  //       map(value => typeof (value) === 'string' ? value : (value && value.name ? value.name : '')),
  //       map(name => name ? this.filterPositions(name) : this.positionsOriginal.slice())
  //     )

  //   this.masterPositions.subscribe((event: any) => {
  //     // tslint:disable-next-line: no-non-null-assertion
  //     this.registrationForm.get('position')!.setValidators([Validators.required, forbiddenNamesValidatorPosition(event)])
  //     this.registrationForm.updateValueAndValidity()
  //   })
  // }

  // onGroupChange() {
  //   // tslint:disable-next-line: no-non-null-assertion
  //   this.masterGroup = this.registrationForm.get('group')!.valueChanges
  //     .pipe(
  //       debounceTime(500),
  //       distinctUntilChanged(),
  //       startWith(''),
  //       map((value: any) => typeof (value) === 'string' ? value : (value && value.name ? value.name : '')),
  //       map((name: any) => name ? this.filterGroups(name) : this.groupsOriginal.slice())
  //     )

  //   this.masterGroup.subscribe((event: any) => {
  //     // tslint:disable-next-line: no-non-null-assertion
  //     this.registrationForm.get('group')!.setValidators([Validators.required])
  //     this.registrationForm.updateValueAndValidity()
  //   })
  // }

  filterOrgsSearch(orgname: string = '') {
      const filterValue = orgname.toLowerCase()
      return this.signupSvc.searchOrgs(filterValue, this.typeValue).subscribe((res: any) => {
        this.resultFetched = true
        this.searching = false
        this.filteredOrgList =  res.result.response.filter((org: any) => {
          return org.orgName.toLowerCase().indexOf(filterValue) >= 0
        })
      },                                                                      (err: any) => {
        this.searching = false
        this.loggerSvc.error('Error in fetching organisations >', err)
        if (err.error && err.error.params && err.error.params.errmsg) {
          this.openSnackbar(err.error.params.errmsg)
        } else {
          this.openSnackbar(this.translateLabels('somethingWentWrong', 'common'))
        }
      })
  }

  async searchOrgs(searchValue: string) {
    this.searching = true
    if (!searchValue) {
      this.openSnackbar(this.translateLabels('enterOrganisationName', 'publicsignup'))
      this.searching = false
      return
    }
    await this.filterOrgsSearch(searchValue)
    // console.log('this.filteredOrgList :: ', this.filteredOrgList)
  }

  editOrg() {
    this.hideOrg = false
    this.resultFetched = false
    this.searching = false
    this.clearValues()
    this.heirarchyObject = null
  }

  // tslint:disable-next-line:function-name
  OrgsSearchChange() {
    // tslint:disable-next-line:no-non-null-assertion
    this.registrationForm.get('organisation')!.valueChanges.subscribe(() => {
      this.resultFetched = false
      this.registrationForm.updateValueAndValidity()
    })
  }

  orgClicked(event: any) {
    if (event) {
      if (event.option && event.option.value && event.option.value.orgName) {
        const frmctr = this.registrationForm.get('organisation') as UntypedFormControl
        frmctr.setValue(_.get(event, 'option.value.orgName') || '')
        // frmctr.patchValue(_.get(event, 'option.value') || '')
        this.heirarchyObject = _.get(event, 'option.value')
        this.hideOrg = true
      } else {
        this.hideOrg = false
      }
    }
  }

  // private filterPositions(name: string): any {
  //   if (name) {
  //     const filterValue = name.toLowerCase()
  //     return this.positionsOriginal.filter((option: any) => option.name.toLowerCase().includes(filterValue))
  //   }
  //   return this.positionsOriginal
  // }

  // private filterGroups(name: string): any {
  //   if (name) {
  //     const filterValue = name.toLowerCase()
  //     return this.groupsOriginal.filter((option: any) => option.toLowerCase().includes(filterValue))
  //   }
  //   return this.groupsOriginal
  // }

  onPhoneChange() {
    const ctrl = this.registrationForm.get('mobile')
    if (ctrl) {
      ctrl
        .valueChanges
        .pipe(startWith(null), pairwise())
        .subscribe(([prev, next]: [any, any]) => {
          if (!(prev == null && next)) {
            this.isMobileVerified = false
            this.otpSend = false
            this.disableVerifyBtn = false
          }
        })
    }
  }

  onEmailChange() {
    const ctrl = this.registrationForm.get('email')
    if (ctrl) {
      ctrl
        .valueChanges
        .pipe(startWith(null), pairwise())
        .subscribe(([prev, next]: [any, any]) => {
          if (!(prev == null && next)) {
            this.isEmailVerified = false
            this.otpEmailSend = false
          }
        })
    }
  }

  sendOtp() {
    const mob = this.registrationForm.get('mobile')
    if (mob && mob.value && Math.floor(mob.value) && mob.valid) {
      this.signupSvc.sendOtp(mob.value, 'phone').subscribe(() => {
        this.otpSend = true
        alert(this.translateLabels('anOtpHasBeenSentToMobile', 'publicsignup'))
        this.startCountDown()
        // tslint:disable-next-line: align
      }, (error: any) => {
        this.snackBar.open(_.get(error, 'error.params.errmsg') || 'Please try again later')
      })
    } else {
      this.snackBar.open(this.translateLabels('pleaseEnterValidMobileNumber', 'publicsignup'))
    }
  }

  resendOTP() {
    const mob = this.registrationForm.get('mobile')
    if (mob && mob.value && Math.floor(mob.value) && mob.valid) {
      this.signupSvc.resendOtp(mob.value, 'phone').subscribe((res: any) => {
        if ((_.get(res, 'result.response')).toUpperCase() === 'SUCCESS') {
          this.otpSend = true
          this.disableVerifyBtn = false
          alert(this.translateLabels('anOtpHasBeenSentToMobile', 'publicsignup'))
          this.startCountDown()
        }
        // tslint:disable-next-line: align
      }, (error: any) => {
        this.snackBar.open(_.get(error, 'error.params.errmsg') || 'Please try again later')
      })
    } else {
      this.snackBar.open(this.translateLabels('pleaseEnterValidMobileNumber', 'publicsignup'))
    }
  }

  verifyOtp(otp: any) {
    // console.log(otp)
    const mob = this.registrationForm.get('mobile')

    if (otp && otp.value) {
      if (otp && otp.value.length < 4) {
        this.snackBar.open(this.translateLabels('pleaseEnterValidOtp', 'publicsignup'))
      } else if (mob && mob.value && Math.floor(mob.value) && mob.valid) {
        this.signupSvc.verifyOTP(otp.value, mob.value, 'phone').subscribe((res: any) => {
          if ((_.get(res, 'result.response')).toUpperCase() === 'SUCCESS') {
            this.otpVerified = true
            this.isMobileVerified = true
            this.disableBtn = false
            // const reqUpdates = {
            //   request: {
            //     userId: this.configSvc.unMappedUser.id,
            //     profileDetails: {
            //       personalDetails: {
            //         mobile: mob.value,
            //         phoneVerified: true,
            //       },
            //     },
            //   },
            // }
            // this.userProfileSvc.editProfileDetails(reqUpdates).subscribe((updateRes: any) => {
            //   if (updateRes) {
            //     this.isMobileVerified = true
            //   }
            // })
          }
          // tslint:disable-next-line: align
        }, (error: any) => {
          this.snackBar.open(_.get(error, 'error.params.errmsg') || 'Please try again later')
          if (error.error && error.error.result) {
            this.disableVerifyBtn = error.error.result.remainingAttempt === 0 ? true : false
          }
        })
      }
    } else {
      this.snackBar.open(this.translateLabels('pleaseEnterValidOtp', 'publicsignup'))
    }
  }
  startCountDown() {
    const startTime = Date.now()
    this.timeLeftforOTP = this.OTP_TIMER
    // && this.primaryCategory !== this.ePrimaryCategory.PRACTICE_RESOURCE
    if (this.OTP_TIMER > 0
    ) {
      this.timerSubscription = interval(1000)
        .pipe(
          map(
            () =>
              startTime + this.OTP_TIMER - Date.now(),
          ),
        )
        .subscribe((_timeRemaining: any) => {
          this.timeLeftforOTP -= 1
          if (this.timeLeftforOTP < 0) {
            this.timeLeftforOTP = 0
            if (this.timerSubscription) {
              this.timerSubscription.unsubscribe()
            }
            // this.submitQuiz()
          }
        })
    }
  }

  sendOtpEmail() {
    const email = this.registrationForm.get('email')
    if (email && email.value && email.valid) {
      this.signupSvc.sendOtp(email.value, 'email').subscribe(() => {
        this.otpEmailSend = true
        alert(this.translateLabels('anOtpHasBeenSentToEmail', 'publicsignup'))
        this.startCountDownEmail()
        // tslint:disable-next-line: align
      }, (error: any) => {
        this.snackBar.open(_.get(error, 'error.params.errmsg') || 'Please try again later')
      })
    } else {
      this.snackBar.open(this.translateLabels('validEmail', 'publicsignup'))
    }
  }

  resendOTPEmail() {
    const email = this.registrationForm.get('email')
    if (email && email.value && email.valid) {
      this.signupSvc.resendOtp(email.value, 'email').subscribe((res: any) => {
        if ((_.get(res, 'result.response')).toUpperCase() === 'SUCCESS') {
          this.otpEmailSend = true
          alert(this.translateLabels('anOtpHasBeenSentToEmail', 'publicsignup'))
          this.startCountDownEmail()
        }
        // tslint:disable-next-line: align
      }, (error: any) => {
        this.snackBar.open(_.get(error, 'error.params.errmsg') || 'Please try again later')
      })
    } else {
      this.snackBar.open(this.translateLabels('validEmail', 'publicsignup'))
    }
  }

  verifyOtpEmail(otp: any) {
    // console.log(otp)
    const email = this.registrationForm.get('email')
    if (otp && otp.value) {
      if (otp && otp.value.length < 4) {
        this.snackBar.open(this.translateLabels('pleaseEnterValidOtp', 'publicsignup'))
      } else if (email && email.value && email.valid) {
        this.signupSvc.verifyOTP(otp.value, email.value, 'email').subscribe((res: any) => {
          if ((_.get(res, 'result.response')).toUpperCase() === 'SUCCESS') {
            this.otpEmailSend = true
            this.isEmailVerified = true
            this.disableBtn = false
            // const reqUpdates = {
            //   request: {
            //     userId: this.configSvc.unMappedUser.id,
            //     profileDetails: {
            //       personalDetails: {
            //         mobile: mob.value,
            //         phoneVerified: true,
            //       },
            //     },
            //   },
            // }
            // this.userProfileSvc.editProfileDetails(reqUpdates).subscribe((updateRes: any) => {
            //   if (updateRes) {
            //     this.isMobileVerified = true
            //   }
            // })
          }
          // tslint:disable-next-line: align
        }, (error: any) => {
          this.snackBar.open(_.get(error, 'error.params.errmsg') || 'Please try again later')
        })
      }
    } else {
      this.snackBar.open(this.translateLabels('pleaseEnterValidOtp', 'publicsignup'))
    }
  }
  startCountDownEmail() {
    const startTime = Date.now()
    this.timeLeftforOTPEmail = this.OTP_TIMER_EMAIL
    // && this.primaryCategory !== this.ePrimaryCategory.PRACTICE_RESOURCE
    if (this.OTP_TIMER_EMAIL > 0
    ) {
      this.timerSubscriptionEmail = interval(1000)
        .pipe(
          map(
            () =>
              startTime + this.OTP_TIMER_EMAIL - Date.now(),
          ),
        )
        .subscribe(_timeRemaining => {
          this.timeLeftforOTPEmail -= 1
          if (this.timeLeftforOTPEmail < 0) {
            this.timeLeftforOTPEmail = 0
            if (this.timerSubscriptionEmail) {
              this.timerSubscriptionEmail.unsubscribe()
            }
            // this.submitQuiz()
          }
        })
    }
  }

  public confirmChange() {
    this.confirm = !this.confirm
    this.registrationForm.patchValue({
      confirmBox: this.confirm,
    })
  }

  public confirmTermsChange() {
    this.confirmTerms = !this.confirmTerms
    this.registrationForm.patchValue({
      confirmTermsBox: this.confirmTerms,
    })
  }

  displayFn = (value: any) => {
    return value ? value.channel : undefined
  }

  displayFnPosition = (value: any) => {
    return value ? value.name : undefined
  }

  displayFnGroup = (value: any) => {
    return value ? value : undefined
  }

  displayFnOrg = (value: any) => {
    return value ? value.orgName : ''
  }

  signup() {
    this.disableBtn = true
    this.recaptchaSubscription = this.recaptchaV3Service.execute('importantAction')
      .subscribe(
        _token => {
          // tslint:disable-next-line: no-console
          let req: any
          if (this.heirarchyObject) {
            req = {
              firstName: this.registrationForm.value.firstname || '',
              // lastName: this.registrationForm.value.lastname || '',
              email: this.registrationForm.value.email || '',
              phone: `${this.registrationForm.value.mobile}` || '',
              // position: this.registrationForm.value.position.name || '',
              group: this.registrationForm.value.group || '',
              source: `${environment.name}.${this.portalID}` || '',
              orgName: this.heirarchyObject.orgName || '',
              channel: this.heirarchyObject.channel || '',
              organisationType: this.heirarchyObject.sbOrgType || '',
              organisationSubType: this.heirarchyObject.sbOrgSubType || '',
              mapId: this.heirarchyObject.mapId || '',
              sbRootOrgId: this.heirarchyObject.sbRootOrgId,
              sbOrgId: this.heirarchyObject.sbOrgId,
              position: this.registrationForm.value.position || '',
            }
          }

          // console.log('req ===: ', req)

          this.signupSvc.register(req).subscribe(
            (_res: any) => {
              this.openDialog()
              this.disableBtn = false
              this.isMobileVerified = true
              this.raiseSignupInteractTelementry()
            },
            (err: any) => {
              this.disableBtn = false
              this.loggerSvc.error('Error in registering new user >', err)
              if (err.error && err.error.params && err.error.params.errmsg) {
                this.openSnackbar(err.error.params.errmsg)
              } else {
                this.openSnackbar(this.translateLabels('somethingWentWrong', 'common'))
              }
            }
          )
        },
        error => {
          this.disableBtn = false
          // tslint:disable-next-line: no-console
          console.error('captcha validation error', error)
          this.openSnackbar(`reCAPTCHA validation failed: ${error}`)
        }
      )
         
  }

  private openSnackbar(primaryMsg: string, duration: number = 5000) {
    this.snackBar.open(primaryMsg, 'X', {
      duration,
    })
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(SignupSuccessDialogueComponent, {
      // height: '400px',
      width: '500px',
      // data: { content, userId: this.userId, userRating: this.userRating },
    })
    dialogRef.afterClosed().subscribe((_result: any) => {
    })
  }

  termsAndConditionClick() {
    const dialogRef = this.dialog.open(TermsAndConditionComponent, {
      maxHeight: 'auto',
      height: '90%',
      width: '90%',
      minHeight: 'auto',
    })
    dialogRef.afterClosed().subscribe((_result: any) => {
      if (_result) {
        this.confirmTerms = _result
      }
     })
  }

  ngOnDestroy() {
    if (this.subscriptionContact) {
      this.subscriptionContact.unsubscribe()
    }
    if (this.recaptchaSubscription) {
      this.recaptchaSubscription.unsubscribe()
    }

    if (isPlatformBrowser(this._platformId)) {
      this._document.body.classList.remove('cs-recaptcha')
    }
    if (this.userdataSubscription) {
      this.userdataSubscription.unsubscribe()
    }
  }

  // Getters
  // get ministry(): FormControl {
  //   return this.registrationForm.get('ministry') as FormControl
  // }
  // get department(): FormControl {
  //   return this.registrationForm.get('department') as FormControl
  // }
  // get organisation(): FormControl {
  //   return this.registrationForm.get('organisation') as FormControl
  // }

  navigateTo(param?: any) {
    const formData = this.registrationForm.value
    const url = '/public/request'
    // tslint:disable-next-line: max-line-length
    this.router.navigate([url], {  queryParams: { type: param }, state: { userform: formData, isMobileVerified: this.isMobileVerified , isEmailVerified: this.isEmailVerified } })
  }

  numericOnly(event: any): boolean {
    const pattren = /^([0-9])$/
    const result = pattren.test(event.key)
    return result
  }

  selectLanguage(event: any) {
    this.selectedLanguage = event
    localStorage.setItem('websiteLanguage', this.selectedLanguage)
    this.langtranslations.updatelanguageSelected(true, this.selectedLanguage, '')
  }

  translateLabels(label: string, type: any) {
    return this.langtranslations.translateActualLabel(label, type, '')
  }
  getZohoForm() {
    const dialogRef = this.dialog.open(ZohoDialogComponent, {
      width: '45%',
      data: {
        view: 'zohoform',
        value: this.zohoHtml,
      },
    })
    dialogRef.afterClosed().subscribe(() => {
    })
    setTimeout(() => {
      this.callXMLRequest()
    },         0)
  }

  callXMLRequest() {
    let webFormxhr: any = {}
    webFormxhr = new XMLHttpRequest()
    // tslint:disable-next-line: prefer-template
    webFormxhr.open('GET', 'https://desk.zoho.in/support/GenerateCaptcha?action=getNewCaptcha&_=' + new Date().getTime(), true)
    webFormxhr.onreadystatechange = () => {
      if (webFormxhr.readyState === 4 && webFormxhr.status === 200) {
        try {
          const response = (webFormxhr.responseText != null) ? JSON.parse(webFormxhr.responseText) : ''
          const zsCaptchaUrl: any = document.getElementById('zsCaptchaUrl')
          if (zsCaptchaUrl) {
            zsCaptchaUrl.src = response.captchaUrl
            zsCaptchaUrl.style.display = 'block'
          }
          const xJdfEaS: any = document.getElementsByName('xJdfEaS')[0]
          xJdfEaS.value = response.captchaDigest
          const zsCaptchaLoading: any = document.getElementById('zsCaptchaLoading')
          zsCaptchaLoading.style.display = 'none'
          const zsCaptcha: any = document.getElementById('zsCaptcha')
          zsCaptcha.style.display = 'block'
          const refreshCaptcha: any = document.getElementById('refreshCaptcha')
          if (refreshCaptcha) {
            refreshCaptcha.addEventListener('click', () => {
              this.callXMLRequest()
            })
          }
        } catch (e) {
        }
      }
    }
    webFormxhr.send()
  }

   raiseSignupInteractTelementry() {
        this.eventService.raiseInteractTelemetry(
          {
            type: WsEvents.EnumInteractTypes.CLICK,
            id: 'sign-up',
            pageid: "/public/signup" 
          },
          {},
          {
            module: "User Registration",
          }
        )
  
        setTimeout(() => {
          this.telemetrySvc.end(
            { 
              type: WsEvents.EnumInteractTypes.CLICK,
              id: 'sign-up',
              pageid: "/public/signup" 
          }, {},
           {
              module: "User Registration",
            })
          
        }, 2000);
    
    }
}