import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'

@Component({
  selector: 'ws-app-sadhana-saptah',
  templateUrl: './sadhana-saptah.component.html',
  styleUrls: ['./sadhana-saptah.component.scss'],
  standalone: false
})
export class SadhanaSaptahComponent implements OnInit {

  sectionList: any = []
  nlwConfig: any
  individualSection: any = {}
  indivisualSection: any = {}
  phoneNumber = '+91 9990141256'
  supportHours = '8:00 AM – 8:00 PM IST'

  constructor(private route: ActivatedRoute, public configService: ConfigurationsService) { }

  ngOnInit() {
    if (this.route.snapshot.data && this.route.snapshot.data.formData
      && this.route.snapshot.data.formData.data
      && this.route.snapshot.data.formData.data.result
      && this.route.snapshot.data.formData.data.result.form
      && this.route.snapshot.data.formData.data.result.form.data
      && this.route.snapshot.data.formData.data.result.form.data.sectionList
    ) {
      this.sectionList = this.route.snapshot.data.formData.data.result.form.data.sectionList
      this.individualSection = this.route.snapshot.data.formData.data.result.form.data.individualSection || {}
      this.nlwConfig = this.route.snapshot.data.formData.data.result.form.data.nlwConfig || {}
    }
  }

}
