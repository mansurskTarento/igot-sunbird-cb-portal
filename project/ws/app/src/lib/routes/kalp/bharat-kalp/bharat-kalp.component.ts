import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'

@Component({
  selector: 'ws-app-bharat-kalp',
  templateUrl: './bharat-kalp.component.html',
  styleUrls: ['./bharat-kalp.component.scss'],
  standalone: false,
})
export class BharatKalpPageComponent implements OnInit {
  sectionList: any[] = []
  bkConfig: any = {}
  individualSection: any = {}

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public configService: ConfigurationsService,
  ) { }

  ngOnInit() {
    const formData = this.route.snapshot.data?.formData?.data?.result?.form?.data
    if (formData) {
      this.sectionList = formData.sectionList || []
      this.individualSection = formData.individualSection || {}
      this.bkConfig = formData.bkConfig || {}
    }
  }

  openCommunity(community: any): void {
    const communityId = community?.communityId || community?.identifier || community?.id
    if (communityId) {
      this.router.navigate(['/app/discussion-forum-v2/community', communityId])
    }
  }
}
