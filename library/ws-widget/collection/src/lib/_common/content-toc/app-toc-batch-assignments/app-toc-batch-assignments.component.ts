import { Component, Input, OnInit } from '@angular/core'
import { Router } from '@angular/router'

@Component({
  selector: 'ws-widget-app-batch-assignments-notes',
  templateUrl: './app-toc-batch-assignments.component.html',
  styleUrls: ['./app-toc-batch-assignments.component.scss'],
})

export class AppTocBatchAssignmentsComponent implements OnInit {

  @Input() content: any
  @Input() currentCourseBatchId: any
  assignments: any[] = []

  constructor(public router: Router) { }

  ngOnInit() {
    this.assignments = [
      {
        title: 'Assignment 1',
        description: 'Description for Assignment 1',
      },
      {
        title: 'Assignment 2',
        description: 'Description for Assignment 2',
      },
      {
        title: 'Assignment 3',
        description: 'Description for Assignment 3',
      },
      {
        title: 'Assignment 4',
        description: 'Description for Assignment 4',
      }
    ]
  }


}
