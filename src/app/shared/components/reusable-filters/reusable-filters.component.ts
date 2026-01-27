import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { MatCheckboxChange } from '@angular/material/checkbox'
// tslint:disable-next-line
import _ from 'lodash'

export interface FilterOption {
  name: string
  displayName?: string
  count?: number
  isChecked?: boolean
}

export interface FilterConfig {
  key: string
  heading: string
  showSearch?: boolean
  showClearAll?: boolean
  selectType?: 'checkbox' | 'radio'
  showCount?: boolean
  showSeeMore?: boolean
  seeMoreLimit?: number
  options: FilterOption[]
}

export interface ApiFacet {
  name: string
  values: { name: string; count: number }[]
}

export interface FilterMetaConfig {
  [key: string]: {
    heading: string
    showSearch?: boolean
    showClearAll?: boolean
    selectType?: 'checkbox' | 'radio'
    showCount?: boolean
    showSeeMore?: boolean
    seeMoreLimit?: number
    order?: number
  }
}

export interface SelectedFilters {
  [key: string]: string[]
}

export interface FilterChip {
  key: string
  value: string
  displayName: string
}

// Default configuration for known filter keys
const DEFAULT_FILTER_META: FilterMetaConfig = {
  'avgRating': {
    heading: 'Rating',
    showSearch: false,
    showClearAll: true,
    selectType: 'checkbox',
    showCount: true,
    showSeeMore: false,
    order: 1
  },
  'language': {
    heading: 'Languages',
    showSearch: true,
    showClearAll: false,
    selectType: 'checkbox',
    showCount: false,
    showSeeMore: true,
    seeMoreLimit: 4,
    order: 2
  },
  'organisation': {
    heading: 'Content Provider',
    showSearch: true,
    showClearAll: false,
    selectType: 'checkbox',
    showCount: true,
    showSeeMore: true,
    seeMoreLimit: 4,
    order: 3
  },
  'courseCategory': {
    heading: 'Duration',
    showSearch: false,
    showClearAll: false,
    selectType: 'checkbox',
    showCount: true,
    showSeeMore: true,
    seeMoreLimit: 4,
    order: 4
  },
  'competencies_v6.competencyAreaName': {
    heading: 'Competency Area',
    showSearch: true,
    showClearAll: false,
    selectType: 'checkbox',
    showCount: true,
    showSeeMore: true,
    seeMoreLimit: 4,
    order: 5
  },
  'competencies_v6.competencyThemeName': {
    heading: 'Competency Theme',
    showSearch: true,
    showClearAll: false,
    selectType: 'checkbox',
    showCount: true,
    showSeeMore: true,
    seeMoreLimit: 4,
    order: 6
  },
  'competencies_v6.competencySubThemeName': {
    heading: 'Competency Sub Theme',
    showSearch: true,
    showClearAll: false,
    selectType: 'checkbox',
    showCount: true,
    showSeeMore: true,
    seeMoreLimit: 4,
    order: 7
  },
  'sectorDetails_v1.sectorName': {
    heading: 'Sector',
    showSearch: true,
    showClearAll: false,
    selectType: 'checkbox',
    showCount: true,
    showSeeMore: true,
    seeMoreLimit: 4,
    order: 8
  },
  'sectorDetails_v1.subSectorName': {
    heading: 'Sub Sector',
    showSearch: true,
    showClearAll: false,
    selectType: 'checkbox',
    showCount: true,
    showSeeMore: true,
    seeMoreLimit: 4,
    order: 9
  }
}

@Component({
  selector: 'ws-reusable-filters',
  templateUrl: './reusable-filters.component.html',
  styleUrls: ['./reusable-filters.component.scss']
})
export class ReusableFiltersComponent implements OnInit, OnDestroy, OnChanges {
  @Input() filterConfig: FilterConfig[] = []
  @Input() apiFacets: ApiFacet[] = []  // Raw API facets input
  @Input() filterMetaConfig: FilterMetaConfig = {}  // Custom meta config to override defaults
  @Input() showHeader: boolean = true
  @Input() headerTitle: string = 'Filter by'
  @Input() showClearAllGlobal: boolean = true

  @Output() appliedFilter = new EventEmitter<SelectedFilters>()
  @Output() filterCleared = new EventEmitter<void>()
  @Output() filterChipRemoved = new EventEmitter<FilterChip>()

  selectedFilters: SelectedFilters = {}
  selectedFilterChips: FilterChip[] = []
  filtersAppliedCount: number = 0
  searchQueries: { [key: string]: string } = {}
  showAllMap: { [key: string]: boolean } = {}

  constructor(private translate: TranslateService) {
    if (localStorage.getItem('websiteLanguage')) {
      this.translate.setDefaultLang('en')
      const lang = localStorage.getItem('websiteLanguage')!
      this.translate.use(lang)
    }
  }

  ngOnInit(): void {
    this.initializeState()
  }

  ngOnChanges(changes: SimpleChanges): void {
    // If apiFacets changes, transform them to filterConfig
    if (changes['apiFacets'] && changes['apiFacets'].currentValue) {
      this.transformApiFacetsToConfig()
    }

    if (changes['filterConfig'] && changes['filterConfig'].currentValue) {
      this.initializeState()
      this.updateFilterChips()
    }
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  /**
   * Transform API facets response to filterConfig format
   */
  transformApiFacetsToConfig(): void {
    if (!this.apiFacets || !Array.isArray(this.apiFacets) || this.apiFacets.length === 0) {
      return
    }

    // Merge custom meta config with defaults
    const mergedMeta = { ...DEFAULT_FILTER_META, ...this.filterMetaConfig }

    // Transform each API facet to FilterConfig
    const transformedConfig: FilterConfig[] = this.apiFacets
      .filter(facet => facet.values && facet.values.length > 0) // Only include facets with values
      .map(facet => {
        const meta = mergedMeta[facet.name] || this.getDefaultMeta(facet.name)

        return {
          key: facet.name,
          heading: meta.heading,
          showSearch: meta.showSearch ?? true,
          showClearAll: meta.showClearAll ?? false,
          selectType: meta.selectType ?? 'checkbox',
          showCount: meta.showCount ?? true,
          showSeeMore: meta.showSeeMore ?? true,
          seeMoreLimit: meta.seeMoreLimit ?? 4,
          options: facet.values.map(value => {
            const filterValues = _.get(this.selectedFilters, facet.name, []) as string[]
            return {
              name: value.name,
              displayName: this.capitalizeFirstLetter(value.name),
              count: value.count,
              isChecked: filterValues.includes(value.name) || false
            }
          })
        }
      })
      .sort((a, b) => {
        const orderA = _.get(mergedMeta, `${a.key}.order`, 999) as number
        const orderB = _.get(mergedMeta, `${b.key}.order`, 999) as number
        return orderA - orderB
      })

    this.filterConfig = transformedConfig
    this.initializeState()
    this.updateFilterChips()
  }

  /**
   * Generate default meta config for unknown filter keys
   */
  getDefaultMeta(key: string): FilterMetaConfig[string] {
    // Convert key like "competencies_v6.competencyAreaName" to "Competency Area Name"
    const heading = key
      .split('.')
      .pop() || key
    const formattedHeading = heading
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim()

    return {
      heading: formattedHeading,
      showSearch: true,
      showClearAll: false,
      selectType: 'checkbox',
      showCount: true,
      showSeeMore: true,
      seeMoreLimit: 4,
      order: 999
    }
  }

  initializeState(): void {
    this.filterConfig.forEach(config => {
      this.searchQueries[config.key] = ''
      this.showAllMap[config.key] = false
    })
  }

  getSelectedFilter(option: FilterOption, key: string): boolean {
    const filterValues = _.get(this.selectedFilters, key, []) as string[]
    return filterValues.includes(option.name) || false
  }

  onSelectionFilter(event: MatCheckboxChange, option: FilterOption, filterKey: string): void {
    const isChecked = event.checked
    option.isChecked = isChecked

    if (!this.selectedFilters[filterKey]) {
      this.selectedFilters[filterKey] = []
    }

    if (isChecked) {
      if (!this.selectedFilters[filterKey].includes(option.name)) {
        this.selectedFilters[filterKey].push(option.name)
      }
    } else {
      const index = this.selectedFilters[filterKey].indexOf(option.name)
      if (index > -1) {
        this.selectedFilters[filterKey].splice(index, 1)
      }
    }

    // Clean up empty arrays
    if (this.selectedFilters[filterKey].length === 0) {
      delete this.selectedFilters[filterKey]
    }

    this.updateFilterChips()
    this.appliedFilter.emit({ ...this.selectedFilters })
  }

  onRadioChange(option: FilterOption, filterKey: string): void {
    // For radio, only one selection allowed
    const config = this.filterConfig.find(c => c.key === filterKey)
    if (config) {
      config.options.forEach(opt => opt.isChecked = false)
    }
    option.isChecked = true
    this.selectedFilters[filterKey] = [option.name]

    this.updateFilterChips()
    this.appliedFilter.emit({ ...this.selectedFilters })
  }

  updateFilterChips(): void {
    this.selectedFilterChips = []
    for (const key in this.selectedFilters) {
      if (this.selectedFilters.hasOwnProperty(key)) {
        const config = this.filterConfig.find(c => c.key === key)
        const configOptions = _.get(config, 'options', []) as FilterOption[]
        this.selectedFilters[key].forEach(value => {
          const option = configOptions.find(o => o.name === value)
          const optionDisplayName = _.get(option, 'displayName', '') as string
          this.selectedFilterChips.push({
            key,
            value,
            displayName: optionDisplayName || this.capitalizeFirstLetter(value)
          })
        })
      }
    }
    this.filtersAppliedCount = this.selectedFilterChips.length
  }

  clearFilterChip(chip: FilterChip): void {
    const config = this.filterConfig.find(c => c.key === chip.key)
    if (config) {
      const option = config.options.find(o => o.name === chip.value)
      if (option) {
        option.isChecked = false
      }
    }

    if (this.selectedFilters[chip.key]) {
      const index = this.selectedFilters[chip.key].indexOf(chip.value)
      if (index > -1) {
        this.selectedFilters[chip.key].splice(index, 1)
      }
      if (this.selectedFilters[chip.key].length === 0) {
        delete this.selectedFilters[chip.key]
      }
    }

    this.updateFilterChips()
    this.filterChipRemoved.emit(chip)
    this.appliedFilter.emit({ ...this.selectedFilters })
  }

  clearAllFilters(): void {
    this.selectedFilters = {}
    this.filterConfig.forEach(config => {
      config.options.forEach(option => {
        option.isChecked = false
      })
    })
    this.updateFilterChips()
    this.filterCleared.emit()
    this.appliedFilter.emit({})
  }

  clearSectionFilters(filterKey: string): void {
    const config = this.filterConfig.find(c => c.key === filterKey)
    if (config) {
      config.options.forEach(option => {
        option.isChecked = false
      })
    }
    delete this.selectedFilters[filterKey]
    this.updateFilterChips()
    this.appliedFilter.emit({ ...this.selectedFilters })
  }

  toggleShowMore(filterKey: string): void {
    this.showAllMap[filterKey] = !this.showAllMap[filterKey]
  }

  getFilteredOptions(config: FilterConfig): FilterOption[] {
    let options = config.options || []
    const searchQuery = this.searchQueries[config.key]?.toLowerCase() || ''

    // Apply search filter
    if (searchQuery && searchQuery.trim() !== '') {
      options = options.filter(opt => {
        const displayName = opt.displayName || opt.name || ''
        return displayName.toLowerCase().includes(searchQuery)
      })
    }

    // Apply see more limit
    const limit = config.seeMoreLimit || 5
    if (config.showSeeMore !== false && !this.showAllMap[config.key] && options.length > limit) {
      return options.slice(0, limit)
    }

    return options
  }

  hasMoreOptions(config: FilterConfig): boolean {
    const limit = config.seeMoreLimit || 5
    const optionsLength = _.get(config, 'options.length', 0) as number
    return optionsLength > limit
  }

  capitalizeFirstLetter(str: string): string {
    if (!str) return ''
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }

  trackByFn(index: number, item: any): any {
    return item.name || index
  }
}
