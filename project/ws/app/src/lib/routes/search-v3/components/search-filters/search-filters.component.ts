import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { Subscription } from 'rxjs';
// tslint:disable-next-line
import _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';
import {
  ConfigurationsService,
  MultilingualTranslationsService,
} from '@sunbird-cb/utils-v2';
import {
  CATEGORY_TYPE,
  TypeOfEvents,
} from '../../../../../../../author/src/lib/constants/constant';
import {
  Facet,
  FacetType,
  FormattedFacets,
  SearchCategory,
} from '../../models/search-v3.model';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { NsContent } from '@sunbird-cb/collection/src/public-api';
import { environment } from '../../../../../../../../../src/environments/environment';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'ws-app-search-filters',
  templateUrl: './search-filters.component.html',
  styleUrls: ['./search-filters.component.scss'],
})
export class SearchFiltersComponent implements OnInit, OnDestroy, OnChanges {
  @Input() newfacets!: any;
  @Input() urlparamFilters!: any;
  @Output() appliedFilter = new EventEmitter<{ [key: string]: any }>();
  @Output() constructQueryParam = new EventEmitter<string>();
  @Input() karmayogiBadge: any;
  @Input() competencyFactet: any;

  private subscription: Subscription = new Subscription();
  queryParams: any;

  categoryType = CATEGORY_TYPE;
  categoryTypeDup = CATEGORY_TYPE;
  categoryTypeEnum = SearchCategory;
  showAllLanguage = false;

  formattedFacets: any = {};
  selectedFilters: any = {};
  compentencyKey!: NsContent.ICompentencyKeys;
  competencyAreaNameKey!: string;
  competencyThemeKey!: string;
  competencySubThemeKey!: string;
  showAllCompetencyTheme: boolean = false;
  showAllOrganisation: boolean = false;
  showAllCompetencySubTheme: boolean = false;
  showAllDesignation: boolean = false;

  selectedFilterChips: any;
  filterQueryOrganisation = '';
  filterQueryLanguage = '';
  filterQueryDesignation = '';
  filterQueryRootOrgName = '';
  filterQueryThemes = '';
  filterQuerySubThemes = '';
  searchCategory = '';
  constructor(
    // private searchSrvc: GbSearchService,
    private activated: ActivatedRoute,
    private translate: TranslateService,
    private langtranslations: MultilingualTranslationsService, // private router: Router
    private configSvc: ConfigurationsService
  ) {
    if (localStorage.getItem('websiteLanguage')) {
      this.translate.setDefaultLang('en');
      const lang = localStorage.getItem('websiteLanguage')!;
      this.translate.use(lang);
    }
  }

  ngOnInit() {
    this.compentencyKey =
      this.configSvc.compentency[environment.compentencyVersionKey];
    this.competencyAreaNameKey = `${this.compentencyKey.vKey}.${this.compentencyKey.vCompetencyArea}`;
    this.competencyThemeKey = `${this.compentencyKey.vKey}.${this.compentencyKey.vCompetencyTheme}`;
    this.competencySubThemeKey = `${this.compentencyKey.vKey}.${this.compentencyKey.vCompetencySubTheme}`;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['newfacets'] && changes['newfacets'].currentValue) {
      this.formattedFacets = this.formatFacets(
        changes['newfacets'].currentValue
      );

      if (this.formattedFacets?.sectorId?.length) {
        const coursesCategory = _.find(this.categoryTypeDup, {
          name: 'courses',
        });

        if (!coursesCategory) return;

        const caseStudyCategory = _.find(coursesCategory.filters, {
          name: 'case-studies',
        });

        const sectorFilters = this.formattedFacets.sectorId.map(
          (sector: any) => ({
            name: sector.name,
            count: sector.count,
            isChecked: sector.isChecked,
            displayName: this.formatSectorName(sector.name),
          })
        );

        if (!caseStudyCategory) {
          coursesCategory.filters.push({
            displayName: 'Case Study',
            name: SearchCategory.CaseStudy,
            count: 0,
            isChecked: false,
            filters: sectorFilters,
          });
        } else {
          caseStudyCategory.filters = sectorFilters;
        }
      }

      // Handle nested filters for other categories
      if (this.formattedFacets?.nestedCategory?.length) {
        const nestedCategory = _.find(this.categoryTypeDup, {
          name: 'nestedCategory',
        });

        if (nestedCategory) {
          nestedCategory.filters = this.formattedFacets.nestedCategory.map(
            (filter: any) => ({
              name: filter.name,
              count: filter.count,
              isChecked: filter.isChecked,
              displayName: this.formatSectorName(filter.name),
            })
          );
        }
      }
    }

    this.setCategoryType();
  }

  formatSectorName(name: string): string {
    if (name.startsWith('sector-fw_sector_')) {
      name = name.replace('sector-fw_sector_', '');
    }
    return name
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  setCategoryType() {
    const params = this.activated.snapshot.queryParams;
    this.searchCategory = params['category'];
    if (this.searchCategory) {
      this.categoryType = this.categoryTypeDup.filter(
        (type) => type.name === this.searchCategory
      );
      if (this.categoryType.length) {
        this.categoryType[0].isChecked = true;
        this.selectedFilters[this.categoryType[0].name] = [
          this.categoryType[0].name,
        ];
        this.selectedFilterChips = [
          {
            value: this.categoryType[0].displayName,
            type: this.categoryType[0].name,
          },
        ];
      }

      if (this.searchCategory === SearchCategory.Events) {
        this.formattedFacets['typeOfEvents'] = TypeOfEvents;
      }
    } else {
      this.categoryType = this.categoryTypeDup.map((cat) => ({
        ...cat,
        isChecked: cat.name === SearchCategory.All ? true : false,
      }));
    }
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  toggleShowMore(togglesection: string) {
    if (togglesection === this.competencyThemeKey) {
      this.showAllCompetencyTheme = !this.showAllCompetencyTheme;
    } else if (togglesection === this.competencySubThemeKey) {
      this.showAllCompetencySubTheme = !this.showAllCompetencySubTheme;
    } else if (togglesection === FacetType.Language) {
      this.showAllLanguage = !this.showAllLanguage;
    } else if (togglesection === FacetType.Organization) {
      this.showAllOrganisation = !this.showAllOrganisation;
    } else if (togglesection === FacetType.Designation) {
      this.showAllDesignation = !this.showAllDesignation;
    }
  }

  translateActualLabels(label: string, type: any) {
    return this.langtranslations.translateActualLabel(label, type, '');
  }

  formatFacets(data: Facet[][]): FormattedFacets {
    const formattedFacets: FormattedFacets | any = {};

    if (!data.length) return formattedFacets;

    const mergedData: { [key: string]: { [key: string]: number } } =
      data.reduce((acc, group) => {
        group.forEach(({ name, values }) => {
          if (!acc[name]) {
            acc[name] = {};
          }
          values.forEach(({ name: valueName, count }) => {
            acc[name][valueName] = (acc[name][valueName] || 0) + count;
          });
        });
        return acc;
      }, {} as { [key: string]: { [key: string]: number } });

    Object.entries(mergedData).forEach(([key, values]) => {
      if (key === FacetType.Duration) {
        const formattedDurations = [
          { range: [0, 1800], label: '0 - 30 mins' },
          { range: [1801, 3600], label: '30 - 60 mins' },
          { range: [3601, 5400], label: '60 - 90 mins' },
          { range: [5401, Infinity], label: '90 mins' },
        ]
          .map(({ range, label }) => {
            const count = Object.entries(values)
              .filter(([key]) => {
                const duration = parseInt(key, 10);
                return duration >= range[0] && duration <= range[1];
              })
              .reduce((sum, [, count]) => sum + count, 0);
            return count > 0 ? { name: label, count, isChecked: false } : null;
          })
          .filter(Boolean);

        formattedFacets[key] = formattedDurations;
      } else if (key === FacetType.AvgRating) {
        const ratingRanges = [4.5, 4.0, 3.5, 3.0];
        const formattedRatings = ratingRanges
          .map((rating) => {
            const count = Object.entries(values)
              .filter(([rate]) => parseFloat(rate) >= rating)
              .reduce((sum, [, count]) => sum + count, 0);
            return count > 0
              ? { name: `${rating.toFixed(1)}`, count, isChecked: false }
              : null;
          })
          .filter(Boolean);

        formattedFacets[key] = formattedRatings;
      } else {
        formattedFacets[key] = Object.entries(values).map(([name, count]) => ({
          name,
          count,
          isChecked: false,
        }));
      }
    });

    return formattedFacets;
  }

  capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  onSelectionFilter(
    event: MatCheckboxChange,
    option: any,
    categoryType: string
  ) {
    const type = option?.name;
    option.isChecked = event.checked;
    if (!this.selectedFilters[categoryType]) {
      this.selectedFilters[categoryType] = [];
    }
    if (event.checked) {
      if (!this.selectedFilters[categoryType].includes(type)) {
        this.selectedFilters[categoryType].push(type);
      }
    } else {
      this.selectedFilters[categoryType] = this.selectedFilters[
        categoryType
      ].filter((item: any) => item !== type);
    }

    this.appliedFilter.emit(this.selectedFilters);
    this.selectedFilterChips = this.refactorFilterData(this.selectedFilters);

    const types = this.categoryTypeDup.map((category) => category.name);
    if (types.includes(type) && !option.isChecked) {
      this.constructQueryParam.emit('');
    }
  }

  get filtersAppliedCount(): number {
    return Object.entries(this.selectedFilters).filter(
      ([_, arr]) => Array.isArray(arr) && arr.length > 0
    ).length;
  }

  refactorFilterData(
    data: Record<string, string[]>
  ): { type: string; value: string }[] {
    if (typeof data !== 'object' || data === null) {
      return [];
    }

    return _.flatMap(data, (values, key) =>
      values.map((value) => ({
        type: key,
        value: this.capitalizeFirstLetter(value),
      }))
    );
  }

  clearFilterChip(item: { type: string; value: string }) {
    let facets;
    const types = this.categoryTypeDup.map((category) => category.name);
    if (types.includes(item.type)) {
      facets = this.categoryType;

      const category = _.find(facets, { displayName: item.type });

      if (!category) {
        this.categoryType[0].isChecked = false;
        if (_.has(this.selectedFilters, item.type)) {
          _.pull(this.selectedFilters[item.type], this.categoryType[0]?.name);
          if (_.isEmpty(this.selectedFilters[item.type])) {
            delete this.selectedFilters[item.type];
          }
        }
        this.appliedFilter.emit(this.selectedFilters);
        this.selectedFilterChips = this.refactorFilterData(
          this.selectedFilters
        );
        this.constructQueryParam.emit('');
        return;
      }

      const foundFilter = _.find(category.filters, { name: item.value });
      if (foundFilter) {
        foundFilter.isChecked = false;

        if (_.has(this.selectedFilters, item.type)) {
          _.pull(this.selectedFilters[item.type], foundFilter.name);
          if (_.isEmpty(this.selectedFilters[item.type])) {
            delete this.selectedFilters[item.type];
          }
        }

        this.appliedFilter.emit(this.selectedFilters);
        this.selectedFilterChips = this.refactorFilterData(
          this.selectedFilters
        );
      }
    } else if (
      item.type === this.competencyAreaNameKey ||
      item.type === this.competencyThemeKey ||
      item.type === this.competencySubThemeKey
    ) {
      facets = this.competencyFactet;

      let competency;
      if (item.type && item.type === this.competencyAreaNameKey) {
        if (facets?.length) {
          competency = facets.find(
            (facet: any) =>
              (facet[item.type]?.name).toLowerCase() ===
              item?.value.toLowerCase()
          );
        }
      } else {
        if (facets?.length) {
          competency = facets.find((facet: any) => {
            if (facet[item.type]) {
              return facet[item.type].find(
                (subFacet: any) =>
                  subFacet?.name.toLowerCase() === item?.value.toLowerCase()
              );
            }
            return false;
          });
        }
      }

      if (competency) {
        if (item.type && item.type === this.competencyAreaNameKey) {
          competency[item.type].isChecked = false;
        } else {
          const subFacet = competency[item.type].find(
            (subFacet: any) =>
              subFacet?.name.toLowerCase() === item?.value.toLowerCase()
          );
          if (subFacet) {
            subFacet.isChecked = false;
          }
        }

        if (this.selectedFilters[item.type]) {
          this.selectedFilters[item.type] = this.selectedFilters[
            item.type
          ].filter(
            (filter: string) =>
              filter.toLowerCase() !== item?.value.toLowerCase()
          );
          if (this.selectedFilters[item.type].length === 0) {
            delete this.selectedFilters[item.type];
          }
        }

        this.appliedFilter.emit(this.selectedFilters);
        this.selectedFilterChips = this.refactorFilterData(
          this.selectedFilters
        );
      }
    } else {
      facets = this.formattedFacets;
      const allFilters = _.flatMap(facets);
      let foundFilter: any;
      foundFilter = _.find(allFilters, {
        name: item.value.toLowerCase(),
      });

      if (!foundFilter) {
        foundFilter = _.find(allFilters, {
          name: item.value,
        });
      }

      if (foundFilter && !foundFilter?.name.startsWith('sector-fw_sector_')) {
        foundFilter.isChecked = false;

        if (_.has(this.selectedFilters, item.type)) {
          _.pull(this.selectedFilters[item.type], foundFilter.name);
          if (_.isEmpty(this.selectedFilters[item.type])) {
            // delete this.selectedFilters[item.type];
          }
        }

        this.appliedFilter.emit(this.selectedFilters);
        this.selectedFilterChips = this.refactorFilterData(
          this.selectedFilters
        );
      } else {
        const foundCategory = _.find(this.categoryTypeDup, {
          name: SearchCategory.Courses,
        });
        if (foundCategory) {
          const found = this.recursivelySetIsCheckedFalse(
            foundCategory.filters,
            item.value.toLowerCase()
          );
          if (found) {
            found.isChecked = false;
            if (_.has(this.selectedFilters, item.type)) {
              if (item.value.toLowerCase().startsWith('sector-fw_sector_')) {
                _.pull(
                  this.selectedFilters[item.type],
                  item.value.toLowerCase()
                );
              } else {
                _.pull(this.selectedFilters[item.type], item.value);
              }
              if (_.isEmpty(this.selectedFilters[item.type])) {
                delete this.selectedFilters[item.type];
              }
            }
            this.appliedFilter.emit(this.selectedFilters);
            this.selectedFilterChips = this.refactorFilterData(
              this.selectedFilters
            );
          }
        }
      }
    }
  }

  clearAllFilters() {
    Object.keys(this.selectedFilters).forEach((key) => {
      this.selectedFilters[key] = [];
    });
    _.forEach(this.categoryType, (category) => {
      category.isChecked = false;
      _.forEach(category.filters, (filter) => {
        filter.isChecked = false;
      });
    });

    _.forEach(this.formattedFacets, (filters) => {
      _.forEach(filters, (filter) => {
        filter.isChecked = false;
      });
    });

    _.forEach(this.competencyFactet, (competency) => {
      competency[this.competencyAreaNameKey].isChecked = false;
      _.forEach(competency[this.competencyThemeKey], (theme) => {
        theme.isChecked = false;
      });
      _.forEach(competency[this.competencySubThemeKey], (subTheme) => {
        subTheme.isChecked = false;
      });
    });

    this.appliedFilter.emit(this.selectedFilters);
    this.selectedFilterChips = [];
    this.constructQueryParam.emit('');
  }

  get filteredOrganisations() {
    let data: any;
    if (this.searchCategory === SearchCategory.Events) {
      data = this.formattedFacets[FacetType.SourceName];
    } else {
      data = this.formattedFacets[FacetType.Organization];
    }
    let filteredList = data.filter((item: any) =>
      item.name
        .toLowerCase()
        .includes(this.filterQueryOrganisation.toLowerCase())
    );

    return this.showAllOrganisation ? filteredList : filteredList.slice(0, 4);
  }

  get filteredLanguages() {
    let filteredList = this.formattedFacets[FacetType.Language].filter(
      (item: any) =>
        item.name.toLowerCase().includes(this.filterQueryLanguage.toLowerCase())
    );

    return this.showAllLanguage ? filteredList : filteredList.slice(0, 4);
  }

  getFilteredThemes(competency: any): any[] {
    let filteredThemes: any[] = []
    if(competency && competency[this.competencyThemeKey]) {
      filteredThemes = competency[this.competencyThemeKey].filter((theme: any) => 
        theme.name.toLowerCase().includes(this.filterQueryThemes.toLowerCase()))
    }
    return filteredThemes
  }

  getFilteredSubThemes(competency: any): any[] {
    if(competency) {}
    // let filteredSubThemes: any[] = []
    // let selectedThemSubthmes: any[] = []
    // if(competency && competency[this.competencyThemeKey]) {
    //   competency[this.competencyThemeKey].forEach((theme: any) => {
    //     if(theme.isChecked) {
    //       selectedThemSubthmes = selectedThemSubthmes.concat(competency[this.competencySubThemeKey])
    //     }
    //   })
      // filteredSubThemes = competency[this.competencyThemeKey].filter((theme: any) => 
      //   theme.name.toLowerCase().includes(this.filterQueryThemes.toLowerCase()))
    // }
    // return filteredSubThemes
    return []
  }

  get filteredDesignations() {
    let filteredList = this.formattedFacets[
      'profileDetails.professionalDetails.designation'
    ]?.filter((item: any) =>
      item?.name
        .toLowerCase()
        .includes(this.filterQueryDesignation.toLowerCase())
    );

    return this.showAllDesignation ? filteredList : filteredList.slice(0, 4);
  }

  get filteredRootOrgNames() {
    let filteredList = this.formattedFacets['rootOrgName']?.filter(
      (item: any) =>
        item?.name
          .toLowerCase()
          .includes(this.filterQueryRootOrgName.toLowerCase())
    );

    return this.showAllOrganisation ? filteredList : filteredList.slice(0, 4);
  }

  private recursivelySetIsCheckedFalse(filters: any[], name: string): any {
    for (const filter of filters) {
      if ((filter?.name).toLowerCase() === name.toLowerCase()) {
        filter.isChecked = false;
        return filter;
      }
      if (filter.filters?.length) {
        const found = this.recursivelySetIsCheckedFalse(
          filter.filters,
          name.toLowerCase()
        );
        if (found) {
          return found;
        }
      }
    }
    return null;
  }
}
