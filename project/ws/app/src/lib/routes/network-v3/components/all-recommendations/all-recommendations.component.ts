import { Component, OnInit } from '@angular/core';
import { PageChangeEmitter } from '../../models/network-v3.model';
import * as _ from 'lodash';
import { MatLegacySnackBar } from '@angular/material/legacy-snack-bar';
import { NetworkingService } from '../../services/networking.service';

@Component({
  selector: 'ws-app-all-recommendations',
  templateUrl: './all-recommendations.component.html',
  styleUrls: ['./all-recommendations.component.scss']
})
export class AllRecommendationsComponent implements OnInit {

  recommendationType = 'peopleNearYou'
  title = 'People near you'
  recommendationList: any[] = []
  paginationSize = 50;
  paginationSizeOptions = [50, 100, 150, 200];
  paginationPage = 1;
  totalItemsCount = 1000; // This should be set based on the actual data count
  recommendationListLoading = false;
  apiCallSubscription: any;


  constructor(
    private snackBar: MatLegacySnackBar,
    private networkingSvc: NetworkingService
  ) { }

  ngOnInit(): void {
    this.getRecommendationsList();
  }

  getRecommendationsList() {
    const formBody = {
      size: this.paginationSize,
      offset: this.paginationPage - 1,
    }
    if(this.apiCallSubscription) {
      this.apiCallSubscription.unsubscribe();
    }
    this.recommendationListLoading = true;
    this.apiCallSubscription = this.networkingSvc.getRecommendedUsers(formBody).subscribe({
      next: (response) => {
        this.recommendationListLoading = false;
        this.recommendationList = _.get(response, 'result.response', []);
        this.totalItemsCount = _.get(response, 'result.count', 0);
      },
      error: (error) => {
        this.recommendationListLoading = false;
        if(error) {
          this.openSnackbar('Error fetching recommendations. Please try again later.', 3000);
        }
      }
    });
  }

  async onPageChange(event: PageChangeEmitter) {
    this.scrollToTop();
    this.paginationPage = event.currentPage
    this.paginationSize = event.limit;
    this.getRecommendationsList();
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openSnackbar(primaryMsg: string, duration: number = 5000) {
    this.snackBar.open(primaryMsg, 'X', {
      duration,
    })
  }

}
