import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
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

  constructor(private route: ActivatedRoute, public configService: ConfigurationsService) { }

  ngOnInit() {
    const formData = this.route.snapshot.data?.formData?.data?.result?.form?.data
    if (formData) {
      this.sectionList = formData.sectionList || []
      this.individualSection = formData.individualSection || {}
      this.bkConfig = formData.bkConfig || {}
    }
  }
}
