import { Component, Input } from '@angular/core'

@Component({
  selector: 'ws-competency-filters',
  templateUrl: './competency-filters.component.html',
  styleUrls: ['./competency-filters.component.scss']
})
export class CompetencyFiltersComponent {

  @Input() allCompetencies: any
  @Input() filteredCompetencyArray: any



}
