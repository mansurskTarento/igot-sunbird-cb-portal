import { Component, OnInit, ElementRef, ViewChild } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { MatDialog } from '@angular/material/dialog'
/* tslint:disable */
import _ from 'lodash'
/* tslint:enable */

@Component({
  selector: 'ws-app-career-detail',
  templateUrl: './career-detail.component.html',
  styleUrls: ['./career-detail.component.scss'],
  standalone: false
})
export class CareerDetailComponent implements OnInit {
  @ViewChild('toastSuccess', { static: true }) toastSuccess!: ElementRef<any>
  @ViewChild('toastError', { static: true }) toastError!: ElementRef<any>
  data!: any
  similarPosts!: any
  defaultError = 'Something went wrong, Please try again after sometime!'
  topicId!: number
  fetchSingleCategoryLoader = false
  // fetchNewData = false

  constructor(
    public dialog: MatDialog,
    private route: ActivatedRoute,
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.topicId = params.topicId
      // if (this.fetchNewData) {
      //   this.getTIDData()
      // }
      this.data = this.route.snapshot.data.topic.data
    })
  }

}
