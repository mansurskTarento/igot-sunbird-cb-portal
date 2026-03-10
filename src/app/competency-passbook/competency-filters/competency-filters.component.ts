import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'

@Component({
  selector: 'ws-competency-filters',
  templateUrl: './competency-filters.component.html',
  styleUrls: ['./competency-filters.component.scss'],
})
export class CompetencyFiltersComponent implements OnInit {

  @Input() allCompetencies: any[] = []
  @Input() filteredCompetencyArray: any[] = []
  @Input() appliedFilter: any = { competencyarea: [], theme: [], subtheme: [] }

  @Output() toggleFilter = new EventEmitter<boolean>()
  @Output() getFilterData = new EventEmitter<any>()
  @Output() clearFilterObj = new EventEmitter<any>()

  competencyAreas: { name: string; refId: string; selected: boolean }[] = []

  // Themes
  allThemes: { name: string; refId: string; selected: boolean; areaName: string }[] = []
  filteredThemes: { name: string; refId: string; selected: boolean; areaName: string }[] = []
  themeSearchText = ''
  showThemes = false

  // Sub-themes
  allSubThemes: { name: string; refId: string; selected: boolean; themeId: string }[] = []
  filteredSubThemes: { name: string; refId: string; selected: boolean; themeId: string }[] = []
  subThemeSearchText = ''
  showSubThemes = false

  ngOnInit(): void {
    this.buildFilterData()
    this.restoreAppliedFilters()
  }

  buildFilterData(): void {
    if (this.allCompetencies?.length) {
      this.competencyAreas = this.allCompetencies.map((area: any) => ({
        name: area.name,
        refId: area.refId || area.id || '',
        selected: false,
      }))
    }
  }

  restoreAppliedFilters(): void {
    const savedAreas: string[] = this.appliedFilter?.competencyarea || []
    const savedThemes: string[] = this.appliedFilter?.theme || []
    const savedSubThemes: string[] = this.appliedFilter?.subtheme || []

    if (!savedAreas.length && !savedThemes.length && !savedSubThemes.length) {
      return
    }

    // Step 1: Mark saved areas as selected
    if (savedAreas.length) {
      this.competencyAreas.forEach(a => {
        a.selected = savedAreas.some(sa =>
          sa.toLowerCase() === a.name.toLowerCase()
        )
      })
      this.rebuildThemes()
    }

    // Step 2: Mark saved themes as selected
    if (savedThemes.length) {
      this.allThemes.forEach(t => {
        t.selected = savedThemes.some(st =>
          st.toLowerCase() === t.name.toLowerCase()
        )
      })
      this.filteredThemes = [...this.allThemes]
      this.rebuildSubThemes()
    }

    // Step 3: Mark saved sub-themes as selected
    if (savedSubThemes.length) {
      this.allSubThemes.forEach(s => {
        s.selected = savedSubThemes.some(ss =>
          ss.toLowerCase() === s.name.toLowerCase()
        )
      })
      this.filteredSubThemes = [...this.allSubThemes]
    }
  }

  // --- Area selection: rebuild themes from selected areas ---
  onAreaChange(area: any, checked: boolean): void {
    area.selected = checked
    this.rebuildThemes()
  }

  rebuildThemes(): void {
    const selectedAreaNames = this.competencyAreas
      .filter(a => a.selected)
      .map(a => a.name.toLowerCase())

    if (!selectedAreaNames.length) {
      this.showThemes = false
      this.allThemes = []
      this.filteredThemes = []
      this.themeSearchText = ''
      // Also reset sub-themes when no areas are selected
      this.resetSubThemes()
      return
    }

    this.showThemes = true
    const themeMap = new Map<string, any>()

    if (this.filteredCompetencyArray?.length) {
      this.filteredCompetencyArray.forEach((area: any) => {
        const areaName = area.name?.toLowerCase()
        const matchesArea = selectedAreaNames.some(s =>
          s === areaName || (s === 'behavioural' && areaName === 'behavioral') || (s === 'behavioral' && areaName === 'behavioural')
        )
        if (matchesArea && area.themes?.length) {
          area.themes.forEach((theme: any) => {
            if (!themeMap.has(theme.id)) {
              themeMap.set(theme.id, {
                name: theme.name,
                refId: theme.id,
                selected: false,
                areaName: area.name,
              })
            }
          })
        }
      })
    }

    // Preserve previously selected state for themes that still exist
    const prevSelected = new Set(this.allThemes.filter(t => t.selected).map(t => t.refId))
    this.allThemes = Array.from(themeMap.values()).map(t => ({
      ...t,
      selected: prevSelected.has(t.refId),
    }))
    this.themeSearchText = ''
    this.filteredThemes = [...this.allThemes]

    // Rebuild sub-themes based on still-selected themes
    this.rebuildSubThemes()
  }

  // --- Theme selection: rebuild sub-themes from selected themes ---
  onThemeChange(theme: any, checked: boolean): void {
    theme.selected = checked
    this.rebuildSubThemes()
  }

  rebuildSubThemes(): void {
    const selectedThemeIds = this.allThemes
      .filter(t => t.selected)
      .map(t => t.refId)

    if (!selectedThemeIds.length) {
      this.showSubThemes = false
      this.allSubThemes = []
      this.filteredSubThemes = []
      this.subThemeSearchText = ''
      return
    }

    this.showSubThemes = true
    const subThemeMap = new Map<string, any>()

    if (this.filteredCompetencyArray?.length) {
      this.filteredCompetencyArray.forEach((area: any) => {
        area.themes?.forEach((theme: any) => {
          if (selectedThemeIds.includes(theme.id) && theme.subThemes?.length) {
            theme.subThemes.forEach((st: any) => {
              const key = st.id || st.name
              if (!subThemeMap.has(key)) {
                subThemeMap.set(key, {
                  name: st.name,
                  refId: st.id || st.name,
                  selected: false,
                  themeId: theme.id,
                })
              }
            })
          }
        })
      })
    }

    const prevSelected = new Set(this.allSubThemes.filter(s => s.selected).map(s => s.refId))
    this.allSubThemes = Array.from(subThemeMap.values()).map(s => ({
      ...s,
      selected: prevSelected.has(s.refId),
    }))
    this.subThemeSearchText = ''
    this.filteredSubThemes = [...this.allSubThemes]
  }

  resetSubThemes(): void {
    this.showSubThemes = false
    this.allSubThemes = []
    this.filteredSubThemes = []
    this.subThemeSearchText = ''
  }

  // --- Search handlers ---
  filterThemes(): void {
    const search = this.themeSearchText.toLowerCase().trim()
    if (search) {
      this.filteredThemes = this.allThemes.filter(t =>
        t.name.toLowerCase().includes(search)
      )
    } else {
      this.filteredThemes = [...this.allThemes]
    }
  }

  filterSubThemes(): void {
    const search = this.subThemeSearchText.toLowerCase().trim()
    if (search) {
      this.filteredSubThemes = this.allSubThemes.filter(s =>
        s.name.toLowerCase().includes(search)
      )
    } else {
      this.filteredSubThemes = [...this.allSubThemes]
    }
  }

  onSubThemeChange(subTheme: any, checked: boolean): void {
    subTheme.selected = checked
  }

  // --- Apply / Clear / Close ---
  applyFilters(): void {
    const selectedAreas = this.competencyAreas.filter(a => a.selected).map(a => a.name)
    const selectedThemes = this.allThemes.filter(t => t.selected).map(t => t.name)
    const selectedSubThemes = this.allSubThemes.filter(s => s.selected).map(s => s.name)

    const filterObj: any = {
      competencyarea: selectedAreas,
      theme: selectedThemes,
      subtheme: selectedSubThemes,
    }
    console.log('Emitting filter data with obj:', filterObj)
    this.getFilterData.emit(filterObj)
  }

  clearFilters(): void {
    this.competencyAreas.forEach(a => a.selected = false)
    this.allThemes.forEach(t => t.selected = false)
    this.allSubThemes.forEach(s => s.selected = false)

    this.themeSearchText = ''
    this.subThemeSearchText = ''
    this.showThemes = false
    this.showSubThemes = false
    this.allThemes = []
    this.filteredThemes = []
    this.allSubThemes = []
    this.filteredSubThemes = []

    const emptyFilter: any = {
      competencyarea: [],
      theme: [],
      subtheme: [],
    }
    console.log('Emitting clear filter with obj:', emptyFilter)
    this.clearFilterObj.emit(emptyFilter)
  }

  closeFilter(): void {
    this.toggleFilter.emit(false)
  }
}
