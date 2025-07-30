import { Component } from '@angular/core';

@Component({
  selector: 'ws-app-profile-visibility-settings',
  templateUrl: './profile-visibility-settings.component.html',
  styleUrls: ['./profile-visibility-settings.component.scss']
})
export class ProfileVisibilitySettingsComponent {
  // Holds the selected visibility value
  selectedVisibility: 'anyone' | 'connections' | 'locked' = 'anyone';

  // Optionally, handle changes if needed
  onVisibilityChange(value: 'anyone' | 'connections' | 'locked') {
    this.selectedVisibility = value;
    // You can add logic here to persist or use the value
  }
}
