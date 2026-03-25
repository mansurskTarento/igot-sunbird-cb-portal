import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ConfigurationsService } from '@sunbird-cb/utils-v2';

@Component({
  selector: 'ws-app-sadhana-saptah',
  templateUrl: './sadhana-saptah.component.html',
  styleUrls: ['./sadhana-saptah.component.scss']
})
export class SadhanaSaptahComponent implements OnInit{

  sectionList: any = []
  nlwConfig: any 
  indivisualSection: any = {}

  constructor(private route: ActivatedRoute, public configService: ConfigurationsService) { }

  ngOnInit() {
    if (this.route.snapshot.data && this.route.snapshot.data.formData
      && this.route.snapshot.data.formData.data
      && this.route.snapshot.data.formData.data.result
      && this.route.snapshot.data.formData.data.result.form
      && this.route.snapshot.data.formData.data.result.form.data
      && this.route.snapshot.data.formData.data.result.form.data.sectionList
    ) {
      debugger
      this.sectionList = this.route.snapshot.data.formData.data.result.form.data.sectionList
      this.indivisualSection = this.route.snapshot.data.formData.data.result.form.data.indivisualSection || {}
      this.nlwConfig = this.route.snapshot.data.formData.data.result.form.data.nlwConfig || {}
    }
  }

}
