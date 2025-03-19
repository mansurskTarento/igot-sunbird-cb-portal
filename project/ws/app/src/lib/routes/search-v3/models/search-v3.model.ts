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
  sourceName?: string;
  avgRating?: { [key: string]: string };
  language?: string[];
  organisation?: string[];
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
  size: number;
  offset: number;
  search: { field: string; values: string[] }[];

  constructor() {
    this.size = 3;
    this.offset = 0;
    this.search = [
      {
        field: 'employmentDetails.departmentName',
        values: [],
      },
    ];
  }
}

export class SearchCommunitiesRequest {
  filterCriteriaMap: {
    status: string;
    orgName?: string[];
    competencyArea?: string[]
    topicName?: string[]
  };
  requestedFields: any[];
  pageNumber: number;
  pageSize: number;
  facets: string[];
  searchString: string | null;
  orderBy?: string;
  orderDirection?: string;

  constructor() {
    this.filterCriteriaMap = {
      status: 'active',
    };
    this.requestedFields = [];
    this.pageNumber = 0;
    this.pageSize = 3;
    this.searchString = null;
    this.facets = ['topicName', 'orgName', 'competencyArea'];
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
}

export enum SortType {
  MostRelevent = 'most_relevant',
  RecentlyAdded = 'recently_added_newest',
  HighestRated = 'highest_rated',
  MostEnrolled = 'most_enrolled',
}
