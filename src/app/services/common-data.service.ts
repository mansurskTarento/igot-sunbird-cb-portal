import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { ProfileVerificationDialogComponent } from '../profile-verification-dialog/profile-verification-dialog.component'
import { UserProfileService } from '@ws/app/src/lib/routes/user-profile/services/user-profile.service'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { MatLegacySnackBar as MatSnackBar, MatLegacySnackBarConfig as MatSnackBarConfig } from '@angular/material/legacy-snack-bar'
import * as _ from 'lodash'
import { MandatoryNotificationsService } from './mandatory-notifications.service'
import { BehaviorSubject, Subscription, timer } from 'rxjs'
import { MandatoryNotificationModalComponent } from '../component/mandatory-notification-modal/mandatory-notification-modal.component'

@Injectable({
  providedIn: 'root'
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
    private mandatoryNotificationsService: MandatoryNotificationsService
  ) {

    if (this.configSvc && this.configSvc.unMappedUser) {
      this.rootOrgId = this.configSvc.unMappedUser.rootOrgId || ''
    }
    this.popupDuration = this.configSvc?.globalConfig?.mandatoryPopupDuration || 7200
  }
  redirectToCustomProfile() {
    this.router.navigate(['/app/person-profile/me'], { fragment: 'orgDetails' })
  }
  mandatoryDetails(isPlayer: boolean) {
    let unMappedUser = this.configSvc.unMappedUser
    let userProfileUpdateDate = unMappedUser && unMappedUser.profileDetails && unMappedUser.profileDetails.personalDetails && unMappedUser.profileDetails.personalDetails?.lastProfileVerificationPromptDate ? Number(unMappedUser.profileDetails.personalDetails.lastProfileVerificationPromptDate) : null
    // Difference in milliseconds
    const currentEpochTime = new Date().getTime()
    let diffMs = 0
    if (userProfileUpdateDate !== null) {
      diffMs = Math.abs(currentEpochTime - userProfileUpdateDate)
    }
    // Convert ms → days
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

    if ((diffDays && diffDays > 90) || userProfileUpdateDate === null) {
      let userData = {
        ...this.configSvc?.userProfile,
        mobile: this.configSvc.unMappedUser?.profileDetails?.personalDetails?.mobile || '',
        primaryEmail: this.configSvc.unMappedUser?.profileDetails?.personalDetails?.primaryEmail || '',
      }
      let dialogRef = this.dialog.open(ProfileVerificationDialogComponent, {
        data: {
          userProfile: userData
        },
        panelClass: 'profile-verification-dialog-container',
        disableClose: true,
        maxWidth: '95vw',
        width: '500px'
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
    let request = {
      "request": {
        "userId": this.configSvc.unMappedUser.id,
        "profileDetails": {
          "personalDetails": {
            "lastProfileVerificationPromptDate": currentEpoch
          }
        }
      }
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
    const request = {
      request: { organisationId: this.rootOrgId },
    }
    if (Object.keys(this.configSvc && this.configSvc.orgReadData || {}).length > 0) {
      let res: any = this.configSvc.orgReadData
      const isPopupEnabled = _.get(res, 'result?.response?.customfieldsdata?.isPopupEnabled') ? true : false
      const customFieldsCount = _.get(res, 'result?.response?.customfieldsdata?.customFieldsCount', 0) as number > 0 ? true : false
      const customFieldsLength = _.get(res, 'result?.response?.customfieldsdata?.customFieldIds', [])
      if (isPopupEnabled && customFieldsCount && customFieldsLength?.length > 0) {
        return this.readCustomattributeDetails(isPlayer)
      } else {
        this.updatePlayerStatus(isPlayer)
        // commneted to NLW 2026
        //this.checkAndShowMandatoryNotification()
        return false
      }
    } else {
      this.userProfileService.readOrgData(request).subscribe((res: any) => {
        const isPopupEnabled = _.get(res, 'result?.response?.customfieldsdata?.isPopupEnabled') ? true : false
        const customFieldsCount = _.get(res, 'result?.response?.customfieldsdata?.customFieldsCount', 0) as number > 0 ? true : false
        const customFieldsLength = _.get(res, 'result?.response?.customfieldsdata?.customFieldIds', [])
        if (isPopupEnabled && customFieldsCount && customFieldsLength?.length > 0) {
          return this.readCustomattributeDetails(isPlayer)
        } else {
          this.updatePlayerStatus(isPlayer)
          // commneted to NLW 2026
          //this.checkAndShowMandatoryNotification()
          return false
        }
      }, error => {
        console.error('Error fetching organization details:', error)
        return false
      })
    }
  }
  readCustomattributeDetails(isPlayer: boolean) {
    this.userProfileService.readCustomattributeDetails(this.configSvc.unMappedUser.id, this.rootOrgId).subscribe((res: any) => {
      let customFieldValues = _.get(res, 'result?.response?.customFieldValues', [])
      if (customFieldValues && customFieldValues.length === 0) {
        return this.redirectToCustomProfile()
      } else {
        //this.redirectToCustomProfile()

        this.updatePlayerStatus(isPlayer)
        // commneted to NLW 2026
        //this.checkAndShowMandatoryNotification()
        return false
      }
    }, error => {
      console.error('Error fetching custom attribute details:', error)
      return false
    })
  }


  fetchMandatoryNotification() {
    this.mandatoryNotificationsService.getMandatoryNotification().subscribe((notification: any) => {
      if (notification && !notification.error && Object.keys(notification).length > 0 && !notification?.read) {
        this.mandatoryNotificationData = notification
        this.showMandatoryNotification = true
        this.openMandatoryNotificationModal()
      } else {
        this.showMandatoryNotification = false
      }
    }, error => {
      this.showMandatoryNotification = false
      console.error('Error fetching mandatory notification:', error)
    })
  }

  openMandatoryNotificationModal() {
    if (this.isMandatoryModalOpen || !this.showMandatoryNotification || this.isPlayer) {
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

        let request: any = {
          request: {
            id: this.mandatoryNotificationData.notification_id,
            created_at: this.mandatoryNotificationData.created_at,
            type: this.mandatoryNotificationData.type
          }
        }

        this.mandatoryNotificationsService.markMandatoryAsRead(request).subscribe((res: any) => {
          if (res.responseCode === 'OK') {
            // Set timestamp when user accepts
            this.mandatoryNotificationData.read = true

            this.setMandatoryTimer()
            this.router.navigate(['/viewer/practice/', this.mandatoryNotificationData?.message?.data?.assessmentId,],
              {
                queryParams: {
                  primaryCategory: this.mandatoryNotificationData?.message?.data?.primaryCategory,
                  collectionId: this.mandatoryNotificationData?.message?.data?.collectionId,
                  collectionType: this.mandatoryNotificationData?.message?.data?.collectionType,
                  batchId: this.mandatoryNotificationData?.message?.data?.batchId,
                }
              }
            )
          }
        }, error => {
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
}