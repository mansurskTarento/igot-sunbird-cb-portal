import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'ws-app-profile-card',
  templateUrl: './profile-card.component.html',
  styleUrls: ['./profile-card.component.scss']
})
export class ProfileCardComponent implements OnInit {

  bannerImageUrl = 'https://portal.qa.karmayogibharat.net/assets/public/profileBanner/1750246574180_MicrosoftTeamsimage1.png';
  profileImageUrl = 'https://portal.qa.karmayogibharat.net/assets/public/profileImage/1750246661816_profile.png'
  userName = 'Astha Sharma'
  userId= ''
  nameInitials: string = '';

  constructor(
    private router: Router
  ) { }

  ngOnInit(): void {
    this.getInitials()
  }

  viewProfile() { 
    this.router.navigate(['/app/person-profile/me', (this.userId)], { fragment: 'profileInfo' })
  }

  getInitials(): void {
    const userName = this.userName;
    if (userName) {
      if (userName.split(' ').length > 1) {
        const nameArr = userName.split(' ')
        this.nameInitials = nameArr[0].charAt(0) + nameArr[1].charAt(0)
      } else {
        this.nameInitials = userName.charAt(0)
      }
    }
  }

}
