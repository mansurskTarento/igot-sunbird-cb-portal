import { Component, OnInit } from '@angular/core';
import { SettingsService } from '../../settings.service';
import { ConfigurationsService } from '@sunbird-cb/utils-v2';
import * as _ from 'lodash';

@Component({
  selector: 'ws-app-profile-visibility-settings',
  templateUrl: './profile-visibility-settings.component.html',
  styleUrls: ['./profile-visibility-settings.component.scss']
})
export class ProfileVisibilitySettingsComponent implements OnInit {
  // Holds the selected visibility value
  selectedVisibility: 'public' | 'connections' | 'private' = 'public';

  constructor(
    private settingsService: SettingsService,
    private configSvc: ConfigurationsService
  ) { }

  ngOnInit() {
    this.getUserDetails();
  }

  getUserDetails() {
    const userId = _.get(this.configSvc, 'userProfileV2.userId')
    this.settingsService.fetchProfile(userId).subscribe({
      next: (response) => {
        this.selectedVisibility = _.get(response, 'visibility', 'public');
      },
      error: () => {
        this.selectedVisibility = 'public';
      }
    });
  }

  onVisibilityChange(value: 'public' | 'connections' | 'private') {
    this.selectedVisibility = value;
  }
}
