import { Component, OnInit } from '@angular/core';
import { PageChangeEmitter } from '../../models/network-v3.model';
import { NetworkingService } from '../../services/networking.service';
import * as _ from 'lodash';
import { MatLegacySnackBar } from '@angular/material/legacy-snack-bar';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'ws-app-mentors',
  templateUrl: './mentors.component.html',
  styleUrls: ['./mentors.component.scss']
})
export class MentorsComponent implements OnInit {
  paginationSize = 50;
  paginationSizeOptions = [3,50, 100, 150, 200];
  paginationPage = 1;
  totalItemsCount = 0;
  defaultPaginationSize = 50;
  mentorsList: any[] = [
  ]
  mentorsListLoading = false;
  mentorsGetSubscription: any

  constructor(
    private snackBar: MatLegacySnackBar,
    private networkingSvc: NetworkingService
  ) { }

  ngOnInit(): void {
    this.getMentorsList();
  }

  async onPageChange(event: PageChangeEmitter) {
    // this.searchContentLoader = true;
    this.scrollToTop();
    this.paginationPage = event.currentPage
    this.paginationSize = event.limit;
    this.getMentorsList();
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getMentorsList() {
    const formBody = {
      size: this.paginationSize,
      offset: this.paginationPage - 1,
    }
    if(this.mentorsGetSubscription) {
      this.mentorsGetSubscription.unsubscribe();
    }
    this.mentorsListLoading = true;
    this.mentorsGetSubscription =this.networkingSvc.getRecommendedMentors(formBody).subscribe({
      next: (response) => {
        this.mentorsListLoading = false;
        this.mentorsList = _.get(response, 'result.response', []) ;
        this.totalItemsCount = _.get(response, 'result.count', 0);
      },
      error: (error) => {
        this.mentorsListLoading = false;
        if(error) {
          this.openSnackbar('No mentors found at the moment. Please try again later.');
        }
      }
    });
  }

  descoverMentors() { 
    window.open(`${environment.contentHost}/mentorship/tabs/mentor-directory`, '_blank')
  }

  openSnackbar(primaryMsg: string, duration: number = 5000) {
    this.snackBar.open(primaryMsg, 'X', {
      duration,
    })
  }
}
