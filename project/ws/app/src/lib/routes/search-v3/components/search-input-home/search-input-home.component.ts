import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChange,
  ViewEncapsulation,
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfigurationsService } from '@sunbird-cb/utils-v2';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ISearchAutoComplete } from '../../../search/models/search.model';
import { SearchServService } from '../../../search/services/search-serv.service';

@Component({
  selector: 'ws-app-search-v3-input-home',
  templateUrl: './search-input-home.component.html',
  styleUrls: ['./search-input-home.component.scss'],
  // tslint:disable-next-line
  encapsulation: ViewEncapsulation.None,
})
export class SearchInputHomeComponent implements OnInit, OnChanges {
  @Input() placeHolder = '';
  @Input() ref = '';
  @Output() closed: EventEmitter<boolean> = new EventEmitter();
  queryControl: UntypedFormControl;
  languageSearch: string[] = [];
  SAKSHAMAI_ICON_LOADER = '/assets/images/sakshamAI/saksham_ai_loader.gif';

  // filteredOptions$: Observable<string[]> = this.queryControl.valueChanges.pipe(
  //   startWith(this.queryControl.value),
  //   debounceTime(500),
  //   distinctUntilChanged(),
  //   switchMap(() => [])
  // );

  autoCompleteResults: ISearchAutoComplete[] = [];
  searchLocale = this.getActiveLocale();
  lang = '';
  disableMenu = false;
  activeFilters: any[] = [];
  recentSearches: string[] = [
    'AI Throttling Improves Deliverability',
    'AI Throttling Improves Deliverability',
    'AI Throttling Improves Deliverability',
  ];
  allSearchResults: string[] = [
    'AI Throttling Improves Deliverability',
    'AI Throttling Improves Deliverability',
    'AI Throttling Improves Deliverability',
  ];

  categories = [
    { label: 'All', value: '', icon: '' },
    { label: 'Courses', value: 'courses', icon: 'video-library' },
    { label: 'Programs', value: 'programs', icon: 'school-search' },
    { label: 'Events', value: 'events', icon: 'calender-event' },
    { label: 'People', value: 'people', icon: 'people-search' },
    { label: 'Case Studies', value: 'case-studies', icon: 'menu_book' },
    { label: 'Communities', value: 'communities', icon: 'diversity_3' },
  ];
  selectedSearchCategory = '';
  openSearchTemplate = false;
  loaderSearching = false;
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.openSearchTemplate = false;
    }
  }
  constructor(
    private activated: ActivatedRoute,
    private router: Router,
    private searchServSvc: SearchServService,
    private configSvc: ConfigurationsService,
    private route: ActivatedRoute,
    private eRef: ElementRef
  ) {
    this.queryControl = new UntypedFormControl(
      this.activated.snapshot.queryParams.q || ''
    );

    this.queryControl.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged())
      .subscribe((value) => {
        if (value) {
          console.log(value);
          this.loaderSearching = false;
        }
      });
  }

  ngOnInit() {
    if (!this.activated.snapshot.data.searchPageData) {
      this.searchServSvc
        .getSearchConfig()
        .then((data) => {
          this.activated.snapshot.data = {
            searchPageData: { data },
          };
        })
        .then(() => {
          // this.autoFilter();
          this.initialize();
        });
    } else {
      // this.autoFilter();
      this.initialize();
    }
  }
  ngOnChanges() {
    for (const change in SimpleChange) {
      if (change === 'placeHolder') {
        this.placeHolder = this.placeHolder;
      }
    }
  }

  autoFilter() {
    if (this.route.snapshot.data.searchPageData) {
      const isAutoCompleteAllowed =
        this.route.snapshot.data.searchPageData.data.search
          .isAutoCompleteAllowed;
      if (typeof isAutoCompleteAllowed === 'boolean' && isAutoCompleteAllowed) {
        this.queryControl.valueChanges
          .pipe(debounceTime(200), distinctUntilChanged())
          .subscribe((q) => {
            this.getSearchAutoCompleteResults(q);
          });
      }
    }
  }

  initialize() {
    let isNotMyUser = false;
    let isIgotOrg = false;
    if (
      this.configSvc &&
      this.configSvc.unMappedUser &&
      this.configSvc.unMappedUser.profileDetails &&
      this.configSvc.unMappedUser.profileDetails.profileStatus
    ) {
      isNotMyUser =
        this.configSvc.unMappedUser.profileDetails.profileStatus.toLowerCase() ===
        'not-my-user'
          ? true
          : false;
    }
    if (
      this.configSvc &&
      this.configSvc.unMappedUser &&
      this.configSvc.unMappedUser.profileDetails &&
      this.configSvc.unMappedUser.profileDetails.employmentDetails &&
      this.configSvc.unMappedUser.profileDetails.employmentDetails
        .departmentName
    ) {
      isIgotOrg =
        this.configSvc.unMappedUser.profileDetails.employmentDetails.departmentName.toLowerCase() ===
        'igot'
          ? true
          : false;
    }
    // let isIgotOrg = true
    if (isNotMyUser && isIgotOrg) {
      this.disableMenu = true;
      // this.router.navigateByUrl('app/person-profile/me#profileInfo')
    } else {
      this.disableMenu = false;
    }
    // document.getElementById('global-search-input')?.focus();

    this.activated.queryParamMap.subscribe((queryParam) => {
      if (queryParam.has('q')) {
        this.queryControl.setValue(queryParam.get('q') || '');
      }

      if (queryParam.has('lang')) {
        this.searchLocale = queryParam.get('lang') || this.getActiveLocale();
      } else {
        this.searchLocale = this.getActiveLocale();
      }

      const isAutoCompleteAllowed = this.route.snapshot.data.searchPageData
        ? this.route.snapshot.data.searchPageData.data.search
            .isAutoCompleteAllowed
        : false;
      if (
        typeof isAutoCompleteAllowed === 'undefined' ||
        (typeof isAutoCompleteAllowed === 'boolean' && isAutoCompleteAllowed)
      ) {
        // this.getSearchAutoCompleteResults(this.queryControl.value)
      }
    });

    this.languageSearch =
      this.route.snapshot.data.searchPageData &&
      this.route.snapshot.data.searchPageData.data.search.languageSearch.map(
        (u: string) => u.toLowerCase()
      );
    this.languageSearch = this.languageSearch.sort();
    this.swapRemove(this.languageSearch, this.languageSearch.indexOf('all'), 0);
    if (
      this.preferredLanguages &&
      this.preferredLanguages.split(',').length > 1
    ) {
      this.languageSearch.splice(1, 0, this.preferredLanguages);
    }
  }

  swapRemove(langArray: string[], from: number, to: number) {
    langArray.splice(to, 0, langArray[from]);
    langArray.splice(from + 1, 1);
  }

  getActiveLocale(): string {
    const locale =
      (this.configSvc.activeLocale && this.configSvc.activeLocale.locals[0]) ||
      'en';
    return this.searchServSvc.getLanguageSearchIndex(locale);
  }

  get preferredLanguages(): string | null {
    if (
      this.configSvc.userPreference &&
      this.configSvc.userPreference.selectedLangGroup
    ) {
      let prefLang: string[] | string =
        this.configSvc.userPreference.selectedLangGroup
          .split(',')
          .map((lang) => {
            return this.searchServSvc.getLanguageSearchIndex(lang || 'en');
          });
      prefLang = prefLang.join(',');
      return prefLang;
    }
    return null;
  }

  updateQuery(query: string) {
    document.getElementById('global-search-input')?.blur();
    if (this.ref === 'home') {
      this.closed.emit(false);
      this.router.navigate(['/app/globalsearch'], {
        queryParams: { q: query.trim() },
        queryParamsHandling: 'merge',
      });
    } else {
      this.router.navigate([], {
        relativeTo: this.activated.parent,
        queryParams: { q: query.trim() },
        queryParamsHandling: 'merge',
      });
    }
    localStorage.removeItem('activeRoute');
  }

  clearSearchText() {
    this.queryControl.reset();
  }

  getSearchAutoCompleteResults(q: string) {
    if (this.searchLocale.split(',').length === 1) {
      this.searchServSvc
        .searchAutoComplete({ q, l: this.searchLocale }).then((result: ISearchAutoComplete[]) => {
          this.autoCompleteResults = result;
          this.openSearchTemplate = false;
        })
        .catch(() => {});
    }
  }

  searchLanguage(lang: string) {
    this.router.navigate([], {
      relativeTo: this.activated.parent,
      queryParams: { lang, q: this.queryControl.value },
      queryParamsHandling: 'merge',
    });
  }

  selectSearchCategory(category: string) {
    this.selectedSearchCategory = category;
  }

  addFilter(key: string, value: any, display: string) {
    const existingIndex = this.activeFilters.findIndex((f) => f.key === key);

    if (existingIndex > -1) {
      this.activeFilters[existingIndex] = { key, value, display };
    } else {
      this.activeFilters.push({ key, value, display });
    }
  }

  removeFilter(filter: any) {
    this.activeFilters = this.activeFilters.filter((f) => f.key !== filter.key);
  }

  clearSearch() {
    this.activeFilters = [];
    this.selectedSearchCategory = 'All';
  }
}
