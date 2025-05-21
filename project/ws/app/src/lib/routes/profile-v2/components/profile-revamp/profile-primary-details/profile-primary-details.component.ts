import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'ws-app-profile-primary-details',
  templateUrl: './profile-primary-details.component.html',
  styleUrls: ['./profile-primary-details.component.scss']
})
export class ProfilePrimaryDetailsComponent {
  @Input() primaryDetails: any;
  @Output() openProfileEditDialog = new EventEmitter(); 

  editPrimaryDetails(header: string) {
    this.openProfileEditDialog.emit(header)
    // Logic to edit primary details
  }
}
