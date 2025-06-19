import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'ws-app-profile-card',
  templateUrl: './profile-card.component.html',
  styleUrls: ['./profile-card.component.scss']
})
export class ProfileCardComponent {

  bannerImageUrl = 'https://portal.qa.karmayogibharat.net/assets/public/profileBanner/1750246574180_MicrosoftTeamsimage1.png';
  profileImageUrl = 'https://portal.qa.karmayogibharat.net/assets/public/profileImage/1750246661816_profile.png'
  userName = 'Astha Sharma'
  userId= ''

  constructor(
    private router: Router
  ) { }

  viewProfile() { 
    this.router.navigate(['/app/person-profile/me', (this.userId)], { fragment: 'profileInfo' })
  }

}
