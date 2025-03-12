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
// import { UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
// import { GbSearchService } from '../../services/gb-search.service';
// import { ActivatedRoute, Router } from '@angular/router';
// tslint:disable-next-line
import _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';
import {
  ConfigurationsService,
  MultilingualTranslationsService,
} from '@sunbird-cb/utils-v2';
import { CATEGORY_TYPE } from '../../../../../../../author/src/lib/constants/constant';
import { Facet, FormattedFacets } from '../../models/search-v3.model';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { NsContent } from '@sunbird-cb/collection/src/public-api';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'ws-app-search-filters',
  templateUrl: './search-filters.component.html',
  styleUrls: ['./search-filters.component.scss'],
})
export class SearchFiltersComponent implements OnInit, OnDestroy, OnChanges {
  @Input() newfacets!: any;
  @Input() urlparamFilters!: any;
  @Output() appliedFilter = new EventEmitter<{ [key: string]: any }>();
  @Input() karmayogiBadge: any;

  private subscription: Subscription = new Subscription();
  queryParams: any;

  categoryType = CATEGORY_TYPE;
  showAll = false;

  formattedFacets: any = {};
  selectedFilters: any = {};
  compentencyKey!: NsContent.ICompentencyKeys;
  competencyAreaNameKey!: string;
  constructor(
    // private searchSrvc: GbSearchService,
    // private activated: ActivatedRoute,
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
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['newfacets'].currentValue) {
      this.formattedFacets = this.formatFacets(
        changes['newfacets'].currentValue
      );
      if (this.formattedFacets && this.formattedFacets['sourceName']) {
        this.formattedFacets['organisation'] = [
          ...this.formattedFacets['sourceName'],
        ];
      }
    } else {
      this.formattedFacets = {};
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  toggleShowMore() {
    this.showAll = !this.showAll;
  }

  translateActualLabels(label: string, type: any) {
    return this.langtranslations.translateActualLabel(label, type, '');
  }

  formatFacets(data: Facet[][]): FormattedFacets {
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

    const formattedFacets: FormattedFacets = {};
    Object.entries(mergedData).forEach(([key, values]) => {
      if (key === 'duration') {
        const formattedDurations: { name: string; count: number }[] = [
          { range: [0, 1800], label: '0 - 30 mins' },
          { range: [1801, 3600], label: '30 - 60 mins' },
          { range: [3601, 5400], label: '60 - 90 mins' },
          { range: [5401, Infinity], label: '90 mins' },
        ].map(({ range, label }) => {
          const count = Object.entries(values)
            .filter(([key]) => {
              const duration = parseInt(key, 10);
              return duration >= range[0] && duration <= range[1];
            })
            .reduce((sum, [, count]) => sum + count, 0);
          return { name: label, count, ischecked: false };
        });
        formattedFacets[key] = formattedDurations;
      } else if (key === 'avgRating') {
        const ratingRanges = [4.5, 4.0, 3.5, 3.0];
        const formattedRatings = ratingRanges.map((rating) => {
          const count = Object.entries(values)
            .filter(([rate]) => parseFloat(rate) >= rating)
            .reduce((sum, [, count]) => sum + count, 0);
          return {
            name: `${rating.toFixed(1)}`,
            count,
            ischecked: false,
          };
        });
        formattedFacets[key] = formattedRatings;
      } else {
        formattedFacets[key] = Object.entries(values).map(([name, count]) => ({
          name,
          count,
          ischecked: false,
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
    type: string,
    categoryType: string
  ) {
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
  }
}
