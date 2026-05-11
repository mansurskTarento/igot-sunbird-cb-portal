import { Component } from '@angular/core'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'

@Component({
  selector: 'ws-base-competency-card-details',
  templateUrl: './base-competency-card-details.component.html',
  styleUrls: ['./base-competency-card-details.component.scss'],
  standalone: false
})
export class BaseCompetencyCardDetailsComponent {
  showOldVersion: boolean = false

  constructor(
    private configSvc: ConfigurationsService,
  ) { }

  ngOnInit() {
    this.showOldVersion = this.configSvc.globalConfig ? this.configSvc.globalConfig.showOldVersionOfLearnersPassbook : false
  }
}
