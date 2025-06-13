import { PeopleSuggestionsComponent } from './people-suggestions.component';
import { ProfileV2RevampService } from '../../../services/profile-v2-revamp.service';
import { MatLegacySnackBar } from '@angular/material/legacy-snack-bar';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import * as _ from 'lodash';

// Mock lodash to avoid import issues
jest.mock('lodash', () => ({
  get: jest.fn()
}));

describe('PeopleSuggestionsComponent', () => {
  let component: PeopleSuggestionsComponent;
  let mockProfileV2RevampService: jest.Mocked<ProfileV2RevampService>;
  let mockSnackBar: jest.Mocked<MatLegacySnackBar>;
  let mockRouter: jest.Mocked<Router>;
  let mockLodashGet: any;

  beforeEach(() => {
    // Create mocks with proper typing
    mockProfileV2RevampService = {
      connectToNetwork: jest.fn()
    } as any;

    mockSnackBar = {
      open: jest.fn()
    } as any;

    mockRouter = {
      navigate: jest.fn()
    } as any;

    mockLodashGet = _.get as jest.MockedFunction<typeof _.get>;

    // Create component instance
    component = new PeopleSuggestionsComponent(
      mockProfileV2RevampService,
      mockSnackBar,
      mockRouter
    );

    // Initialize component properties
    component.peopleSuggestionsList = [];
    component.currentUser = {};
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Initialization', () => {
    it('should create component instance', () => {
      expect(component).toBeTruthy();
      expect(component.peopleSuggestionsList).toEqual([]);
      expect(component.currentUser).toEqual({});
    });

    it('should initialize with default input values', () => {
      expect(component.peopleSuggestionsList).toEqual([]);
      expect(component.currentUser).toEqual({});
    });
  });

  describe('ngOnChanges', () => {
    beforeEach(() => {
      mockLodashGet.mockImplementation((obj: any, path: string, defaultValue: any) => {
        if (path === 'personalDetails.firstname') {
          return obj?.personalDetails?.firstname || defaultValue;
        }
        return defaultValue;
      });
    });

    it('should not process empty peopleSuggestionsList', () => {
      component.peopleSuggestionsList = [];
      component.ngOnChanges();
      
      expect(component.peopleSuggestionsList).toEqual([]);
    });

    it('should not process null peopleSuggestionsList', () => {
      component.peopleSuggestionsList = null as any;
      component.ngOnChanges();
      
      expect(component.peopleSuggestionsList).toBeNull();
    });

    it('should set connectionStatus to connect for each person', () => {
      const mockPeople = [
        { id: 1, personalDetails: { firstname: 'John Doe' } },
        { id: 2, personalDetails: { firstname: 'Jane Smith' } }
      ];
      
      component.peopleSuggestionsList = mockPeople;
      component.ngOnChanges();

      expect(component.peopleSuggestionsList[0]['connectionStatus']).toBe('connect');
      expect(component.peopleSuggestionsList[1]['connectionStatus']).toBe('connect');
    });

    it('should set nameInitials for single name', () => {
      const mockPeople = [
        { id: 1, personalDetails: { firstname: 'John' } }
      ];
      
      component.peopleSuggestionsList = mockPeople;
      component.ngOnChanges();

      expect(component.peopleSuggestionsList[0]['nameInitials']).toBe('J');
    });

    it('should set nameInitials for full name with two words', () => {
      const mockPeople = [
        { id: 1, personalDetails: { firstname: 'John Doe' } }
      ];
      
      component.peopleSuggestionsList = mockPeople;
      component.ngOnChanges();

      expect(component.peopleSuggestionsList[0]['nameInitials']).toBe('JD');
    });

    it('should set nameInitials for full name with multiple words', () => {
      const mockPeople = [
        { id: 1, personalDetails: { firstname: 'John Michael Doe' } }
      ];
      
      component.peopleSuggestionsList = mockPeople;
      component.ngOnChanges();

      expect(component.peopleSuggestionsList[0]['nameInitials']).toBe('JM');
    });

    it('should handle person without firstname', () => {
      const mockPeople = [
        { id: 1, personalDetails: {} }
      ];
      
      mockLodashGet.mockReturnValue('');
      component.peopleSuggestionsList = mockPeople;
      component.ngOnChanges();

      expect(component.peopleSuggestionsList[0]['nameInitials']).toBeUndefined();
    });

    it('should handle person without personalDetails', () => {
      const mockPeople = [
        { id: 1 }
      ];
      
      mockLodashGet.mockReturnValue('');
      component.peopleSuggestionsList = mockPeople;
      component.ngOnChanges();

      expect(component.peopleSuggestionsList[0]['connectionStatus']).toBe('connect');
      expect(component.peopleSuggestionsList[0]['nameInitials']).toBeUndefined();
    });
  });

  describe('connect', () => {
    it('should call sendConnectionRequest with person object', () => {
      const mockPerson = { id: 1, name: 'John' };
      const sendConnectionRequestSpy = jest.spyOn(component, 'sendConnectionRequest').mockImplementation(() => {});
      
      component.connect(mockPerson);
      
      expect(sendConnectionRequestSpy).toHaveBeenCalledWith(mockPerson);
    });

    it('should handle null person object', () => {
      const sendConnectionRequestSpy = jest.spyOn(component, 'sendConnectionRequest').mockImplementation(() => {});
      
      component.connect(null);
      
      expect(sendConnectionRequestSpy).toHaveBeenCalledWith(null);
    });
  });

  describe('sendConnectionRequest', () => {
    beforeEach(() => {
      mockLodashGet.mockImplementation((obj: any, path: string, defaultValue: any) => {
        if (path === 'userId') return obj?.userId || defaultValue;
        if (path === 'employmentDetails.departmentName') return obj?.employmentDetails?.departmentName || defaultValue;
        return defaultValue;
      });
    });

    it('should not process null person', () => {
      component.sendConnectionRequest(null);
      
      expect(mockProfileV2RevampService.connectToNetwork).not.toHaveBeenCalled();
    });

    it('should not process undefined person', () => {
      component.sendConnectionRequest(undefined as any);
      
      expect(mockProfileV2RevampService.connectToNetwork).not.toHaveBeenCalled();
    });

    it('should send connection request successfully', () => {
      const mockPerson = {
        id: 'person123',
        userId: 'user456',
        employmentDetails: { departmentName: 'Engineering' },
        connectionStatus: 'connect'
      };

      const mockCurrentUser = {
        userId: 'currentUser789',
        employmentDetails: { departmentName: 'Marketing' }
      };

      component.currentUser = mockCurrentUser;
      mockProfileV2RevampService.connectToNetwork.mockReturnValue(of({}));
      const openSnackbarSpy = jest.spyOn(component as any, 'openSnackbar').mockImplementation(() => {});

      component.sendConnectionRequest(mockPerson);

      const expectedFormBody = {
        connectionId: 'person123',
        userIdFrom: 'currentUser789',
        userNameFrom: 'currentUser789',
        userDepartmentFrom: 'Marketing',
        userIdTo: 'user456',
        userNameTo: 'person123',
        userDepartmentTo: 'Engineering'
      };

      expect(mockProfileV2RevampService.connectToNetwork).toHaveBeenCalledWith(expectedFormBody);
      expect(mockPerson.connectionStatus).toBe('pending');
      expect(openSnackbarSpy).toHaveBeenCalledWith('Connection request sent successfully');
    });

    it('should handle connection request error', () => {
      const mockPerson = {
        id: 'person123',
        userId: 'user456'
      };

      component.currentUser = { userId: 'currentUser789' };
      mockProfileV2RevampService.connectToNetwork.mockReturnValue(throwError('Network error'));
      const openSnackbarSpy = jest.spyOn(component as any, 'openSnackbar').mockImplementation(() => {});

      component.sendConnectionRequest(mockPerson);

      expect(openSnackbarSpy).toHaveBeenCalledWith('Something went wrong while sending connection request');
    });

    it('should use identifier when id is not available', () => {
      const mockPerson = {
        identifier: 'identifier123',
        userId: 'user456'
      };

      component.currentUser = { userId: 'currentUser789' };
      mockProfileV2RevampService.connectToNetwork.mockReturnValue(of({}));

      component.sendConnectionRequest(mockPerson);

      expect(mockProfileV2RevampService.connectToNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionId: 'identifier123',
          userNameTo: 'identifier123'
        })
      );
    });

    it('should use wid when id and identifier are not available', () => {
      const mockPerson = {
        wid: 'wid123',
        userId: 'user456'
      };

      component.currentUser = { userId: 'currentUser789' };
      mockProfileV2RevampService.connectToNetwork.mockReturnValue(of({}));

      component.sendConnectionRequest(mockPerson);

      expect(mockProfileV2RevampService.connectToNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionId: 'wid123',
          userNameTo: 'wid123'
        })
      );
    });

    it('should handle person without employmentDetails', () => {
      const mockPerson = {
        id: 'person123',
        userId: 'user456'
      };

      component.currentUser = { userId: 'currentUser789' };
      mockProfileV2RevampService.connectToNetwork.mockReturnValue(of({}));

      component.sendConnectionRequest(mockPerson);

      expect(mockProfileV2RevampService.connectToNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          userDepartmentTo: ''
        })
      );
    });
  });

  describe('goToUserProfile', () => {
    it('should navigate to person profile with userId', () => {
      const mockPerson = { userId: 'user123' };
      
      component.goToUserProfile(mockPerson);
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/app/person-profile', 'user123'],
        { fragment: 'profileInfo' }
      );
    });

    it('should navigate to person profile with id when userId not available', () => {
      const mockPerson = { id: 'person123' };
      
      component.goToUserProfile(mockPerson);
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/app/person-profile', 'person123'],
        { fragment: 'profileInfo' }
      );
    });

    it('should navigate to person profile with wid when userId and id not available', () => {
      const mockPerson = { wid: 'wid123' };
      
      component.goToUserProfile(mockPerson);
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/app/person-profile', 'wid123'],
        { fragment: 'profileInfo' }
      );
    });

    it('should navigate with undefined when no identifier available', () => {
      const mockPerson = {};
      
      component.goToUserProfile(mockPerson);
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/app/person-profile', undefined],
        { fragment: 'profileInfo' }
      );
    });
  });

  describe('openSnackbar', () => {
    it('should open snackbar with default duration', () => {
      const openSnackbarMethod = (component as any).openSnackbar;
      
      openSnackbarMethod.call(component, 'Test message');
      
      expect(mockSnackBar.open).toHaveBeenCalledWith('Test message', 'X', {
        duration: 5000
      });
    });

    it('should open snackbar with custom duration', () => {
      const openSnackbarMethod = (component as any).openSnackbar;
      
      openSnackbarMethod.call(component, 'Test message', 3000);
      
      expect(mockSnackBar.open).toHaveBeenCalledWith('Test message', 'X', {
        duration: 3000
      });
    });

    it('should handle empty message', () => {
      const openSnackbarMethod = (component as any).openSnackbar;
      
      openSnackbarMethod.call(component, '');
      
      expect(mockSnackBar.open).toHaveBeenCalledWith('', 'X', {
        duration: 5000
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete flow from ngOnChanges to connect', () => {
      const mockPeople = [
        {
          id: 'person1',
          userId: 'user1',
          personalDetails: { firstname: 'John Doe' },
          employmentDetails: { departmentName: 'Engineering' }
        }
      ];

      component.peopleSuggestionsList = mockPeople;
      component.currentUser = {
        userId: 'currentUser',
        employmentDetails: { departmentName: 'Marketing' }
      };

      mockLodashGet.mockImplementation((obj: any, path: string, defaultValue: any) => {
        if (path === 'personalDetails.firstname') return 'John Doe';
        if (path === 'userId') return obj?.userId || defaultValue;
        if (path === 'employmentDetails.departmentName') return obj?.employmentDetails?.departmentName || defaultValue;
        return defaultValue;
      });

      mockProfileV2RevampService.connectToNetwork.mockReturnValue(of({}));
      const openSnackbarSpy = jest.spyOn(component as any, 'openSnackbar').mockImplementation(() => {});

      // Test ngOnChanges
      component.ngOnChanges();
      
      expect(component.peopleSuggestionsList[0]['connectionStatus']).toBe('connect');
      expect(component.peopleSuggestionsList[0]['nameInitials']).toBe('JD');

      // Test connect
      component.connect(component.peopleSuggestionsList[0]);
      
      expect(mockProfileV2RevampService.connectToNetwork).toHaveBeenCalled();
      expect(component.peopleSuggestionsList[0].connectionStatus).toBe('pending');
      expect(openSnackbarSpy).toHaveBeenCalledWith('Connection request sent successfully');
    });

    it('should handle error scenarios gracefully', () => {
      const mockPeople = [
        {
          id: 'person1',
          userId: 'user1'
        }
      ];

      component.peopleSuggestionsList = mockPeople;
      component.currentUser = { userId: 'currentUser' };

      mockLodashGet.mockReturnValue('');
      mockProfileV2RevampService.connectToNetwork.mockReturnValue(throwError('API Error'));
      const openSnackbarSpy = jest.spyOn(component as any, 'openSnackbar').mockImplementation(() => {});

      component.ngOnChanges();
      component.connect(component.peopleSuggestionsList[0]);

      expect(openSnackbarSpy).toHaveBeenCalledWith('Something went wrong while sending connection request');
    });
  });
});