//#region (imports)
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Competency, UserStats, achievement, educationalQualifications, person, profileRoutes, serviceHistory } from '../../models/profile-revamp.model';
import { MatLegacyDialog } from '@angular/material/legacy-dialog'
import { CoverPhotoEditPopupComponent } from '../../components/profile-revamp/cover-photo-edit-popup/cover-photo-edit-popup.component'
import { PrfileEditV2Component } from '../../revamp-dialogs/prfile-edit-v2/prfile-edit-v2.component';
import { ProfileEntryEditComponent } from '../../revamp-dialogs/profile-entry-edit/profile-entry-edit.component';
//#endregion

@Component({
  selector: 'ws-app-profile-view-v2',
  templateUrl: './profile-view-v2.component.html',
  styleUrls: ['./profile-view-v2.component.scss']
})
export class ProfileViewV2Component implements OnInit {

  //#region (global variables)
  coverPhotoUrl = './assets/icons/profile_cover_pic.svg';
  userStats: UserStats[] = [
    {
      state: 'My Karma Points',
      totalPoints: '2,133',
      iconUrl: '',
      vewAllUrl: '',
      stateInfo: 'My Karma Points'
    },
    {
      state: 'My Certificates',
      totalPoints: '312',
      iconUrl: '',
      vewAllUrl: ''
    },
    {
      state: 'My Posts',
      totalPoints: '312',
      iconUrl: '',
      vewAllUrl: ''
    }
  ];
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
  serviceHistoryList: serviceHistory[] = [
    {
      designation: 'designation-1',
      orgDetails: 'org details, location',
      period: 'Jul 2020 - Present - 4 years',
      orgLogo: './assets/icons/profile_cover_pic.svg'
    },
    {
      designation: 'designation-2',
      orgDetails: 'org details, location',
      period: 'Jul 2020 - Present - 4 years',
      orgLogo: './assets/icons/profile_cover_pic.svg'
    }
  ]
  educationalQualificationsList: educationalQualifications[] = [
    {
      education: 'education-1',
      instituteAndLocation: 'institute and location',
      period: 'Jul 2020 - Present - 4 years'
    },
    {
      education: 'education-2',
      instituteAndLocation: 'institute and location',
      period: 'Jul 2020 - Present - 4 years'
    },
    {
      education: 'education-3',
      instituteAndLocation: 'institute and location',
      period: 'Jul 2020 - Present - 4 years'
    },
  ]

  competencies: Competency[] = [
    {
      name: 'Behavioural',
      active: false,
      themes: [
        { name: 'Food Waste Management', id: 1 },
        { name: 'Commitment to the Organisation', id: 2 },
        { name: 'Sustainability Management', id: 3 },
        { name: 'Climate Finance', id: 4 },
        { name: 'Data Management', id: 5 },
        { name: 'General Management', id: 6 },
        { name: 'Monitoring and Evaluation', id: 7 }
      ]
    },
    {
      name: 'Functional',
      themes: [
        { name: 'Data Management', id: 5 },
        { name: 'General Management', id: 6 },
        { name: 'Monitoring and Evaluation', id: 7 }
      ]
    },
    {
      name: 'Domain',
      themes: [
        { name: 'Climate Finance', id: 8 },
        { name: 'Finance', id: 9 }
      ]
    }
  ];
  achievementsList: achievement[] = [
    {
      certificateName: 'Program Manager Award',
      provider: 'Microsoft',
      period: '12 Jan, 2023',
      certificateUrl: './assets/icons/profile_cover_pic.svg'
    }
  ]
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
  primaryDetails = {
    group: 'Group A',
    designation: 'Secretariat Assistant',
    employeeId: 'KB2468',
    email: 'harshit.rao@karmayogibharat.in',
    mobileNumber: '+91 9972222610',
    gender: 'Male',
    dateOfBirth: '03/April/1990',
    motherTongue: 'Kannada',
    category: 'General',
    officePinCode: '110003',
    ehrmsId: '35011992HARS',
    dateOfRetirement: 'N/A',
    organizedService: 'Yes',
    civilServiceType: 'All India Services',
    services: 'India Forest Service',
    cadre: 'AGMUT',
    batch: '1960',
    cadreControllingAuthority: 'Ministry of Environment & Forests'
  };
  //#endregion

  @ViewChild('progressCanvas') progressCanvas!: ElementRef<HTMLCanvasElement>;

  imageUrl: string = './assets/icons/profile_cover_pic.svg';

  constructor(
    private dialog: MatLegacyDialog,
  ) { }

  ngOnInit() {
    const progress = (247 - ((247 * 60) / 100))
    document.documentElement.style.setProperty('--i', String(progress))
  }

  selectRoute(profileRoute: profileRoutes) {
    profileRoute.isActive = !profileRoute.isActive
  }

  openCoverPhotoDialog() {
    const dialogRef = this.dialog.open(CoverPhotoEditPopupComponent, {
      width: '500px',
      panelClass: 'cover-photo-edit-popup',
      data: {
        coverPhotoUrl: this.coverPhotoUrl
      },
      disableClose: true,
    })
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result && result.isUpdated) {
        this.coverPhotoUrl = result.coverPhotoUrl
      }
    })
  }

  openProfileEditDialog(header: string) {
    const dialogDetails = {
      header: header,
    }
    const dialogRef = this.dialog.open(PrfileEditV2Component, {
      data: dialogDetails,
      disableClose: true,
      panelClass: 'dialog_sidenav',
      autoFocus: false
    })

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        // this.coverPhotoUrl = result.coverPhotoUrl
      }
    })
  }

  openProfileEntryEditDialog(header: string, entryDetails?: any) {
    const dialogDetails = {
      header: header,
      entryDetails: entryDetails
    }
    const dialogRef = this.dialog.open(ProfileEntryEditComponent, {
      data: dialogDetails,
      disableClose: true,
      panelClass: 'dialog_sidenav',
      autoFocus: false
    })

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        // this.coverPhotoUrl = result.coverPhotoUrl
      }
    })
  }

}
