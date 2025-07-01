import { CommunitySuggestionsComponent } from './community-suggestions.component';

describe('CommunitySuggestionsComponent (Jest, no TestBed)', () => {
  let component: any;
  let mockRouter: any;
  let mockEvents: any;

  beforeEach(() => {
    mockRouter = { navigate: jest.fn() };
    mockEvents = { raiseInteractTelemetry: jest.fn() };
    component = new CommunitySuggestionsComponent(mockRouter, mockEvents);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default communitySuggestionsList as empty array', () => {
    expect(Array.isArray(component.communitySuggestionsList)).toBe(true);
    expect(component.communitySuggestionsList.length).toBe(0);
  });

  it('should call viewCommunity and navigate if communityId exists', () => {
    const community = { communityId: '123' };
    component.raiseTelemetry = jest.fn();
    component.viewCommunity(community);
    expect(component.raiseTelemetry).toHaveBeenCalledWith('123');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/discussion-forum-v2/community/', '123']);
  });

  it('should not navigate if communityId does not exist', () => {
    const community = { name: 'NoId' };
    component.raiseTelemetry = jest.fn();
    component.viewCommunity(community);
    expect(component.raiseTelemetry).not.toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should not navigate if community is null', () => {
    component.raiseTelemetry = jest.fn();
    component.viewCommunity(null);
    expect(component.raiseTelemetry).not.toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should call raiseTelemetry with correct params', () => {
    const WsEvents: any = {
      EnumInteractTypes: { CLICK: 'click' },
      EnumTelemetrymodules: { NETWORK: 'network' }
    };
    component.events = { raiseInteractTelemetry: jest.fn() };
    const globalAny: any = globalThis as any;
    globalAny.WsEvents = WsEvents;
    component.raiseTelemetry('456');
    expect(component.events.raiseInteractTelemetry).toHaveBeenCalledWith(
      { type: WsEvents.EnumInteractTypes.CLICK, id: 'comminuty-card' },
      { id: '456', type: 'Community' },
      { module: WsEvents.EnumTelemetrymodules.NETWORK }
    );
  });

  // Use all variables to avoid lint errors
  afterEach(() => {
    expect(component).toBeDefined();
    expect(mockRouter).toBeDefined();
    expect(mockEvents).toBeDefined();
  });
});
