export class SearchV4Request {
  request: RequestParams;
  locale?: string[];
  constructor(competenciesKey: any) {
    this.request = new RequestParams(competenciesKey);
  }
}

export class RequestParams {
  filters: Filters;
  fields: any[];
  facets: string[];
  query: string;
  limit: number;
  offset: number;
  sort_by: SortBy;

  constructor(competenciesKey: any) {
    this.filters = new Filters();
    this.fields = [];
    this.facets = [...SearchOthersFacet, ...competenciesKey];
    this.query = '';
    this.limit = 3;
    this.offset = 0;
    this.sort_by = new SortBy();
  }
}

export class Filters {
  contentType: any;
  courseCategory?: any;
  status: string[];
  sourceName?: string[];
  avgRating?: { [key: string]: string };
  language?: string[];
  organisation?: string[];
  sectorId?: string[];
  [key: string]: any;
  constructor() {
    this.contentType = ['Course'];
    this.courseCategory = [];
    this.status = ['Live'];
  }
}

export class SortBy {
  lastUpdatedOn?: string;
  startDate?: string;
  avgRating?: string;
  firstName?: string;
  constructor() {
    // this.lastUpdatedOn = 'desc';
  }
}

export enum SearchCategory {
  All = '',
  Courses = 'courses',
  Programs = 'programs',
  Events = 'events',
  People = 'peoples',
  CaseStudy = 'case-studies',
  Communities = 'communities',
}

export const SearchOthersFacet = [
  'duration',
  'avgRating',
  'language',
  'organisation',
  'sectorId',
];

// Events
export const SearchEventfacet = ['duration', 'language', 'sourceName'];

export const SearchEventFields = [
  'name',
  'instructions',
  'description',
  'mimeType',
  'identifier',
  'resourceType',
  'contentType',
  'channel',
  'sourceName',
  'duration',
  'competencies_v6',
  'version',
  'startDate',
  'endDate',
  'startTime',
  'endTime',
  'status',
  'createdOn',
  'eventType',
  'expiryDate',
  'creatorDetails',
  'appIcon',
  'recordedLinks',
];

export class SearchPeoplesRequest {
  filters: PeoplesFilters;
  facets?: string[];
  fields: any[];
  limit: number;
  offset: number;
  sort_by: SortBy;
  query: string;
  constructor() {
    this.limit = 5;
    this.offset = 0;
    this.sort_by = { firstName: 'asc' };
    (this.query = ''), (this.fields = []);
    this.filters = new PeoplesFilters();
    this.facets = [
      'profileDetails.professionalDetails.designation',
      'rootOrgName',
    ];
  }
}

export class PeoplesFilters {
  rootOrgName?: string[];
  [key: string]: any;
}

export class SearchCommunitiesRequest {
  filterCriteriaMap: {
    status: string;
    orgName?: string[];
    competencyArea?: string[];
    topicName?: string[];
      [key: string]: any;
  };
  requestedFields: any[];
  pageNumber: number;
  pageSize: number;
  facets: string[];
  searchString: string | null;
  orderBy?: string;
  orderDirection?: string;

  constructor(competenciesKey: any) {
    this.filterCriteriaMap = {
      status: 'active',
    };
    this.requestedFields = [];
    this.pageNumber = 0;
    this.pageSize = 3;
    this.searchString = null;
    this.facets = ['topicName', 'orgName', ...competenciesKey];
  }
}

export class SearchNLP {
  query: string;
  synonyms: boolean;
  constructor() {
    this.query = '';
    this.synonyms = false;
  }
}

export interface PageChangeEmitter {
  currentPage: number;
  previousPage: number;
  limit: number;
}

export type Facet = {
  name: string;
  values: { name: string; count: number }[];
};

export type FormattedFacets = {
  [key: string]: { name: string; count: number }[] | null;
};

export enum FacetType {
  Organization = 'organisation',
  Language = 'language',
  AvgRating = 'avgRating',
  Duration = 'duration',
  Designation = 'designation',
  SourceName = 'sourceName',
}

export enum SortType {
  MostRelevent = 'most_relevant',
  RecentlyAdded = 'recently_added_newest',
  HighestRated = 'highest_rated',
  MostEnrolled = 'most_enrolled',
  Ascending = 'asc',
  Descending = 'desc',
}
