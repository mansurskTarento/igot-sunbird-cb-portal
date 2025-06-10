import { TestBed } from '@angular/core/testing';
import { RouterStateSnapshot } from '@angular/router';
import { ConfigurationsService, IResolveResponse } from '@sunbird-cb/utils-v2';
import { of, throwError } from 'rxjs';
import { profileEntriesResolver } from './profile-entries.resolver';
import { NSProfileDataV2 } from '../../models/profile-v2.model';
import { ProfileV2RevampService } from '../../services/profile-v2-revamp.service';
import * as _ from 'lodash';

// Mock the lodash module
jest.mock('lodash', () => ({
  get: jest.fn()
}));

describe('profileEntriesResolver', () => {
  let resolver: profileEntriesResolver;
  let mockProfileService: any;
  let mockConfigService: any;
  let mockRoute: any;
  let mockState: any;
  let mockLodashGet: any;

  const mockProfileEntriesData = {
    result: {
      response: {
        userId: 'test-user-id',
        entries: [
          {
            id: 'entry-1',
            title: 'Entry 1',
            description: 'First entry'
          },
          {
            id: 'entry-2',
            title: 'Entry 2',
            description: 'Second entry'
          }
        ],
        count: 2
      }
    }
  };

  const mockUserProfile = {
    userId: 'default-user-id',
    firstName: 'Default',
    lastName: 'User'
  };

  beforeEach(() => {
    // Mock ProfileV2RevampService
    mockProfileService = {
      fetchProfileEntries: jest.fn()
    };

    // Mock ConfigurationsService
    mockConfigService = {
      userProfile: mockUserProfile
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
        profileEntriesResolver,
        { provide: ProfileV2RevampService, useValue: mockProfileService },
        { provide: ConfigurationsService, useValue: mockConfigService }
      ]
    });

    resolver = TestBed.inject(profileEntriesResolver);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('resolve', () => {
    it('should create resolver instance', () => {
      expect(resolver).toBeDefined();
      expect(resolver).toBeInstanceOf(profileEntriesResolver);
    });

    it('should resolve profile entries data for "me" path with current user', (done) => {
      // Arrange
      mockRoute.routeConfig.path = 'me';
      mockProfileService.fetchProfileEntries.mockReturnValue(of(mockProfileEntriesData));
      mockLodashGet.mockReturnValue(mockProfileEntriesData.result.response);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.fetchProfileEntries).toHaveBeenCalledWith('default-user-id');
        expect(mockLodashGet).toHaveBeenCalledWith(mockProfileEntriesData, 'result.response');
        expect(response.data).toEqual(mockProfileEntriesData.result.response);
        expect(response.error).toBeNull();
        done();
      });
    });

    it('should resolve profile entries data for non-"me" path with route params userId', (done) => {
      // Arrange
      mockRoute.routeConfig.path = 'profile-entries';
      mockRoute.params.userId = 'route-param-user-id';
      mockProfileService.fetchProfileEntries.mockReturnValue(of(mockProfileEntriesData));
      mockLodashGet.mockReturnValue(mockProfileEntriesData.result.response);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.fetchProfileEntries).toHaveBeenCalledWith('route-param-user-id');
        expect(response.data).toEqual(mockProfileEntriesData.result.response);
        expect(response.error).toBeNull();
        done();
      });
    });

    it('should resolve profile entries data with query params userId when route params is empty', (done) => {
      // Arrange
      mockRoute.routeConfig.path = 'profile-entries';
      mockRoute.params = {};
      mockRoute.queryParams.userId = 'query-param-user-id';
      mockProfileService.fetchProfileEntries.mockReturnValue(of(mockProfileEntriesData));
      mockLodashGet.mockReturnValue(mockProfileEntriesData.result.response);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.fetchProfileEntries).toHaveBeenCalledWith('query-param-user-id');
        expect(response.data).toEqual(mockProfileEntriesData.result.response);
        expect(response.error).toBeNull();
        done();
      });
    });

    it('should fallback to config service userId when no userId in params or query', (done) => {
      // Arrange
      mockRoute.routeConfig.path = 'profile-entries';
      mockRoute.params = {};
      mockRoute.queryParams = {};
      mockProfileService.fetchProfileEntries.mockReturnValue(of(mockProfileEntriesData));
      mockLodashGet.mockReturnValue(mockProfileEntriesData.result.response);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.fetchProfileEntries).toHaveBeenCalledWith('default-user-id');
        expect(response.data).toEqual(mockProfileEntriesData.result.response);
        expect(response.error).toBeNull();
        done();
      });
    });

    it('should use empty string when no userProfile in config service', (done) => {
      // Arrange
      mockRoute.routeConfig.path = 'profile-entries';
      mockRoute.params = {};
      mockRoute.queryParams = {};
      mockConfigService.userProfile = null;
      mockProfileService.fetchProfileEntries.mockReturnValue(of(mockProfileEntriesData));
      mockLodashGet.mockReturnValue(mockProfileEntriesData.result.response);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.fetchProfileEntries).toHaveBeenCalledWith('');
        expect(response.data).toEqual(mockProfileEntriesData.result.response);
        expect(response.error).toBeNull();
        done();
      });
    });

    it('should handle null routeConfig', (done) => {
      // Arrange
      mockRoute.routeConfig = null;
      mockRoute.params.userId = 'param-user-id';
      mockProfileService.fetchProfileEntries.mockReturnValue(of(mockProfileEntriesData));
      mockLodashGet.mockReturnValue(mockProfileEntriesData.result.response);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.fetchProfileEntries).toHaveBeenCalledWith('param-user-id');
        expect(response.data).toEqual(mockProfileEntriesData.result.response);
        expect(response.error).toBeNull();
        done();
      });
    });

    it('should handle error from profile service', (done) => {
      // Arrange
      const mockError = { message: 'Profile entries fetch failed' };
      mockRoute.routeConfig.path = 'me';
      mockProfileService.fetchProfileEntries.mockReturnValue(throwError(mockError));

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.fetchProfileEntries).toHaveBeenCalledWith('default-user-id');
        expect(response.data).toBeNull();
        expect(response.error).toEqual(mockError);
        done();
      });
    });

    it('should handle undefined result from lodash get', (done) => {
      // Arrange
      mockRoute.routeConfig.path = 'me';
      mockProfileService.fetchProfileEntries.mockReturnValue(of(mockProfileEntriesData));
      mockLodashGet.mockReturnValue(undefined);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.fetchProfileEntries).toHaveBeenCalledWith('default-user-id');
        expect(mockLodashGet).toHaveBeenCalledWith(mockProfileEntriesData, 'result.response');
        expect(response.data).toBeUndefined();
        expect(response.error).toBeNull();
        done();
      });
    });

    it('should prioritize route params over query params', (done) => {
      // Arrange
      mockRoute.routeConfig.path = 'profile-entries';
      mockRoute.params.userId = 'route-param-user';
      mockRoute.queryParams.userId = 'query-param-user';
      mockProfileService.fetchProfileEntries.mockReturnValue(of(mockProfileEntriesData));
      mockLodashGet.mockReturnValue(mockProfileEntriesData.result.response);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe(() => {
        expect(mockProfileService.fetchProfileEntries).toHaveBeenCalledWith('route-param-user');
        done();
      });
    });

    it('should handle empty string userId in params', (done) => {
      // Arrange
      mockRoute.routeConfig.path = 'profile-entries';
      mockRoute.params.userId = '';
      mockRoute.queryParams.userId = 'query-param-user';
      mockProfileService.fetchProfileEntries.mockReturnValue(of(mockProfileEntriesData));
      mockLodashGet.mockReturnValue(mockProfileEntriesData.result.response);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe(() => {
        expect(mockProfileService.fetchProfileEntries).toHaveBeenCalledWith('query-param-user');
        done();
      });
    });

    it('should handle when all userIds are empty', (done) => {
      // Arrange
      mockRoute.routeConfig.path = 'profile-entries';
      mockRoute.params = {};
      mockRoute.queryParams = {};
      mockConfigService.userProfile = { userId: '' };
      mockProfileService.fetchProfileEntries.mockReturnValue(of(mockProfileEntriesData));
      mockLodashGet.mockReturnValue(mockProfileEntriesData.result.response);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe(() => {
        expect(mockProfileService.fetchProfileEntries).toHaveBeenCalledWith('');
        done();
      });
    });

    it('should handle empty entries array', (done) => {
      // Arrange
      const emptyEntriesData = {
        result: {
          response: {
            userId: 'test-user-id',
            entries: [],
            count: 0
          }
        }
      };
      mockRoute.routeConfig.path = 'me';
      mockProfileService.fetchProfileEntries.mockReturnValue(of(emptyEntriesData));
      mockLodashGet.mockReturnValue(emptyEntriesData.result.response);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.fetchProfileEntries).toHaveBeenCalledWith('default-user-id');
        expect(response.data).toEqual(emptyEntriesData.result.response);
        expect(response.error).toBeNull();
        done();
      });
    });

    it('should handle null response data', (done) => {
      // Arrange
      const nullResponseData = {
        result: {
          response: null
        }
      };
      mockRoute.routeConfig.path = 'me';
      mockProfileService.fetchProfileEntries.mockReturnValue(of(nullResponseData));
      mockLodashGet.mockReturnValue(null);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.fetchProfileEntries).toHaveBeenCalledWith('default-user-id');
        expect(mockLodashGet).toHaveBeenCalledWith(nullResponseData, 'result.response');
        expect(response.data).toBeNull();
        expect(response.error).toBeNull();
        done();
      });
    });

    it('should handle malformed response data', (done) => {
      // Arrange
      const malformedData = {
        someOtherProperty: 'value'
      };
      mockRoute.routeConfig.path = 'me';
      mockProfileService.fetchProfileEntries.mockReturnValue(of(malformedData));
      mockLodashGet.mockReturnValue(undefined);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.fetchProfileEntries).toHaveBeenCalledWith('default-user-id');
        expect(mockLodashGet).toHaveBeenCalledWith(malformedData, 'result.response');
        expect(response.data).toBeUndefined();
        expect(response.error).toBeNull();
        done();
      });
    });

    it('should handle network timeout error', (done) => {
      // Arrange
      const timeoutError = { name: 'TimeoutError', message: 'Request timed out' };
      mockRoute.routeConfig.path = 'me';
      mockProfileService.fetchProfileEntries.mockReturnValue(throwError(timeoutError));

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.fetchProfileEntries).toHaveBeenCalledWith('default-user-id');
        expect(response.data).toBeNull();
        expect(response.error).toEqual(timeoutError);
        done();
      });
    });
  });
});