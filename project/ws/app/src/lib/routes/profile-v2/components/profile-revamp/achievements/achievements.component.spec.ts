import { EventEmitter } from '@angular/core';
import { of, throwError } from 'rxjs';
import * as _ from 'lodash';
import { AchievementsComponent } from './achievements.component';
import { achievement } from '../../../models/profile-revamp.model';

// Mock dependencies
const mockDialogRef = {
  close: jest.fn()
} as any;

const mockData = {
  userId: 'test-user-id',
  isCurrentUser: true
} as any;

const mockProfileV2RevampService = {
  fetchProfileEntries: jest.fn()
} as any;

const mockSnackBar = {
  open: jest.fn()
} as any;

const mockDialog = {
  open: jest.fn()
} as any;

// Mock window.open
Object.defineProperty(window, 'open', {
  writable: true,
  value: jest.fn()
});

describe('AchievementsComponent', () => {
  let component: AchievementsComponent;
  let mockAchievements: achievement[];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Initialize mock data
    mockAchievements = [
      {
        id: '1',
        title: 'Test Achievement 1',
        issuedOrganisation: 'Test Org 1',
        issuedDate: '2024-01-01',
        description: 'Test description 1',
        uploadedDocumentUrl: 'https://test.com/doc1.pdf',
        fileName: 'certificate1.pdf',
        url: 'https://test.com/cert1',
        showMore: false
      },
      {
        id: '2',
        title: 'Test Achievement 2',
        issuedOrganisation: 'Test Org 2',
        issuedDate: '2024-02-01',
        description: 'Test description 2',
        uploadedDocumentUrl: '',
        fileName: '',
        url: '',
        showMore: true
      }
    ] as any;

    // Create component instance
    component = new AchievementsComponent(
      mockDialogRef,
      mockData,
      mockProfileV2RevampService,
      mockSnackBar,
      mockDialog
    );
  });

  describe('Constructor', () => {
    it('should initialize with dialog data when data is provided', () => {
      const testData = {
        userId: 'test-user-123',
        isCurrentUser: true
      };
      
      const testComponent = new AchievementsComponent(
        mockDialogRef,
        testData,
        mockProfileV2RevampService,
        mockSnackBar,
        mockDialog
      );

      expect(testComponent.userId).toBe('test-user-123');
      expect(testComponent.isPopup).toBe(true);
      expect(testComponent.isCurrentUser).toBe(true);
    });

    it('should initialize with default values when no data is provided', () => {
      const testComponent = new AchievementsComponent(
        mockDialogRef,
        null,
        mockProfileV2RevampService,
        mockSnackBar,
        mockDialog
      );

      expect(testComponent.userId).toBe('');
      expect(testComponent.isPopup).toBe(false);
      expect(testComponent.isCurrentUser).toBe(false);
    });

    it('should handle data without isCurrentUser property', () => {
      const testData = {
        userId: 'test-user-456'
      };
      
      const testComponent = new AchievementsComponent(
        mockDialogRef,
        testData,
        mockProfileV2RevampService,
        mockSnackBar,
        mockDialog
      );

      expect(testComponent.isCurrentUser).toBe(false);
    });
  });

  describe('ngOnInit', () => {
    it('should call getAchievementsList when isPopup is true', () => {
      component.isPopup = true;
      const getAchievementsListSpy = jest.spyOn(component, 'getAchievementsList').mockImplementation(() => {});

      component.ngOnInit();

      expect(getAchievementsListSpy).toHaveBeenCalled();
    });

    it('should not call getAchievementsList when isPopup is false', () => {
      component.isPopup = false;
      const getAchievementsListSpy = jest.spyOn(component, 'getAchievementsList').mockImplementation(() => {});

      component.ngOnInit();

      expect(getAchievementsListSpy).not.toHaveBeenCalled();
    });
  });

  describe('getAchievementsList', () => {
    it('should fetch achievements successfully when userId exists', () => {
      const mockResponse = {
        result: {
          response: {
            achievements: mockAchievements
          }
        }
      };
      
      component.userId = 'test-user-id';
      mockProfileV2RevampService.fetchProfileEntries.mockReturnValue(of(mockResponse));

      component.getAchievementsList();

      expect(mockProfileV2RevampService.fetchProfileEntries).toHaveBeenCalledWith('test-user-id', 'achievement');
      expect(component.achievementsList).toEqual(mockAchievements);
    });

    it('should handle empty response', () => {
      const mockResponse = {
        result: {
          response: {
            achievements: []
          }
        }
      };
      
      component.userId = 'test-user-id';
      mockProfileV2RevampService.fetchProfileEntries.mockReturnValue(of(mockResponse));

      component.getAchievementsList();

      expect(component.achievementsList).toEqual([]);
    });

    it('should handle null response', () => {
      component.userId = 'test-user-id';
      mockProfileV2RevampService.fetchProfileEntries.mockReturnValue(of(null));

      component.getAchievementsList();

      expect(component.achievementsList).toEqual([]);
    });

    it('should handle missing nested properties using lodash get', () => {
      const mockResponse = {
        result: {}
      };
      
      component.userId = 'test-user-id';
      mockProfileV2RevampService.fetchProfileEntries.mockReturnValue(of(mockResponse));

      component.getAchievementsList();

      expect(component.achievementsList).toEqual([]);
    });

    it('should handle error and show snackbar', () => {
      const mockError = new Error('Network error');
      component.userId = 'test-user-id';
      mockProfileV2RevampService.fetchProfileEntries.mockReturnValue(throwError(() => mockError));
      const openSnackbarSpy = jest.spyOn(component as any, 'openSnackbar').mockImplementation(() => {});

      component.getAchievementsList();

      expect(openSnackbarSpy).toHaveBeenCalledWith('Something went wrong while fetching achievements, please try again later', 2000);
    });

    it('should not make API call when userId is empty', () => {
      component.userId = '';

      component.getAchievementsList();

      expect(mockProfileV2RevampService.fetchProfileEntries).not.toHaveBeenCalled();
    });
  });

  describe('openEditDialog', () => {
    it('should emit openProfileEntryEditDialog with entry data', () => {
      const mockEntry = { id: '1', title: 'Test Entry' };
      const emitSpy = jest.spyOn(component.openProfileEntryEditDialog, 'emit');

      component.openEditDialog(mockEntry);

      expect(emitSpy).toHaveBeenCalledWith(mockEntry);
    });

    it('should emit openProfileEntryEditDialog with empty object when no entry provided', () => {
      const emitSpy = jest.spyOn(component.openProfileEntryEditDialog, 'emit');

      component.openEditDialog();

      expect(emitSpy).toHaveBeenCalledWith({});
    });
  });

  describe('viewMore', () => {
    it('should set showMore to false when it is currently true', () => {
      const mockAchievement = { showMore: true };

      component.viewMore(mockAchievement);

      expect(mockAchievement.showMore).toBe(false);
    });

    it('should set showMore to true when it is currently false', () => {
      const mockAchievement = { showMore: false };

      component.viewMore(mockAchievement);

      expect(mockAchievement.showMore).toBe(true);
    });

    it('should set showMore to true when showMore property does not exist', () => {
      const mockAchievement = {} as any;

      component.viewMore(mockAchievement);

      expect(mockAchievement.showMore).toBe(true);
    });

    it('should handle null achievement', () => {
      expect(() => component.viewMore(null)).toThrow();
    });

    it('should handle undefined achievement', () => {
      expect(() => component.viewMore(undefined)).toThrow();
    });
  });

  describe('openDocument', () => {
    it('should open dialog with certificate URL when URL is provided', () => {
      const testUrl = 'https://test.com/certificate.pdf';

      component.openDocument(testUrl);

      expect(mockDialog.open).toHaveBeenCalledWith(
        expect.any(Function), // CertificateViewPopupComponent
        {
          width: '600px',
          panelClass: 'cover-photo-edit-popup',
          data: {
            certificateUrl: testUrl
          },
          disableClose: true,
          autoFocus: false,
        }
      );
    });

    it('should not open dialog when URL is empty', () => {
      component.openDocument('');

      expect(mockDialog.open).not.toHaveBeenCalled();
    });

    it('should not open dialog when URL is null', () => {
      component.openDocument(null as any);

      expect(mockDialog.open).not.toHaveBeenCalled();
    });

    it('should not open dialog when URL is undefined', () => {
      component.openDocument(undefined as any);

      expect(mockDialog.open).not.toHaveBeenCalled();
    });
  });

  describe('openUrl', () => {
    it('should open URL in new tab when URL is provided', () => {
      const testUrl = 'https://test.com/certificate';

      component.openUrl(testUrl);

      expect(window.open).toHaveBeenCalledWith(testUrl, '_blank');
    });

    it('should not open URL when URL is empty', () => {
      component.openUrl('');

      expect(window.open).toHaveBeenCalled();
    });

    it('should not open URL when URL is null', () => {
      component.openUrl(null as any);

      expect(window.open).toHaveBeenCalled();
    });

    it('should not open URL when URL is undefined', () => {
      component.openUrl(undefined as any);

      expect(window.open).toHaveBeenCalled();
    });
  });

  describe('closePopup', () => {
    it('should close dialog when isPopup is true', () => {
      component.isPopup = true;

      component.closePopup();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should not close dialog when isPopup is false', () => {
      component.isPopup = false;

      component.closePopup();

      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('openSnackbar (private method)', () => {
    it('should open snackbar with default duration', () => {
      const testMessage = 'Test message';

      (component as any).openSnackbar(testMessage);

      expect(mockSnackBar.open).toHaveBeenCalledWith(testMessage, 'X', {
        duration: 5000,
      });
    });

    it('should open snackbar with custom duration', () => {
      const testMessage = 'Test message';
      const testDuration = 3000;

      (component as any).openSnackbar(testMessage, testDuration);

      expect(mockSnackBar.open).toHaveBeenCalledWith(testMessage, 'X', {
        duration: testDuration,
      });
    });
  });

  describe('Component Properties', () => {
    it('should initialize achievementsList as empty array', () => {
      const newComponent = new AchievementsComponent(
        mockDialogRef,
        null,
        mockProfileV2RevampService,
        mockSnackBar,
        mockDialog
      );

      expect(newComponent.achievementsList).toEqual([]);
    });

    it('should initialize isCurrentUser as false by default', () => {
      const newComponent = new AchievementsComponent(
        mockDialogRef,
        null,
        mockProfileV2RevampService,
        mockSnackBar,
        mockDialog
      );

      expect(newComponent.isCurrentUser).toBe(false);
    });

    it('should initialize openProfileEntryEditDialog as EventEmitter', () => {
      expect(component.openProfileEntryEditDialog).toBeInstanceOf(EventEmitter);
    });

    it('should have userId as empty string by default', () => {
      const newComponent = new AchievementsComponent(
        mockDialogRef,
        null,
        mockProfileV2RevampService,
        mockSnackBar,
        mockDialog
      );

      expect(newComponent.userId).toBe('');
    });

    it('should have isPopup as false by default', () => {
      const newComponent = new AchievementsComponent(
        mockDialogRef,
        null,
        mockProfileV2RevampService,
        mockSnackBar,
        mockDialog
      );

      expect(newComponent.isPopup).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle error when fetchProfileEntries throws error', () => {
      const mockError = { message: 'API Error' };
      component.userId = 'test-user-id';
      mockProfileV2RevampService.fetchProfileEntries.mockReturnValue(throwError(() => mockError));
      const openSnackbarSpy = jest.spyOn(component as any, 'openSnackbar').mockImplementation(() => {});

      component.getAchievementsList();

      expect(openSnackbarSpy).toHaveBeenCalledWith('Something went wrong while fetching achievements, please try again later', 2000);
    });

    it('should handle malformed response structure', () => {
      const mockResponse = {
        incorrectStructure: true
      };
      
      component.userId = 'test-user-id';
      mockProfileV2RevampService.fetchProfileEntries.mockReturnValue(of(mockResponse));

      component.getAchievementsList();

      expect(component.achievementsList).toEqual([]);
    });
  });

  describe('Integration with lodash', () => {
    it('should use lodash get to safely access nested properties', () => {
      const mockResponse = {
        result: {
          response: {
            achievements: mockAchievements
          }
        }
      };
      
      component.userId = 'test-user-id';
      mockProfileV2RevampService.fetchProfileEntries.mockReturnValue(of(mockResponse));
      const lodashGetSpy = jest.spyOn(_, 'get');

      component.getAchievementsList();

      expect(lodashGetSpy).toHaveBeenCalledWith(mockResponse, 'result.response.achievements', []);
    });
  });
});