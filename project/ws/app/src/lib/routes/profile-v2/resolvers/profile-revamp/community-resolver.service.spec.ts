import { TestBed } from '@angular/core/testing';
import { RouterStateSnapshot } from '@angular/router';
import { IResolveResponse } from '@sunbird-cb/utils-v2';
import { of, throwError } from 'rxjs';
import { CommunityResolverService } from './community-resolver.service';
import { NSProfileDataV2 } from '../../models/profile-v2.model';
import { ProfileV2RevampService } from '../../services/profile-v2-revamp.service';
import * as _ from 'lodash';

// Mock the lodash module
jest.mock('lodash', () => ({
  get: jest.fn()
}));

describe('CommunityResolverService', () => {
  let resolver: CommunityResolverService;
  let mockProfileService: any;
  let mockRoute: any;
  let mockState: any;
  let mockLodashGet: any;

  const mockCommunitiesData = {
    result: {
      search_results: {
        data: [
          {
            id: 'community-1',
            name: 'Finance Community',
            description: 'Community for finance professionals',
            topicName: 'Finance',
            status: 'active',
            memberCount: 150
          },
          {
            id: 'community-2',
            name: 'Tech Community',
            description: 'Community for technology enthusiasts',
            topicName: 'Technology',
            status: 'active',
            memberCount: 200
          },
          {
            id: 'community-3',
            name: 'HR Community',
            description: 'Community for HR professionals',
            topicName: 'Human Resources',
            status: 'active',
            memberCount: 75
          }
        ],
        totalCount: 3
      }
    }
  };

  const expectedFormBody = {
    filterCriteriaMap: {
      status: "active"
    },
    requestedFields: [],
    pageNumber: 0,
    pageSize: 3,
    facets: [
      "topicName"
    ]
  };

  beforeEach(() => {
    // Mock ProfileV2RevampService
    mockProfileService = {
      getCommunities: jest.fn()
    };

    // Mock ActivatedRouteSnapshot
    mockRoute = {
      params: {},
      queryParams: {},
      routeConfig: { path: '' }
    };

    // Mock RouterStateSnapshot
    mockState = {} as RouterStateSnapshot;

    // Mock lodash get function
    mockLodashGet = _.get as jest.Mock;

    TestBed.configureTestingModule({
      providers: [
        CommunityResolverService,
        { provide: ProfileV2RevampService, useValue: mockProfileService }
      ]
    });

    resolver = TestBed.inject(CommunityResolverService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('resolve', () => {
    it('should create resolver instance', () => {
      expect(resolver).toBeDefined();
      expect(resolver).toBeInstanceOf(CommunityResolverService);
    });

    it('should resolve communities data with correct form body', (done) => {
      // Arrange
      mockProfileService.getCommunities.mockReturnValue(of(mockCommunitiesData));
      mockLodashGet.mockReturnValue(mockCommunitiesData.result.search_results.data);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.getCommunities).toHaveBeenCalledWith(expectedFormBody);
        expect(mockLodashGet).toHaveBeenCalledWith(mockCommunitiesData, 'result.search_results.data');
        expect(response.data).toEqual(mockCommunitiesData.result.search_results.data);
        expect(response.error).toBeNull();
        done();
      });
    });

    it('should handle empty communities array', (done) => {
      // Arrange
      const emptyCommunitiesData = {
        result: {
          search_results: {
            data: [],
            totalCount: 0
          }
        }
      };
      mockProfileService.getCommunities.mockReturnValue(of(emptyCommunitiesData));
      mockLodashGet.mockReturnValue([]);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.getCommunities).toHaveBeenCalledWith(expectedFormBody);
        expect(response.data).toEqual([]);
        expect(response.error).toBeNull();
        done();
      });
    });

    it('should handle undefined result from lodash get', (done) => {
      // Arrange
      mockProfileService.getCommunities.mockReturnValue(of(mockCommunitiesData));
      mockLodashGet.mockReturnValue(undefined);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.getCommunities).toHaveBeenCalledWith(expectedFormBody);
        expect(mockLodashGet).toHaveBeenCalledWith(mockCommunitiesData, 'result.search_results.data');
        expect(response.data).toBeUndefined();
        expect(response.error).toBeNull();
        done();
      });
    });

    it('should handle null response data', (done) => {
      // Arrange
      const nullResponseData = {
        result: {
          search_results: {
            data: null,
            totalCount: 0
          }
        }
      };
      mockProfileService.getCommunities.mockReturnValue(of(nullResponseData));
      mockLodashGet.mockReturnValue(null);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.getCommunities).toHaveBeenCalledWith(expectedFormBody);
        expect(response.data).toBeNull();
        expect(response.error).toBeNull();
        done();
      });
    });

    it('should handle malformed response data', (done) => {
      // Arrange
      const malformedData = {
        someOtherProperty: 'value',
        result: {
          otherData: 'test'
        }
      };
      mockProfileService.getCommunities.mockReturnValue(of(malformedData));
      mockLodashGet.mockReturnValue(undefined);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.getCommunities).toHaveBeenCalledWith(expectedFormBody);
        expect(mockLodashGet).toHaveBeenCalledWith(malformedData, 'result.search_results.data');
        expect(response.data).toBeUndefined();
        expect(response.error).toBeNull();
        done();
      });
    });

    it('should handle missing search_results', (done) => {
      // Arrange
      const missingSearchResults = {
        result: {
          otherProperty: 'value'
        }
      };
      mockProfileService.getCommunities.mockReturnValue(of(missingSearchResults));
      mockLodashGet.mockReturnValue(undefined);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.getCommunities).toHaveBeenCalledWith(expectedFormBody);
        expect(response.data).toBeUndefined();
        expect(response.error).toBeNull();
        done();
      });
    });

    it('should handle missing result property', (done) => {
      // Arrange
      const missingResult = {
        otherProperty: 'value'
      };
      mockProfileService.getCommunities.mockReturnValue(of(missingResult));
      mockLodashGet.mockReturnValue(undefined);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.getCommunities).toHaveBeenCalledWith(expectedFormBody);
        expect(response.data).toBeUndefined();
        expect(response.error).toBeNull();
        done();
      });
    });

    it('should handle service error', (done) => {
      // Arrange
      const mockError = { message: 'Failed to fetch communities' };
      mockProfileService.getCommunities.mockReturnValue(throwError(mockError));

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.getCommunities).toHaveBeenCalledWith(expectedFormBody);
        expect(response.data).toBeNull();
        expect(response.error).toEqual(mockError);
        done();
      });
    });

    it('should handle HTTP 400 error', (done) => {
      // Arrange
      const badRequestError = { 
        status: 400, 
        statusText: 'Bad Request',
        message: 'Invalid request parameters'
      };
      mockProfileService.getCommunities.mockReturnValue(throwError(badRequestError));

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.getCommunities).toHaveBeenCalledWith(expectedFormBody);
        expect(response.data).toBeNull();
        expect(response.error).toEqual(badRequestError);
        done();
      });
    });

    it('should handle HTTP 404 error', (done) => {
      // Arrange
      const notFoundError = { 
        status: 404, 
        statusText: 'Not Found',
        message: 'Communities not found'
      };
      mockProfileService.getCommunities.mockReturnValue(throwError(notFoundError));

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.getCommunities).toHaveBeenCalledWith(expectedFormBody);
        expect(response.data).toBeNull();
        expect(response.error).toEqual(notFoundError);
        done();
      });
    });

    it('should handle HTTP 500 error', (done) => {
      // Arrange
      const serverError = { 
        status: 500, 
        statusText: 'Internal Server Error',
        message: 'Server error occurred'
      };
      mockProfileService.getCommunities.mockReturnValue(throwError(serverError));

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.getCommunities).toHaveBeenCalledWith(expectedFormBody);
        expect(response.data).toBeNull();
        expect(response.error).toEqual(serverError);
        done();
      });
    });

    it('should handle network timeout error', (done) => {
      // Arrange
      const timeoutError = { 
        name: 'TimeoutError', 
        message: 'Request timed out' 
      };
      mockProfileService.getCommunities.mockReturnValue(throwError(timeoutError));

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.getCommunities).toHaveBeenCalledWith(expectedFormBody);
        expect(response.data).toBeNull();
        expect(response.error).toEqual(timeoutError);
        done();
      });
    });

    it('should verify form body structure is correct', () => {
      // Arrange
      mockProfileService.getCommunities.mockReturnValue(of(mockCommunitiesData));
      mockLodashGet.mockReturnValue(mockCommunitiesData.result.search_results.data);

      // Act
      resolver.resolve(mockRoute, mockState).subscribe();

      // Assert
      const calledFormBody = mockProfileService.getCommunities.mock.calls[0][0];
      expect(calledFormBody).toEqual(expectedFormBody);
      expect(calledFormBody.filterCriteriaMap.status).toBe('active');
      expect(calledFormBody.requestedFields).toEqual([]);
      expect(calledFormBody.pageNumber).toBe(0);
      expect(calledFormBody.pageSize).toBe(3);
      expect(calledFormBody.facets).toEqual(['topicName']);
    });

    it('should handle single community in results', (done) => {
      // Arrange
      const singleCommunityData = {
        result: {
          search_results: {
            data: [
              {
                id: 'single-community',
                name: 'Single Community',
                status: 'active',
                topicName: 'General'
              }
            ],
            totalCount: 1
          }
        }
      };
      mockProfileService.getCommunities.mockReturnValue(of(singleCommunityData));
      mockLodashGet.mockReturnValue(singleCommunityData.result.search_results.data);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: any) => {
        expect(response.data).toHaveLength(1);
        expect(response.data[0].id).toBe('single-community');
        expect(response.error).toBeNull();
        done();
      });
    });

    it('should not depend on route parameters', (done) => {
      // Arrange
      mockRoute.params = { someParam: 'value' };
      mockRoute.queryParams = { query: 'test' };
      mockProfileService.getCommunities.mockReturnValue(of(mockCommunitiesData));
      mockLodashGet.mockReturnValue(mockCommunitiesData.result.search_results.data);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.getCommunities).toHaveBeenCalledWith(expectedFormBody);
        expect(response.data).toBeDefined();
        expect(response.error).toBeNull();
        done();
      });
    });

    it('should handle communities with different statuses but only return active ones based on filter', (done) => {
      // Arrange
      const mixedStatusData = {
        result: {
          search_results: {
            data: [
              {
                id: 'active-community',
                name: 'Active Community',
                status: 'active'
              }
            ],
            totalCount: 1
          }
        }
      };
      mockProfileService.getCommunities.mockReturnValue(of(mixedStatusData));
      mockLodashGet.mockReturnValue(mixedStatusData.result.search_results.data);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: any) => {
        expect(mockProfileService.getCommunities).toHaveBeenCalledWith(expectedFormBody);
        expect(response.data[0].status).toBe('active');
        expect(response.error).toBeNull();
        done();
      });
    });

    it('should handle communities with various facets', (done) => {
      // Arrange
      const facetedCommunitiesData = {
        result: {
          search_results: {
            data: [
              {
                id: 'tech-community',
                name: 'Tech Community',
                topicName: 'Technology',
                status: 'active'
              },
              {
                id: 'finance-community',
                name: 'Finance Community',
                topicName: 'Finance',
                status: 'active'
              }
            ],
            facets: {
              topicName: ['Technology', 'Finance']
            },
            totalCount: 2
          }
        }
      };
      mockProfileService.getCommunities.mockReturnValue(of(facetedCommunitiesData));
      mockLodashGet.mockReturnValue(facetedCommunitiesData.result.search_results.data);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: any) => {
        expect(response.data).toHaveLength(2);
        expect(response.data[0].topicName).toBe('Technology');
        expect(response.data[1].topicName).toBe('Finance');
        expect(response.error).toBeNull();
        done();
      });
    });

    it('should handle partial response structure', (done) => {
      // Arrange
      const partialData = {
        result: {
          search_results: {
            // Missing data property
            totalCount: 0
          }
        }
      };
      mockProfileService.getCommunities.mockReturnValue(of(partialData));
      mockLodashGet.mockReturnValue(undefined);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockLodashGet).toHaveBeenCalledWith(partialData, 'result.search_results.data');
        expect(response.data).toBeUndefined();
        expect(response.error).toBeNull();
        done();
      });
    });
  });
});