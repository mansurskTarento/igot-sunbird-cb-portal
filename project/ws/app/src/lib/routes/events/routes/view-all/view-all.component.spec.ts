import { ViewAllComponent } from './view-all.component';
import { of, throwError } from 'rxjs';
import { MobileFiltersComponent } from '../events/mobile-filters/mobile-filters.component';

describe('ViewAllComponent', () => {
  let component: ViewAllComponent;
  let mockActivatedRoute: any;
  let mockEventService: any;
  let mockDatePipe: any;
  let mockBottomSheet: any;
  let mockSnackBar: any;
  let mockTranslateService: any;
  let mockRouter: any;

  beforeEach(() => {
    // Mock dependencies
    mockActivatedRoute = {
      queryParamMap: of({
        params: {
          resourceType: 'webinar',
          query: 'test'
        }
      })
    };

    mockEventService = {
      getEventsList: jest.fn()
    };

    mockDatePipe = {
      transform: jest.fn((format) => {
        if (format === 'yyyy-MM-dd') {
          return '2025-03-13';
        }
        return '13/03/2025';
      })
    };

    mockBottomSheet = {
      open: jest.fn().mockReturnValue({
        afterDismissed: jest.fn().mockReturnValue(of({}))
      })
    };

    mockSnackBar = {
      open: jest.fn()
    };

    mockTranslateService = {
      setDefaultLang: jest.fn(),
      use: jest.fn()
    };

    mockRouter = {
      navigate: jest.fn()
    };

    // Create component instance
    component = new ViewAllComponent(
      mockActivatedRoute as any,
      mockEventService as any,
      mockDatePipe as any,
      mockBottomSheet as any,
      mockSnackBar as any,
      mockTranslateService as any,
      mockRouter as any
    );

    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn().mockReturnValue('en'),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    // Mock scroll event
    Object.defineProperty(window, 'scrollY', { value: 1000 });
    Object.defineProperty(window, 'innerHeight', { value: 800 });
    Object.defineProperty(document.body, 'offsetHeight', { value: 2000 });

    // Initialize component
    component.ngOnInit();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct default values', () => {
    expect(component.currentPage).toBe(0);
    expect(component.pageLimit).toBe(9);
    expect(component.sortOptions).toEqual({ startDate: 'desc' });
    expect(component.titles.length).toBe(2);
    expect(component.facetsData).toBeDefined();
  });

  it('should set language from localStorage', () => {
    expect(mockTranslateService.setDefaultLang).toHaveBeenCalledWith('en');
    expect(mockTranslateService.use).toHaveBeenCalledWith('en');
  });

  it('should handle query params from activated route', () => {
    expect(component.selectedFilters.resourceType).toEqual(['webinar']);
    expect(component.searchControl.value).toBe('test');
  });

  describe('fetchData', () => {
    beforeEach(() => {
      component.contentDataList = [];
      component.currentPage = 0;
    });

    it('should fetch data successfully', () => {
      const mockResponse = {
        result: {
          Event: [
            { id: '1', name: 'Event 1', startDate: '2025-03-13', endDate: '2025-03-14', startTime: '10:00', endTime: '11:00' },
            { id: '2', name: 'Event 2', startDate: '2025-03-14', endDate: '2025-03-15', startTime: '10:00', endTime: '11:00' }
          ],
          count: 2
        }
      };

      mockEventService.getEventsList.mockReturnValue(of(mockResponse));

      component.fetchData();

      expect(mockEventService.getEventsList).toHaveBeenCalled();
      expect(component.contentDataList.length).toBeGreaterThan(0);
      expect(component.currentPage).toBe(1);
      expect(component.isLoading).toBe(false);
    });

    it('should handle error when fetching data', () => {
      mockEventService.getEventsList.mockReturnValue(throwError('Error'));

      component.fetchData();

      expect(mockEventService.getEventsList).toHaveBeenCalled();
      expect(component.isLoading).toBe(false);
    });

    it('should process results based on event status filter', () => {
      component.selectedFilters.eventStatus = ['Live Events'];

      const mockResponse = {
        result: {
          Event: [
            { id: '1', name: 'Event 1', startDate: '2025-03-13', endDate: '2025-03-14', startTime: '10:00', endTime: '23:00' },
            { id: '2', name: 'Event 2', startDate: '2025-03-10', endDate: '2025-03-11', startTime: '10:00', endTime: '11:00' }
          ],
          count: 2
        }
      };

      mockEventService.getEventsList.mockReturnValue(of(mockResponse));

      // Mock the current date to ensure predictable test results
      component.fetchData();

      expect(component.contentDataList.length).toBeGreaterThan(0);

      // Restore original Date
    });
  });

  describe('generateRequestBody', () => {
    it('should generate correct request body with no filters', () => {
      component.selectedFilters = {};
      const requestBody = component.generateRequestBody();

      expect(requestBody.request.filters.contentType).toBe('Event');
      expect(requestBody.request.filters.category).toBe('Event');
      expect(requestBody.request.limit).toBe(9);
      expect(requestBody.request.offset).toBe(0);
    });

    it('should generate correct request body with resource type filter', () => {
      component.selectedFilters = { resourceType: ['webinar'] };
      const requestBody = component.generateRequestBody();

      expect(requestBody.request.filters.resourceType).toEqual(['webinar']);
    });

    it('should generate correct request body with date filters', () => {
      component.selectedFilters = {
        eventDate: ['Today']
      };

      const requestBody = component.generateRequestBody();

      expect(requestBody.request.filters.startDate).toBeDefined();
      expect(requestBody.request.filters.endDate).toBeDefined();
      expect(mockDatePipe.transform).toHaveBeenCalled();
    });

    it('should generate correct request body with date range', () => {
      component.selectedFilters = {
        dateRange: {
          fromDate: new Date('2025-03-01'),
          toDate: new Date('2025-03-15')
        }
      };

      const requestBody = component.generateRequestBody();

      expect(requestBody.request.filters.startDate).toBeDefined();
      expect(requestBody.request.filters.endDate).toBeDefined();
      expect(mockDatePipe.transform).toHaveBeenCalledWith(new Date('2025-03-01'), 'yyyy-MM-dd');
      expect(mockDatePipe.transform).toHaveBeenCalledWith(new Date('2025-03-15'), 'yyyy-MM-dd');
    });
  });

  describe('filter operations', () => {
    it('should clear all filters', () => {
      component.selectedFilters = { resourceType: ['webinar'] };
      component.startDate = '2025-03-01';
      component.endDate = '2025-03-15';

      component.clearAll();

      expect(component.selectedFilters).toEqual({});
      expect(component.startDate).toBe('');
      expect(component.endDate).toBe('');
    });

    it('should remove specific filter', () => {
      component.selectedFilters = {
        resourceType: ['webinar', 'karmayogiTalks'],
        eventStatus: ['Live Events']
      };

      component.removeFilter('resourceType', 'webinar');

      expect(component.selectedFilters.resourceType).toEqual(['karmayogiTalks']);
      expect(component.selectedFilters.eventStatus).toEqual(['Live Events']);
    });

    it('should remove date range filter', () => {
      component.selectedFilters = {
        dateRange: { fromDate: new Date(), toDate: new Date() }
      };
      component.startDate = '2025-03-01';
      component.endDate = '2025-03-15';

      component.removeFilter('dateRange', null);

      expect(component.selectedFilters.dateRange).toBeUndefined();
      expect(component.startDate).toBe('');
      expect(component.endDate).toBe('');
    });

    it('should update selection when filter is changed', () => {
      component.selectedFilters = {};

      component.changeSelection(true, 'resourceType', { name: 'webinar' });

      expect(component.selectedFilters.resourceType).toEqual(['webinar']);
    });

    it('should remove selection when filter is unchecked', () => {
      component.selectedFilters = { resourceType: ['webinar'] };

      component.changeSelection(false, 'resourceType', { name: 'webinar' });

      expect(component.selectedFilters.resourceType).toBeUndefined();
    });
  });

  describe('bottom sheet', () => {
    it('should open bottom sheet with correct data', () => {
      component.openBottomSheet();

      expect(mockBottomSheet.open).toHaveBeenCalledWith(
        MobileFiltersComponent,
        expect.objectContaining({
          data: expect.objectContaining({
            facetsData: component.facetsData,
            selectedFilters: component.selectedFilters
          })
        })
      );
    });

    it('should apply filters when bottom sheet is dismissed with apply action', () => {
      const mockBottomSheetRef = {
        afterDismissed: jest.fn().mockReturnValue(of({
          action: 'apply',
          selectedFilters: { resourceType: ['karmayogiTalks'] }
        }))
      };

      mockBottomSheet.open.mockReturnValue(mockBottomSheetRef);

      component.openBottomSheet();

      expect(component.selectedFilters).toEqual({ resourceType: ['karmayogiTalks'] });
    });
  });

  describe('date handling', () => {
    it('should update start date', () => {
      component.onDateChange({ value: new Date('2025-03-01') }, { key: 'fromDate' }, { key: 'dateRange' });

      expect(component.startDate).toBe('2025-03-13');
    });

    it('should update end date', () => {
      component.onDateChange({ value: new Date('2025-03-15') }, { key: 'toDate' }, { key: 'dateRange' });

      expect(component.endDate).toBe('2025-03-13');
    });

    it('should show error when start date is greater than end date', () => {
      component.startDate = '2025-03-15';
      component.endDate = '2025-03-01';

      component.onDateChange({ value: new Date('2025-03-15') }, { key: 'toDate' }, { key: 'dateRange' });

      expect(mockSnackBar.open).toHaveBeenCalled();
    });


  });



})