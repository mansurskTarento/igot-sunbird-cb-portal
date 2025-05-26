//#region (imports)
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { UserStats, achievement, educationalQualifications, person, profileRoutes, serviceHistory } from '../../models/profile-revamp.model';
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
import { forkJoin } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { PipeCertificateImageURL } from '@sunbird-cb/utils-v2';

//#endregion

@Component({
  selector: 'ws-app-profile-view-v2',
  templateUrl: './profile-view-v2.component.html',
  styleUrls: ['./profile-view-v2.component.scss'],
  providers: [PipeCertificateImageURL]
})
export class ProfileViewV2Component implements OnInit {

  //#region (global variables)
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
      isActive: true,
      id: ''
    }, {
      name: 'Service History',
      url: '',
      icon: 'person',
      isActive: false,
      id: ''
    }, {
      name: 'Competencies',
      url: '',
      icon: 'extension',
      isActive: false,
      id: ''
    }, {
      name: 'Educational',
      url: '',
      icon: 'school',
      isActive: false,
      id: ''
    }, {
      name: 'Achievements',
      url: '',
      icon: 'trophy',
      isActive: false,
      id: ''
    },
  ]
  locationDetails: any
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

  peopleSuggestionsList: person[] = [
    {
      id: '1',
      name: 'John Doe',
      designation: 'Program Manager',
      profileImage: './assets/icons/profile_cover_pic.svg',
      connectionStatus: 'none'
    },
    {
      id: '2',
      name: 'Jane Smith',
      designation: 'Project Manager',
      profileImage: './assets/icons/profile_cover_pic.svg',
      connectionStatus: 'none'
    },
    {
      id: '3',
      name: 'Alice Johnson',
      designation: 'Software Engineer',
      profileImage: './assets/icons/profile_cover_pic.svg',
      connectionStatus: 'none'
    }
  ]
  aboutme = 'Proin porta nisi ultrices risus accumsan ornare. Donec interdum eu metus eget aliquet. Proin in sem non nulla vehicula venenatis lacinia vitae justo. Etiam a commodo magna. Nulla aliquet lacus id mi euismod ultricies quis et odio. Proin porta nisi ultrices risus accumsan ornare. Donec interdum eu Proin porta nisi ultrices risus accumsan ornare. Donec interdum eu metus eget aliquet. Proin in sem non nulla vehicula venenatis lacinia vitae justo. Etiam a commodo magna. Nulla aliquet lacus id mi euismod ultricies quis et odio. Proin porta nisi ultrices risus accumsan ornare. Donec interdum eu '
  showMoreAbout = false
  primaryDetails: any;
  //#endregion

  @ViewChild('progressCanvas') progressCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(
    private dialog: MatLegacyDialog,
    private activatedRoute: ActivatedRoute,
    private profileV2RevampSvc: ProfileV2RevampService,
    private snackBar: MatLegacySnackBar,
    private pipeImgUrl: PipeCertificateImageURL,
  ) { }

  ngOnInit() {
    this.getProfileDetailsFromRoutes()
  }

  getProfileDetailsFromRoutes() {
    this.activatedRoute.data.subscribe(data => {
      this.profesionalDetails = _.get(data, 'profile.data', {})
      this.userId = _.get(data, 'profile.userId', '')
      this.patchProfileDetails()
      this.patchEntries(_.get(data, 'entries.data', {}))
      console.log('data', data)
    })
  }

  patchProfileDetails() {
    this.profileImageUrl = _.get(this.profesionalDetails, 'profileImageUrl', '')
    this.profileBannerUrl = _.get(this.profesionalDetails, 'profileBannerUrl', '')
    this.profileCompletion = _.get(this.profesionalDetails, 'profileCompletion', 0)
    this.getInitials()
    this.setProfileCompletionGraph()
    this.primaryDetails = {
      firstname: _.get(this.profesionalDetails, 'personalDetails.firstname', ''),
      group: _.get(this.profesionalDetails, 'professionalDetails[0].group', ''),
      designation: _.get(this.profesionalDetails, 'professionalDetails[0].designation', ''),
      osid: _.get(this.profesionalDetails, 'professionalDetails[0].osid', ''),
      employeeCode: _.get(this.profesionalDetails, 'employmentDetails.employeeCode', ''),
      primaryEmail: _.get(this.profesionalDetails, 'personalDetails.primaryEmail', ''),
      mobile: _.get(this.profesionalDetails, 'personalDetails.mobile', ''),
      gender: _.get(this.profesionalDetails, 'personalDetails.gender', ''),
      dob: _.get(this.profesionalDetails, 'personalDetails.dob', ''),
      domicileMedium: _.get(this.profesionalDetails, 'personalDetails.domicileMedium', ''),
      category: _.get(this.profesionalDetails, 'personalDetails.category', ''),
      pinCode: _.get(this.profesionalDetails, 'employmentDetails.pinCode', ''),

      dateOfRetirement: 'N/A',
      organizedService: 'Yes',
      civilServiceType: 'All India Services',
      services: 'India Forest Service',
      cadre: 'AGMUT',
      batch: '1960',
      cadreControllingAuthority: 'Ministry of Environment & Forests'
    }
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
    this.locationDetails = _.get(entries, 'locationDetails')
  }

  selectRoute(profileRoute: profileRoutes) {
    profileRoute.isActive = !profileRoute.isActive
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
          this.patchProfileDetails()
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
          this.profesionalDetails = _.get(response, 'result', {})
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
      profileDetails: {
        profileImage: this.profileImageUrl,
        firstname: _.get(this.profesionalDetails, 'personalDetails.firstname', ''),
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
            if (_.get(this.locationDetails, 'uuid')) {
              this.updateProfileEntry()
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
        }
      };

      // Define field mappings with their paths in the API response and form body
      const fieldMappings = [
        {
          formField: 'firstname',
          apiPath: 'personalDetails.firstname',
          formBodyPath: 'personalDetails.firstname'
        },
        {
          formField: 'primaryEmail',
          apiPath: 'personalDetails.primaryEmail',
          formBodyPath: 'personalDetails.primaryEmail'
        },
        {
          formField: 'mobile',
          apiPath: 'personalDetails.mobile',
          formBodyPath: 'personalDetails.mobile'
        },
        {
          formField: 'gender',
          apiPath: 'personalDetails.gender',
          formBodyPath: 'personalDetails.gender'
        },
        {
          formField: 'dob',
          apiPath: 'personalDetails.dob',
          formBodyPath: 'personalDetails.dob'
        },
        {
          formField: 'domicileMedium',
          apiPath: 'personalDetails.domicileMedium',
          formBodyPath: 'personalDetails.domicileMedium'
        },
        {
          formField: 'category',
          apiPath: 'personalDetails.category',
          formBodyPath: 'personalDetails.category'
        },
        {
          formField: 'group',
          apiPath: 'professionalDetails[0].group',
          formBodyPath: 'professionalDetails[0].group'
        },
        {
          formField: 'designation',
          apiPath: 'professionalDetails[0].designation',
          formBodyPath: 'professionalDetails[0].designation'
        },
        {
          formField: 'osid',
          apiPath: 'professionalDetails[0].osid',
          formBodyPath: 'professionalDetails[0].osid'
        },
        {
          formField: 'employeeCode',
          apiPath: 'employmentDetails.employeeCode',
          formBodyPath: 'employmentDetails.employeeCode'
        },
        {
          formField: 'pinCode',
          apiPath: 'employmentDetails.pinCode',
          formBodyPath: 'employmentDetails.pinCode'
        }
      ];

      let hasChanges = false;

      // Compare each field and add to form body if changed
      fieldMappings.forEach(mapping => {
        const currentValue = _.get(result, mapping.apiPath, '');
        const formValue = this.primaryDetails[mapping.formField];

        if (formValue !== currentValue) {
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
          current[finalKey] = formValue;
          hasChanges = true;
        }
      });

      // // Handle additional fields that might not be in the API response
      // const additionalFields = [
      //   'dateOfRetirement',
      //   'organizedService',
      //   'civilServiceType',
      //   'services',
      //   'cadre',
      //   'batch',
      //   'cadreControllingAuthority'
      // ];

      // additionalFields.forEach(field => {
      //   // Since these fields aren't in the API response, we'll assume they're new/changed
      //   // You can add specific logic here if needed
      //   if (this.primaryDetails[field] !== undefined && this.primaryDetails[field] !== '') {
      //     formBody.request[field] = this.primaryDetails[field];
      //     hasChanges = true;
      //   }
      // });

      // Only call update API if there are actual changes
      if (hasChanges) {
        console.log('Form body with changes:', formBody);
        this.updateProfileDetails(formBody);
      }
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

  private openSnackbar(primaryMsg: string, duration: number = 5000) {
    this.snackBar.open(primaryMsg, 'X', {
      duration,
    })
  }

}
