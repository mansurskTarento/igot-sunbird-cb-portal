import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
  Input,
} from '@angular/core';
// import { UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
// import { GbSearchService } from '../../services/gb-search.service';
// import { ActivatedRoute, Router } from '@angular/router';
// tslint:disable-next-line
import _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';
import { MultilingualTranslationsService } from '@sunbird-cb/utils-v2';
import {
  CATEGORY_TYPE,
  FILTER_COMPETENCY_AREA,
  FILTER_CONTENT_PROVIDER,
  FILTER_DURATION,
  FILTER_LANGUAGE,
  FILTER_RATING,
} from '../../../../../../../author/src/lib/constants/constant';

@Component({
  selector: 'ws-app-search-filters',
  templateUrl: './search-filters.component.html',
  styleUrls: ['./search-filters.component.scss'],
})
export class SearchFiltersComponent implements OnInit, OnDestroy {
  @Input() newfacets!: any;
  @Input() urlparamFilters!: any;
  @Output() appliedFilter = new EventEmitter<any>();
  @Input() karmayogiBadge: any;

  private subscription: Subscription = new Subscription();
  queryParams: any;

  categoryType = CATEGORY_TYPE;
  ratingFilter = FILTER_RATING;
  languageFilter = FILTER_LANGUAGE;
  contentProviderFilter = FILTER_CONTENT_PROVIDER;
  duartionFilter = FILTER_DURATION;
  competencyAreaFilter = FILTER_COMPETENCY_AREA;
  showAll = false;

  constructor(
    // private searchSrvc: GbSearchService,
    // private activated: ActivatedRoute,
    private translate: TranslateService,
    private langtranslations: MultilingualTranslationsService // private router: Router
  ) {
    if (localStorage.getItem('websiteLanguage')) {
      this.translate.setDefaultLang('en');
      const lang = localStorage.getItem('websiteLanguage')!;
      this.translate.use(lang);
    }
  }

  ngOnInit() {}

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  toggleShowMore() {
    this.showAll = !this.showAll;
  }

  translateActualLabels(label: string, type: any) {
    return this.langtranslations.translateActualLabel(label, type, '');
  }
}
