import { MyAllEventsComponent } from './my-all-events.component';
import { of, Subscription } from 'rxjs';

jest.mock('@ngx-translate/core');
jest.mock('../../../services/events.service');
jest.mock('@sunbird-cb/utils-v2');

describe('MyAllEventsComponent', () => {
  let component: MyAllEventsComponent;
  let mockActivatedRoute: any;
  let mockTranslateService: any;
  let mockEventService: any;
  let mockLangTranslations: any;
  let mockLibEventService: any;

  beforeEach(() => {
    mockActivatedRoute = {
      queryParamMap: of({ params: { tabSelected: 'today' } })
    };
    mockTranslateService = { setDefaultLang: jest.fn(), use: jest.fn() };
    mockEventService = { getEventsList: jest.fn().mockReturnValue(of({ result: { Event: [], count: 0 } })) };
    mockLangTranslations = { translateActualLabel: jest.fn() };
    mockLibEventService = { raiseInteractTelemetry: jest.fn() };

    component = new MyAllEventsComponent(
      mockActivatedRoute,
      mockTranslateService,
      mockEventService,
      mockLangTranslations,
      mockLibEventService
    );
  });

  it('should initialize component', () => {
    expect(component).toBeTruthy();
  });

  it('should set tabSelected on init', () => {
    component.ngOnInit();
    expect(component.tabSelected).toBe('today');
  });

  it('should call fetchData on scroll when conditions met', () => {
    jest.spyOn(component, 'fetchData');
    Object.defineProperty(window, 'innerHeight', { value: 1000 });
    Object.defineProperty(window, 'scrollY', { value: 1000 });
    Object.defineProperty(document.body, 'offsetHeight', { value: 1400 });
    component.showNextPage = true;
    component.isLoading = false;
    component.onScroll();
    expect(component.fetchData).toHaveBeenCalled();
  });

  it('should fetch data and update contentDataList', () => {
    component.fetchData();
    expect(mockEventService.getEventsList).toHaveBeenCalled();
  });

  it('should check if an event is live', () => {
    const event = {
      startDate: '2025-03-18',
      endDate: '2025-03-19',
      startTime: '10:00AM',
      endTime: '11:00AM'
    };
    expect(component.isLiveEvent(event)).toBe(false);
  });

  it('should reset data', () => {
    component.dataScription = new Subscription();
    component.resetData();
    expect(component.contentDataList.length).toBe(0);
    expect(component.currentPage).toBe(0);
  });

  it('should raise telemetry event', () => {
    const event = { identifier: 'event123' };
    component.raiseTelemetry(event);
    expect(mockLibEventService.raiseInteractTelemetry).toHaveBeenCalled();
  });

  it('should switch tabs and fetch data', () => {
    jest.spyOn(component, 'fetchData');
    component.tabClick({ index: 1 });
    expect(component.tabSelected).toBe('upcoming');
    expect(component.fetchData).toHaveBeenCalled();
  });
});
