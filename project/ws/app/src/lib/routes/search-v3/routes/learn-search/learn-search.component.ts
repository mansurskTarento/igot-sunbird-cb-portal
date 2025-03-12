import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { GbSearchService } from '../../services/gb-search.service';
import {
  ConfigurationsService,
  EventService,
  MultilingualTranslationsService,
  ValueService,
} from '@sunbird-cb/utils-v2';
import { Router } from '@angular/router';
// tslint:disable-next-line
import _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';

import { WidgetContentLibService } from '@sunbird-cb/consumption';
import {
  PageChangeEmitter,
  SearchCategory,
  SearchCommunitiesRequest,
  SearchEventfacet,
  SearchEventFields,
  SearchPeoplesRequest,
  SearchV4Request,
} from '../../models/search-v3.model';
import { from } from 'rxjs';
import { map, mergeMap, toArray } from 'rxjs/operators';
import { NsContent } from '@sunbird-cb/collection/src/public-api';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'ws-app-learn-search',
  templateUrl: './learn-search.component.html',
  styleUrls: ['./learn-search.component.scss'],
})
export class LearnSearchComponent implements OnInit, OnChanges, OnDestroy {
  @Input() searchQuery!: { query: string; nlp: string };
  @Input() userValue = '';
  @Input() paramFilters: any = [];
  @Input() filtersPanel!: string;

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
  seeAllResult = '';
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

  coursesFacets = [];
  eventsFacets = [];
  combinedFacets: any[] = [];
  compentencyKey!: NsContent.ICompentencyKeys;

  constructor(
    private searchV3Service: GbSearchService,
    private configSvc: ConfigurationsService,
    private events: EventService,
    // private activated: ActivatedRoute,
    private valueSvc: ValueService,
    private translate: TranslateService,
    private contSvc: WidgetContentLibService,
    private router: Router,
    private langtranslations: MultilingualTranslationsService
  ) {
    if (localStorage.getItem('websiteLanguage')) {
      this.translate.setDefaultLang('en');
      const lang = localStorage.getItem('websiteLanguage')!;
      this.translate.use(lang);
    }

    this.compentencyKey =
      this.configSvc.compentency[environment.compentencyVersionKey];
  }

  ngOnInit() {
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

    // if (
    //   this.activated.snapshot.data.recommendedPeople &&
    //   this.activated.snapshot.data.recommendedPeople.data.result
    // ) {
    //   this.recommendedUsers =
    //     this.activated.snapshot.data.recommendedPeople.data.result.data.find(
    //       (item: any) => item.field === 'employmentDetails.departmentName'
    //     ).results;
    //   this.recommendedUsers.sort((a: any, b: any) => {
    //     return this.getName(a.personalDetails)
    //       .toLowerCase()
    //       .localeCompare(this.getName(b.personalDetails).toLowerCase());
    //   });
    // }
    this.updateNoResultMessage(this.statedata.param);
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
      changes.searchQuery.currentValue?.query !==
      changes.searchQuery.previousValue?.query
    ) {
      this.statedata = {
        param: this.searchQuery?.nlp
          ? this.searchQuery?.nlp
          : this.searchQuery.query,
        path: 'Search',
      };
      this.isLoadingSearch = true;
      this.resetAllSearchParams();
      await this.searchCourses();
      await this.searchEvents();
      await this.searchPeople();
      await this.searchcommunities();

      this.isLoadingSearch = false;
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

  connectionUpdatePeopleCard(_event: any) {
    // if (event === 'connection-updated') {
    //   // let usrDept = 'igot'
    //   // if (this.me) {
    //   //   usrDept = this.me.departmentName || 'igot'
    //   // }
    //   let req: NSNetworkDataV2.IRecommendedUserReq;
    //   req = {
    //     size: 50,
    //     offset: 0,
    //     search: [
    //       {
    //         field: 'employmentDetails.departmentName',
    //         values: [this.currentUserDept],
    //       },
    //     ],
    //   };
    //   this.networkV2Service.fetchAllRecommendedUsers(req).subscribe(
    //     (data: any) => {
    //       this.recommendedUsers = data.result.data.find(
    //         (item: any) => item.field === 'employmentDetails.departmentName'
    //       ).results;
    //       this.getAllConnectionRequests();
    //     },
    //     (_err: any) => {
    //       // this.openSnackbar(err.error.message.split('|')[1] || this.defaultError)
    //     }
    //   );
    // }
  }

  async searchCourses() {
    this.searchRequestCourse.request.query = this.statedata?.param;
    // this.searchRequestCourse.request.filters.contentType = ['Course']
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
      `${this.compentencyKey.vKey}.${this.compentencyKey.vCompetencyArea}`,
      `${this.compentencyKey.vKey}.${this.compentencyKey.vCompetencyTheme}`,
      `${this.compentencyKey.vKey}.${this.compentencyKey.vCompetencySubTheme}`,
    ]);
    this.searchRequestCourse.request.limit = this.initialPaginationSize;
    this.searchRequestCourse.request.filters.courseCategory = [];
    this.searchRequestCourse.request.filters.avgRating = {};

    Object.keys(selectedFilters).forEach((key) => {
      if (selectedFilters[key] && Array.isArray(selectedFilters[key])) {
        if (key === 'avgRating') {
          const ratings = selectedFilters[key]
            .map((val: string) => parseFloat(val.split(' ')[0]))
            .filter((num: any) => !isNaN(num));

          if (ratings.length > 0) {
            this.searchRequestCourse.request.filters.avgRating = {
              '>=': String(Math.min(...ratings)),
            };
          }
        } else if (key === 'language') {
          this.searchRequestCourse.request.filters.language =
            selectedFilters[key];
        } else if (key === 'organisation') {
          this.searchRequestCourse.request.filters.organisation =
            selectedFilters[key];
        } else if (
          key ===
          `${this.compentencyKey.vKey}.${this.compentencyKey.vCompetencyArea}`
        ) {
          this.searchRequestCourse.request.filters[
            `${this.compentencyKey.vKey}.${this.compentencyKey.vCompetencyArea}`
          ] = selectedFilters[key];
        } else {
          this.searchRequestCourse.request.filters.courseCategory!.push(
            ...selectedFilters[key]
          );
        }
      }
    });

    this.deleteFilterKeys();

    this.searchCourses();
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
      this.searchRequestCourse.request.filters[
        `${this.compentencyKey.vKey}.${this.compentencyKey.vCompetencyArea}`
      ] &&
      this.searchRequestCourse.request.filters[
        `${this.compentencyKey.vKey}.${this.compentencyKey.vCompetencyArea}`
      ].length === 0
    ) {
      delete this.searchRequestCourse.request.filters[
        `${this.compentencyKey.vKey}.${this.compentencyKey.vCompetencyArea}`
      ];
    }
  }

  async seeAllResults(category: string) {
    this.seeAllResult = category;
    // this.combinedFacets = [];
    if (category === SearchCategory.Courses) {
      this.searchRequestCourse.request.limit = this.initialPaginationSize;
      this.combinedFacets = [this.coursesFacets];
      await this.searchCourses();
    } else if (category === SearchCategory.Events) {
      this.searchRequestEvents.request.limit = this.initialPaginationSize;
      this.combinedFacets = [this.eventsFacets];
      await this.searchEvents();
    } else if (category === SearchCategory.People) {
      this.searchRequestPeoples.size = this.initialPaginationSize;
      this.searchPeople();
    } else if (category === SearchCategory.Communities) {
      this.searchRequestCommunities.pageSize = this.initialPaginationSize;
      this.searchcommunities();
    }
  }

  resetAllSearchParams() {
    this.searchRequestCourse = new SearchV4Request([
      `${this.compentencyKey.vKey}.${this.compentencyKey.vCompetencyArea}`,
      `${this.compentencyKey.vKey}.${this.compentencyKey.vCompetencyTheme}`,
      `${this.compentencyKey.vKey}.${this.compentencyKey.vCompetencySubTheme}`,
    ]);
    this.searchRequestEvents = new SearchV4Request([
      `${this.compentencyKey.vKey}.${this.compentencyKey.vCompetencyArea}`,
      `${this.compentencyKey.vKey}.${this.compentencyKey.vCompetencyTheme}`,
      `${this.compentencyKey.vKey}.${this.compentencyKey.vCompetencySubTheme}`,
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
  }

  onChangeSortSearch(event: string) {
    this.searchRequestCourse.request.sort_by = {};
    this.searchRequestEvents.request.sort_by = {};
    if (event === 'most_relevant') {
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
    } else if (event === 'recently_added_newest') {
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
    } else if (event === 'highest_rated') {
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
    } else if (event === 'most_enrolled') {
    }
  }
}
