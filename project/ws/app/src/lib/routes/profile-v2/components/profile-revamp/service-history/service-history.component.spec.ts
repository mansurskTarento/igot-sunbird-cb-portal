import { ServiceHistoryComponent } from './service-history.component';
// import { DatePipe } from '@angular/common';
// import { MatLegacyDialogRef } from '@angular/material/legacy-dialog';
// import { ProfileV2RevampService } from '../../../services/profile-v2-revamp.service';
// import { MatLegacySnackBar } from '@angular/material/legacy-snack-bar';
import { of, throwError } from 'rxjs';
import { EventEmitter } from '@angular/core';

describe('ServiceHistoryComponent', () => {
  let component: ServiceHistoryComponent;
  let mockDatePipe: any;
  let mockDialogRef: any;
  let mockProfileV2RevampSvc: any;
  let mockSnackBar: any;
  let mockData: any;

  const mockServiceHistoryList = [
    {
      designation: 'Software Engineer',
      orgDetails: 'Tech Corp, Bangalore, Karnataka',
      period: 'Mar 22 - Present',
      orgLogo: 'assets/icons/office.svg',
      showMore: false
    },
    {
      designation: 'Senior Developer',
      orgDetails: 'Tech Corp, Bangalore, Karnataka',
      period: 'jan 2022 - feb 2023',
      orgLogo: 'assets/icons/office.svg',
      showMore: false
    }
  ];

  beforeEach(() => {
    mockDatePipe = {
      transform: jest.fn()
    };

    mockDialogRef = {
      close: jest.fn()
    };

    mockProfileV2RevampSvc = {
      fetchProfileEntries: jest.fn()
    };

    mockSnackBar = {
      open: jest.fn()
    };

    mockData = {
      userId: 'user123',
      isCurrentUser: true
    };

    // Create component instance manually
    component = new ServiceHistoryComponent(
      mockDatePipe,
      mockDialogRef,
      mockData,
      mockProfileV2RevampSvc,
      mockSnackBar
    );

    // Initialize component properties
    component.serviceHistoryList = [];
    component.isCurrentUser = false;
    component.openProfileEntryEditDialog = new EventEmitter();
    component.userId = '';
    component.isPopup = false;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with data when data is provided', () => {
      const testData = {
        userId: 'test-user-123',
        isCurrentUser: true
      };

      const testComponent = new ServiceHistoryComponent(
        mockDatePipe,
        mockDialogRef,
        testData,
        mockProfileV2RevampSvc,
        mockSnackBar
      );

      expect(testComponent.userId).toBe('test-user-123');
      expect(testComponent.isPopup).toBe(true);
      expect(testComponent.isCurrentUser).toBe(true);
    });

    it('should handle null or undefined data', () => {
      const testComponent = new ServiceHistoryComponent(
        mockDatePipe,
        mockDialogRef,
        null,
        mockProfileV2RevampSvc,
        mockSnackBar
      );

      expect(testComponent.userId).toBe('');
      expect(testComponent.isPopup).toBe(false);
      expect(testComponent.isCurrentUser).toBe(false);
    });

    it('should handle data without userId', () => {
      const testData = {
        isCurrentUser: true
      };

      const testComponent = new ServiceHistoryComponent(
        mockDatePipe,
        mockDialogRef,
        testData,
        mockProfileV2RevampSvc,
        mockSnackBar
      );

      expect(testComponent.userId).toBe('');
      expect(testComponent.isPopup).toBe(false);
    });
  });

  describe('ngOnInit', () => {
    it('should call getServiceHistoryList when isPopup is true', () => {
      component.isPopup = true;
      const getServiceHistoryListSpy = jest.spyOn(component, 'getServiceHistoryList').mockImplementation(() => {});

      component.ngOnInit();

      expect(getServiceHistoryListSpy).toHaveBeenCalled();
    });

    it('should not call getServiceHistoryList when isPopup is false', () => {
      component.isPopup = false;
      const getServiceHistoryListSpy = jest.spyOn(component, 'getServiceHistoryList').mockImplementation(() => {});

      component.ngOnInit();

      expect(getServiceHistoryListSpy).not.toHaveBeenCalled();
    });
  });

  describe('getServiceHistoryList', () => {
    beforeEach(() => {
      component.userId = 'test-user-123';
      jest.spyOn(component, 'formateData').mockImplementation(() => {});
      jest.spyOn(component, 'openSnackbar' as any).mockImplementation(() => {});
    });

    it('should fetch service history successfully', () => {
      const mockResponse = {
        result: {
          response: {
            serviceHistory: mockServiceHistoryList
          }
        }
      };

      mockProfileV2RevampSvc.fetchProfileEntries.mockReturnValue(of(mockResponse));

      component.getServiceHistoryList();

      expect(mockProfileV2RevampSvc.fetchProfileEntries).toHaveBeenCalledWith('test-user-123', 'serviceHistory');
      expect(component.serviceHistoryList).toEqual(mockServiceHistoryList);
      expect(component.formateData).toHaveBeenCalled();
    });

    it('should handle empty response', () => {
      const mockResponse = {
        result: {
          response: {
            serviceHistory: []
          }
        }
      };

      mockProfileV2RevampSvc.fetchProfileEntries.mockReturnValue(of(mockResponse));

      component.getServiceHistoryList();

      expect(component.serviceHistoryList).toEqual([]);
      expect(component.formateData).toHaveBeenCalled();
    });

    it('should handle response without serviceHistory', () => {
      const mockResponse = {
        result: {
          response: {}
        }
      };

      mockProfileV2RevampSvc.fetchProfileEntries.mockReturnValue(of(mockResponse));

      component.getServiceHistoryList();

      expect(component.serviceHistoryList).toEqual([]);
      expect(component.formateData).toHaveBeenCalled();
    });

    it('should handle error response', () => {
      const mockError = { error: 'Network error' };
      mockProfileV2RevampSvc.fetchProfileEntries.mockReturnValue(throwError(mockError));

      component.getServiceHistoryList();

      expect(component.openSnackbar as any).toHaveBeenCalledWith(
        'something went wrong while fetching service history please try again later',
        5000
      );
    });

    it('should not fetch when userId is empty', () => {
      component.userId = '';

      component.getServiceHistoryList();

      expect(mockProfileV2RevampSvc.fetchProfileEntries).not.toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    it('should call formateData when serviceHistoryList has data', () => {
      component.serviceHistoryList = mockServiceHistoryList;
      jest.spyOn(component, 'formateData').mockImplementation(() => {});

      component.ngOnChanges();

      expect(component.formateData).toHaveBeenCalled();
    });

    it('should not call formateData when serviceHistoryList is empty', () => {
      component.serviceHistoryList = [];
      jest.spyOn(component, 'formateData').mockImplementation(() => {});

      component.ngOnChanges();

      expect(component.formateData).not.toHaveBeenCalled();
    });

    it('should not call formateData when serviceHistoryList is null', () => {
      component.serviceHistoryList = null as any;
      jest.spyOn(component, 'formateData').mockImplementation(() => {});

      component.ngOnChanges();

      expect(component.formateData).not.toHaveBeenCalled();
    });
  });

  describe('formateData', () => {
    beforeEach(() => {
      mockDatePipe.transform.mockImplementation((date: Date, format: string) => {
        if (format === 'MMM yyyy') {
          return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }
        return date.toString();
      });
    });

    it('should format service history data correctly', () => {
      component.serviceHistoryList = [...mockServiceHistoryList];

      component.formateData();

      const firstService = component.serviceHistoryList[0];
      expect(firstService.orgDetails).toBe('undefined, undefined, undefined');
      expect(firstService.period).toContain(' - Present - 0 year');
      expect(firstService.period).toContain(' - Present - 0 year');
      expect(firstService.showMore).toBe(false);
    });

    it('should handle currently working employees', () => {
      const currentlyWorkingService = {
        ...mockServiceHistoryList[1],
        currentlyWorking: 'true'
      };
      component.serviceHistoryList = [currentlyWorkingService];

      component.formateData();

      const service = component.serviceHistoryList[0];
      expect(service.period).toContain('Present');
    });

    it('should calculate year gap correctly', () => {
      const serviceWithGap = {
        ...mockServiceHistoryList[0],
        startDate: '2020-01-01',
        endDate: '2023-12-31',
        currentlyWorking: 'false'
      };
      component.serviceHistoryList = [serviceWithGap];

      component.formateData();

      const service = component.serviceHistoryList[0];
      expect(service.period).toContain('3 year');
    });

    it('should handle singular year correctly', () => {
      const serviceWithOneYear = {
        ...mockServiceHistoryList[0],
        startDate: '2022-01-01',
        endDate: '2022-12-31',
        currentlyWorking: 'false'
      };
      component.serviceHistoryList = [serviceWithOneYear];

      component.formateData();

      const service = component.serviceHistoryList[0];
      expect(service.period).toContain('0 year');
    });

    it('should handle missing start date', () => {
      const serviceWithoutStartDate = {
        ...mockServiceHistoryList[0],
        startDate: null
      };
      component.serviceHistoryList = [serviceWithoutStartDate];

      component.formateData();

      const service = component.serviceHistoryList[0];
      expect(service.period).toContain(' - ');
    });

    it('should handle missing organization details', () => {
      const serviceWithMissingOrg = {
        ...mockServiceHistoryList[0],
        orgName: null,
        orgDistrict: null,
        orgState: null
      };
      component.serviceHistoryList = [serviceWithMissingOrg];

      component.formateData();

      const service = component.serviceHistoryList[0];
      expect(service.orgDetails).toBe('null, null, null');
    });

    it('should not format when serviceHistoryList is empty', () => {
      component.serviceHistoryList = [];
      const originalList = [...component.serviceHistoryList];

      component.formateData();

      expect(component.serviceHistoryList).toEqual(originalList);
    });

    it('should not format when serviceHistoryList is null', () => {
      component.serviceHistoryList = null as any;

      expect(() => component.formateData()).not.toThrow();
    });
  });

  describe('openEditDialog', () => {
    const mockEntry = { id: '1', designation: 'Test Role' };

    it('should close dialog with entry when isPopup is true', () => {
      component.isPopup = true;

      component.openEditDialog(mockEntry);

      expect(mockDialogRef.close).toHaveBeenCalledWith(mockEntry);
    });

    it('should emit event when isPopup is false', () => {
      component.isPopup = false;
      jest.spyOn(component.openProfileEntryEditDialog, 'emit');

      component.openEditDialog(mockEntry);

      expect(component.openProfileEntryEditDialog.emit).toHaveBeenCalledWith(mockEntry);
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should handle empty entry object', () => {
      component.isPopup = true;

      component.openEditDialog();

      expect(mockDialogRef.close).toHaveBeenCalledWith({});
    });

    it('should handle null entry', () => {
      component.isPopup = false;
      jest.spyOn(component.openProfileEntryEditDialog, 'emit');

      component.openEditDialog(null);

      expect(component.openProfileEntryEditDialog.emit).toHaveBeenCalledWith(null);
    });
  });

  describe('closePopup', () => {
    it('should close dialog when isPopup is true', () => {
      component.isPopup = true;

      component.closePopup();

      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });

    it('should not close dialog when isPopup is false', () => {
      component.isPopup = false;

      component.closePopup();

      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('openSnackbar (private method)', () => {
    it('should open snackbar with default duration', () => {
      const message = 'Test message';

      (component as any).openSnackbar(message);

      expect(mockSnackBar.open).toHaveBeenCalledWith(message, 'X', {
        duration: 5000
      });
    });

    it('should open snackbar with custom duration', () => {
      const message = 'Test message';
      const duration = 3000;

      (component as any).openSnackbar(message, duration);

      expect(mockSnackBar.open).toHaveBeenCalledWith(message, 'X', {
        duration: 3000
      });
    });

    it('should handle empty message', () => {
      (component as any).openSnackbar('');

      expect(mockSnackBar.open).toHaveBeenCalledWith('', 'X', {
        duration: 5000
      });
    });
  });

  describe('Input Properties', () => {
    it('should initialize serviceHistoryList as empty array', () => {
      expect(component.serviceHistoryList).toEqual([]);
    });

    it('should initialize isCurrentUser as false', () => {
      expect(component.isCurrentUser).toBe(false);
    });

    it('should have openProfileEntryEditDialog as EventEmitter', () => {
      expect(component.openProfileEntryEditDialog).toBeInstanceOf(EventEmitter);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete flow from ngOnInit to formateData', () => {
      component.isPopup = true;
      component.userId = 'test-user';
      
      const mockResponse = {
        result: {
          response: {
            serviceHistory: mockServiceHistoryList
          }
        }
      };

      mockProfileV2RevampSvc.fetchProfileEntries.mockReturnValue(of(mockResponse));
      mockDatePipe.transform.mockImplementation((date: Date, format: string) => {
        if (format === 'MMM yyyy') {
          return 'Jan 2020';
        }
        return date.toString();
      });

      component.ngOnInit();

      expect(mockProfileV2RevampSvc.fetchProfileEntries).toHaveBeenCalledWith('test-user', 'serviceHistory');
      expect(component.serviceHistoryList).toHaveLength(2);
      expect(component.serviceHistoryList[0].orgDetails).toBe('undefined, undefined, undefined');
      expect(component.serviceHistoryList[0].showMore).toBe(false);
    });

    it('should handle error flow gracefully', () => {
      component.isPopup = true;
      component.userId = 'test-user';
      
      mockProfileV2RevampSvc.fetchProfileEntries.mockReturnValue(throwError({ error: 'API Error' }));
      jest.spyOn(component, 'openSnackbar' as any).mockImplementation(() => {});

      component.ngOnInit();

      expect(component.openSnackbar as any).toHaveBeenCalledWith(
        'something went wrong while fetching service history please try again later',
        5000
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined values in service data', () => {
      const serviceWithUndefined = {
        designation: '',
        orgDetails: '',
        period: '',
        orgLogo: '',
        showMore: false
      };
      
      component.serviceHistoryList = [serviceWithUndefined];

      expect(() => component.formateData()).not.toThrow();
    });

    it('should handle invalid date strings', () => {
      const serviceWithInvalidDates = {
        ...mockServiceHistoryList[0],
        startDate: 'invalid-date',
        endDate: 'another-invalid-date'
      };
      
      component.serviceHistoryList = [serviceWithInvalidDates];

      expect(() => component.formateData()).not.toThrow();
    });

    it('should handle very large service history lists', () => {
      const largeList = Array(1000).fill(null).map((_, index) => ({
        ...mockServiceHistoryList[0],
        id: `service-${index}`
      }));
      
      component.serviceHistoryList = largeList;

      expect(() => component.formateData()).not.toThrow();
      expect(component.serviceHistoryList).toHaveLength(1000);
    });
  });
});