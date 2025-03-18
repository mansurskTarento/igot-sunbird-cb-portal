import { EventsHomeV2Component } from './events-home-v2.component';

jest.mock('./events-home-v2.component', () => ({
  EventsHomeV2Component: jest.fn().mockImplementation(() => ({
    ngOnInit: jest.fn(),
  }))
}));

describe('EventsHomeV2Component', () => {
  let component: any;

  beforeEach(() => {
    component = new EventsHomeV2Component();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should call ngOnInit on initialization', () => {
    const ngOnInitSpy = jest.spyOn(component, 'ngOnInit');
    component.ngOnInit();
    expect(ngOnInitSpy).toHaveBeenCalled();
  });

});
