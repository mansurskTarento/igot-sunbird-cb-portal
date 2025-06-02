//#region (imports)
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UserStats, achievement, educationalQualifications, profileRoutes, serviceHistory } from '../../models/profile-revamp.model';
import { MatLegacyDialog } from '@angular/material/legacy-dialog'
import { CoverPhotoEditPopupComponent } from '../../components/profile-revamp/cover-photo-edit-popup/cover-photo-edit-popup.component'
import { PrfileEditV2Component } from '../../revamp-dialogs/prfile-edit-v2/prfile-edit-v2.component';
import { ProfileEntryEditComponent } from '../../revamp-dialogs/profile-entry-edit/profile-entry-edit.component';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { ProfileV2RevampService } from '../../services/profile-v2-revamp.service';
import { HttpErrorResponse } from '@angular/common/http';
import { MatLegacySnackBar } from '@angular/material/legacy-snack-bar';
import { ServiceHistoryComponent } from '../../components/profile-revamp/service-history/service-history.component';
import { EducationalQualificationsComponent } from '../../components/profile-revamp/educational-qualifications/educational-qualifications.component';
import { AchievementsComponent } from '../../components/profile-revamp/achievements/achievements.component';
import { forkJoin, Subject } from 'rxjs';
import { mergeMap, takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environment'
import { ConfigurationsService, PipeCertificateImageURL } from '@sunbird-cb/utils-v2';
import { TransferRequestComponent } from '../../components/transfer-request/transfer-request.component';
import { WithdrawRequestComponent } from '../../components/withdraw-request/withdraw-request.component';

//#endregion

@Component({
  selector: 'ws-app-profile-view-v2',
  templateUrl: './profile-view-v2.component.html',
  styleUrls: ['./profile-view-v2.component.scss'],
  providers: [PipeCertificateImageURL]
})
export class ProfileViewV2Component implements OnInit, OnDestroy {

  //#region (global variables)
  private destroySubject$ = new Subject()
  isCurrentUser = false;
  userId: string = '';
  profesionalDetails: any
  profileImageUrl = '';
  profileBannerUrl = '';
  profileCompletion: number = 0;
  nameInitials: string = '';
  userStats: UserStats[] = [];
  profileRoutes: profileRoutes[] = [
    {
      name: 'About Me',
      url: '',
      icon: 'person',
      id: 'about-me'
    }, {
      name: 'Basic Details',
      url: './assets/icons/checklist.svg',
      icon: '',
      id: 'basic-details'
    }, {
      name: 'Service History',
      url: '',
      icon: 'history',
      id: 'service-history'
    }, {
      //   name: 'Competencies',
      //   url: '',
      //   icon: 'extension',
      //   isActive: false,
      //   id: ''
      // }, {
      name: 'Educational',
      url: '',
      icon: 'school',
      id: 'educational-qualifications'
    }, {
      name: 'Achievements',
      url: './assets/icons/trophy.svg',
      icon: '',
      id: 'achievements'
    },
  ]
  activeRoutId: string = 'about-me';
  locationDetails: any = {}
  serviceHistoryDetails: {
    count: number,
    serviceHistoryList: serviceHistory[]
  } = {
      count: 0,
      serviceHistoryList: []
    }

  educationalQualificationDetails: {
    count: number,
    educationalQualifications: educationalQualifications[]
  } = {
      count: 0,
      educationalQualifications: []
    }
  // competencies: Competency[] = [
  //   {
  //     name: 'Behavioural',
  //     active: false,
  //     themes: [
  //       { name: 'Food Waste Management', id: 1 },
  //       { name: 'Commitment to the Organisation', id: 2 },
  //       { name: 'Sustainability Management', id: 3 },
  //       { name: 'Climate Finance', id: 4 },
  //       { name: 'Data Management', id: 5 },
  //       { name: 'General Management', id: 6 },
  //       { name: 'Monitoring and Evaluation', id: 7 }
  //     ]
  //   },
  //   {
  //     name: 'Functional',
  //     themes: [
  //       { name: 'Data Management', id: 5 },
  //       { name: 'General Management', id: 6 },
  //       { name: 'Monitoring and Evaluation', id: 7 }
  //     ]
  //   },
  //   {
  //     name: 'Domain',
  //     themes: [
  //       { name: 'Climate Finance', id: 8 },
  //       { name: 'Finance', id: 9 }
  //     ]
  //   }
  // ];
  achievementsDetails: {
    count: number,
    achievementsList: achievement[]
  } = {
      count: 0,
      achievementsList: []
    }

  peopleSuggestionsList: any[] = []
  communitySuggestionsList: any[] = []
  aboutme = ''
  showMoreAbout = false
  primaryDetails: any;

  groupsList: any[] = []
  designationsList: any[] = []
  isMentor = false
  enableWTR = false; // to enable withdraw transfer request
  enableWR = false; // to enable withdraw request
  unVerifiedObj = {
    designation: '',
    group: '',
    organization: '',
    groupRequestTime: 0,
    designationRequestTime: 0,
  }
  rejectedFields = {
    name: '',
    group: '',
    designation: '',
    groupRejectionComments: '',
    designationRejectionComments: '',
    groupRejectionTime: 0,
    designationRejectionTime: 0,
  }
  approvalPendingFields = []
  //#endregion

  @ViewChild('progressCanvas') progressCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(
    private dialog: MatLegacyDialog,
    private activatedRoute: ActivatedRoute,
    private profileV2RevampSvc: ProfileV2RevampService,
    private snackBar: MatLegacySnackBar,
    private pipeImgUrl: PipeCertificateImageURL,
    private configSvc: ConfigurationsService
  ) { }

  ngOnInit() {
    this.getProfileDetailsFromRoutes()
    const lastSectionId = sessionStorage.getItem('lastProfileSection');
    if (lastSectionId) {
      setTimeout(() => {
        this.selectRoute(lastSectionId);
      }, 100);
    }
    this.getSendApprovalStatus()
    this.getRejectedStatus()
    this.getGroupData()
    this.loadDesignations()
    this.checkIsMentor()
    if( this.configSvc.userProfile && this.configSvc.userProfile.userId) {
      this.isCurrentUser = this.configSvc.userProfile.userId === this.userId
    }
  }

  //#region (initialization)

  getGroupData(): void {
      this.profileV2RevampSvc.getGroups()
        .pipe(takeUntil(this.destroySubject$))
        .subscribe((res: any) => {
          this.groupsList = res.result && res.result.response.filter((ele: any) => ele !== 'Others')
        }, (error: HttpErrorResponse) => {
          if (!error.ok) {
            this.openSnackbar(this.handleTranslateTo('groupDataFaile'))
          }
        })
    }

    loadDesignations() {
      this.profileV2RevampSvc.getDesignations({}).subscribe(
        (data: any) => {
          this.designationsList = data.responseData
        },
        (_err: any) => {
          this.openSnackbar('Failed to load designations')
        })
    }

  checkIsMentor() {
    const userRoles: any = _.get(this.configSvc, 'userRoles', []);
    if( userRoles && userRoles.length > 0) {
      this.isMentor = userRoles.includes('mentor') || userRoles.includes('MENTOR') || userRoles.includes('Mentor') ? true : false;
    }
  }

  getProfileDetailsFromRoutes() {
    this.activatedRoute.data.subscribe(data => {
      this.profesionalDetails = _.get(data, 'profile.data.profiledetails', _.get(data, 'profile.data', {}))
      this.profesionalDetails['userId'] = _.get(data, 'profile.userId', '')
      this.userId = _.get(data, 'profile.userId', '')
      this.profileCompletion = _.get(data, 'profile.data.profileCompletion', 0)
      this.patchProfileDetails()
      this.patchEntries(_.get(data, 'entries.data', {}))
      this.patchConnections(_.get(data, 'recamendations.data', []))
      this.patchRecamendedCommunity(_.get(data, 'recamendedCommunity.data', []))
    })
  }

  patchProfileDetails() {
    this.profileImageUrl = _.get(this.profesionalDetails, 'profileImageUrl', '')
    this.profileBannerUrl = _.get(this.profesionalDetails, 'profileBannerUrl', '')
    this.getInitials()
    this.setProfileCompletionGraph()
    this.primaryDetails = {
      firstname: _.get(this.profesionalDetails, 'personalDetails.firstname', ''),
      group: _.get(this.profesionalDetails, 'professionalDetails[0].group', ''),
      designation: _.get(this.profesionalDetails, 'professionalDetails[0].designation', ''),
      profileGroupStatus: _.get(this.profesionalDetails, 'profileGroupStatus', ''),
      profileDesignationStatus: _.get(this.profesionalDetails, 'profileDesignationStatus', ''),
      osid: _.get(this.profesionalDetails, 'professionalDetails[0].osid', ''),
      employeeCode: _.get(this.profesionalDetails, 'employmentDetails.employeeCode', ''),
      primaryEmail: _.get(this.profesionalDetails, 'personalDetails.primaryEmail', ''),
      mobile: _.get(this.profesionalDetails, 'personalDetails.mobile', ''),
      gender: _.get(this.profesionalDetails, 'personalDetails.gender', ''),
      dob: _.get(this.profesionalDetails, 'personalDetails.dob', ''),
      domicileMedium: _.get(this.profesionalDetails, 'personalDetails.domicileMedium', ''),
      category: _.get(this.profesionalDetails, 'personalDetails.category', ''),
      pinCode: _.get(this.profesionalDetails, 'employmentDetails.pinCode', ''),

      externalSystemId: _.get(this.profesionalDetails, 'additionalProperties.externalSystemId', ''),
      externalSystemDor: _.get(this.profesionalDetails, 'additionalProperties.externalSystemDor', ''),
      isCadre: _.get(this.profesionalDetails, 'personalDetails.isCadre', false),
      civilServiceTypeId: _.get(this.profesionalDetails, 'cadreDetails.civilServiceTypeId', ''),
      civilServiceType: _.get(this.profesionalDetails, 'cadreDetails.civilServiceType', 'NA'),
      civilServiceId: _.get(this.profesionalDetails, 'cadreDetails.civilServiceId', ''),
      civilServiceName: _.get(this.profesionalDetails, 'cadreDetails.civilServiceName', ''),
      cadreId: _.get(this.profesionalDetails, 'cadreDetails.cadreId', ''),
      cadreName: _.get(this.profesionalDetails, 'cadreDetails.cadreName', ''),
      cadreBatch: _.get(this.profesionalDetails, 'cadreDetails.cadreBatch', ''),
      cadreControllingAuthorityName: _.get(this.profesionalDetails, 'cadreDetails.cadreControllingAuthorityName', ''),

      aboutme: _.get(this.profesionalDetails, 'employmentDetails.aboutme', ''),

      currentOrgName: _.get(this.configSvc, 'userProfile.rootOrgName', ''),
    }
    this.aboutme = _.get(this.profesionalDetails, 'employmentDetails.aboutme', '')
  }

  getInitials(): void {
    const userName = _.get(this.profesionalDetails, 'personalDetails.firstname', '');
    if (userName) {
      if (userName.split(' ').length > 1) {
        const nameArr = userName.split(' ')
        this.nameInitials = nameArr[0].charAt(0) + nameArr[1].charAt(0)
      } else {
        this.nameInitials = userName.charAt(0)
      }
    }
  }

  setProfileCompletionGraph() {
    const progress = (247 - ((247 * this.profileCompletion) / 100))
    document.documentElement.style.setProperty('--i', String(progress))
  }

  patchEntries(entries: any) {
    this.serviceHistoryDetails.serviceHistoryList = _.get(entries, 'serviceHistory.data', [])
    this.serviceHistoryDetails.count = _.get(entries, 'serviceHistory.count', 0)
    this.educationalQualificationDetails.educationalQualifications = _.get(entries, 'educationalQualifications.data', [])
    this.educationalQualificationDetails.count = _.get(entries, 'educationalQualifications.count', 0)
    this.achievementsDetails.achievementsList = _.get(entries, 'achievements.data', [])
    this.achievementsDetails.count = _.get(entries, 'achievements.count', 0)
    this.locationDetails = _.get(entries, 'locationDetails.data[0]', {})
  }

  patchConnections(connections: any) {
    this.peopleSuggestionsList = connections
  }

  patchRecamendedCommunity(community: any) {
    this.communitySuggestionsList = community
  }
  //#endregion (initialization)

  selectRoute(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      // Save the selected section to session storage
      sessionStorage.setItem('lastProfileSection', sectionId);

      // Smooth scroll to element
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
    this.activeRoutId = sectionId
  }

  openCoverPhotoDialog() {
    const dialogRef = this.dialog.open(CoverPhotoEditPopupComponent, {
      width: '500px',
      panelClass: 'cover-photo-edit-popup',
      data: {
        coverPhotoUrl: this.profileBannerUrl
      },
      disableClose: true,
    })
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result && result.isUpdated) {
        this.saveBannerImage(result.file)
      }
    })
  }

  saveBannerImage(file: File) {
    if (file) {
      const fileName = file.name.replace(/[^A-Za-z0-9.]/g, '')
      const formdata = new FormData()
      formdata.append('data', file, fileName)
      this.profileV2RevampSvc.updateBannerPic(formdata).pipe(
        mergeMap((res: any) => {
          const createdUrl = _.get(res, 'result.url', '')
          const urlToReplace = 'https://storage.googleapis.com/igot'
          const urlSplice = createdUrl.slice(urlToReplace.length)
          // let uploadedFile = createdUrl
          // if (createdUrl.startsWith(urlToReplace)) {
          //   const urlSplice = createdUrl.slice(urlToReplace.length)
          //   uploadedFile = `${environment.domainName}assets/public/${urlSplice}`
          // }
          const uploadedFile = this.pipeImgUrl.transform(urlSplice)
          const formBody = {
            request: {
              userId: this.userId,
              profileDetails: {
                profileBannerUrl: uploadedFile
              }
            }
          }
          return this.profileV2RevampSvc.updateProfileDetails(formBody)

        })
      ).subscribe({
        next: (res: any) => {
          if (res) {
            this.fetchProfileDetails()
          }
        }, error: (error: HttpErrorResponse) => {
          if (error) {
            const errorMessage = _.get(error, 'error.message', 'Something went wrong please try again')
            this.openSnackbar(errorMessage)
          }
        }
      })
    } else if (this.profileBannerUrl) {
      const formBody = {
        request: {
          userId: this.userId,
          profileDetails: {
            profileBannerUrl: ''
          }
        }
      }
      this.updateProfileDetails(formBody)
    }
  }

  updateProfileDetails(formBody: any) {
    this.profileV2RevampSvc.updateProfileDetails(formBody).subscribe({
      next: (response: any) => {
        if (response) {
          this.fetchProfileDetails()
          this.openSnackbar('Updated Successfully')
        }
      },
      error: (error: HttpErrorResponse) => {
        if (error) {
          this.openSnackbar('Something went wrong please try again')
        }
      }
    })
  }

  fetchProfileDetails() {
    this.profileV2RevampSvc.fetchProfile(this.userId).subscribe({
      next: (response: any) => {
        if (response) {
          this.profesionalDetails = _.get(response, 'result.profiledetails', _.get(response, 'result', {}))
          this.profileCompletion = _.get(response, 'result.profileCompletion', 0)
          this.patchProfileDetails()
        }
      },
      error: (error: HttpErrorResponse) => {
        if (error) {
          this.openSnackbar('Something went wrong please try again')
        }
      }
    })
  }

  openProfileEditDialog(header: string) {
    const dialogDetails = {
      header: header,
      profileDetails: this.primaryDetails,
    }
    if (header === 'Profile') {
      dialogDetails.profileDetails = {
        profileImage: this.profileImageUrl,
        firstname: _.get(this.primaryDetails, 'firstname', ''),
        state: _.get(this.locationDetails, 'state', ''),
        district: _.get(this.locationDetails, 'district', ''),
      }
    }
    const dialogRef = this.dialog.open(PrfileEditV2Component, {
      data: dialogDetails,
      disableClose: true,
      panelClass: 'dialog_sidenav',
      autoFocus: false
    })

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.generateBasicProfileFormBody(result)
        if (_.get(result, 'state', '') || _.get(result, 'district', '')) {
          if (_.get(result, 'state', '') !== _.get(this.locationDetails, 'state', '') ||
            _.get(result, 'district', '') !== _.get(this.locationDetails, 'district', '')
          ) {
            this.locationDetails['state'] = _.get(result, 'state', '')
            this.locationDetails['district'] = _.get(result, 'district', '')
            const formBody: any = {
              request: {
                userId: this.userId,
                locationDetails: [this.locationDetails]
              }
            }
            if (_.get(this.locationDetails, 'uuid')) {
              this.updateProfileEntry(formBody)
            } else {
              this.addProfileEntry(formBody)
            }
          }
        }
      }
    })
  }

  generateBasicProfileFormBody(result: any): any {
    if (result) {
      const formBody: any = {
        request: {
          userId: this.userId,
          profileDetails: {}
        }
      };

      // Define field mappings with their paths in the API response and form body
      const fieldMappings = [
        {
          formField: 'profileImageUrl',
          resultPath: 'profileImageUrl',
          formBodyPath: 'profileDetails.profileImageUrl'
        },
        {
          formField: 'firstname',
          resultPath: 'firstname',
          formBodyPath: 'profileDetails.personalDetails.firstname'
        },
        {
          formField: 'primaryEmail',
          resultPath: 'primaryEmail',
          formBodyPath: 'profileDetails.personalDetails.primaryEmail'
        },
        {
          formField: 'mobile',
          resultPath: 'mobile',
          formBodyPath: 'profileDetails.personalDetails.mobile'
        },
        {
          formField: 'gender',
          resultPath: 'gender',
          formBodyPath: 'profileDetails.personalDetails.gender'
        },
        {
          formField: 'dob',
          resultPath: 'dob',
          formBodyPath: 'profileDetails.personalDetails.dob'
        },
        {
          formField: 'domicileMedium',
          resultPath: 'domicileMedium',
          formBodyPath: 'profileDetails.personalDetails.domicileMedium'
        },
        {
          formField: 'category',
          resultPath: 'category',
          formBodyPath: 'profileDetails.personalDetails.category'
        },
        {
          formField: 'isCadre',
          resultPath: 'isCadre',
          formBodyPath: 'profileDetails.personalDetails.isCadre'
        },
        {
          formField: 'group',
          resultPath: 'group',
          formBodyPath: 'profileDetails.professionalDetails[0].group'
        },
        {
          formField: 'designation',
          resultPath: 'designation',
          formBodyPath: 'profileDetails.professionalDetails[0].designation'
        },
        {
          formField: 'osid',
          resultPath: 'osid',
          formBodyPath: 'profileDetails.professionalDetails[0].osid'
        },
        {
          formField: 'employeeCode',
          resultPath: 'employeeCode',
          formBodyPath: 'profileDetails.employmentDetails.employeeCode'
        },
        {
          formField: 'pinCode',
          resultPath: 'pinCode',
          formBodyPath: 'profileDetails.employmentDetails.pinCode'
        },
        {
          formField: 'aboutme',
          resultPath: 'aboutme',
          formBodyPath: 'profileDetails.employmentDetails.aboutme'
        }, {
          formField: 'civilServiceTypeId',
          resultPath: 'civilServiceTypeId',
          formBodyPath: 'profileDetails.cadreDetails.civilServiceTypeId'
        }, {
          formField: 'civilServiceType',
          resultPath: 'civilServiceType',
          formBodyPath: 'profileDetails.cadreDetails.civilServiceType'
        },
        {
          formField: 'civilServiceId',
          resultPath: 'civilServiceId',
          formBodyPath: 'profileDetails.cadreDetails.civilServiceId'
        },
        {
          formField: 'civilServiceName',
          resultPath: 'civilServiceName',
          formBodyPath: 'profileDetails.cadreDetails.civilServiceName'
        },
        {
          formField: 'cadreId',
          resultPath: 'cadreId',
          formBodyPath: 'profileDetails.cadreDetails.cadreId'
        },
        {
          formField: 'cadreName',
          resultPath: 'cadreName',
          formBodyPath: 'profileDetails.cadreDetails.cadreName'
        },
        {
          formField: 'cadreBatch',
          resultPath: 'cadreBatch',
          formBodyPath: 'profileDetails.cadreDetails.cadreBatch'
        },
        {
          formField: 'cadreControllingAuthorityName',
          resultPath: 'cadreControllingAuthorityName',
          formBodyPath: 'profileDetails.cadreDetails.cadreControllingAuthorityName'
        }
      ];

      let hasChanges = false;

      // Compare each field and add to form body if changed
      fieldMappings.forEach(mapping => {
        const currentValue = _.get(result, mapping.resultPath, '');
        const formValue = this.primaryDetails[mapping.formField];

        if (formValue !== currentValue && currentValue) {
          // Create nested object structure if needed
          const pathParts = mapping.formBodyPath.split('.');
          let current = formBody.request;

          for (let i = 0; i < pathParts.length - 1; i++) {
            const part = pathParts[i];
            if (part.includes('[0]')) {
              const arrayKey = part.replace('[0]', '');
              if (!current[arrayKey]) current[arrayKey] = [{}];
              current = current[arrayKey][0];
            } else {
              if (!current[part]) current[part] = {};
              current = current[part];
            }
          }

          // Set the final value
          const finalKey = pathParts[pathParts.length - 1];
          current[finalKey] = currentValue;
          hasChanges = true;
        }
      });
      if (hasChanges) {
        this.updateProfileDetails(formBody);
      }
    }
  }

  getSendApprovalStatus(): void {
    const formBody = {
      serviceName: 'profile',
      applicationStatus: 'SEND_FOR_APPROVAL',
    }
    this.profileV2RevampSvc.fetchApprovalDetails(formBody)
      .pipe(takeUntil(this.destroySubject$))
      .subscribe((responce: any) => {
        this.unVerifiedObj.groupRequestTime = 0
        this.unVerifiedObj.designationRequestTime = 0
        this.approvalPendingFields = _.get(responce, 'result.data', [])

        if (this.approvalPendingFields && this.approvalPendingFields.length === 0) {
          this.enableWTR = false
          return
        }
        const exists = this.approvalPendingFields.filter((obj: any) => {
          if (obj.hasOwnProperty('name')) {
            this.unVerifiedObj.organization = obj.name
          }
          if (obj.hasOwnProperty('group') && obj.lastUpdatedOn > this.unVerifiedObj.groupRequestTime) {
            this.unVerifiedObj.group = obj.group
            this.unVerifiedObj.groupRequestTime = obj.lastUpdatedOn
          }
          if (obj.hasOwnProperty('designation') && obj.lastUpdatedOn > this.unVerifiedObj.designationRequestTime) {
            this.unVerifiedObj.designation = obj.designation
            this.unVerifiedObj.designationRequestTime = obj.lastUpdatedOn
          }
          return obj.hasOwnProperty('name')
        }).length > 0

        if (exists) {
          this.enableWTR = true
        } else {
          this.enableWR = true
        }
      }, (error: HttpErrorResponse) => {
        if (!error.ok) {
          this.openSnackbar(this.handleTranslateTo('approvalStatusFailed'))
        }
      })
  }

  getRejectedStatus(): void {
    const formBody = {
      serviceName: 'profile',
      applicationStatus: 'REJECTED',
    }
    this.profileV2RevampSvc.fetchApprovalDetails(formBody)
      .pipe(takeUntil(this.destroySubject$))
      .subscribe((res: any) => {
        if (res.result && res.result.data && Array.isArray(res.result.data)) {
          res.result.data.forEach((obj: any) => {
            if (obj.hasOwnProperty('name')) {
              this.rejectedFields.name = obj.name
            }
            if (obj.hasOwnProperty('group') && obj.lastUpdatedOn > this.rejectedFields.groupRejectionTime) {
              this.rejectedFields.group = obj.group
              this.rejectedFields.groupRejectionComments = obj.comment
              this.rejectedFields.groupRejectionTime = obj.lastUpdatedOn
            }
            if (obj.hasOwnProperty('designation') && obj.lastUpdatedOn > this.rejectedFields.designationRejectionTime) {
              this.rejectedFields.designation = obj.designation
              this.rejectedFields.designationRejectionComments = obj.comment
              this.rejectedFields.designationRejectionTime = obj.lastUpdatedOn
            }
          })
        }
      }, (error: HttpErrorResponse) => {
        if (!error.ok) {
          this.openSnackbar(this.handleTranslateTo('rejectedStatusFailed'))
        }
      })
  }

  handleTransferRequest(): void {
      const dialogRef = this.dialog.open(TransferRequestComponent, {
        data: { portalProfile: this.profesionalDetails, groupData: this.groupsList, designationsMeta: this.designationsList },
        disableClose: true,
        panelClass: 'common-modal',
      })
  
      dialogRef.componentInstance.enableWithdraw.subscribe((value: boolean) => {
        if (value) {
          this.enableWTR = true
          this.getSendApprovalStatus()
          this.fetchProfileDetails()
        }
      })
    }

    handleWithdrawTransferRequest(): void {
        const dialogRef = this.dialog.open(WithdrawRequestComponent, {
          data: {
            approvalPendingFields: this.approvalPendingFields,
            withDrawType: 'department',
          },
          disableClose: true,
          panelClass: 'common-modal',
        })
    
        dialogRef.componentInstance.enableMakeTransfer.subscribe((value: boolean) => {
          if (value) {
            this.enableWTR = false
            this.unVerifiedObj.group = ''
            this.unVerifiedObj.designation = ''
          }
        })
      }

    
  viewMentorProfile() {
      window.open(`${environment.contentHost}/mentorship`, '_blank')
    }
  openProfileEntryListDialog(header: string) {
    const dialogDetails = {
      header: header,
      userId: this.userId
    }
    switch (header) {
      case 'Service History':
        this.openServiceHistoryListDialog(dialogDetails)
        break;
      // case 'Competencies':
      //   this.openCompetenciesListDialog(dialogDetails)
      //   break;
      case 'Educational qualifications':
        this.openEducationalQualificationsListDialog(dialogDetails)
        break;
      case 'Achievements':
        this.openAchievementsListDialog(dialogDetails)
        break;
    }
  }

  openServiceHistoryListDialog(dialogDetails: any) {
    const dialogRef = this.dialog.open(ServiceHistoryComponent, {
      data: dialogDetails,
      disableClose: true,
      panelClass: 'dialog_sidenav',
      autoFocus: false
    })
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.openProfileEntryEditDialog('Service History', result)
      }
    })
  }

  openEducationalQualificationsListDialog(dialogDetails: any) {
    const dialogRef = this.dialog.open(EducationalQualificationsComponent, {
      data: dialogDetails,
      disableClose: true,
      panelClass: 'dialog_sidenav',
      autoFocus: false
    })
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.openProfileEntryEditDialog('Educational qualifications', result)
      }
    })
  }

  openAchievementsListDialog(dialogDetails: any) {
    const dialogRef = this.dialog.open(AchievementsComponent, {
      data: dialogDetails,
      disableClose: true,
      panelClass: 'dialog_sidenav',
      autoFocus: false
    })
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.openProfileEntryEditDialog('Achievements', result)
      }
    })
  }


  //#region (profile entry edit)
  async openProfileEntryEditDialog(header: string, entryDetails?: any) {
    const dialogDetails = {
      header: header,
      entryDetails: entryDetails
    }
    const isNew = entryDetails ? false : true
    const dialogRef = this.dialog.open(ProfileEntryEditComponent, {
      data: dialogDetails,
      disableClose: true,
      panelClass: 'dialog_sidenav',
      autoFocus: false
    })

    dialogRef.afterClosed().subscribe(async (result: any) => {
      if (result) {
        let formBody: any = {}
        switch (header) {
          case 'Service History':
            formBody = this.generateServiceHistoryFormBody(result, entryDetails)
            break;
          // case 'Competencies':
          //   this.competencies = result
          //   break;
          case 'Educational qualifications':
            formBody = await this.generateEducationalQualificationsFormBody(result, entryDetails)
            break;
          case 'Achievements':
            formBody = this.generateAchievementsFormBody(result, entryDetails)
            break;
        }

        if (formBody) {
          if (isNew) {
            this.addProfileEntry(formBody)
          } else {
            this.updateProfileEntry(formBody)
          }
        }
      }
    })
  }

  generateServiceHistoryFormBody(serviceHistory: any, oldDetails: any): any {
    delete serviceHistory['showMore']
    delete serviceHistory['orgDetails']
    delete serviceHistory['period']
    const formBody: any = {
      request: {
        userId: this.userId,
        serviceHistory: [serviceHistory]
      }
    }
    if (_.get(oldDetails, 'uuid', '')) {
      formBody.request['serviceHistory'][0]['uuid'] = oldDetails.uuid
    }
    return formBody
  }

  async generateEducationalQualificationsFormBody(educationalQualifications: any, oldDetails: any): Promise<any> {
    const isOtherDegree = _.get(educationalQualifications, 'degree', '') === 'other' && _.get(educationalQualifications, 'otherDegree', '') ? true : false;
    const isOtherInstitute = _.get(educationalQualifications, 'institutionName', '') === 'other' && _.get(educationalQualifications, 'otherInstituteName', '') ? true : false;
    const formBody: any = {
      request: {
        userId: this.userId,
        educationalQualifications: [{
          degree: isOtherDegree ? _.get(educationalQualifications, 'otherDegree', '') : _.get(educationalQualifications, 'degree', ''),
          fieldOfStudy: _.get(educationalQualifications, 'fieldOfStudy', ''),
          institutionName: isOtherInstitute ? _.get(educationalQualifications, 'otherInstituteName', '') : _.get(educationalQualifications, 'institutionName', ''),
          endYear: _.get(educationalQualifications, 'endYear', ''),
          startYear: _.get(educationalQualifications, 'startYear', ''),
        }]
      }
    }
    if (_.get(oldDetails, 'uuid', '')) {
      formBody.request['educationalQualifications'][0]['uuid'] = oldDetails.uuid
    }
    try {
      const addApiCalls: any = [];
      if (isOtherDegree) {
        const degreeBody = {
          degreeName: _.get(educationalQualifications, 'otherDegree', ''),
        }
        addApiCalls.push(this.profileV2RevampSvc.updateDegree(degreeBody))
      }
      if (isOtherInstitute) {
        const instituteBody = {
          institutionName: _.get(educationalQualifications, 'otherInstituteName', ''),
        }
        addApiCalls.push(this.profileV2RevampSvc.updateInstitution(instituteBody))
      }
      if (addApiCalls.length > 0) {
        await forkJoin(addApiCalls).toPromise()
      }
      return formBody

    } catch (error) {
      this.openSnackbar('Error adding degree/institute. Please try again.');
      throw error;
    }
  }

  generateAchievementsFormBody(achievements: any, oldDetails: any): any {
    const formBody: any = {
      request: {
        userId: this.userId,
        achievements: [achievements]
      }
    }
    if (_.get(oldDetails, 'uuid', '')) {
      formBody.request['achievements'][0]['uuid'] = oldDetails.uuid
    }
    return formBody
  }

  //#region (service history, achievements, educational qualifications will edit based on the request)
  addProfileEntry(formBody: any) {
    this.profileV2RevampSvc.addEntriesToProfile(formBody).subscribe({
      next: (response: any) => {
        if (response) {
          this.fetchProfileEntries()
          this.openSnackbar('Updated Successfully')
        }
      },
      error: (error: HttpErrorResponse) => {
        if (error) {
          this.openSnackbar('Something went wrong please try again')
        }
      }
    })
  }

  updateProfileEntry(formBody: any) {
    this.profileV2RevampSvc.updateEntriesOfProfile(formBody).subscribe({
      next: (response: any) => {
        if (response) {
          this.fetchProfileEntries()
          this.openSnackbar('Updated Successfully')
        }
      },
      error: (error: HttpErrorResponse) => {
        if (error) {
          this.openSnackbar('Something went wrong please try again')
        }
      }
    })
  }
  //#endregion (service history, achievements, educational qualifications will edit based on the request)

  fetchProfileEntries() {
    this.profileV2RevampSvc.fetchProfileEntries(this.userId).subscribe({
      next: (response: any) => {
        if (response) {
          this.patchEntries(_.get(response, 'result.response', {}))
        }
      },
      error: (error: HttpErrorResponse) => {
        if (error) {
          this.openSnackbar('Something went wrong please try again')
        }
      }
    })
  }

  //#endregion (profile entry edit)

  handleTranslateTo(menuName: string): string {
    return this.profileV2RevampSvc.handleTranslateTo(menuName)
  }

  private openSnackbar(primaryMsg: string, duration: number = 5000) {
    this.snackBar.open(primaryMsg, 'X', {
      duration,
    })
  }

  ngOnDestroy() {
    this.destroySubject$.unsubscribe()
  }

}
