import { Component, OnInit } from '@angular/core'

@Component({
    selector: 'ws-learner-advisory',
    templateUrl: './learner-advisory.component.html',
    styleUrls: ['./learner-advisory.component.scss'],
    standalone: false
})
export class LearnerAdvisoryComponent implements OnInit {

  titles = [
    { title: 'Tips for Learners', url: 'none', icon: '' },
  ]
  constructor() { }

  ngOnInit() {

  }

}
