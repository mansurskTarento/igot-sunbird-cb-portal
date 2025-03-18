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
  SearchEventfacet,
  SearchEventFields,
  SearchPeoplesRequest,
  SearchV4Request,
  SortType,
} from '../../models/search-v3.model';
import { forkJoin, from } from 'rxjs';
import { map, mergeMap, toArray } from 'rxjs/operators';
import {
  NsContent,
  WidgetUserService,
} from '@sunbird-cb/collection/src/public-api';
import { environment } from 'src/environments/environment';
import { NetworkV2Service } from '../../../network-v2/services/network-v2.service';

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
  searchRequestCommunities = new SearchCommunitiesRequest();
  isLoadingSearch = true;

  initialPaginationSize = 10;
  initialPaginationSizeOptions = [10, 20, 50, 100];
  initialPaginationPage = 1;

  coursesFacets = [];
  eventsFacets = [];
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
    if (
      (changes.searchQuery &&
        changes.searchQuery.currentValue?.query !==
          changes.searchQuery.previousValue?.query) ||
      changes.searchQuery.currentValue?.searchCategory !==
        changes.searchQuery.previousValue?.searchCategory
    ) {
      this.resetAllSearchParams();
      this.statedata = {
        param: this.searchQuery?.nlp
          ? this.searchQuery?.nlp
          : this.searchQuery.query,
        path: 'Search',
      };
      this.isLoadingSearch = true;
      if (changes.searchQuery.currentValue?.searchCategory) {
        const category = changes.searchQuery.currentValue?.searchCategory || '';
        this.seeAllResults(category);
      } else {
        await this.searchCourses();
        await this.searchEvents();
        await this.searchPeople();
        await this.searchcommunities();
        this.isLoadingSearch = false;
      }
    }
  }

  getName(userDetails: any) {
    return userDetails.firstName
      ? userDetails.firstName
      : userDetails.firstname;
  }

  raiseTelemetry(content: any, i: number) {
    if (content) {
      this.events.raiseInteractTelemetry(
        {
          type: 'click',
          subType: `card-learnSearch`,
          // id: `${_.camelCase(content.primaryCategory)}-card`,
          id: `course-card-${i + 1}`,
          pageid: `/app/globalsearch_${content.primaryCategory}-card`,
        },
        {
          id: content.identifier || '',
          type: content.primaryCategory,
          rollup: {},
          ver: `${content.version}${''}`,
        },
        {
          // pageIdExt: `${content.primaryCategory}-card`,
          module: content.primaryCategory,
        }
      );
    }
  }

  ngOnDestroy() {
    if (this.defaultSideNavBarOpenedSubscription) {
      this.defaultSideNavBarOpenedSubscription.unsubscribe();
    }
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

      this.courseSearchResults.forEach((course: any) => {
        course?.organisation?.forEach((element: any) => {
          this.allResultsDepartmentName.add(element);
        });
      });
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
    this.searchRequestEvents.request.facets = SearchEventfacet;

    delete this.searchRequestEvents.request.filters?.courseCategory;
    delete this.searchRequestEvents.request.sort_by?.lastUpdatedOn;

    this.searchRequestEvents.request.query = this.statedata?.param || '';
    const result = await this.searchV3Service.searchCoursesv4(
      this.searchRequestEvents
    );
    if (result.result && result.result?.Event) {
      this.eventsSearchResults = result.result?.Event || [];
      this.eventSearchTotalCount = result.result?.count;
      this.eventsFacets = result.result?.facets;
      this.eventsSearchResults.forEach((event: any) => {
        this.allResultsDepartmentName.add(event?.sourceName);
      });
    } else {
      this.eventsSearchResults = [];
      this.eventSearchTotalCount = 0;
    }
  }

  async searchPeople() {
    const uniqueDepartmentNames = Array.from(this.allResultsDepartmentName);
    if (uniqueDepartmentNames.length > 0) {
      this.searchRequestPeoples.search[0].values = uniqueDepartmentNames;
      this.searchRequestPeoples.size = 10;
      let response = await this.searchV3Service.searchConnections(
        this.searchRequestPeoples
      );
      this.peoplesSearchResults = response?.result?.data?.[0]?.results || [];
      this.peopleSearchTotalCount = this.peoplesSearchResults.length;
      this.getAllConnectionRequests();
    }
  }

  async searchcommunities() {
    const uniqueDepartmentNames = Array.from(this.allResultsDepartmentName);
    // const uniqueDepartmentNames = ['Finance and Budget testing'];
    this.searchRequestCommunities.pageSize = 10;
    if (uniqueDepartmentNames.length > 0) {
      from(uniqueDepartmentNames)
        .pipe(
          mergeMap((deptName) => {
            const request = { ...this.searchRequestCommunities };
            request.filterCriteriaMap.orgName = deptName;
            return this.searchV3Service.searchCommunity(request);
          }),
          map((response) => {
            const data = response?.result?.search_results?.data || [];
            const totalCount =
              response?.result?.search_results?.totalCount || 0;
            const additionalInfo =
              (response?.result?.search_results?.additionalInfo &&
                response?.result?.search_results?.additionalInfo[0]) ||
              [];

            const enrichedData = data.map((item: any) => ({
              ...item,
              additionalInfo: additionalInfo,
            }));

            return { enrichedData, totalCount };
          }),
          toArray()
        )
        .subscribe((allResults) => {
          this.communitiesSearchResults = allResults.reduce(
            (acc, curr) => acc.concat(curr.enrichedData),
            []
          );
          this.communitiesSearchTotalCount = allResults.reduce(
            (sum, curr) => sum + curr.totalCount,
            0
          );
        });
    }
  }

  applySearchFilter(selectedFilters: { [key: string]: any }) {
    this.searchRequestCourse = new SearchV4Request([
      this.competencyAreaNameKey,
      this.competencyThemeKey,
      this.competencySubThemeKey,
    ]);
    this.searchRequestCourse.request.limit = this.initialPaginationSize;
    this.searchRequestCourse.request.filters.courseCategory = [];
    this.searchRequestCourse.request.filters.avgRating = {};

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
        } else if (key === this.competencyThemeKey) {
          this.searchRequestCourse.request.filters[this.competencyThemeKey] =
            selectedFilters[key];
        } else if (key === this.competencySubThemeKey) {
          this.searchRequestCourse.request.filters[this.competencySubThemeKey] =
            selectedFilters[key];
        } else if (key === SearchCategory.Events) {
          this.constructQueryParam('events');
          this.seeAllResult = SearchCategory.Events;
        } else if (key === SearchCategory.Courses) {
          this.constructQueryParam('courses');
          this.seeAllResult = SearchCategory.Courses;
        } else if (key === SearchCategory.CaseStudy) {
          this.constructQueryParam('case-studies');
          this.seeAllResult = SearchCategory.CaseStudy;
        } else if (key === SearchCategory.People) {
          this.constructQueryParam('peoples');
          this.seeAllResult = SearchCategory.People;
        } else if (key === SearchCategory.Communities) {
          this.constructQueryParam('communities');
          this.seeAllResult = SearchCategory.Communities;
        } else if (key === 'typeOfEvents') {
          this.searchRequestEvents.request.filters.status.push(
            ...selectedFilters[key]
          );
        } else {
          this.searchRequestCourse.request.filters.courseCategory!.push(
            ...selectedFilters[key]
          );
        }
      }
    });

    if (!Object.keys(selectedFilters).includes('typeOfEvents')) {
      this.searchRequestEvents.request.filters.status = [];
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
      this.searchCourses();
      this.searchEvents();
      this.searchPeople();
      this.searchcommunities();
    }
  }

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
  }

  async seeAllResults(category: string) {
    // this.seeAllResult.push(category);
    this.seeAllResult = category;
    if (category === SearchCategory.Courses) {
      this.eventSearchTotalCount = 0;
      this.peopleSearchTotalCount = 0;
      this.communitiesSearchTotalCount = 0;
      this.searchRequestCourse.request.limit = this.initialPaginationSize;
      await this.searchCourses();
      this.combinedFacets = [this.coursesFacets];
    } else if (category === SearchCategory.CaseStudy) {
      this.eventSearchTotalCount = 0;
      this.peopleSearchTotalCount = 0;
      this.communitiesSearchTotalCount = 0;
      this.searchRequestCourse.request.limit = this.initialPaginationSize;
      this.searchRequestCourse.request.filters.courseCategory = ['Case Study'];
      await this.searchCourses();
      this.combinedFacets = [this.coursesFacets];
    } else if (category === SearchCategory.Events) {
      this.courseSearchTotalCount = 0;
      this.peopleSearchTotalCount = 0;
      this.communitiesSearchTotalCount = 0;
      this.searchRequestEvents.request.limit = this.initialPaginationSize;
      await this.searchEvents();
      this.combinedFacets = [this.eventsFacets];
    } else if (category === SearchCategory.People) {
      this.courseSearchTotalCount = 0;
      this.eventSearchTotalCount = 0;
      this.communitiesSearchTotalCount = 0;
      this.searchRequestPeoples.size = this.initialPaginationSize;
      this.searchPeople();
    } else if (category === SearchCategory.Communities) {
      this.courseSearchTotalCount = 0;
      this.eventSearchTotalCount = 0;
      this.peopleSearchTotalCount = 0;
      this.searchRequestCommunities.pageSize = this.initialPaginationSize;
      this.searchcommunities();
    }
    this.isLoadingSearch = false;
    this.scrollToTop();
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
    this.searchRequestCommunities = new SearchCommunitiesRequest();

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
  }

  onPageChange(event: PageChangeEmitter) {
    if (this.seeAllResult === SearchCategory.Courses) {
      this.searchRequestCourse.request.limit = event.limit;
      this.searchRequestCourse.request.offset = event.currentPage * event.limit;
      this.searchCourses();
    } else if (this.seeAllResult === SearchCategory.Events) {
      this.searchRequestEvents.request.limit = event.limit;
      this.searchRequestEvents.request.offset = event.currentPage * event.limit;
      this.searchEvents();
    } else if (this.seeAllResult === SearchCategory.People) {
      this.searchRequestPeoples.size = event.limit;
      this.searchRequestPeoples.offset = event.currentPage * event.limit;
      this.searchPeople();
    } else if (this.seeAllResult === SearchCategory.Communities) {
      this.searchRequestCommunities.pageSize = event.limit;
      this.searchRequestCommunities.pageNumber = event.currentPage;
      this.searchcommunities();
    }
    this.scrollToTop();
  }

  onChangeSortSearch(event: string) {
    this.resetPagination();
    this.searchRequestCourse.request.sort_by = {};
    this.searchRequestCourse.request.limit = this.initialPaginationSize;
    this.searchRequestCourse.request.offset = 0;

    this.searchRequestEvents.request.sort_by = {};
    this.searchRequestEvents.request.limit = this.initialPaginationSize;
    this.searchRequestEvents.request.offset = 0;
    if (event === SortType.MostRelevent) {
      if (this.seeAllResult === '') {
        this.searchCourses();
        this.searchEvents();
        this.searchPeople();
        this.searchcommunities();
      } else if (this.seeAllResult === SearchCategory.Courses) {
        this.searchRequestCourse.request.sort_by = {};
        this.searchCourses();
      } else if (this.seeAllResult === SearchCategory.Events) {
        this.searchRequestEvents.request.sort_by = {};
        this.searchEvents();
      }
    } else if (event === SortType.RecentlyAdded) {
      if (this.seeAllResult === '') {
        this.searchRequestCourse.request.sort_by.lastUpdatedOn = 'desc';
        this.searchRequestEvents.request.sort_by.startDate = 'desc';
        this.searchCourses();
        this.searchEvents();
        this.searchPeople();
        this.searchcommunities();
      } else if (this.seeAllResult === SearchCategory.Courses) {
        this.searchRequestCourse.request.sort_by.lastUpdatedOn = 'desc';
        this.searchCourses();
      } else if (this.seeAllResult === SearchCategory.Events) {
        this.searchRequestEvents.request.sort_by.startDate = 'desc';
        this.searchEvents();
      }
    } else if (event === SortType.HighestRated) {
      if (this.seeAllResult === '') {
        this.searchRequestCourse.request.sort_by.avgRating = 'desc';
        this.searchRequestEvents.request.sort_by.avgRating = 'desc';
        this.searchCourses();
        this.searchEvents();
        this.searchPeople();
        this.searchcommunities();
      } else if (this.seeAllResult === SearchCategory.Courses) {
        this.searchRequestCourse.request.sort_by.avgRating = 'desc';
        this.searchCourses();
      } else if (this.seeAllResult === SearchCategory.Events) {
        this.searchRequestEvents.request.sort_by.avgRating = 'desc';
        this.searchEvents();
      }
    } else if (event === SortType.MostEnrolled) {
    }
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
    };
    this.queryParamChange.emit(this.queryParams);
  }

  resetPagination() {
    this.initialPaginationPage = 2;
    setTimeout(() => {
      this.initialPaginationPage = 1;
    });
  }
}
