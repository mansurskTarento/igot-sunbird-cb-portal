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
import { debounceTime, distinctUntilChanged, skip } from 'rxjs/operators';
import { SearchServService } from '../../../search/services/search-serv.service';
import { GbSearchService } from '../../services/gb-search.service';
import {
  SearchCategory,
  SearchCommunitiesRequest,
  SearchEventfacet,
  SearchEventFields,
  SearchNLP,
  SearchPeoplesRequest,
  SearchV4Request,
} from '../../models/search-v3.model';
import { WidgetContentLibService } from '@sunbird-cb/consumption';

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

  disableMenu = false;
  recentSearches: string[] = [
    // 'AI Throttling Improves Deliverability',
    // 'AI Throttling Improves Deliverability',
    // 'AI Throttling Improves Deliverability',
  ];

  allSearchResults: any[] = [];
  categories = [
    { label: 'All', value: SearchCategory.All, icon: '' },
    { label: 'Content', value: SearchCategory.Courses, icon: 'video-library' },
    // {
    //   label: 'Programs',
    //   value: SearchCategory.Programs,
    //   icon: 'school-search',
    // },
    { label: 'Events', value: SearchCategory.Events, icon: 'calender-event' },
    { label: 'People', value: SearchCategory.People, icon: 'people-search' },
    {
      label: 'Case Studies',
      value: SearchCategory.CaseStudy,
      icon: 'diversity_3',
    },
    {
      label: 'Communities',
      value: SearchCategory.Communities,
      icon: 'menu_book',
    },
  ];

  selectedSearchCategory: string = SearchCategory.All;
  openSearchTemplate = false;
  loaderSearching = false;
  responseNlpQuery = '';
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
    private eRef: ElementRef,
    private searchV3Service: GbSearchService,
    private contSvc: WidgetContentLibService
  ) {
    this.queryControl = new UntypedFormControl(
      this.activated.snapshot.queryParams.q || ''
    );

    this.queryControl.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged(), skip(1))
      .subscribe(async (value) => {
        if (value.length > 2) {
          await this.searchFromQuery(value);
          this.loaderSearching = false;
        } else {
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
          this.initialize();
        });
    } else {
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
            this.searchFromQuery(q);
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
    } else {
      this.disableMenu = false;
    }
    this.activated.queryParamMap.subscribe((queryParam) => {
      if (queryParam.has('q')) {
        this.queryControl.setValue(queryParam.get('q') || '');
      }
      if (queryParam.has('category')) {
        this.selectedSearchCategory = queryParam.get('category') || '';
      } else {
        this.selectedSearchCategory = '';
      }

      const isAutoCompleteAllowed = this.route.snapshot.data.searchPageData
        ? this.route.snapshot.data.searchPageData.data.search
            .isAutoCompleteAllowed
        : false;
      if (
        typeof isAutoCompleteAllowed === 'undefined' ||
        (typeof isAutoCompleteAllowed === 'boolean' && isAutoCompleteAllowed)
      ) {
      }
    });
  }

  async updateQuery(query: string) {
    await this.searchInNLP(query);

    document.getElementById('global-search-input')?.blur();
    const queryParams = {
      q: query.trim(),
      search: this.responseNlpQuery || null,
      category: this.selectedSearchCategory || null,
      p: null,
      f: null,
      tab: null,
      filtersPanel: 'show',
    };
    const navigationExtras = {
      queryParams,
      queryParamsHandling: 'merge' as 'merge',
    };
    if (this.ref === 'home') {
      this.closed.emit(false);
      this.router.navigate(['/app/globalsearch'], navigationExtras);
    } else {
      this.router.navigate([], { ...navigationExtras, relativeTo: this.activated.parent });
    }
    localStorage.removeItem('activeRoute');
    this.openSearchTemplate = false;
  }

  clearSearchText() {
    setTimeout(() => {
      this.openSearchTemplate = true;
    }, 0);
    this.queryControl.reset();
  }

  async selectSearchCategory(category: string) {
    this.selectedSearchCategory = category;
    this.searchFromQuery(this.queryControl.value);
    this.updateQuery(this.queryControl.value);
  }

  async searchFromQuery(query: string) {
    let courseSearchResult: any;
    const searchRequest = new SearchV4Request([]);
    searchRequest.request.query = query;
    switch (this.selectedSearchCategory) {
      case SearchCategory.Courses:
        searchRequest.request.filters.courseCategory = 'course';
        break;
      case SearchCategory.All:
        searchRequest.request.filters.courseCategory = [];
        searchRequest.request.filters.contentType = ['Course', 'Event'];
        break;

      case SearchCategory.Programs:
        searchRequest.request.filters.courseCategory = 'blended program';
        break;

      case SearchCategory.Events:
        searchRequest.request.filters.contentType = 'Event';
        searchRequest.request.fields = SearchEventFields;
        searchRequest.request.facets = SearchEventfacet;

        delete searchRequest.request.filters?.courseCategory;
        delete searchRequest.request.sort_by?.lastUpdatedOn;
        break;

      case SearchCategory.CaseStudy:
        searchRequest.request.filters.courseCategory = 'case study';
        break;
    }

    courseSearchResult = await this.searchV3Service.searchCoursesv4(
      searchRequest
    ).catch();

    if (this.selectedSearchCategory === SearchCategory.People) {
      const searchRequest = new SearchPeoplesRequest();
      searchRequest.query = query;
      const result = await this.searchV3Service.searchConnections(
        searchRequest
      ).catch(() => (this.allSearchResults = []));

      if (result.result && result.result?.response?.content.length) {
        this.allSearchResults = result.result?.response?.content || [];
      } else {
        this.allSearchResults = [];
      }

      return;
    } else if (this.selectedSearchCategory === SearchCategory.Communities) {
      const searchRequestCommunities = new SearchCommunitiesRequest([]);
      searchRequestCommunities.searchString = query;
      const result = await this.searchV3Service
        .searchCommunity(searchRequestCommunities)
        .catch(() => (this.allSearchResults = []));
      if (
        result.result &&
        Object.keys(result.result).length > 0 &&
        result.result?.search_results?.data &&
        result.result?.search_results?.data.length
      ) {
        this.allSearchResults = result.result?.search_results?.data;
      } else {
        this.allSearchResults = [];
      }

      return;
    }

    const validKeys = Object.keys(courseSearchResult?.result || {}).filter(
      (key) =>
        (key === 'Event' || key === 'content') &&
        Array.isArray(courseSearchResult.result[key]) &&
        courseSearchResult.result[key].length > 0
    );

    this.allSearchResults = validKeys.length
      ? courseSearchResult.result[validKeys[0]]
      : [];
  }

  getResultName(result: any): string {
    if (!result) {
      return '';
    }

    if (this.selectedSearchCategory === SearchCategory.People) {
      return result.personalDetails?.firstname ?? result.firstName ?? '';
    } else if (this.selectedSearchCategory === SearchCategory.Communities) {
      return result.communityName ?? '';
    } else {
      return result.name ?? '';
    }
  }

  redirectToContent(result: any) {
    this.openSearchTemplate = false;
    if (this.selectedSearchCategory === SearchCategory.People) {
      this.goToUserProfile(result);
    } else if (this.selectedSearchCategory === SearchCategory.Communities) {
      // TODO: Route community
    } else {
      this.getRedirectUrlData(result);
    }
  }

  goToUserProfile(user: any) {
    this.router.navigate(
      ['/app/person-profile', user.userId || user.id || user.wid],
      { fragment: 'profileInfo' }
    );
  }

  async getRedirectUrlData(content: any) {
    if (content && content.objectType === 'Event' && content.identifier) {
      this.router.navigate([`app/event-hub/home/${content.identifier}`]);
    } else {
      const urlData = await this.contSvc.getResourseLink(content);
      this.router.navigate([urlData.url], {
        queryParams: urlData.queryParams,
      });
    }
  }

  async searchInNLP(query: string) {
    const searchRequest = new SearchNLP();
    searchRequest.query = query;
    await this.searchV3Service
      .nlpSearch(searchRequest)
      .then(async (response) => {
        if (response?.data && response?.data?.keywords) {
          if (response?.data?.keywords.length > 0) {
            this.responseNlpQuery = response?.data?.keywords[0]?.keyword;
          }
        } else {
          this.responseNlpQuery = '';
        }
      })
      .catch();
  }

  openSearchTemplateF() {
    this.openSearchTemplate = true;
    if (!this.selectedSearchCategory) {
      this.searchFromQuery(this.responseNlpQuery);
    }
  }
}
