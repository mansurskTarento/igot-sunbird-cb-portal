import { TestBed } from '@angular/core/testing';
import { RouterStateSnapshot } from '@angular/router';
import { ConfigurationsService, IResolveResponse } from '@sunbird-cb/utils-v2';
import { of, throwError } from 'rxjs';
import { profileResolver } from './profile.resolver';
import { NSProfileDataV2 } from '../../models/profile-v2.model';
import { ProfileV2RevampService } from '../../services/profile-v2-revamp.service';
import * as _ from 'lodash';

// Mock the lodash module
jest.mock('lodash', () => ({
  get: jest.fn()
}));

describe('profileResolver', () => {
  let resolver: profileResolver;
  let mockProfileService: any;
  let mockConfigService: any;
  let mockRoute: any;
  let mockState: any;
  let mockLodashGet: any;

  const mockProfileData = {
    result: {
      userId: 'test-user-id',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com'
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
      fetchProfile: jest.fn()
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
        profileResolver,
        { provide: ProfileV2RevampService, useValue: mockProfileService },
        { provide: ConfigurationsService, useValue: mockConfigService }
      ]
    });

    resolver = TestBed.inject(profileResolver);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('resolve', () => {
    it('should create resolver instance', () => {
      expect(resolver).toBeDefined();
      expect(resolver).toBeInstanceOf(profileResolver);
    });

    it('should resolve profile data for "me" path with current user', (done) => {
      // Arrange
      mockRoute.routeConfig.path = 'me';
      mockProfileService.fetchProfile.mockReturnValue(of(mockProfileData));
      mockLodashGet.mockReturnValue(mockProfileData.result);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: any) => {
        expect(mockProfileService.fetchProfile).toHaveBeenCalledWith('default-user-id');
        expect(mockLodashGet).toHaveBeenCalledWith(mockProfileData, 'result');
        expect(response.data).toEqual(mockProfileData.result);
        expect(response.error).toBeNull();
        expect(response.userId).toBe('default-user-id');
        done();
      });
    });

    it('should resolve profile data for non-"me" path with route params userId', (done) => {
      // Arrange
      mockRoute.routeConfig.path = 'profile';
      mockRoute.params.userId = 'route-param-user-id';
      mockProfileService.fetchProfile.mockReturnValue(of(mockProfileData));
      mockLodashGet.mockReturnValue(mockProfileData.result);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: any) => {
        expect(mockProfileService.fetchProfile).toHaveBeenCalledWith('route-param-user-id');
        expect(response.data).toEqual(mockProfileData.result);
        expect(response.error).toBeNull();
        expect(response.userId).toBe('route-param-user-id');
        done();
      });
    });

    it('should resolve profile data with query params userId when route params is empty', (done) => {
      // Arrange
      mockRoute.routeConfig.path = 'profile';
      mockRoute.params = {};
      mockRoute.queryParams.userId = 'query-param-user-id';
      mockProfileService.fetchProfile.mockReturnValue(of(mockProfileData));
      mockLodashGet.mockReturnValue(mockProfileData.result);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: any) => {
        expect(mockProfileService.fetchProfile).toHaveBeenCalledWith('query-param-user-id');
        expect(response.data).toEqual(mockProfileData.result);
        expect(response.error).toBeNull();
        expect(response.userId).toBe('query-param-user-id');
        done();
      });
    });

    it('should fallback to config service userId when no userId in params or query', (done) => {
      // Arrange
      mockRoute.routeConfig.path = 'profile';
      mockRoute.params = {};
      mockRoute.queryParams = {};
      mockProfileService.fetchProfile.mockReturnValue(of(mockProfileData));
      mockLodashGet.mockReturnValue(mockProfileData.result);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: any) => {
        expect(mockProfileService.fetchProfile).toHaveBeenCalledWith('default-user-id');
        expect(response.data).toEqual(mockProfileData.result);
        expect(response.error).toBeNull();
        expect(response.userId).toBe('default-user-id');
        done();
      });
    });

    it('should use empty string when no userProfile in config service', (done) => {
      // Arrange
      mockRoute.routeConfig.path = 'profile';
      mockRoute.params = {};
      mockRoute.queryParams = {};
      mockConfigService.userProfile = null;
      mockProfileService.fetchProfile.mockReturnValue(of(mockProfileData));
      mockLodashGet.mockReturnValue(mockProfileData.result);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: any) => {
        expect(mockProfileService.fetchProfile).toHaveBeenCalledWith('');
        expect(response.data).toEqual(mockProfileData.result);
        expect(response.error).toBeNull();
        expect(response.userId).toBe('');
        done();
      });
    });

    it('should handle null routeConfig', (done) => {
      // Arrange
      mockRoute.routeConfig = null;
      mockRoute.params.userId = 'param-user-id';
      mockProfileService.fetchProfile.mockReturnValue(of(mockProfileData));
      mockLodashGet.mockReturnValue(mockProfileData.result);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: any) => {
        expect(mockProfileService.fetchProfile).toHaveBeenCalledWith('param-user-id');
        expect(response.data).toEqual(mockProfileData.result);
        expect(response.error).toBeNull();
        expect(response.userId).toBe('param-user-id');
        done();
      });
    });

    it('should handle error from profile service', (done) => {
      // Arrange
      const mockError = { message: 'Profile fetch failed' };
      mockRoute.routeConfig.path = 'me';
      mockProfileService.fetchProfile.mockReturnValue(throwError(mockError));

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: IResolveResponse<NSProfileDataV2.IProfile>) => {
        expect(mockProfileService.fetchProfile).toHaveBeenCalledWith('default-user-id');
        expect(response.data).toBeNull();
        expect(response.error).toEqual(mockError);
        done();
      });
    });

    it('should handle undefined result from lodash get', (done) => {
      // Arrange
      mockRoute.routeConfig.path = 'me';
      mockProfileService.fetchProfile.mockReturnValue(of(mockProfileData));
      mockLodashGet.mockReturnValue(undefined);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: any) => {
        expect(mockProfileService.fetchProfile).toHaveBeenCalledWith('default-user-id');
        expect(mockLodashGet).toHaveBeenCalledWith(mockProfileData, 'result');
        expect(response.data).toBeUndefined();
        expect(response.error).toBeNull();
        expect(response.userId).toBe('default-user-id');
        done();
      });
    });

    it('should prioritize route params over query params', (done) => {
      // Arrange
      mockRoute.routeConfig.path = 'profile';
      mockRoute.params.userId = 'route-param-user';
      mockRoute.queryParams.userId = 'query-param-user';
      mockProfileService.fetchProfile.mockReturnValue(of(mockProfileData));
      mockLodashGet.mockReturnValue(mockProfileData.result);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: any) => {
        expect(mockProfileService.fetchProfile).toHaveBeenCalledWith('route-param-user');
        expect(response.userId).toBe('route-param-user');
        done();
      });
    });

    it('should handle empty string userId in params', (done) => {
      // Arrange
      mockRoute.routeConfig.path = 'profile';
      mockRoute.params.userId = '';
      mockRoute.queryParams.userId = 'query-param-user';
      mockProfileService.fetchProfile.mockReturnValue(of(mockProfileData));
      mockLodashGet.mockReturnValue(mockProfileData.result);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: any) => {
        expect(mockProfileService.fetchProfile).toHaveBeenCalledWith('query-param-user');
        expect(response.userId).toBe('query-param-user');
        done();
      });
    });

    it('should handle when all userIds are empty', (done) => {
      // Arrange
      mockRoute.routeConfig.path = 'profile';
      mockRoute.params = {};
      mockRoute.queryParams = {};
      mockConfigService.userProfile = { userId: '' };
      mockProfileService.fetchProfile.mockReturnValue(of(mockProfileData));
      mockLodashGet.mockReturnValue(mockProfileData.result);

      // Act
      const result = resolver.resolve(mockRoute, mockState);

      // Assert
      result.subscribe((response: any) => {
        expect(mockProfileService.fetchProfile).toHaveBeenCalledWith('');
        expect(response.userId).toBe('');
        done();
      });
    });
  });
});