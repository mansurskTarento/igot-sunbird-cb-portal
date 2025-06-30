import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'ws-app-connections',
  templateUrl: './connections.component.html',
  styleUrls: ['./connections.component.scss']
})
export class ConnectionsComponent implements OnInit{

  // selectedTabKey = 'connections';
  selectedTabIndex = 0;

  connectionsList: any = [
    {
      profileIamge: 'https://portal.dev.karmayogibharat.net/assets/public/profileImage/1748236292880_profile.png',
      firstName: 'Jaydon Franci',
      currentRole: 'Director General of Police (DGP) and Commandant General of Police (CGP)',
      description: 'Employees State Insurance Post Graduate Institute of Management (ESI PGIM)',
      location: 'New Delhi',
      time: '27s',
      userId: '',
    },
    {
      profileIamge: '',
      firstName: 'Jaydon Franci',
      currentRole: 'Director General of Police (DGP) and Commandant General of Police (CGP)',
      description: 'Employees State Insurance Post Graduate Institute of Management (ESI PGIM)',
      location: 'New Delhi',
      time: '27s',
      userId: '',
    },
    {
      profileIamge: '',
      firstName: 'Jaydon Franci',
      currentRole: 'Director General of Police (DGP) and Commandant General of Police (CGP)',
      description: 'Employees State Insurance Post Graduate Institute of Management (ESI PGIM)',
      location: 'New Delhi',
      time: '27s',
      userId: '',
    },
  ]
  connectionsCount = 21;

  requestsList: any = [
    {
      profileIamge: 'https://portal.dev.karmayogibharat.net/assets/public/profileImage/1748236292880_profile.png',
      firstName: 'Jaydon Franci',
      currentRole: 'Director General of Police (DGP) and Commandant General of Police (CGP)',
      description: 'Employees State Insurance Post Graduate Institute of Management (ESI PGIM)',
      location: 'New Delhi',
      time: '27s',
      userId: '',
    },
    {
      profileIamge: '',
      firstName: 'Jaydon Franci',
      currentRole: 'Director General of Police (DGP) and Commandant General of Police (CGP)',
      description: 'Employees State Insurance Post Graduate Institute of Management (ESI PGIM)',
      location: 'New Delhi',
      time: '27s',
      userId: '',
    },
    {
      profileIamge: '',
      firstName: 'Jaydon Franci',
      currentRole: 'Director General of Police (DGP) and Commandant General of Police (CGP)',
      description: 'Employees State Insurance Post Graduate Institute of Management (ESI PGIM)',
      location: 'New Delhi',
      time: '27s',
      userId: '',
    },
  ];
  requestsCount = 32;

  sentRequestsList: any = [
    {
      profileIamge: 'https://portal.dev.karmayogibharat.net/assets/public/profileImage/1748236292880_profile.png',
      firstName: 'Jaydon Franci',
      currentRole: 'Director General of Police (DGP) and Commandant General of Police (CGP)',
      description: 'Employees State Insurance Post Graduate Institute of Management (ESI PGIM)',
      location: 'New Delhi',
      time: '27s',
      userId: '',
    },
    {
      profileIamge: '',
      firstName: 'Jaydon Franci',
      currentRole: 'Director General of Police (DGP) and Commandant General of Police (CGP)',
      description: 'Employees State Insurance Post Graduate Institute of Management (ESI PGIM)',
      location: 'New Delhi',
      time: '27s',
      userId: '',
    },
    {
      profileIamge: '',
      firstName: 'Jaydon Franci',
      currentRole: 'Director General of Police (DGP) and Commandant General of Police (CGP)',
      description: 'Employees State Insurance Post Graduate Institute of Management (ESI PGIM)',
      location: 'New Delhi',
      time: '27s',
      userId: '',
    },
  ];
  sentRequestsCount = 21;

  blockedList: any = [
    {
      profileIamge: 'https://portal.dev.karmayogibharat.net/assets/public/profileImage/1748236292880_profile.png',
      firstName: 'Jaydon Franci',
      currentRole: 'Director General of Police (DGP) and Commandant General of Police (CGP)',
      description: 'Employees State Insurance Post Graduate Institute of Management (ESI PGIM)',
      location: 'New Delhi',
      time: '27s',
      userId: '',
    },
    {
      profileIamge: '',
      firstName: 'Jaydon Franci',
      currentRole: 'Director General of Police (DGP) and Commandant General of Police (CGP)',
      description: 'Employees State Insurance Post Graduate Institute of Management (ESI PGIM)',
      location: 'New Delhi',
      time: '27s',
      userId: '',
    },
    {
      profileIamge: '',
      firstName: 'Jaydon Franci',
      currentRole: 'Director General of Police (DGP) and Commandant General of Police (CGP)',
      description: 'Employees State Insurance Post Graduate Institute of Management (ESI PGIM)',
      location: 'New Delhi',
      time: '27s',
      userId: '',
    },
  ];
  blockedCount = 2;

  ngOnInit() {
    // Initialization logic here
  }

  // onTabChange(event: any) {
  //   this.selectedTabKey = event.tab.value;
  // }

}
