import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { ConfigurationsService, DomainConfService } from '@sunbird-cb/utils-v2'
import { ProfileVerificationDialogComponent } from '../profile-verification-dialog/profile-verification-dialog.component'
import { UserProfileService } from '@ws/app'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar, MatSnackBarConfig as MatSnackBarConfig } from '@angular/material/snack-bar'
import * as _ from 'lodash'
import { MandatoryNotificationsService } from './mandatory-notifications.service'
import { BehaviorSubject, Observable, of, Subscription, timer } from 'rxjs'
import { map } from 'rxjs/operators'
import { HttpClient } from '@angular/common/http'
import { MandatoryNotificationModalComponent } from '../component/mandatory-notification-modal/mandatory-notification-modal.component'

@Injectable({
  providedIn: 'root',
})
export class CommonDataService {

  configSuccess: MatSnackBarConfig = {
    panelClass: 'style-success',
    duration: 20000,
    horizontalPosition: 'center',
    verticalPosition: 'bottom',
  }
  rootOrgId = ''

  private mandatoryNotificationSubject = new BehaviorSubject<any>(null)
  public mandatoryNotification$ = this.mandatoryNotificationSubject.asObservable()

  // Mandatory notification timer properties
  showMandatoryNotification = false
  isMandatoryModalOpen = false
  mandatoryNotificationTimer: Subscription | null = null
  mandatoryNotificationData: any = null
  popupDuration: any = 7200
  isPlayer: boolean = false
  lastNotificationActionTime: number | null = null

  constructor(
    private router: Router,
    private configSvc: ConfigurationsService,
    private userProfileService: UserProfileService,
    private dialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private mandatoryNotificationsService: MandatoryNotificationsService,
    private http: HttpClient,
    private domainConfSvc: DomainConfService
  ) {

    if (this.configSvc && this.configSvc.unMappedUser) {
      this.rootOrgId = this.configSvc.unMappedUser.rootOrgId || ''
    }
    this.popupDuration = this.configSvc?.globalConfig?.mandatoryPopupDuration || 7200
  }
  redirectToCustomProfile() {
    this.router.navigate(['/app/person-profile/me'], { fragment: 'orgDetails' })
  }

  // dialog/popup visibility from global-config -> components.dialogs
  isDialogEnabled(dialogKey: string): boolean {
    return this.domainConfSvc.isConfigEnabled('components.dialogs', 'enabled')
      && this.domainConfSvc.isConfigEnabled('components.dialogs', dialogKey)
  }

  mandatoryDetails(isPlayer: boolean) {
    if (!this.isDialogEnabled('profileVerification')) {
      // skip the verification dialog but keep the downstream org/custom-field
      // checks and mandatory-notification flow running
      this.getOrgDetails(isPlayer)
      return
    }
    const unMappedUser = this.configSvc.unMappedUser
    const userProfileUpdateDate = unMappedUser && unMappedUser.profileDetails && unMappedUser.profileDetails.personalDetails && unMappedUser.profileDetails.personalDetails?.lastProfileVerificationPromptDate ? Number(unMappedUser.profileDetails.personalDetails.lastProfileVerificationPromptDate) : null
    // Difference in milliseconds
    const currentEpochTime = new Date().getTime()
    let diffMs = 0
    if (userProfileUpdateDate !== null) {
      diffMs = Math.abs(currentEpochTime - userProfileUpdateDate)
    }
    // Convert ms → days
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

    if ((diffDays && diffDays > 90) || userProfileUpdateDate === null) {
      const userData = {
        ...this.configSvc?.userProfile,
        mobile: this.configSvc.unMappedUser?.profileDetails?.personalDetails?.mobile || '',
        primaryEmail: this.configSvc.unMappedUser?.profileDetails?.personalDetails?.primaryEmail || '',
      }
      const dialogRef = this.dialog.open(ProfileVerificationDialogComponent, {
        data: {
          userProfile: userData,
        },
        panelClass: 'profile-verification-dialog-container',
        disableClose: true,
        maxWidth: '95vw',
        width: '500px',
      })

      dialogRef.afterClosed().subscribe(async (res: any) => {
        if (res && res?.action === 'update') {
          this.router.navigate(['/app/person-profile/me'], { fragment: 'mandatorySection', queryParams: { source: 'mandatoryUpdate' } })
          dialogRef.close()
        } else if (res && res?.action === 'verify') {
          this.callExtPatchProfile(isPlayer)
        }
      })
    } else {
      this.getOrgDetails(isPlayer)
    }
  }
  callExtPatchProfile(isPlayer: boolean) {
    const currentEpoch = new Date().getTime().toString()
    const request = {
      'request': {
        'userId': this.configSvc.unMappedUser.id,
        'profileDetails': {
          'personalDetails': {
            'lastProfileVerificationPromptDate': currentEpoch,
          },
        },
      },
    }
    this.userProfileService.editProfileDetails(request).subscribe((res: any) => {
      if (res && res.result && res.result.response?.toUpperCase() === 'SUCCESS') {
        this.matSnackBar.open('Profile verification  updated successfully', 'X', this.configSuccess)
        if (this.configSvc?.unMappedUser?.profileDetails?.personalDetails) {
          this.configSvc.unMappedUser.profileDetails.personalDetails.lastProfileVerificationPromptDate = currentEpoch
        }
      }
      this.getOrgDetails(isPlayer)
    })
  }

  getOrgDetails(isPlayer: boolean) {
    this.rootOrgId = this.rootOrgId || this.configSvc?.userProfile?.rootOrgId ||''
    const request = {
      request: { organisationId: this.rootOrgId },
    }
    if (Object.keys(this.configSvc && this.configSvc.orgReadData || {}).length > 0) {
      const res: any = this.configSvc.orgReadData
      const isPopupEnabled = _.get(res, 'customfieldsdata?.isPopupEnabled') ? true : false
      const customFieldsCount = _.get(res, 'customfieldsdata?.customFieldsCount', 0) as number > 0 ? true : false
      const customFieldsLength = _.get(res, 'customfieldsdata?.customFieldIds', [])
      if (isPopupEnabled && customFieldsCount && customFieldsLength?.length > 0) {
        return this.readCustomattributeDetails(isPlayer)
      }
        this.updatePlayerStatus(isPlayer)
        this.checkAndShowMandatoryNotification()
        return false

    }
      this.userProfileService.readOrgData(request).subscribe((res: any) => {
        this.configSvc.orgReadData = res?.result?.response
        const isPopupEnabled = _.get(res, 'result?.response?.customfieldsdata?.isPopupEnabled') ? true : false
        const customFieldsCount = _.get(res, 'result?.response?.customfieldsdata?.customFieldsCount', 0) as number > 0 ? true : false
        const customFieldsLength = _.get(res, 'result?.response?.customfieldsdata?.customFieldIds', [])
        if (isPopupEnabled && customFieldsCount && customFieldsLength?.length > 0) {
          return this.readCustomattributeDetails(isPlayer)
        }
          this.updatePlayerStatus(isPlayer)
          this.checkAndShowMandatoryNotification()
          return false

      },                                                     error => {
        console.error('Error fetching organization details:', error)
        return false
      })

  }
  readCustomattributeDetails(isPlayer: boolean) {
    this.userProfileService.readCustomattributeDetails(this.configSvc.unMappedUser.id, this.rootOrgId).subscribe((res: any) => {
      const customFieldValues = _.get(res, 'result?.response?.customFieldValues', [])
      if (customFieldValues && customFieldValues.length === 0) {
        return this.redirectToCustomProfile()
      }
        // this.redirectToCustomProfile()

        this.updatePlayerStatus(isPlayer)
        this.checkAndShowMandatoryNotification()
        return false

    },                                                                                                           error => {
      console.error('Error fetching custom attribute details:', error)
      return false
    })
  }

  fetchMandatoryNotification() {
    if (!this.isDialogEnabled('mandatoryNotification')) {
      this.showMandatoryNotification = false
      return
    }
    this.mandatoryNotificationsService.getMandatoryNotification().subscribe((notification: any) => {
      if (notification && !notification.error && Object.keys(notification).length > 0 && !notification?.read) {
        this.mandatoryNotificationData = notification
        this.showMandatoryNotification = true
        this.openMandatoryNotificationModal()
      } else {
        this.showMandatoryNotification = false
      }
    },                                                                      error => {
      this.showMandatoryNotification = false
      console.error('Error fetching mandatory notification:', error)
    })
  }

  openMandatoryNotificationModal() {
    if (this.isMandatoryModalOpen || !this.showMandatoryNotification || this.isPlayer
      || !this.isDialogEnabled('mandatoryNotification')) {
      return
    }
    this.isMandatoryModalOpen = true

    // Clear any pending re-trigger timer
    if (this.mandatoryNotificationTimer) {
      this.mandatoryNotificationTimer.unsubscribe()
      this.mandatoryNotificationTimer = null
    }
    const dialogRef = this.dialog.open(MandatoryNotificationModalComponent, {
      data: {
        notification: this.mandatoryNotificationData,
      },
      panelClass: 'mandatory-notification-dialog-container',
      disableClose: false,
    })

    dialogRef.afterClosed().subscribe(result => {
      this.isMandatoryModalOpen = false
      if (result === 'accepted') {

        const request: any = {
          request: {
            id: this.mandatoryNotificationData.notification_id,
            created_at: this.mandatoryNotificationData.created_at,
            type: this.mandatoryNotificationData.type,
          },
        }

        this.mandatoryNotificationsService.markMandatoryAsRead(request).subscribe((res: any) => {
          if (res.responseCode === 'OK') {
            // Set timestamp when user accepts
            this.mandatoryNotificationData.read = true

            this.setMandatoryTimer()
            this.router.navigate(['/viewer/practice/', this.mandatoryNotificationData?.message?.data?.assessmentId],
                                 {
                queryParams: {
                  primaryCategory: this.mandatoryNotificationData?.message?.data?.primaryCategory,
                  collectionId: this.mandatoryNotificationData?.message?.data?.collectionId,
                  collectionType: this.mandatoryNotificationData?.message?.data?.collectionType,
                  batchId: this.mandatoryNotificationData?.message?.data?.batchId,
                },
              }
            )
          }
        },                                                                        error => {
          console.error('Error marking mandatory notification as read:', error)
          this.showMandatoryNotification = false
          this.setMandatoryTimer()
        })
      } else {
        this.showMandatoryNotification = false
        this.setMandatoryTimer()
      }
    })
  }

  setMandatoryTimer() {
    // Set timestamp when user accepts
    this.lastNotificationActionTime = Date.now()
    this.mandatoryNotificationData.read = true

    // Unsubscribe from existing timer if any
    if (this.mandatoryNotificationTimer) {
      this.mandatoryNotificationTimer.unsubscribe()
      this.mandatoryNotificationTimer = null
    }

    this.mandatoryNotificationTimer = timer(this.popupDuration * 1000).subscribe(() => {
      this.showMandatoryNotification = true
      this.fetchMandatoryNotification()
    })
  }

  checkAndShowMandatoryNotification() {
    if (!this.isPlayer && !this.isMandatoryModalOpen) {
      const currentTime = Date.now()
      const timeElapsedInSeconds = this.lastNotificationActionTime
        ? (currentTime - this.lastNotificationActionTime) / 1000 // Convert milliseconds to seconds
        : this.popupDuration + 1 // If no timestamp, consider time elapsed (in seconds)

      // Only show modal if time elapsed is greater than or equal to popup duration
      if (timeElapsedInSeconds >= this.popupDuration) {
        // Unsubscribe from existing timer if any
        if (this.mandatoryNotificationTimer) {
          this.mandatoryNotificationTimer.unsubscribe()
          this.mandatoryNotificationTimer = null
        }

        this.showMandatoryNotification = true
        this.fetchMandatoryNotification()
      }
    }
  }

  updatePlayerStatus(isPlayer: boolean) {
    this.isPlayer = isPlayer
  }

  /**
   * Check NLW 2026 certification eligibility from user profile and cache in localStorage.
   * - If the value exists in profile, cache it.
   * - If not present, mark as not eligible so we don't call the API again.
   */
  checkAndCacheNlw2026Eligibility(userProfile: any): void {
    const isNlw2026Certified = _.get(userProfile, 'profileDetails.additionalProperties.isNlw2026Certified')
    if (isNlw2026Certified !== undefined && isNlw2026Certified !== null) {
      localStorage.setItem('isNlw2026Certified', JSON.stringify(isNlw2026Certified))
    } else {
      // Key not present in profile — user is not eligible
      localStorage.setItem('isNlw2026Certified', 'false')
    }
  }

  /**
   * Get NLW 2026 certification eligibility.
   * First checks localStorage cache to avoid unnecessary API calls.
   * If no cached value, reads from the current configSvc user profile.
   * Returns true only if the user is certified.
   */
  /**\n   * Resolve a content URL based on the user's ministry/state org language mapping.\n   * Falls back to English if no match found.\n   */
  getLanguageBasedContentUrl(contentKey: string): string {
    const ministryOrStateOrgName = _.get(this.configSvc, 'unMappedUser.profileDetails.ministryOrStateOrgName', '')
    const languageMap = _.get(this.configSvc, 'globalConfig.languageMap', {})
    const languageBasedContent = _.get(this.configSvc, 'globalConfig.languageBasedContent', {})
    const language = languageMap[(ministryOrStateOrgName || '').toLowerCase()] || 'english'
    return _.get(languageBasedContent, `${language}.${contentKey}`, '') || _.get(languageBasedContent, `english.${contentKey}`, '')
  }

  /**
   * Get NLW 2026 certification eligibility.
   * First checks localStorage cache to avoid unnecessary API calls.
   * If no cached value, reads from the current configSvc user profile.
   * Returns true only if the user is certified.
   */
  getNlw2026CertifiedStatus(): Observable<boolean> {
    const cached = localStorage.getItem('isNlw2026Certified')
    if (cached !== null) {
      return of(cached === 'true')
    }
    // Check from configSvc if already loaded
    const isNlw2026Certified = _.get(
      this.configSvc, 'unMappedUser.profileDetails.additionalProperties.isNlw2026Certified'
    )
    if (isNlw2026Certified !== undefined && isNlw2026Certified !== null) {
      localStorage.setItem('isNlw2026Certified', JSON.stringify(isNlw2026Certified))
      return of(!!isNlw2026Certified)
    }
    // Not in cache or configSvc — call user read API
    const userId = _.get(this.configSvc, 'unMappedUser.id')
    if (!userId) {
      localStorage.setItem('isNlw2026Certified', 'false')
      return of(false)
    }
    return this.http.get<any>(`/apis/proxies/v8/api/user/v2/read/${userId}`).pipe(
      map((res: any) => {
        const userProfile = _.get(res, 'result.response')
        if (userProfile) {
          // Update configSvc with fresh data
          this.configSvc.unMappedUser = userProfile
        }
        const certified = _.get(userProfile, 'profileDetails.additionalProperties.isNlw2026Certified')
        if (certified !== undefined && certified !== null) {
          localStorage.setItem('isNlw2026Certified', JSON.stringify(certified))
          return !!certified
        }
        localStorage.setItem('isNlw2026Certified', 'false')
        return false
      })
    )
  }
}
