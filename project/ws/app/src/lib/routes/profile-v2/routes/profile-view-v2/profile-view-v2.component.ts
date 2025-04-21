//#region (imports)
import { Component, OnInit } from '@angular/core';
import { UserStats, educationalQualifications, profileRoutes, serviceHistory } from '../../models/profile-revamp.model';
//#endregion

@Component({
  selector: 'ws-app-profile-view-v2',
  templateUrl: './profile-view-v2.component.html',
  styleUrls: ['./profile-view-v2.component.scss']
})
export class ProfileViewV2Component implements OnInit {

  //#region (global variables)
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
    },{
      name: 'Service History',
      url: '',
      icon: 'person',
      isActive: false,
      id: ''
    },{
      name: 'Competencies',
      url: '',
      icon: 'extension',
      isActive: false,
      id: ''
    },{
      name: 'Educational',
      url: '',
      icon: 'school',
      isActive: false,
      id: ''
    },{
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
      orgLogo: './assets/images/image.svg'
    },
    {
      designation: 'designation-2',
      orgDetails: 'org details, location',
      period: 'Jul 2020 - Present - 4 years',
      orgLogo: './assets/images/image.svg'
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
  //#endregion

  constructor() { }

  ngOnInit() {
  }

  selectRoute(profileRoute: profileRoutes) {
    profileRoute.isActive = !profileRoute.isActive
  }

  
}
