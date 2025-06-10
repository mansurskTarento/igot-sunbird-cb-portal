import { TestBed } from '@angular/core/testing';
import { RouterStateSnapshot } from '@angular/router';
import { IResolveResponse } from '@sunbird-cb/utils-v2';
import { of, throwError } from 'rxjs';
import { connectionsResolverResolver } from './connections-resolver.resolver';
import { NSProfileDataV2 } from '../../models/profile-v2.model';
import { ProfileV2RevampService } from '../../services/profile-v2-revamp.service';
import * as _ from 'lodash';

// Mock the lodash module
jest.mock('lodash', () => ({
  get: jest.fn()
}));

describe('connectionsResolverResolver', () => {
  let resolver: connectionsResolverResolver;
  let mockProfileService: any;
  let mockRoute: any;
  let mockState: any;
  let mockLodashGet: any;

  const mockRecommendedUsersData = {
    result: {
      data: [{
        results: [
          {
            userId: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            employmentDetails: {
              departmentName: 'Finance And Budget',
              designation: 'Manager'
            }
          },
          {
            userId: 'user-2',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@example.com',
            employmentDetails: {
              departmentName: 'Finance And Budget',
              designation: 'Senior Analyst'
            }
          }
        ]
      }]
    }
  };

  const expectedFormBody = {
    offset: 0,
    search: [
      {
        field: 'employmentDetails.departmentName',
        values: [
          'Finance And Budget'
        ]
      }
    ]
  };

  beforeEach(() => {
    // Mock ProfileV2RevampService
    mockProfileService = {
      getRecommendedUsers: jest.fn()
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
        connectionsResolverResolver,
        { provide: ProfileV2RevampService, useValue: mockProfileService }
      ]
    });

    resolver = TestBed.inject(connectionsResolverResolver);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('resolve', () => {
    it('should create resolver instance', () => {
      expect(resolver).toBeDefined();
      expect(resolver).toBeInstanceOf(connectionsResolverResolver);
    });

    it('should resolve recommended users with correct form body', (done) => {
      // Arrange
      mockProfileService.getRecommendedUsers.mockReturnValue(of(mockRecommendedUsersData));
      mockLodashGet.mockReturnValue(mockRecommendedUsersData.result.data[0].results);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.getRecommendedUsers).toHaveBeenCalledWith(expectedFormBody);
        expect(mockLodashGet).toHaveBeenCalledWith(mockRecommendedUsersData, 'result.data[0].results');
        expect(response.data).toEqual(mockRecommendedUsersData.result.data[0].results);
        expect(response.error).toBeNull();
        done();
      });
    });

    it('should handle empty results array', (done) => {
      // Arrange
      const emptyResultsData = {
        result: {
          data: [{
            results: []
          }]
        }
      };
      mockProfileService.getRecommendedUsers.mockReturnValue(of(emptyResultsData));
      mockLodashGet.mockReturnValue([]);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.getRecommendedUsers).toHaveBeenCalledWith(expectedFormBody);
        expect(response.data).toEqual([]);
        expect(response.error).toBeNull();
        done();
      });
    });

    it('should handle undefined result from lodash get', (done) => {
      // Arrange
      mockProfileService.getRecommendedUsers.mockReturnValue(of(mockRecommendedUsersData));
      mockLodashGet.mockReturnValue(undefined);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.getRecommendedUsers).toHaveBeenCalledWith(expectedFormBody);
        expect(mockLodashGet).toHaveBeenCalledWith(mockRecommendedUsersData, 'result.data[0].results');
        expect(response.data).toBeUndefined();
        expect(response.error).toBeNull();
        done();
      });
    });

    it('should handle null response data', (done) => {
      // Arrange
      const nullResponseData = {
        result: {
          data: [{
            results: null
          }]
        }
      };
      mockProfileService.getRecommendedUsers.mockReturnValue(of(nullResponseData));
      mockLodashGet.mockReturnValue(null);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.getRecommendedUsers).toHaveBeenCalledWith(expectedFormBody);
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
      mockProfileService.getRecommendedUsers.mockReturnValue(of(malformedData));
      mockLodashGet.mockReturnValue(undefined);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.getRecommendedUsers).toHaveBeenCalledWith(expectedFormBody);
        expect(mockLodashGet).toHaveBeenCalledWith(malformedData, 'result.data[0].results');
        expect(response.data).toBeUndefined();
        expect(response.error).toBeNull();
        done();
      });
    });

    it('should handle missing data array', (done) => {
      // Arrange
      const missingDataArray = {
        result: {}
      };
      mockProfileService.getRecommendedUsers.mockReturnValue(of(missingDataArray));
      mockLodashGet.mockReturnValue(undefined);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.getRecommendedUsers).toHaveBeenCalledWith(expectedFormBody);
        expect(response.data).toBeUndefined();
        expect(response.error).toBeNull();
        done();
      });
    });

    it('should handle empty data array', (done) => {
      // Arrange
      const emptyDataArray = {
        result: {
          data: []
        }
      };
      mockProfileService.getRecommendedUsers.mockReturnValue(of(emptyDataArray));
      mockLodashGet.mockReturnValue(undefined);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.getRecommendedUsers).toHaveBeenCalledWith(expectedFormBody);
        expect(response.data).toBeUndefined();
        expect(response.error).toBeNull();
        done();
      });
    });

    it('should handle service error', (done) => {
      // Arrange
      const mockError = { message: 'Failed to fetch recommended users' };
      mockProfileService.getRecommendedUsers.mockReturnValue(throwError(mockError));

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.getRecommendedUsers).toHaveBeenCalledWith(expectedFormBody);
        expect(response.data).toBeNull();
        expect(response.error).toEqual(mockError);
        done();
      });
    });

    it('should handle HTTP 404 error', (done) => {
      // Arrange
      const httpError = { 
        status: 404, 
        statusText: 'Not Found',
        message: 'Resource not found'
      };
      mockProfileService.getRecommendedUsers.mockReturnValue(throwError(httpError));

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.getRecommendedUsers).toHaveBeenCalledWith(expectedFormBody);
        expect(response.data).toBeNull();
        expect(response.error).toEqual(httpError);
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
      mockProfileService.getRecommendedUsers.mockReturnValue(throwError(serverError));

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.getRecommendedUsers).toHaveBeenCalledWith(expectedFormBody);
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
      mockProfileService.getRecommendedUsers.mockReturnValue(throwError(timeoutError));

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.getRecommendedUsers).toHaveBeenCalledWith(expectedFormBody);
        expect(response.data).toBeNull();
        expect(response.error).toEqual(timeoutError);
        done();
      });
    });

    it('should verify form body structure is correct', () => {
      // Arrange
      mockProfileService.getRecommendedUsers.mockReturnValue(of(mockRecommendedUsersData));
      mockLodashGet.mockReturnValue(mockRecommendedUsersData.result.data[0].results);

      // Act
      resolver.resolve(mockRoute, mockState).subscribe();

      // Assert
      const calledFormBody = mockProfileService.getRecommendedUsers.mock.calls[0][0];
      expect(calledFormBody).toEqual(expectedFormBody);
      expect(calledFormBody.offset).toBe(0);
      expect(calledFormBody.search).toHaveLength(1);
      expect(calledFormBody.search[0].field).toBe('employmentDetails.departmentName');
      expect(calledFormBody.search[0].values).toEqual(['Finance And Budget']);
    });

    it('should handle single user in results', (done) => {
      // Arrange
      const singleUserData = {
        result: {
          data: [{
            results: [
              {
                userId: 'single-user',
                firstName: 'Single',
                lastName: 'User',
                employmentDetails: {
                  departmentName: 'Finance And Budget'
                }
              }
            ]
          }]
        }
      };
      mockProfileService.getRecommendedUsers.mockReturnValue(of(singleUserData));
      mockLodashGet.mockReturnValue(singleUserData.result.data[0].results);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: any) => {
        expect(response.data).toHaveLength(1);
        expect(response.data[0].userId).toBe('single-user');
        expect(response.error).toBeNull();
        done();
      });
    });

    it('should not depend on route parameters', (done) => {
      // Arrange
      mockRoute.params = { someParam: 'value' };
      mockRoute.queryParams = { query: 'test' };
      mockProfileService.getRecommendedUsers.mockReturnValue(of(mockRecommendedUsersData));
      mockLodashGet.mockReturnValue(mockRecommendedUsersData.result.data[0].results);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.getRecommendedUsers).toHaveBeenCalledWith(expectedFormBody);
        expect(response.data).toBeDefined();
        expect(response.error).toBeNull();
        done();
      });
    });

    it('should handle multiple data objects but only use first one', (done) => {
      // Arrange
      const multipleDataObjects = {
        result: {
          data: [
            {
              results: [{ userId: 'first-data-user' }]
            },
            {
              results: [{ userId: 'second-data-user' }]
            }
          ]
        }
      };
      mockProfileService.getRecommendedUsers.mockReturnValue(of(multipleDataObjects));
      mockLodashGet.mockReturnValue(multipleDataObjects.result.data[0].results);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: any) => {
        expect(mockLodashGet).toHaveBeenCalledWith(multipleDataObjects, 'result.data[0].results');
        expect(response.data[0].userId).toBe('first-data-user');
        expect(response.error).toBeNull();
        done();
      });
    });
  });
});