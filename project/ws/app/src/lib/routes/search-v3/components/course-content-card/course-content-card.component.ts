import { Component, Input } from '@angular/core';

@Component({
  selector: 'ws-app-course-content-card',
  templateUrl: './course-content-card.component.html',
  styleUrls: ['./course-content-card.component.scss'],
})
export class CourseContentCardComponent {
  @Input() content: any;

  contentBookmarked = false;
  defaultThumbnail = '/assets/instances/eagle/app_logos/default.png';
  defaultSLogo = '/assets/instances/eagle/app_logos/igot-katmayogi-logo.svg';

  constructor() {}
  
  checkForCiosDuration(item: any) {
    if (item && item.contentId && item.contentId.includes('ext_')) {
      return item.duration * 60;
    }
    return item.duration;
  }
}
