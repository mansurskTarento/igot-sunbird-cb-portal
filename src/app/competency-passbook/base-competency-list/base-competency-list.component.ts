import { Component } from '@angular/core'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'

@Component({
  selector: 'ws-base-competency-list',
  templateUrl: './base-competency-list.component.html',
  styleUrls: ['./base-competency-list.component.scss']
})
export class BaseCompetencyListComponent {

  showOldVersion: boolean = false

  constructor(
    private configSvc: ConfigurationsService,
  ) { }

  ngOnInit() {
    this.showOldVersion = this.configSvc.globalConfig ? this.configSvc.globalConfig.showOldVersionOfLearnersPassbook : false
  }

}
