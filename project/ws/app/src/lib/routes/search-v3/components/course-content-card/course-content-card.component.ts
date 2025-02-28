import { Component } from '@angular/core';

@Component({
  selector: 'ws-app-course-content-card',
  templateUrl: './course-content-card.component.html',
  styleUrls: ['./course-content-card.component.scss']
})
export class CourseContentCardComponent {
  content: any
  contentBookmarked = false
}
