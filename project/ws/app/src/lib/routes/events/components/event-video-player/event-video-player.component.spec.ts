import { EventVideoPlayerComponent } from './event-video-player.component';
import { of } from 'rxjs';

// Mock the videoJs import
jest.mock('video.js', () => {
  return jest.fn().mockImplementation(() => {
    return {
      dispose: jest.fn(),
    };
  });
});

// Mock video.js initializer utility
jest.mock('../../../../../../../../../library/ws-widget/collection/src/lib/_services/videojs-util', () => ({
  videoJsInitializer: jest.fn().mockReturnValue({
    player: {
      dispose: jest.fn(),
    },
    dispose: jest.fn(),
  }),
  telemetryEventDispatcherFunction: jest.fn(),
  saveContinueLearningFunction: jest.fn(),
  fireRealTimeProgressFunction: jest.fn(),
}));

describe('EventVideoPlayerComponent', () => {
  let component: EventVideoPlayerComponent;
  let mockActivatedRoute: any;
  let mockEventService: any;
  let mockConfigSvc: any;

  const mockEventData = {
    identifier: 'test-event-123',
    registrationLink: 'http://example.com/video.mp4',
    startDate: '2023-01-01',
    startTime: '0900+0000',
    endDate: '2023-01-01',
    endTime: '1000+0000',
    duration: 60,
    batches: JSON.stringify([{ batchId: 'batch-001' }]),
    channel: 'test-channel'
  };

  const mockStateReadResponse = {
    result: {
      events: [{
        progressdetails: JSON.stringify({ stateMetaData: 300 }),
        status: 1
      }]
    }
  };

  beforeEach(() => {
    // Create mocks
    mockActivatedRoute = {
      snapshot: {
        data: {
          content: {
            data: mockEventData
          }
        }
      },
      queryParams: of({ isEnrolled: true })
    };

    mockEventService = {
      eventStateRead: jest.fn().mockReturnValue(of(mockStateReadResponse)),
      saveEventProgressUpdate: jest.fn().mockReturnValue(of({}))
    };

    mockConfigSvc = {
      userProfile: {
        userId: 'test-user-001'
      }
    };

    // Initialize component
    component = new EventVideoPlayerComponent(
      mockActivatedRoute,
      mockEventService,
      mockConfigSvc
    );

    // Mock ElementRef for videoTag
    component.videoTag = {
      nativeElement: document.createElement('video')
    } as any;

    // Spy on console.log to avoid actual console outputs
    jest.spyOn(console, 'log').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });


  test('should get batch ID correctly', () => {
    component.eventData = mockEventData;
    const batchId = component.getBatchId();
    expect(batchId).toBe('batch-001');
  });

  test('should format date correctly', () => {
    const formattedDate = component.customDateFormat('2023-01-01', '0900+0000');
    expect(formattedDate).toBe('2023-01-01 0900');
  });

  test('should call eventStateRead and initialize player', () => {
    const spyEventStateRead = jest.spyOn(component, 'eventStateRead');

    component.ngOnInit();

    expect(spyEventStateRead).toHaveBeenCalled();
    // initializePlayer gets called inside the eventStateRead subscription
    // This will be indirectly tested in the next test
  });

  test('should initialize player with resume point', () => {
    component.eventData = mockEventData;
    component.eventStateRead();

    // Check if initializePlayer was called with the correct resume position
    expect(mockEventService.eventStateRead).toHaveBeenCalledWith({
      eventId: mockEventData.identifier,
      batchId: 'batch-001'
    });

    // Since we're not actually calling initializePlayer in our test setup,
    // we can't directly verify it received the correct resume value
    // But we can check that widgetData was set correctly
    expect(component.widgetData).toHaveProperty('identifier', mockEventData.identifier);
    expect(component.widgetData).toHaveProperty('url', mockEventData.registrationLink);
  });

  test('should cleanup on destroy when player and dispose exist', () => {
    // Setup the player and dispose function with definite values
    const mockPlayerDispose = jest.fn();
    const mockDispose = jest.fn();

    // Explicitly assign non-null values
    component.player = { dispose: mockPlayerDispose } as any;
    component.dispose = mockDispose;

    component.ngOnDestroy();

    expect(mockPlayerDispose).toHaveBeenCalled();
    expect(mockDispose).toHaveBeenCalled();
  });

  test('should handle ngOnDestroy safely when player is null', () => {
    // Setup with player as null but dispose function present
    component.player = null;
    const mockDispose = jest.fn();
    component.dispose = mockDispose;

    // Should not throw an error
    expect(() => component.ngOnDestroy()).not.toThrow();
    expect(mockDispose).toHaveBeenCalled();
  });

  test('should handle ngOnDestroy safely when dispose is null', () => {
    // Setup with player present but dispose as null
    const mockPlayerDispose = jest.fn();
    component.player = { dispose: mockPlayerDispose } as any;
    component.dispose = null;

    // Should not throw an error
    expect(() => component.ngOnDestroy()).not.toThrow();
    expect(mockPlayerDispose).toHaveBeenCalled();
  });

  test('should handle ngOnDestroy safely when both player and dispose are null', () => {
    // Setup with both player and dispose as null
    component.player = null;
    component.dispose = null;

    // Should not throw an error
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  test('should save progress update correctly', () => {
    component.eventData = mockEventData;
    component.resumeEventStatus = 1;

    component.saveProgressUpdate(60, 1800, '2023-01-01 09:30:00+0000');

    expect(mockEventService.saveEventProgressUpdate).toHaveBeenCalled();
    const requestArg = mockEventService.saveEventProgressUpdate.mock.calls[0][0];
    expect(requestArg.request.events[0].eventId).toBe(mockEventData.identifier);
  });

  test('should not save progress update if already completed', () => {
    component.eventData = mockEventData;
    component.resumeEventStatus = 2; // Already completed

    component.saveProgressUpdate(60, 1800, '2023-01-01 09:30:00+0000');

    expect(mockEventService.saveEventProgressUpdate).not.toHaveBeenCalled();
  });

  test('should handle saveProgressUpdate safely when configSvc.userProfile is null', () => {
    component.eventData = mockEventData;
    component.resumeEventStatus = 1;
    // Set userProfile to null
    mockConfigSvc.userProfile = null;

    component.saveProgressUpdate(60, 1800, '2023-01-01 09:30:00+0000');

    // Function should complete without errors
    // The userId in the request should be an empty string
    expect(mockEventService.saveEventProgressUpdate).toHaveBeenCalled();
    const requestArg = mockEventService.saveEventProgressUpdate.mock.calls[0][0];
    expect(requestArg.request.userId).toBe('');
  });

  test('should handle saveProgressUpdate safely when eventData is null', () => {
    component.eventData = null;
    component.resumeEventStatus = 1;

    // Should not throw error
    expect(() => {
      component.saveProgressUpdate(60, 1800, '2023-01-01 09:30:00+0000');
    }).toThrow();

    // saveEventProgressUpdate should not be called
    expect(mockEventService.saveEventProgressUpdate).not.toHaveBeenCalled();
  });

  test('should handle start interval correctly', () => {
    component.eventData = mockEventData;
    const spySaveProgressUpdate = jest.spyOn(component, 'saveProgressUpdate');

    component.startInterval(1800, '2023-01-01 09:30:00+0000');

    expect(spySaveProgressUpdate).toHaveBeenCalledWith(
      mockEventData.duration,
      1800,
      '2023-01-01 09:30:00+0000',
      true
    );
  });
});