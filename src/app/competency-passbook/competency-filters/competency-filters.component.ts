import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'

@Component({
  selector: 'ws-competency-filters',
  templateUrl: './competency-filters.component.html',
  styleUrls: ['./competency-filters.component.scss'],
})
export class CompetencyFiltersComponent implements OnInit {

  @Input() allCompetencies: any[] = []
  @Input() filteredCompetencyArray: any[] = []

  @Output() toggleFilter = new EventEmitter<boolean>()
  @Output() getFilterData = new EventEmitter<any>()
  @Output() clearFilterObj = new EventEmitter<any>()

  competencyAreas: { name: string; refId: string; selected: boolean }[] = []
  allThemes: { name: string; refId: string; selected: boolean; areaId?: string }[] = []
  filteredThemes: { name: string; refId: string; selected: boolean; areaId?: string }[] = []
  themeSearchText = ''

  ngOnInit(): void {
    this.buildFilterData()
  }

  buildFilterData(): void {
    // Build competency area checkboxes from allCompetencies (Behavioural, Domain, Functional)
    if (this.allCompetencies && this.allCompetencies.length) {
      this.competencyAreas = this.allCompetencies.map((area: any) => ({
        name: area.name,
        refId: area.refId || area.id || '',
        selected: false,
      }))
    }

    // Build theme checkboxes from the filteredCompetencyArray data
    this.buildThemeList()
  }

  buildThemeList(): void {
    const themeMap = new Map<string, any>()
    if (this.filteredCompetencyArray && this.filteredCompetencyArray.length) {
      this.filteredCompetencyArray.forEach((area: any) => {
        if (area.themes && area.themes.length) {
          area.themes.forEach((theme: any) => {
            if (!themeMap.has(theme.id)) {
              themeMap.set(theme.id, {
                name: theme.name,
                refId: theme.id,
                selected: false,
                areaId: area.id,
              })
            }
          })
        }
      })
    }
    this.allThemes = Array.from(themeMap.values())
    this.filteredThemes = [...this.allThemes]
  }

  onAreaChange(area: any, checked: boolean): void {
    area.selected = checked
  }

  onThemeChange(theme: any, checked: boolean): void {
    theme.selected = checked
  }

  filterThemes(): void {
    const search = this.themeSearchText.toLowerCase().trim()
    if (!search) {
      this.filteredThemes = [...this.allThemes]
    } else {
      this.filteredThemes = this.allThemes.filter(t =>
        t.name.toLowerCase().includes(search)
      )
    }
  }

  applyFilters(): void {
    const selectedAreas = this.competencyAreas
      .filter(a => a.selected)
      .map(a => a.name)

    const selectedThemes = this.allThemes
      .filter(t => t.selected)
      .map(t => t.name)

    const filterObj: any = {
      competencyarea: selectedAreas,
      theme: selectedThemes,
      subtheme: [],
    }

    this.getFilterData.emit(filterObj)
  }

  clearFilters(): void {
    this.competencyAreas.forEach(a => a.selected = false)
    this.allThemes.forEach(t => t.selected = false)
    this.themeSearchText = ''
    this.filteredThemes = [...this.allThemes]

    const emptyFilter: any = {
      competencyarea: [],
      theme: [],
      subtheme: [],
    }
    this.clearFilterObj.emit(emptyFilter)
  }

  closeFilter(): void {
    this.toggleFilter.emit(false)
  }
}
