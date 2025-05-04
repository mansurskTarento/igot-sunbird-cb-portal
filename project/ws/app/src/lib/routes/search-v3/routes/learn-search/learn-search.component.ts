import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
} from '@angular/core';
import { GbSearchService } from '../../services/gb-search.service';
import {
  ConfigurationsService,
  EventService,
  MultilingualTranslationsService,
  ValueService,
} from '@sunbird-cb/utils-v2';
import { ActivatedRoute, Router } from '@angular/router';
// tslint:disable-next-line
import _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';

import {
  FacetType,
  PageChangeEmitter,
  SearchCategory,
  SearchCommunitiesRequest,
  SearchConstantLocalStorage,
  SearchEventfacet,
  SearchEventFields,
  SearchPeoplesRequest,
  SearchV4Request,
  SortType,
} from '../../models/search-v3.model';
import { forkJoin, Subject } from 'rxjs';
import {
  NsContent,
  WidgetUserService,
} from '@sunbird-cb/collection/src/public-api';
import { environment } from '../../../../../../../../../src/environments/environment';
import { NetworkV2Service } from '../../../network-v2/services/network-v2.service';
import moment from 'moment';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'ws-app-learn-search',
  templateUrl: './learn-search.component.html',
  styleUrls: ['./learn-search.component.scss'],
})
export class LearnSearchComponent implements OnInit, OnChanges, OnDestroy {
  @Input() searchQuery!: { query: string; nlp: string; searchCategory: string };
  @Input() userValue = '';
  @Input() paramFilters: any = [];
  @Input() filtersPanel!: string;
  @Output() queryParamChange = new EventEmitter<any>();

  // searchResults: any = [];
  defaultThumbnail = '';
  sideNavBarOpened = true;
  private defaultSideNavBarOpenedSubscription: any;
  private destroy$ = new Subject<void>();
  
  public screenSizeIsLtMedium = false;
  isLtMedium$ = this.valueSvc.isLtMedium$;
  statedata:
    | {
        param: any;
        path: any;
      }
    | undefined;
  // resultFacets: any = [];
  // facetsData: any = [];
  veifiedKarmayogi = false;
  noResultMessage = '';
  recommendedUsers: any;
  seeAllResult: string = '';
  allResultsDepartmentName = new Set<string>();

  courseSearchTotalCount = 0;
  eventSearchTotalCount = 0;
  peopleSearchTotalCount = 0;
  communitiesSearchTotalCount = 0;

  courseSearchResults: any[] = [];
  eventsSearchResults: any[] = [];
  peoplesSearchResults: any[] = [];
  communitiesSearchResults: any[] = [];

  searchRequestCourse = new SearchV4Request([]);
  searchRequestEvents = new SearchV4Request([]);
  searchRequestPeoples = new SearchPeoplesRequest();
  searchRequestCommunities = new SearchCommunitiesRequest([]);
  searchContentLoader = true;

  initialPaginationSize = 10;
  initialPaginationSizeOptions = [10, 20, 50, 100];
  initialPaginationPage = 1;
  commonPageResultSize = 3;

  coursesFacets = [];
  eventsFacets = [];
  communitiesFacets = [];
  peoplesFacets = [];

  combinedFacets: any[] = [];
  compentencyKey!: NsContent.ICompentencyKeys;
  enrollmentDetails: any = [];
  cbpPlanList: any = [];

  competencyAreaNameKey!: string;
  competencyThemeKey!: string;
  competencySubThemeKey!: string;

  currentUserDept = '';
  connectionRequestsSent!: any;
  queryParams: any;
  typesOfEventsFilters: any;
  competencyFactet: any = [];
  searchSortFilter: string = '';
  searchPeopleLoader = false;
  filtersChipFromLearn: string[] = [];
  isExploreContentTab = false;
  applySelectedFilters:any = []
  compentencyKeyExist = false
  constructor(
    private searchV3Service: GbSearchService,
    private configSvc: ConfigurationsService,
    private events: EventService,
    private activated: ActivatedRoute,
    private valueSvc: ValueService,
    private translate: TranslateService,
    private router: Router,
    private langtranslations: MultilingualTranslationsService,
    private userService: WidgetUserService,
    private networkV2Service: NetworkV2Service
  ) {
    if (localStorage.getItem('websiteLanguage')) {
      this.translate.setDefaultLang('en');
      const lang = localStorage.getItem('websiteLanguage')!;
      this.translate.use(lang);
    }

    this.compentencyKey =
      this.configSvc.compentency[environment.compentencyVersionKey];
    this.competencyAreaNameKey = `${this.compentencyKey.vKey}.${this.compentencyKey.vCompetencyArea}`;
    this.competencyThemeKey = `${this.compentencyKey.vKey}.${this.compentencyKey.vCompetencyTheme}`;
    this.competencySubThemeKey = `${this.compentencyKey.vKey}.${this.compentencyKey.vCompetencySubTheme}`;
  }

  ngOnInit() {
    if (
      this.configSvc.userProfile &&
      this.configSvc.userProfile.departmentName
    ) {
      this.currentUserDept = this.configSvc.userProfile.departmentName;
    }
    this.statedata = {
      param: this.searchQuery?.nlp
        ? this.searchQuery?.nlp
        : this.searchQuery.query,
      path: 'Search',
    };
    const instanceConfig = this.configSvc.instanceConfig;
    this.defaultSideNavBarOpenedSubscription = this.isLtMedium$.subscribe(
      (isLtMedium) => {
        this.sideNavBarOpened = !isLtMedium;
        this.screenSizeIsLtMedium = isLtMedium;
      }
    );

    if (instanceConfig) {
      this.defaultThumbnail = instanceConfig.logos.defaultContent || '';
    }

    this.updateNoResultMessage(this.statedata.param);

    this.checkCourseEnrollmentAndCbpPlan();
    // this.fetchCbpPlan()
    this.checkIfExploreContentTab()
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (
      this.configSvc.unMappedUser &&
      this.configSvc.unMappedUser.profileDetails
    ) {
      this.veifiedKarmayogi =
        this.configSvc.unMappedUser.profileDetails.profileStatus &&
        this.configSvc.unMappedUser.profileDetails.profileStatus === 'VERIFIED'
          ? true
          : false;
    }
    if(changes['paramFilters'] && changes['paramFilters'].currentValue && changes['paramFilters'].currentValue.length) {
      this.searchContentLoader = true;

      this.searchRequestCourse.request.filters.courseCategory = changes['paramFilters'].currentValue[0].subType
      
      this.seeAllResult = SearchCategory.Courses;
      this.eventSearchTotalCount = 0;
      this.peopleSearchTotalCount = 0;
      this.communitiesSearchTotalCount = 0;
      this.searchRequestCourse.request.limit = this.initialPaginationSize;
      await this.searchCourses();
      this.sideNavBarOpened = false
      this.searchContentLoader = false;
      this.filtersChipFromLearn = changes['paramFilters'].currentValue[0].subType
      return
    }

    if (
      (changes.searchQuery &&
        changes.searchQuery.currentValue?.query !==
          changes.searchQuery.previousValue?.query) ||
      changes.searchQuery.currentValue?.searchCategory !==
        changes.searchQuery.previousValue?.searchCategory
      ) {
      this.searchContentLoader = true;
      this.searchPeopleLoader = true;
      this.resetAllSearchParams();
      this.statedata = {
        param: this.searchQuery?.nlp
          ? this.searchQuery?.nlp
          : this.searchQuery.query,
        path: 'Search',
      };
      if (changes.searchQuery.currentValue?.searchCategory) {
        const category = changes.searchQuery.currentValue?.searchCategory || '';
        this.seeAllResults(category);
      } else {
        await this.searchCourses();
        await this.searchEvents();
        
        await this.searchPeople();
        await this.searchcommunities();

        this.searchPeopleLoader = false
        this.searchContentLoader = false;
      }

      this.updateNoResultMessage(this.statedata.param);

      if (changes.filtersPanel && changes.filtersPanel.currentValue === 'show') {
        this.sideNavBarOpened = true
        this.filtersChipFromLearn = []

      }
    }

    
  }

  getName(userDetails: any) {
    return userDetails.firstName
      ? userDetails.firstName
      : userDetails.firstname;
  }

  applyTelemetry(event: any, index: number) {
    this.raiseTelemetry(event, index);
  }

  raiseTelemetry(content: any, i: number) {
    if (content) {
      this.events.raiseInteractTelemetry(
        {
          type: 'click',
          subType: `card-learnSearch`,
          id: `search-card-${i + 1}`,
          pageid: `/app/globalsearch`,
        },
        {
          id: content.identifier || '',
          type: content.contentType,
          rollup: {},
          ver: content.version ? `${content.version}${''}` : '',
        },
        {}
      );
    }
  }

  ngOnDestroy() {
    if (this.defaultSideNavBarOpenedSubscription) {
      if (this.defaultSideNavBarOpenedSubscription) {
        this.defaultSideNavBarOpenedSubscription.unsubscribe();
      }
    }

    this.destroy$.next();
    this.destroy$.complete();

    localStorage.removeItem(SearchConstantLocalStorage.SortType);
  }

  translateLabels(label: string, type: any) {
    return this.langtranslations.translateLabel(label, type, '');
  }

  updateNoResultMessage(searchTerm: string) {
    this.translate
      .get('learnsearch.noResultFound', { searchTerm })
      .subscribe((translatedText: string) => {
        this.noResultMessage = translatedText;
      });
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  connectionUpdatePeopleCard(event: any) {
    if (event === 'connection-updated') {
      this.getAllConnectionRequests();
    }
  }

  async searchCourses() {
  
    this.searchRequestCourse.request.query = this.statedata?.param;
    const result = await this.searchV3Service.searchCoursesv4(
      this.searchRequestCourse
    );

    if (result.result && result.result.content) {
      this.courseSearchResults = result.result.content;
      this.courseSearchTotalCount = result.result?.count;
      this.coursesFacets = result.result?.facets || [];
      // console.log('resuult', result)
      // console.log('this.courseFacets', this.coursesFacets)
      // console.log('this.combinedFacets', this.combinedFacets)
     // this.combinedFacets  = JSON.parse(JSON.stringify((result.result?.facets || [])))
     this.combinedFacets = []
      this.combinedFacets = 
      [...this.combinedFacets, (result.result?.facets || [])]
      // this.courseSearchResults.forEach((course: any) => {
      //   course?.organisation?.forEach((element: any) => {
      //     this.allResultsDepartmentName.add(element);
      //   });
      // });
    } else {
      this.courseSearchResults = [];
      this.courseSearchTotalCount = 0;
      this.coursesFacets = result.result?.facets || [];
    }
  }

  async searchEvents() {
    // this.searchRequestEvents.request.sort_by.startDate = 'desc';
    this.searchRequestEvents.request.filters.contentType = 'Event';
    this.searchRequestEvents.request.fields = SearchEventFields;
    this.searchRequestEvents.request.facets = [
      ...SearchEventfacet,
      this.competencyAreaNameKey,
      this.competencyThemeKey,
      this.competencySubThemeKey,
    ];

    delete this.searchRequestEvents.request.filters?.courseCategory;
    delete this.searchRequestEvents.request.sort_by?.lastUpdatedOn;

    this.searchRequestEvents.request.query = this.statedata?.param || '';
    // this.searchRequestEvents['request']['offset'] = 0
    const result = await this.searchV3Service.searchCoursesv4(
      this.searchRequestEvents
    );
    if (result.result && result.result?.Event) {
      // if (this.typesOfEventsFilters.length) {
      //   // this.eventsSearchResults = this.processEventsResult(
      //   //   result.result?.Event
      //   // );
      //   this.eventsSearchResults = result.result?.Event
      //   this.eventSearchTotalCount = this.eventsSearchResults.length;
      // } else {
        this.eventsSearchResults = result.result?.Event || [];
        this.eventSearchTotalCount = result.result?.count;
      // }
      this.eventsFacets = result.result?.facets;
      // this.eventsSearchResults.forEach((event: any) => {
      //   this.allResultsDepartmentName.add(event?.sourceName);
      // });
    } else {
      this.eventsSearchResults = [];
      this.eventSearchTotalCount = 0;
    }
  }

  async searchPeople() {
    this.searchRequestPeoples.query = this.statedata?.param || '';
    const result = await this.searchV3Service.searchConnections(
      this.searchRequestPeoples
    );

    if (result && result.result && result.result?.response?.content) {
      this.peoplesSearchResults = result.result?.response?.content || [];
      this.peopleSearchTotalCount = result.result?.response?.count;
      this.peoplesFacets = result.result?.response.facets || []
      this.getAllConnectionRequests();
    } else {
      this.peoplesSearchResults = [];
      this.peopleSearchTotalCount = 0;
      this.peoplesFacets = []
    }
  }

  async searchcommunities() {
    // this.searchRequestCommunities.pageSize = this.initialPaginationSize;
    this.searchRequestCommunities.searchString = this.statedata?.param || '';
    const result = await this.searchV3Service
      .searchCommunity(this.searchRequestCommunities)
      .catch(() => {
        return {
          result: { search_results: { data: [], totalCount: 0, facets: {} } },
        };
      });

    if (
      result.result &&
      result.result?.search_results?.data &&
      result.result?.search_results?.data.length
    ) {
      this.communitiesSearchResults = result.result?.search_results?.data || [];
      this.communitiesSearchTotalCount =
        result.result?.search_results?.totalCount;
      this.communitiesFacets = this.processCommunityFacets(
        result.result?.search_results?.facets
      );
    } else {
      this.communitiesSearchResults = [];
      this.communitiesSearchTotalCount = 0;
    }
  }

  async getCompetencyHierichy(filterFlag?:any) {
    const competency = ['Behavioural', 'Functional', 'Domain'];
    let competencyFactet: any = [];
    let competencyThemeFacet: any = [];
    let competencySubThemeFacet: any = [];
    let result: any;
    for (const element of competency) {
      if (this.seeAllResult === SearchCategory.Courses) {
        if(filterFlag) {
          // const searchRequestCourse = new SearchV4Request([
          //   this.competencyAreaNameKey,
          //   this.competencyThemeKey,
          //   this.competencySubThemeKey,
          // ]);
          this.searchRequestCourse.request.query = this.statedata?.param;
          this.searchRequestCourse.request.filters[this.competencyAreaNameKey] = 
            element;
          result = await this.searchV3Service.searchCoursesv4(
            this.searchRequestCourse
          );
        } else {
          const searchRequestCourse = new SearchV4Request([
            this.competencyAreaNameKey,
            this.competencyThemeKey,
            this.competencySubThemeKey,
          ]);
          searchRequestCourse.request.query = this.statedata?.param;
          searchRequestCourse.request.filters[this.competencyAreaNameKey] =
            element;
          result = await this.searchV3Service.searchCoursesv4(
            searchRequestCourse
          );
        }
        competencyThemeFacet = result.result?.facets.find(
          (facet: any) => facet.name === this.competencyThemeKey
        );
        competencySubThemeFacet = result.result?.facets.find(
          (facet: any) => facet.name === this.competencySubThemeKey
        );
      } else if (this.seeAllResult === SearchCategory.Events) {
        const searchRequestEvents = new SearchV4Request([
          this.competencyAreaNameKey,
          this.competencyThemeKey,
          this.competencySubThemeKey,
        ]);
        searchRequestEvents.request.query = this.statedata?.param;
        searchRequestEvents.request.filters[this.competencyAreaNameKey] =
          element;
        result = await this.searchV3Service.searchCoursesv4(
          searchRequestEvents
        );
        competencyThemeFacet = result.result?.facets.find(
          (facet: any) => facet.name === this.competencyThemeKey
        );
        competencySubThemeFacet = result.result?.facets.find(
          (facet: any) => facet.name === this.competencySubThemeKey
        );
      } else if (this.seeAllResult === SearchCategory.Communities) {
        const searchRequestCommunity = new SearchCommunitiesRequest([
          this.competencyAreaNameKey,
          this.competencyThemeKey,
          this.competencySubThemeKey,
        ]);
        searchRequestCommunity.searchString = this.statedata?.param;
        searchRequestCommunity.filterCriteriaMap[this.competencyAreaNameKey] =
          element;
        result = await this.searchV3Service.searchCommunity(
          searchRequestCommunity
        );
        competencyThemeFacet = result.result?.search_results?.facets[
          this.competencyThemeKey
        ].length
          ? {
              values:
                result.result?.search_results?.facets[this.competencyThemeKey],
            }
          : { values: [] };
        competencySubThemeFacet = result.result?.search_results?.facets[
          this.competencySubThemeKey
        ].length
          ? {
              values:
                result.result?.search_results?.facets[
                  this.competencySubThemeKey
                ],
            }
          : { values: [] };
      } else if (this.seeAllResult === SearchCategory.CaseStudy) {
        const searchRequestCourse = new SearchV4Request([
          this.competencyAreaNameKey,
          this.competencyThemeKey,
          this.competencySubThemeKey,
        ]);
        searchRequestCourse.request.query = this.statedata?.param;
        searchRequestCourse.request.filters[this.competencyAreaNameKey] =
          [element];
        searchRequestCourse.request.filters.courseCategory = ['Case Study']
        result = await this.searchV3Service.searchCoursesv4(
          searchRequestCourse
        );
        competencyThemeFacet = result.result?.facets.find(
          (facet: any) => facet.name === this.competencyThemeKey
        );
        competencySubThemeFacet = result.result?.facets.find(
          (facet: any) => facet.name === this.competencySubThemeKey
        );
      }

      const competencyThemeName = competencyThemeFacet
        ? competencyThemeFacet.values.map((value: any) => ({
            name: value?.name || value?.value,
            count: value.count,
            isChecked: false,
          }))
        : [];
      const competencySubThemeName = competencySubThemeFacet
        ? competencySubThemeFacet.values.map((value: any) => ({
            name: value?.name || value?.value,
            count: value.count,
            isChecked: false,
          }))
        : [];

      if (competencyThemeName.length || competencySubThemeName.length) {
        competencyFactet.push({
          [this.competencyAreaNameKey]: {
            name: element,
            count: this.seeAllResult === SearchCategory.Communities ? _.get(result, 'result.search_results.totalCount', 0) : _.get(result, 'result.count', 0),
            isChecked: false,
          },
          [this.competencyThemeKey]: competencyThemeName,
          [this.competencySubThemeKey]: competencySubThemeName,
        });
      }
    }
    this.competencyFactet = competencyFactet;
  }

  processCommunityFacets(facets: Record<string, any[]>): any {
    return Object.keys(facets).map((key) => ({
      name: key,
      values: facets[key].map(({ value, count }) => ({ name: value, count })),
    }));
  }

  async applySearchFilter(selectedFilters: { [key: string]: any }) {
    this.applySelectedFilters = selectedFilters
    this.searchContentLoader = true;
    this.searchPeopleLoader = true;
    this.compentencyKeyExist = false
    this.searchRequestCourse = new SearchV4Request([
      this.competencyAreaNameKey,
      this.competencyThemeKey,
      this.competencySubThemeKey,
    ]);
    this.searchRequestCourse.request.limit = this.initialPaginationSize;
    this.searchRequestCourse.request.filters.courseCategory = [];
    this.searchRequestCourse.request.filters.avgRating = {};
    // this.searchRequestCourse.request.filters.courseCategory = selectedFilters

    if (this.searchSortFilter === SortType.MostRelevent) {
      if (this.seeAllResult === '') {
      } else if (this.seeAllResult === SearchCategory.Courses) {
        this.searchRequestCourse.request.sort_by = {};
      } else if (this.seeAllResult === SearchCategory.Events) {
        this.searchRequestEvents.request.sort_by = {};
      }
    } else if (this.searchSortFilter === SortType.RecentlyAdded) {
      if (this.seeAllResult === '') {
        this.searchRequestCourse.request.sort_by.lastUpdatedOn = 'desc';
        this.searchRequestEvents.request.sort_by.startDate = 'desc';
      } else if (this.seeAllResult === SearchCategory.Courses) {
        this.searchRequestCourse.request.sort_by.lastUpdatedOn = 'desc';
      } else if (this.seeAllResult === SearchCategory.Events) {
        this.searchRequestEvents.request.sort_by.startDate = 'desc';
      } else if (this.seeAllResult === SearchCategory.Communities) {
        this.searchRequestCommunities.orderDirection = 'desc';
      } else if (this.seeAllResult === SearchCategory.People) {
        delete this.searchRequestPeoples?.sort_by?.firstName;
        this.searchRequestPeoples.sort_by.lastUpdatedOn = 'desc';
      }
    } else if (this.searchSortFilter === SortType.HighestRated) {
      if (this.seeAllResult === '') {
        this.searchRequestCourse.request.sort_by.avgRating = 'desc';
        this.searchRequestEvents.request.sort_by.avgRating = 'desc';
      } else if (this.seeAllResult === SearchCategory.Courses) {
        this.searchRequestCourse.request.sort_by.avgRating = 'desc';
      } else if (this.seeAllResult === SearchCategory.Events) {
        this.searchRequestEvents.request.sort_by.avgRating = 'desc';
      }
    } else if (this.searchSortFilter === SortType.Ascending) {
      this.searchRequestPeoples.sort_by.firstName = SortType.Ascending;
    } else if (this.searchSortFilter === SortType.Descending) {
      this.searchRequestPeoples.sort_by.firstName = SortType.Descending;
    } else if (this.searchSortFilter === SortType.AtoZ) {
      this.searchRequestCourse.request.sort_by.name = SortType.Ascending;
      this.searchRequestEvents.request.sort_by.name = SortType.Ascending;
    } else if (this.searchSortFilter === SortType.ZtoA) {
      this.searchRequestCourse.request.sort_by.name = SortType.Descending;
      this.searchRequestEvents.request.sort_by.name = SortType.Descending;
    }


    this.searchRequestCommunities.pageNumber = 0;
    this.searchRequestCommunities.pageSize = this.initialPaginationSize;

    this.searchRequestPeoples.limit = this.initialPaginationSize;
    this.searchRequestPeoples.offset = 0;

    this.resetPagination();
    Object.keys(selectedFilters).forEach((key) => {
      if (selectedFilters[key] && Array.isArray(selectedFilters[key])) {
        if (key === FacetType.AvgRating) {
          const ratings = selectedFilters[key]
            .map((val: string) => parseFloat(val.split(' ')[0]))
            .filter((num: any) => !isNaN(num));

          if (ratings.length > 0) {
            this.searchRequestCourse.request.filters.avgRating = {
              '>=': String(Math.min(...ratings)),
            };
          }
        } else if (key === FacetType.Language) {
          this.searchRequestCourse.request.filters.language =
            selectedFilters[key];
        } else if (key === FacetType.Organization) {
          this.searchRequestCourse.request.filters.organisation =
            selectedFilters[key];
        } else if (key === this.competencyAreaNameKey) {
          this.searchRequestCourse.request.filters[this.competencyAreaNameKey] =
            selectedFilters[key];
          this.searchRequestEvents.request.filters[this.competencyAreaNameKey] =
            selectedFilters[key];
          this.searchRequestCommunities.filterCriteriaMap[
            this.competencyAreaNameKey
          ] = selectedFilters[key];
          this.compentencyKeyExist = true
        } else if (key === this.competencyThemeKey) {
          this.searchRequestCourse.request.filters[this.competencyThemeKey] =
            selectedFilters[key];
          this.searchRequestEvents.request.filters[this.competencyThemeKey] =
            selectedFilters[key];
          this.searchRequestCommunities.filterCriteriaMap[
            this.competencyThemeKey
          ] = selectedFilters[key];
          this.compentencyKeyExist = true
        } else if (key === this.competencySubThemeKey) {
          this.searchRequestCourse.request.filters[this.competencySubThemeKey] =
            selectedFilters[key];
          this.searchRequestEvents.request.filters[this.competencySubThemeKey] =
            selectedFilters[key];
          this.searchRequestCommunities.filterCriteriaMap[
            this.competencySubThemeKey
          ] = selectedFilters[key];
          this.compentencyKeyExist = true
        } else if (key === SearchCategory.Events) {
          this.constructQueryParam('events');
          this.seeAllResult = SearchCategory.Events;
        } else if (key === SearchCategory.Courses) {
          this.constructQueryParam('courses');
          this.seeAllResult = SearchCategory.Courses;
        } else if (key === 'Case Study') {
          this.searchRequestCourse.request.filters.sectorId = [
            ...selectedFilters[key],
          ];
        } else if (key === SearchCategory.People) {
          this.constructQueryParam('peoples');
          this.seeAllResult = SearchCategory.People;
        } else if (key === SearchCategory.Communities) {
          this.constructQueryParam('communities');
          this.seeAllResult = SearchCategory.Communities;
        } else if (key === 'typeOfEvents') {
            const currentEpochTime = moment().valueOf();
            // const endOfDayEpochTime = moment().endOf('day').valueOf();
            const tomorrowEpochTime = moment().add(1, 'day').startOf('day').valueOf();
            this.resetEventsTypesRequest()
            if (selectedFilters[key][0] === 'live') {
              this.searchRequestEvents.request.filters.startDateTimeInEpoch = {
                '<=': currentEpochTime,
              };
              this.searchRequestEvents.request.filters.endDateTimeInEpoch = {
                '>=': currentEpochTime,
              };
            } else if (selectedFilters[key][0] === 'upcoming') {
              this.searchRequestEvents.request.filters.startDateTimeInEpoch = {
                '>=': tomorrowEpochTime,
              };
            } else if (selectedFilters[key][0] === 'past events') {
              this.searchRequestEvents.request.filters.endDateTimeInEpoch = {
                '<=': currentEpochTime,
              };
            }
        } else if (key === 'competencyArea') {
          this.searchRequestCommunities.filterCriteriaMap.competencyArea = [
            ...selectedFilters[key],
          ];
        } else if (key === 'orgName') {
          this.searchRequestCommunities.filterCriteriaMap.orgName = [
            ...selectedFilters[key],
          ];
        } else if (key === 'topicName') {
          this.searchRequestCommunities.filterCriteriaMap.topicName = [
            ...selectedFilters[key],
          ];
        } else if (key === 'profileDetails.professionalDetails.designation') {
          this.searchRequestPeoples.filters[key] = [...selectedFilters[key]];
        } else if (key === 'rootOrgName') {
          this.searchRequestPeoples.filters[key] = [...selectedFilters[key]];
        } 
        else if (key === 'sourceName') {
          this.searchRequestEvents.request.filters.sourceName = [
            ...selectedFilters[key],
          ];
        }
        else if (key === 'resourceType') {
          this.searchRequestEvents.request.filters.resourceType = [
            ...selectedFilters[key],
          ];
        }
         else {
          this.searchRequestCourse.request.filters.courseCategory!.push(
            ...selectedFilters[key]
          );
        }
      }
    });

    if (!Object.keys(selectedFilters).includes('typeOfEvents')) {
      this.resetEventsTypesRequest()
    }
    
    this.deleteFilterKeys();
    if (
      this.seeAllResult === SearchCategory.Courses ||
      this.seeAllResult === SearchCategory.CaseStudy
    ) {
      this.searchCourses();
    } else if (this.seeAllResult === SearchCategory.Events) {
      this.searchEvents();
    } else if (this.seeAllResult === SearchCategory.People) {
      this.searchPeople();
    } else if (this.seeAllResult === SearchCategory.Communities) {
      this.searchcommunities();
    } else {
      await this.searchCourses();
      await this.searchEvents();
      this.searchPeople();
      this.searchcommunities();
    }
    if(selectedFilters && selectedFilters.length) {
      this.searchRequestCourse.request.filters.courseCategory = selectedFilters
      if(this.compentencyKeyExist) {
        this.getCompetencyHierichy(true)
      }
    } else if(this.compentencyKeyExist) {
      this.getCompetencyHierichy(true)
    } else {
      this.getCompetencyHierichy(false)
    }
    this.searchContentLoader = false;
    this.searchPeopleLoader = false;

  }

  private checkIfExploreContentTab(): void {
    this.activated.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.isExploreContentTab = !!params['tab'];
      });
  }

  async applyFilterFromLearn(selectedFilters: { [key: string]: any }) {
    console.log('selectedFilters',selectedFilters)
    // this.searchContentLoader = true;
    // this.searchPeopleLoader = true;

    // this.searchRequestCourse = new SearchV4Request([
    //   this.competencyAreaNameKey,
    //   this.competencyThemeKey,
    //   this.competencySubThemeKey,
    // ]);
    // this.searchRequestCourse.request.limit = this.initialPaginationSize;
    // this.searchRequestCourse.request.filters.courseCategory = [];
    // this.searchRequestCourse.request.filters.avgRating = {};

    // if (this.searchSortFilter === SortType.MostRelevent) {
    //   if (this.seeAllResult === '') {
    //   } else if (this.seeAllResult === SearchCategory.Courses) {
    //     this.searchRequestCourse.request.sort_by = {};
    //   } else if (this.seeAllResult === SearchCategory.Events) {
    //     this.searchRequestEvents.request.sort_by = {};
    //   }
    // } else if (this.searchSortFilter === SortType.RecentlyAdded) {
    //   if (this.seeAllResult === '') {
    //     this.searchRequestCourse.request.sort_by.lastUpdatedOn = 'desc';
    //     this.searchRequestEvents.request.sort_by.startDate = 'desc';
    //   } else if (this.seeAllResult === SearchCategory.Courses) {
    //     this.searchRequestCourse.request.sort_by.lastUpdatedOn = 'desc';
    //   } else if (this.seeAllResult === SearchCategory.Events) {
    //     this.searchRequestEvents.request.sort_by.startDate = 'desc';
    //   } else if (this.seeAllResult === SearchCategory.Communities) {
    //     this.searchRequestCommunities.orderDirection = 'desc';
    //   } else if (this.seeAllResult === SearchCategory.People) {
    //     delete this.searchRequestPeoples?.sort_by?.firstName;
    //     this.searchRequestPeoples.sort_by.lastUpdatedOn = 'desc';
    //   }
    // } else if (this.searchSortFilter === SortType.HighestRated) {
    //   if (this.seeAllResult === '') {
    //     this.searchRequestCourse.request.sort_by.avgRating = 'desc';
    //     this.searchRequestEvents.request.sort_by.avgRating = 'desc';
    //   } else if (this.seeAllResult === SearchCategory.Courses) {
    //     this.searchRequestCourse.request.sort_by.avgRating = 'desc';
    //   } else if (this.seeAllResult === SearchCategory.Events) {
    //     this.searchRequestEvents.request.sort_by.avgRating = 'desc';
    //   }
    // } else if (this.searchSortFilter === SortType.Ascending) {
    //   this.searchRequestPeoples.sort_by.firstName = SortType.Ascending;
    // } else if (this.searchSortFilter === SortType.Descending) {
    //   this.searchRequestPeoples.sort_by.firstName = SortType.Descending;
    // }

    // this.searchRequestCommunities.pageNumber = 0;
    // this.searchRequestCommunities.pageSize = this.initialPaginationSize;

    // this.searchRequestPeoples.limit = this.initialPaginationSize;
    // this.searchRequestPeoples.offset = 0;

    // this.resetPagination();
    // Object.keys(selectedFilters).forEach((key) => {
    //   if (selectedFilters[key] && Array.isArray(selectedFilters[key])) {
    //     if (key === FacetType.AvgRating) {
    //       const ratings = selectedFilters[key]
    //         .map((val: string) => parseFloat(val.split(' ')[0]))
    //         .filter((num: any) => !isNaN(num));

    //       if (ratings.length > 0) {
    //         this.searchRequestCourse.request.filters.avgRating = {
    //           '>=': String(Math.min(...ratings)),
    //         };
    //       }
    //     } else if (key === FacetType.Language) {
    //       this.searchRequestCourse.request.filters.language =
    //         selectedFilters[key];
    //     } else if (key === FacetType.Organization) {
    //       this.searchRequestCourse.request.filters.organisation =
    //         selectedFilters[key];
    //     } else if (key === this.competencyAreaNameKey) {
    //       this.searchRequestCourse.request.filters[this.competencyAreaNameKey] =
    //         selectedFilters[key];
    //       this.searchRequestEvents.request.filters[this.competencyAreaNameKey] =
    //         selectedFilters[key];
    //       this.searchRequestCommunities.filterCriteriaMap[
    //         this.competencyAreaNameKey
    //       ] = selectedFilters[key];
    //     } else if (key === this.competencyThemeKey) {
    //       this.searchRequestCourse.request.filters[this.competencyThemeKey] =
    //         selectedFilters[key];
    //       this.searchRequestEvents.request.filters[this.competencyThemeKey] =
    //         selectedFilters[key];
    //       this.searchRequestCommunities.filterCriteriaMap[
    //         this.competencyThemeKey
    //       ] = selectedFilters[key];
    //     } else if (key === this.competencySubThemeKey) {
    //       this.searchRequestCourse.request.filters[this.competencySubThemeKey] =
    //         selectedFilters[key];
    //       this.searchRequestEvents.request.filters[this.competencySubThemeKey] =
    //         selectedFilters[key];
    //       this.searchRequestCommunities.filterCriteriaMap[
    //         this.competencySubThemeKey
    //       ] = selectedFilters[key];
    //     } else if (key === SearchCategory.Events) {
    //      // this.constructQueryParam('events');
    //       this.seeAllResult = SearchCategory.Events;
    //     } else if (key === SearchCategory.Courses) {
    //       // this.constructQueryParam('courses');
    //       this.seeAllResult = SearchCategory.Courses;
    //     } else if (key === 'Case Study') {
    //       this.searchRequestCourse.request.filters.sectorId = [
    //         ...selectedFilters[key],
    //       ];
    //     } else if (key === SearchCategory.People) {
    //      // this.constructQueryParam('peoples');
    //       this.seeAllResult = SearchCategory.People;
    //     } else if (key === SearchCategory.Communities) {
    //      // this.constructQueryParam('communities');
    //       this.seeAllResult = SearchCategory.Communities;
    //     } else if (key === 'typeOfEvents') {
    //       this.typesOfEventsFilters = [...selectedFilters[key]];
    //     } else if (key === 'competencyArea') {
    //       this.searchRequestCommunities.filterCriteriaMap.competencyArea = [
    //         ...selectedFilters[key],
    //       ];
    //     } else if (key === 'orgName') {
    //       this.searchRequestCommunities.filterCriteriaMap.orgName = [
    //         ...selectedFilters[key],
    //       ];
    //     } else if (key === 'topicName') {
    //       this.searchRequestCommunities.filterCriteriaMap.topicName = [
    //         ...selectedFilters[key],
    //       ];
    //     } else if (key === 'profileDetails.professionalDetails.designation') {
    //       this.searchRequestPeoples.filters[key] = [...selectedFilters[key]];
    //     } else if (key === 'rootOrgName') {
    //       this.searchRequestPeoples.filters[key] = [...selectedFilters[key]];
    //     } else if (key === 'sourceName') {
    //       this.searchRequestEvents.request.filters.sourceName = [
    //         ...selectedFilters[key],
    //       ];
    //     } else {
    //       this.searchRequestCourse.request.filters.courseCategory!.push(
    //         ...selectedFilters[key]
    //       );
    //     }
    //   }
    // });

    // if (!Object.keys(selectedFilters).includes('typeOfEvents')) {
    //   this.typesOfEventsFilters = [];
    // }

    // this.deleteFilterKeys();
    // if (
    //   this.seeAllResult === SearchCategory.Courses ||
    //   this.seeAllResult === SearchCategory.CaseStudy
    // ) {
    //   this.searchCourses();
    // } else if (this.seeAllResult === SearchCategory.Events) {
    //   this.searchEvents();
    // } else if (this.seeAllResult === SearchCategory.People) {
    //   this.searchPeople();
    // } else if (this.seeAllResult === SearchCategory.Communities) {
    //   this.searchcommunities();
    // } else {
    //   await this.searchCourses();
    //   await this.searchEvents();
    //   this.searchPeople();
    //   this.searchcommunities();
    // }

    // this.searchContentLoader = false;
    // this.searchPeopleLoader = false;
  }

  // Delete the empty request param from resuest body
  deleteFilterKeys() {
    if (
      this.searchRequestCourse.request.filters.avgRating &&
      Object.keys(this.searchRequestCourse.request.filters.avgRating).length ===
        0
    ) {
      delete this.searchRequestCourse.request.filters.avgRating;
    }

    if (
      this.searchRequestCourse.request.filters.language &&
      this.searchRequestCourse.request.filters.language.length === 0
    ) {
      delete this.searchRequestCourse.request.filters.language;
    }

    if (
      this.searchRequestCourse.request.filters.organisation &&
      this.searchRequestCourse.request.filters.organisation.length === 0
    ) {
      delete this.searchRequestCourse.request.filters.organisation;
    }
    if (
      this.searchRequestCourse.request.filters[this.competencyAreaNameKey] &&
      this.searchRequestCourse.request.filters[this.competencyAreaNameKey]
        .length === 0
    ) {
      delete this.searchRequestCourse.request.filters[
        this.competencyAreaNameKey
      ];
    }
    if (
      this.searchRequestCourse.request.filters[this.competencySubThemeKey] &&
      this.searchRequestCourse.request.filters[this.competencySubThemeKey]
        .length === 0
    ) {
      delete this.searchRequestCourse.request.filters[
        this.competencySubThemeKey
      ];
    }
    if (
      this.searchRequestCommunities.filterCriteriaMap.competencyArea &&
      this.searchRequestCommunities.filterCriteriaMap.competencyArea.length ===
        0
    ) {
      delete this.searchRequestCommunities.filterCriteriaMap.competencyArea;
    }
    if (
      this.searchRequestCommunities.filterCriteriaMap[
        this.competencyAreaNameKey
      ] &&
      this.searchRequestCommunities.filterCriteriaMap[
        this.competencyAreaNameKey
      ].length === 0
    ) {
      delete this.searchRequestCommunities.filterCriteriaMap[
        this.competencyAreaNameKey
      ];
    }
    if (
      this.searchRequestCommunities.filterCriteriaMap[
        this.competencyThemeKey
      ] &&
      this.searchRequestCommunities.filterCriteriaMap[this.competencyThemeKey]
        .length === 0
    ) {
      delete this.searchRequestCommunities.filterCriteriaMap[
        this.competencyThemeKey
      ];
    }
    if (
      this.searchRequestCommunities.filterCriteriaMap[
        this.competencySubThemeKey
      ] &&
      this.searchRequestCommunities.filterCriteriaMap[
        this.competencySubThemeKey
      ].length === 0
    ) {
      delete this.searchRequestCommunities.filterCriteriaMap[
        this.competencySubThemeKey
      ];
    }
    if (
      this.searchRequestCommunities.filterCriteriaMap.orgName &&
      this.searchRequestCommunities.filterCriteriaMap.orgName.length === 0
    ) {
      delete this.searchRequestCommunities.filterCriteriaMap.orgName;
    }
    if (
      this.searchRequestCommunities.filterCriteriaMap.topicName &&
      this.searchRequestCommunities.filterCriteriaMap.topicName.length === 0
    ) {
      delete this.searchRequestCommunities.filterCriteriaMap.topicName;
    }
    if (
      this.searchRequestCommunities.filterCriteriaMap.topicName &&
      this.searchRequestCommunities.filterCriteriaMap.topicName.length === 0
    ) {
      delete this.searchRequestCommunities.filterCriteriaMap.topicName;
    }
    if (
      this.searchRequestPeoples.filters[
        'profileDetails.professionalDetails.designation'
      ] &&
      this.searchRequestPeoples.filters[
        'profileDetails.professionalDetails.designation'
      ].length === 0
    ) {
      delete this.searchRequestPeoples.filters[
        'profileDetails.professionalDetails.designation'
      ];
    }
    if (
      this.searchRequestPeoples.filters['rootOrgName'] &&
      this.searchRequestPeoples.filters['rootOrgName'].length === 0
    ) {
      delete this.searchRequestPeoples.filters['rootOrgName'];
    }
    if (
      this.searchRequestEvents.request.filters.sourceName &&
      this.searchRequestEvents.request.filters.sourceName.length === 0
    ) {
      delete this.searchRequestEvents.request.filters.sourceName;
    }
    if (
      this.searchRequestEvents.request.filters[this.competencyAreaNameKey] &&
      this.searchRequestEvents.request.filters[this.competencyAreaNameKey]
        .length === 0
    ) {
      delete this.searchRequestEvents.request.filters[
        this.competencyAreaNameKey
      ];
    }
    if (
      this.searchRequestEvents.request.filters[this.competencySubThemeKey] &&
      this.searchRequestEvents.request.filters[this.competencySubThemeKey]
        .length === 0
    ) {
      delete this.searchRequestEvents.request.filters[
        this.competencySubThemeKey
      ];
    }
    if (
      this.searchRequestEvents.request.filters[this.competencyThemeKey] &&
      this.searchRequestEvents.request.filters[this.competencyThemeKey]
        .length === 0
    ) {
      delete this.searchRequestEvents.request.filters[this.competencyThemeKey];
    }
  }

  async seeAllResults(category: string) {
    this.seeAllResult = category;
    if (category === SearchCategory.Courses) {
      this.eventSearchTotalCount = 0;
      this.peopleSearchTotalCount = 0;
      this.communitiesSearchTotalCount = 0;
      this.searchRequestCourse.request.limit = this.initialPaginationSize;
      await this.searchCourses();
      this.combinedFacets = [this.coursesFacets];
      this.getCompetencyHierichy();
    } else if (category === SearchCategory.CaseStudy) {
      this.eventSearchTotalCount = 0;
      this.peopleSearchTotalCount = 0;
      this.communitiesSearchTotalCount = 0;
      this.searchRequestCourse.request.limit = this.initialPaginationSize;
      this.searchRequestCourse.request.filters.courseCategory = ['Case Study'];      
      await this.searchCourses();
      this.combinedFacets = [this.coursesFacets];
      this.getCompetencyHierichy();
    } else if (category === SearchCategory.Events) {
      this.courseSearchTotalCount = 0;
      this.peopleSearchTotalCount = 0;
      this.communitiesSearchTotalCount = 0;
      this.searchRequestEvents.request.limit = this.initialPaginationSize;
      await this.searchEvents();
      this.combinedFacets = [this.eventsFacets];
      this.getCompetencyHierichy();
      this.processTypeOfEventsFilter()
    } else if (category === SearchCategory.People) {
      this.courseSearchTotalCount = 0;
      this.eventSearchTotalCount = 0;
      this.communitiesSearchTotalCount = 0;
      this.searchRequestPeoples.limit = this.initialPaginationSize;
      await this.searchPeople();
      this.combinedFacets = this.peoplesFacets.length ? [this.peoplesFacets] : [];
    } else if (category === SearchCategory.Communities) {
      this.courseSearchTotalCount = 0;
      this.eventSearchTotalCount = 0;
      this.peopleSearchTotalCount = 0;
      this.searchRequestCommunities.pageSize = this.initialPaginationSize;
      await this.searchcommunities();
      this.combinedFacets = [this.communitiesFacets];
      this.getCompetencyHierichy();
    }
    // this.scrollToTop();
    this.searchPeopleLoader = false
    this.searchContentLoader = false;
  }

  resetAllSearchParams() {
    this.searchRequestCourse = new SearchV4Request([
      this.competencyAreaNameKey,
      this.competencyThemeKey,
      this.competencySubThemeKey,
    ]);
    this.searchRequestEvents = new SearchV4Request([
      this.competencyAreaNameKey,
      this.competencyThemeKey,
      this.competencySubThemeKey,
    ]);
    this.searchRequestPeoples = new SearchPeoplesRequest();
    this.searchRequestCommunities = new SearchCommunitiesRequest([
      this.competencyAreaNameKey,
      this.competencyThemeKey,
      this.competencySubThemeKey,
    ]);

    this.courseSearchResults = [];
    this.eventsSearchResults = [];
    this.peoplesSearchResults = [];
    this.communitiesSearchResults = [];

    this.combinedFacets = [];

    this.courseSearchTotalCount = 0;
    this.eventSearchTotalCount = 0;
    this.peopleSearchTotalCount = 0;
    this.communitiesSearchTotalCount = 0;

    this.seeAllResult = '';
    this.allResultsDepartmentName = new Set<string>();
    this.competencyFactet = [];
  }

  async onPageChange(event: PageChangeEmitter) {
    this.searchPeopleLoader = true
    this.searchContentLoader = true;

    if (this.seeAllResult === SearchCategory.Courses) {
      this.searchRequestCourse.request.limit = event.limit;
      this.searchRequestCourse.request.offset =
        (event.currentPage - 1) * event.limit;
      await this.searchCourses();
    } else if (this.seeAllResult === SearchCategory.Events) {
      this.searchRequestEvents.request.limit = event.limit;
      this.searchRequestEvents.request.offset =
        (event.currentPage - 1) * event.limit;
      await this.searchEvents();
    } else if (this.seeAllResult === SearchCategory.People) {
      this.searchRequestPeoples.limit = event.limit;
      this.searchRequestPeoples.offset = (event.currentPage - 1) * event.limit;
      this.searchPeople();
    } else if (this.seeAllResult === SearchCategory.Communities) {
      this.searchRequestCommunities.pageSize = event.limit;
      this.searchRequestCommunities.pageNumber = event.currentPage - 1;
      this.searchcommunities();
    }

    this.searchPeopleLoader = false
    this.searchContentLoader = false;

    this.scrollToTop();
  }

  async onChangeSortSearch(event: string) {
    this.searchPeopleLoader = true
    this.searchContentLoader = true;
    this.searchSortFilter = event
    this.resetPagination();
    this.searchRequestCourse.request.sort_by = {};
    this.searchRequestCourse.request.limit = this.initialPaginationSize;
    this.searchRequestCourse.request.offset = 0;

    this.searchRequestEvents.request.sort_by = {};
    this.searchRequestEvents.request.offset = 0;

    this.searchRequestCommunities.pageNumber = 0;

    this.searchRequestPeoples.offset = 0;
    if (this.seeAllResult) {
      this.searchRequestPeoples.limit = this.initialPaginationSize;
      this.searchRequestEvents.request.limit = this.initialPaginationSize;
      this.searchRequestCourse.request.limit = this.initialPaginationSize;
      this.searchRequestCommunities.pageSize = this.initialPaginationSize;
    } else {
      this.searchRequestPeoples.limit = this.initialPaginationSize;
      this.searchRequestCommunities.pageSize = this.initialPaginationSize;
      this.searchRequestEvents.request.limit = this.commonPageResultSize;
      this.searchRequestCourse.request.limit = this.commonPageResultSize;
    }
    Object.keys(this.applySelectedFilters).forEach((key) => {
      if (this.applySelectedFilters[key] && Array.isArray(this.applySelectedFilters[key])) {
        if (key === FacetType.AvgRating) {
          const ratings = this.applySelectedFilters[key]
            .map((val: string) => parseFloat(val.split(' ')[0]))
            .filter((num: any) => !isNaN(num));

          if (ratings.length > 0) {
            this.searchRequestCourse.request.filters.avgRating = {
              '>=': String(Math.min(...ratings)),
            };
          }
        } else if (key === FacetType.Language) {
          this.searchRequestCourse.request.filters.language =
            this.applySelectedFilters[key];
        } else if (key === FacetType.Organization) {
          this.searchRequestCourse.request.filters.organisation =
            this.applySelectedFilters[key];
        } else if (key === this.competencyAreaNameKey) {          
          this.searchRequestCourse.request.filters[this.competencyAreaNameKey] =
            this.applySelectedFilters[key];
          this.searchRequestEvents.request.filters[this.competencyAreaNameKey] =
            this.applySelectedFilters[key];
          this.searchRequestCommunities.filterCriteriaMap[
            this.competencyAreaNameKey
          ] = this.applySelectedFilters[key];
        } else if (key === this.competencyThemeKey) {
          this.searchRequestCourse.request.filters[this.competencyThemeKey] =
            this.applySelectedFilters[key];
          this.searchRequestEvents.request.filters[this.competencyThemeKey] =
            this.applySelectedFilters[key];
          this.searchRequestCommunities.filterCriteriaMap[
            this.competencyThemeKey
          ] = this.applySelectedFilters[key];
        } else if (key === this.competencySubThemeKey) {
          this.searchRequestCourse.request.filters[this.competencySubThemeKey] =
            this.applySelectedFilters[key];
          this.searchRequestEvents.request.filters[this.competencySubThemeKey] =
            this.applySelectedFilters[key];
          this.searchRequestCommunities.filterCriteriaMap[
            this.competencySubThemeKey
          ] = this.applySelectedFilters[key];
        } else if (key === SearchCategory.Events) {
          this.constructQueryParam('events');
          this.seeAllResult = SearchCategory.Events;
        } else if (key === SearchCategory.Courses) {
          this.constructQueryParam('courses');
          this.seeAllResult = SearchCategory.Courses;
        } else if (key === 'Case Study') {
          this.searchRequestCourse.request.filters.sectorId = [
            ...this.applySelectedFilters[key],
          ];
        } else if (key === SearchCategory.People) {
          this.constructQueryParam('peoples');
          this.seeAllResult = SearchCategory.People;
        } else if (key === SearchCategory.Communities) {
          this.constructQueryParam('communities');
          this.seeAllResult = SearchCategory.Communities;
        } else if (key === 'typeOfEvents') {
            const currentEpochTime = moment().valueOf();
            // const endOfDayEpochTime = moment().endOf('day').valueOf();
            const tomorrowEpochTime = moment().add(1, 'day').startOf('day').valueOf();
            this.resetEventsTypesRequest()
            if (this.applySelectedFilters[key][0] === 'live') {
              this.searchRequestEvents.request.filters.startDateTimeInEpoch = {
                '<=': currentEpochTime,
              };
              this.searchRequestEvents.request.filters.endDateTimeInEpoch = {
                '>=': currentEpochTime,
              };
            } else if (this.applySelectedFilters[key][0] === 'upcoming') {
              this.searchRequestEvents.request.filters.startDateTimeInEpoch = {
                '>=': tomorrowEpochTime,
              };
            } else if (this.applySelectedFilters[key][0] === 'past events') {
              this.searchRequestEvents.request.filters.endDateTimeInEpoch = {
                '<=': currentEpochTime,
              };
            }
        } else if (key === 'competencyArea') {
          this.searchRequestCommunities.filterCriteriaMap.competencyArea = [
            ...this.applySelectedFilters[key],
          ];
        } else if (key === 'orgName') {
          this.searchRequestCommunities.filterCriteriaMap.orgName = [
            ...this.applySelectedFilters[key],
          ];
        } else if (key === 'topicName') {
          this.searchRequestCommunities.filterCriteriaMap.topicName = [
            ...this.applySelectedFilters[key],
          ];
        } else if (key === 'profileDetails.professionalDetails.designation') {
          this.searchRequestPeoples.filters[key] = [...this.applySelectedFilters[key]];
        } else if (key === 'rootOrgName') {
          this.searchRequestPeoples.filters[key] = [...this.applySelectedFilters[key]];
        } 
        else if (key === 'sourceName') {
          this.searchRequestEvents.request.filters.sourceName = [
            ...this.applySelectedFilters[key],
          ];
        }
        else if (key === 'resourceType') {
          this.searchRequestEvents.request.filters.resourceType = [
            ...this.applySelectedFilters[key],
          ];
        }
         else {
          this.searchRequestCourse.request.filters.courseCategory!.push(
            ...this.applySelectedFilters[key]
          );
        }
      }
    });

    if (event === SortType.MostRelevent) {
      if (this.seeAllResult === '') {
        await this.searchCourses();
        await this.searchEvents();
        await this.searchcommunities();
      } else if (this.seeAllResult === SearchCategory.Courses) {
        this.searchRequestCourse.request.sort_by = {};
        await this.searchCourses();
      } else if (this.seeAllResult === SearchCategory.Events) {
        this.searchRequestEvents.request.sort_by = {};
        await this.searchEvents();
      }
    } else if (event === SortType.RecentlyAdded) {
      if (this.seeAllResult === '') {
        this.searchRequestCourse.request.sort_by.lastUpdatedOn = 'desc';
        this.searchRequestEvents.request.sort_by.startDate = 'desc';
       await this.searchCourses();
       await this.searchEvents();
       await this.searchcommunities();
      } else if (this.seeAllResult === SearchCategory.Courses) {
        this.searchRequestCourse.request.sort_by.lastUpdatedOn = 'desc';
        await this.searchCourses();
      } else if (this.seeAllResult === SearchCategory.Events) {
        this.searchRequestEvents.request.sort_by.startDate = 'desc';
        await this.searchEvents();
      } else if (this.seeAllResult === SearchCategory.Communities) {
        this.searchRequestCommunities.orderDirection = 'desc';
        await this.searchcommunities();
      } else if (this.seeAllResult === SearchCategory.People) {
        delete this.searchRequestPeoples?.sort_by?.firstName;
        this.searchRequestPeoples.sort_by.lastUpdatedOn = 'desc';
        await this.searchPeople();
      }
    } else if (event === SortType.HighestRated) {
      if (this.seeAllResult === '') {
        this.searchRequestCourse.request.sort_by.avgRating = 'desc';
        this.searchRequestEvents.request.sort_by.avgRating = 'desc';
        await this.searchCourses();
        await this.searchEvents();
        await this.searchcommunities();
      } else if (this.seeAllResult === SearchCategory.Courses) {
        this.searchRequestCourse.request.sort_by.avgRating = 'desc';
        await this.searchCourses();
      } else if (this.seeAllResult === SearchCategory.Events) {
        this.searchRequestEvents.request.sort_by.avgRating = 'desc';
        await this.searchEvents();
      }
    } else if (event === SortType.Ascending) {
      this.searchRequestPeoples.sort_by.firstName = SortType.Ascending;
      await this.searchPeople();
    } else if (event === SortType.Descending) {
      this.searchRequestPeoples.sort_by.firstName = SortType.Descending;
      await this.searchPeople();
    }  else if (event === SortType.AtoZ) {
      if (this.seeAllResult === '') {
        this.searchRequestCourse.request.sort_by.name = SortType.Ascending;
        this.searchRequestEvents.request.sort_by.name = SortType.Ascending;
        await this.searchCourses();
        await this.searchEvents();
        await this.searchcommunities();
      } else if (this.seeAllResult === SearchCategory.Courses) {
        this.searchRequestCourse.request.sort_by.name = SortType.Ascending;
        await this.searchCourses();
      } else if (this.seeAllResult === SearchCategory.Events) {
        this.searchRequestEvents.request.sort_by.name = SortType.Ascending;
        await this.searchEvents();
      }

    } else if (event === SortType.ZtoA) {
      if (this.seeAllResult === '') {
        this.searchRequestCourse.request.sort_by.name = SortType.Descending;
        this.searchRequestEvents.request.sort_by.name = SortType.Descending;
        await this.searchCourses();
        await this.searchEvents();
        await this.searchcommunities();
      } else if (this.seeAllResult === SearchCategory.Courses) {
        this.searchRequestCourse.request.sort_by.name = SortType.Descending;
        await this.searchCourses();
      } else if (this.seeAllResult === SearchCategory.Events) {
        this.searchRequestEvents.request.sort_by.name = SortType.Descending;
        await this.searchEvents();
      }
    }



    localStorage.setItem(SearchConstantLocalStorage.SortType, event);
    this.searchPeopleLoader = false
    this.searchContentLoader = false;
  }

  checkCourseEnrollmentAndCbpPlan() {
    const userId = this.configSvc.userProfile?.userId || '';
    const request = {
      request: {
        retiredCoursesEnabled: true,
        limit: this.initialPaginationSize,
      },
    };

    forkJoin({
      inProgress: this.searchV3Service.enrollment(
        { request: { ...request.request, status: 'In-Progress' } },
        userId
      ),
      completed: this.searchV3Service.enrollment(
        { request: { ...request.request, status: 'Completed' } },
        userId
      ),
      cbpPlan: this.userService.fetchCbpPlanList(),
    }).subscribe((responses) => {
      const inProgressCourses =
        (responses.inProgress as any)?.result?.courses || [];
      const completedCourses =
        (responses.completed as any)?.result?.courses || [];

      this.enrollmentDetails = [...inProgressCourses, ...completedCourses];
      this.cbpPlanList = responses.cbpPlan || [];
    });
  }

  getAllConnectionRequests() {
    this.networkV2Service
      .fetchAllConnectionRequests()
      .subscribe((requests: any) => {
        this.connectionRequestsSent = requests.result.data;

        if (this.peoplesSearchResults && this.peoplesSearchResults.length > 0) {
          // Filter all the connection requests sent
          if (
            this.connectionRequestsSent &&
            this.connectionRequestsSent.length > 0
          ) {
            this.connectionRequestsSent.map((user: any) => {
              const userid = user.id || user.identifier || user.wid;
              if (userid) {
                this.peoplesSearchResults.forEach((usr: any) => {
                  if ((usr.userId || usr.wid) === userid) {
                    usr['requestSent'] = true;
                  }
                });
              }
            });
          }
        }
      });
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  constructQueryParam(category: any) {
    const params = this.activated.snapshot.queryParams;

    this.queryParams = {
      q: params['q'].trim(),
      search: params['search'] || null,
      category: category || null,
      tab: null
    };
    this.queryParamChange.emit(this.queryParams);
  }

  resetPagination() {
    this.initialPaginationPage = 2;
    setTimeout(() => {
      this.initialPaginationPage = 1;
    });
  }

  processEventsResult(events: any) {
    let processedEvents: any = [];

    let serverTime = moment();
        serverTime = serverTime.add(5, 'hours').add(30, 'minutes');
        serverTime.format('YYYY-MM-DD HH:mm:ss'),
        // Display the server time
        /* tslint:disable */
        // console.log("Server Time: ", serverTime.format('YYYY-MM-DD HH:mm:ss'));
        // console.log('eventName', eventName)
        // console.log('userIdentifier', userIdentifier)
        
        
        
    events.forEach((event: any) => {
      if (
        event.startDate &&
        event.endDate &&
        event.startTime &&
        event.endTime
      ) {
        // Conver current time into milliseconds
        let currentTime = new Date(serverTime.toString()).getTime()/1000;
        // Combining date and time for start event
        let evenStarttDate =
          new Date(`${event.startDate} ${event.startTime}`).getTime() / 1000;
        // Combining date and time for end event
        let eventEndDate =
          new Date(`${event.endDate} ${event.endTime}`).getTime() / 1000;
        if (currentTime > eventEndDate) {
          if (this.typesOfEventsFilters.includes('past events')) {
            processedEvents.push(event);
          }
        } else if (
          (currentTime <= eventEndDate &&
          currentTime >= evenStarttDate)
        ) {
          console.log('in live')
          if (this.typesOfEventsFilters.includes('live')) {
            event.showLive = true;
            processedEvents.push(event);
          }
        } else {
          console.log('in upcoming')
          if (this.typesOfEventsFilters.includes('upcoming')) {
            processedEvents.push(event);
          }
        }
      }
    });
    return processedEvents;
  }

  async removeFilterChip(filter: any) {
    this.searchContentLoader = true;
    this.filtersChipFromLearn = this.filtersChipFromLearn.filter(ele => ele !== filter)
    this.searchRequestCourse.request.filters.courseCategory = this.filtersChipFromLearn
    
    if(!this.filtersChipFromLearn.length) {
      this.sideNavBarOpened = true
      this.seeAllResults(SearchCategory.Courses)
      return 
    }

    await this.searchCourses()
    this.searchContentLoader = false;

    
  }

  async processTypeOfEventsFilter() {
    const typeOfEvents = ['live', 'upcoming', 'past events'];
    const eventCounts: any[] = [];

    for (const type of typeOfEvents) {
      const searchRequestEvents = new SearchV4Request([]);
      searchRequestEvents.request.query = this.statedata?.param;
      searchRequestEvents.request.filters.contentType = 'Event';
      searchRequestEvents.request.fields = SearchEventFields;
      searchRequestEvents.request.facets = ["startDateTimeInEpoch"];
  
      delete searchRequestEvents.request.filters?.courseCategory;
      delete searchRequestEvents.request.sort_by?.lastUpdatedOn;

      const currentEpochTime = moment().valueOf();
      // const endOfDayEpochTime = moment().endOf('day').valueOf();
      const tomorrowEpochTime = moment().add(1, 'day').startOf('day').valueOf();

      if (type === 'live') {
        searchRequestEvents.request.filters.startDateTimeInEpoch = {
          '<=': currentEpochTime,
        };
        searchRequestEvents.request.filters.endDateTimeInEpoch = {
          '>=': currentEpochTime,
        };
      } else if (type === 'upcoming') {
        searchRequestEvents.request.filters.startDateTimeInEpoch = {
          '>=': tomorrowEpochTime,
        };
      } else if (type === 'past events') {
        searchRequestEvents.request.filters.endDateTimeInEpoch = {
          '<=': currentEpochTime,
        };
      }

      const result = await this.searchV3Service.searchCoursesv4(searchRequestEvents);
      eventCounts.push({
        name: type,
        count: result?.result?.count || 0,
        isChecked: false,
        displayName: type,
      });
    }

    console.log('Event counts by type:', eventCounts);
    this.typesOfEventsFilters = eventCounts;
  }

  resetEventsTypesRequest() {
    if(this.searchRequestEvents.request.filters.startDateTimeInEpoch) {
      delete this.searchRequestEvents.request.filters.startDateTimeInEpoch
    }
    if(this.searchRequestEvents.request.filters.endDateTimeInEpoch) {
      delete this.searchRequestEvents.request.filters.endDateTimeInEpoch
    }
  }
}
