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
import { MatRadioChange } from '@angular/material/radio';
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
  @Output() applyFilterFromLearn = new EventEmitter<{ [key: string]: any }>();
  @Input() karmayogiBadge: any;
  @Input() competencyFactet: any;
  @Input() typesOfEvents: any;

  private subscription: Subscription = new Subscription();
  queryParams: any;

  categoryType = CATEGORY_TYPE;
  categoryTypeDup = CATEGORY_TYPE;
  categoryTypeEnum = SearchCategory;
  showAllLanguage = false;
  showAllContents = false;

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
  filterQueryContents = '';
  filterQueryLanguage = '';
  filterQueryDesignation = '';
  filterQueryRootOrgName = '';
  filterQueryThemes = '';
  // filterQuerySubThemes = '';
  filterCompetency = '';
  searchCategory = '';
  sectorFilters:any
  isExploreContentTab = false
  isAllContentSelected = true
  searchQuery = ''
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
          name: 'case-study',
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
        this.sectorFilters = sectorFilters
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
      this.setCategoryType();
    }   
    
    if (changes['typesOfEvents'] && changes['typesOfEvents'].currentValue) {
      this.formattedFacets['typeOfEvents'] = this.typesOfEvents;
    } 

    this.selectedFilterChips = this.refactorFilterData(this.selectedFilters);

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
    if(params['q']) {
      this.searchQuery = params['q'];
    }
    if((this.searchCategory && params['category'] && this.searchCategory !== params['category']) ||
    !params['category']) {
      this.selectedFilters = {}
    } 

    this.isExploreContentTab = !!params['tab'];
    //let contentType = ''
   // this.selectedFilters = {}
   // console.log('categoryType', this.categoryType)
  //  if(params && params.f) {
  //   let formattedParams = JSON.parse(params.f)
  //   if(Object.keys(formattedParams) && Object.keys(formattedParams).length && formattedParams['primaryCategory']) {
  //     contentType = formattedParams['primaryCategory']
      
  //   }
  // }
    // if(contentType.length) {
    //   this.setCourseCategoryType(contentType)
    //   this.applyFilterFromLearn.emit(this.selectedFilters);
    //   this.selectedFilterChips = this.refactorFilterData(this.selectedFilters);
    //  // console.log('this.selectedFilters',this.selectedFilters, this.categoryTypeDup[parentIndex].name)
    //  // this.searchCategory = contentType;
    // } else {
      this.searchCategory = params['category'];
      if (this.searchCategory) {
        this.categoryType = this.categoryTypeDup.filter(
          (type) => type.name === this.searchCategory
        );
        if(this.searchCategory === 'case-study' && !this.categoryType.length) {
          this.categoryType = [
            {
              name: 'case-study',
              count: 0,
              isChecked: false,
              displayName: 'Case study',
              filters: [],
              disabled: false,
            }
          ]
        }
        if (this.categoryType.length && !this.isExploreContentTab) {
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
          this.formattedFacets['typeOfEvents'] = this.typesOfEvents;

        }
      } else {
        this.categoryType = this.categoryTypeDup.map((cat) => ({
          ...cat,
          isChecked: cat.name === SearchCategory.All ? true : false,
        }));
      }
    // }
    
    
  }

  setCourseCategoryType(contentType:string) {   
      this.categoryTypeDup.map((item, parentIndex)=>{
        if(item.name === contentType) {
          item.isChecked = true
        } else if(item.filters) {
            this.checkForFilter(item, item.filters, contentType, parentIndex, parentIndex)
        }
      })
  }

  checkForFilter(parentData:any, filtersData:any, contentType:string, parentIndex:any, childIndex:any) {
    // this.selectedFilters['Course'] = []
    if(filtersData && filtersData.length) {
      filtersData.map((item:any, index:any)=>{
        if(item.filters && item.filters.length) {
          this.checkForFilter(parentData, item.filters, contentType, parentIndex, index)
        } else {
          if(contentType.indexOf(item.name) > -1) {
            item.isChecked = true
            parentData.filters[childIndex].isChecked = true
            this.categoryTypeDup[parentIndex].isChecked = true
            this.categoryType[0].isChecked = false
            if(Object.keys(this.selectedFilters).length === 0) {
              this.selectedFilters['Course'] = []
              this.selectedFilters['Course'] = contentType
            } else {
              this.selectedFilters['Course'].concat(contentType);
            }            
          } else {
            item.isChecked = false
          }
        }
      })
      // this.appliedFilter.emit(this.selectedFilters);
      // this.selectedFilterChips = this.refactorFilterData(this.selectedFilters);
      // console.log('this.selectedFilters',this.selectedFilters, this.categoryTypeDup[parentIndex].name)
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
    } else if (togglesection === FacetType.SourceName) {
      this.showAllOrganisation = !this.showAllOrganisation;
    } else if (togglesection === FacetType.Designation) {
      this.showAllDesignation = !this.showAllDesignation;
    } else if (togglesection === FacetType.courseCategory) {
      this.showAllContents = !this.showAllContents;
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

    Object.keys(this.selectedFilters).forEach((key) => {
      if (Array.isArray(this.selectedFilters[key]) && this.selectedFilters[key].length === 0) {
        delete this.selectedFilters[key];
      }
    });

    this.appliedFilter.emit(this.selectedFilters);
    this.selectedFilterChips = this.refactorFilterData(this.selectedFilters);

    const types = this.categoryTypeDup.map((category) => category.name);
    if (types.includes(type) && !option.isChecked) {
      this.constructQueryParam.emit('');
    }

    if (categoryType === 'contentType' && this.isAllContentSelected) {
      this.isAllContentSelected = false
    }
  }

  onTypesOfEventsChange(_event: MatRadioChange, option: any, radioType:string) {
    const type = option?.name;
    this.selectedFilters[radioType] = [type];
  
    const eventOptions = this.formattedFacets[radioType];
    if (eventOptions) {
      eventOptions.forEach((opt: any) => {
        opt.isChecked = opt.name === type;
      });
    }
  
    this.appliedFilter.emit(this.selectedFilters);
    this.selectedFilterChips = this.refactorFilterData(this.selectedFilters);
  
  }

  onCompetencyAreaSelectionFilter(event: MatCheckboxChange,
    competency: any, ) {
      const competencyDetails = competency[this.competencyAreaNameKey]
      if (competencyDetails) {
      const competencyName = competencyDetails.name
      competencyDetails['isChecked'] = event.checked
      if (!this.selectedFilters[this.competencyAreaNameKey]) {
        this.selectedFilters[this.competencyAreaNameKey] = [];
      }
      if (event.checked) {
        if (!this.selectedFilters[this.competencyAreaNameKey].includes(competencyName)) {
          this.selectedFilters[this.competencyAreaNameKey].push(competencyName);
        }
      } else {
        this.selectedFilters[this.competencyAreaNameKey] = this.selectedFilters[
          this.competencyAreaNameKey
        ].filter((item: any) => item !== competencyName);
        const competencyThemes = competency[this.competencyThemeKey]
        if(competencyThemes) {
          competencyThemes.forEach((theme: any) => {
            if(theme.isChecked) {
             theme.isChecked = false
              this.selectedFilters[this.competencyThemeKey] = this.selectedFilters[
                this.competencyThemeKey
              ].filter((item: any) => item !== theme.name);
            } 
          })
        }
        
      }
      this.appliedFilter.emit(this.selectedFilters);
      this.selectedFilterChips = this.refactorFilterData(this.selectedFilters);
      const types = this.categoryTypeDup.map((category) => category.name);
      if (types.includes(competencyName) && !competencyDetails.isChecked) {
        this.constructQueryParam.emit('');
      }
    } else {
      if(Object.keys(competency).length && competency.name) {
        this.selectedFilters[this.competencyAreaNameKey] = this.selectedFilters[this.competencyAreaNameKey].filter((value:any) =>  value !== competency.name)
        this.selectedFilters[this.competencyThemeKey] = []
        
        // const competencyThemes = competency[this.competencyThemeKey]
        // if(competencyThemes) {
        //   competencyThemes.forEach((theme: any) => {
        //     if(theme.isChecked) {
        //      theme.isChecked = false
        //       this.selectedFilters[this.competencyThemeKey] = this.selectedFilters[
        //         this.competencyThemeKey
        //       ].filter((item: any) => item !== theme.name);
        //     } 
        //   })
        // }
        
      }
      this.appliedFilter.emit(this.selectedFilters);
      this.selectedFilterChips = this.refactorFilterData(this.selectedFilters);
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
    if(this.searchCategory === 'case-study') {
      types.push('case-study')
    }
    if (types.includes(item.type)) {
      facets = this.categoryType;

      const category = _.find(facets, { name: item.type });

      if (category) {
        // this.categoryType[0].isChecked = false;
        // if (_.has(this.selectedFilters, item.type)) {
        //   _.pull(this.selectedFilters[item.type], this.categoryType[0]?.name);
        //   if (_.isEmpty(this.selectedFilters[item.type])) {
        //     delete this.selectedFilters[item.type];
        //   }
        // }
        // this.appliedFilter.emit(this.selectedFilters);
        // this.selectedFilterChips = this.refactorFilterData(
        //   this.selectedFilters
        // );
        // this.constructQueryParam.emit('');
        this.clearAllFilters();
        return;
      }

      const foundFilter = _.find(category!.filters, { name: item.value });
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

    if (!this.isExploreContentTab) {
      _.forEach(this.categoryType, (category) => {
        category.isChecked = false;
        _.forEach(category.filters, (filter) => {
          filter.isChecked = false;
        });
      });
    } else {
      this.isAllContentSelected = true
    }

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

    if (!this.isExploreContentTab) {
      this.constructQueryParam.emit('');
    }
  }

  get filteredOrganisations() {
    let data: any;
    if (this.searchCategory === SearchCategory.Events) {
      data = this.formattedFacets[FacetType.SourceName];
    } else {
      data = this.formattedFacets[FacetType.Organization];
    }
    let filteredList = data?.filter((item: any) =>
      item.name
        .toLowerCase()
        .includes(this.filterQueryOrganisation.toLowerCase())
    );

    return this.showAllOrganisation ? filteredList : filteredList.slice(0, 4);
  }

  get filteredContents() {
    let filteredList = this.formattedFacets[FacetType.courseCategory].filter(
      (item: any) =>
        item.name.toLowerCase().includes(this.filterQueryContents.toLowerCase())
    );

    return this.showAllContents ? filteredList : filteredList.slice(0, 4);
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
    competency['filteredLength'] = filteredThemes.length
    return competency.showAll ? filteredThemes : filteredThemes.slice(0, 4)
  }

  togoleThemes(competency: any) {
    if(competency.showAll) {
      competency['showAll'] = false
    } else {
      competency['showAll'] = true
    }
  }

  // getFilteredSubThemes(competency: any): any[] {
  //   let filteredSubThemes: any[] = []
  //   if(competency && competency[this.competencySubThemeKey]) {
  //     filteredSubThemes = competency[this.competencySubThemeKey].filter((subTheme: any) => 
  //     subTheme.name.toLowerCase().includes(this.filterQuerySubThemes.toLowerCase()))
  //   }
  //   return filteredSubThemes
  // }

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

  allContentSelection() {
    this.isAllContentSelected = true;
    this.selectedFilters['contentType'] = []
    
    this.filteredContents.map((item: any) => {
      item.isChecked = false;
    })

    this.appliedFilter.emit(this.selectedFilters);
    this.selectedFilterChips = this.refactorFilterData(this.selectedFilters);
  }

  getSelectedFilter(item:any) {
    if(Object.keys(this.selectedFilters).length) {
      return this.filterValueExists(this.selectedFilters, item.name)
    }    
  }

  filterValueExists(obj:any, target:any):any {
    if (Array.isArray(obj)) {
      return obj.some(item => this.filterValueExists(item, target));
    } else if (obj !== null && typeof obj === 'object') {
      return Object.values(obj).some(value => this.filterValueExists(value, target));
    } else {
      return obj === target;
    }
  }
  
}
