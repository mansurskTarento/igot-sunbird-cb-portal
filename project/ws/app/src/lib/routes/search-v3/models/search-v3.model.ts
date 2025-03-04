export class SearchV4Request {
  request: RequestParams;
  locale?: string[];
  constructor() {
    this.request = new RequestParams();
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

  constructor() {
    this.filters = new Filters();
    this.fields = [];
    this.facets = SearchOthersFacet;
    this.query = '';
    this.limit = 3;
    this.offset = 0;
    this.sort_by = new SortBy();
  }
}

export class Filters {
  contentType: string;
  courseCategory?: string;
  status: string[];
  sourceName?: string;
  constructor() {
    this.contentType = 'course';
    this.courseCategory = 'course';
    this.status = ['Live'];
  }
}

export class SortBy {
  lastUpdatedOn?: string;
  startDate?: string;
  constructor() {
    this.lastUpdatedOn = 'desc';
  }
}

export enum SearchCategory {
  All = '',
  Courses = 'courses',
  Programs = 'programs',
  Events = 'events',
  People = 'people',
  CaseStudy = 'case-studies',
  Communities = 'communities',
}

export const SearchOthersFacet = [
  'duration',
  'rating',
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
    orgName: string;
  };
  requestedFields: any[];
  pageNumber: number;
  pageSize: number;
  searchString: string | null;

  constructor() {
    this.filterCriteriaMap = {
      status: 'active',
      orgName: '',
    };
    this.requestedFields = [];
    this.pageNumber = 0;
    this.pageSize = 3;
    this.searchString = null;
  }
}
