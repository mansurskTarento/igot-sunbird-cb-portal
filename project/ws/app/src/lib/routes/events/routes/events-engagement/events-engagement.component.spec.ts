import { EventsEngagementComponent } from './events-engagement.component';

jest.mock('@sunbird-cb/utils-v2', () => {
  return {
    MultilingualTranslationsService: jest.fn().mockImplementation(() => ({
      translateActualLabel: jest.fn((label) => `translated-${label}`),
    })),
  };
});

describe('EventsEngagementComponent', () => {
  let component: any;
  let bottomSheetRef: any;
  let langtranslations: any;

  beforeEach(() => {
    bottomSheetRef = { dismiss: jest.fn() };

    // Ensure the constructor is properly handled
    component = new EventsEngagementComponent(bottomSheetRef, null, langtranslations);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return value from engagementDetails', () => {
    component.engagementDetails = { key1: 'value1' };
    expect(component.getValue('key1')).toBe('value1');
  });

  it('should return empty string if key is not found in engagementDetails', () => {
    component.engagementDetails = { key1: 'value1' };
    expect(component.getValue('key2')).toBe('');
  });

  it('should close the dialog', () => {
    component.closeDiaolg();
    expect(bottomSheetRef.dismiss).toHaveBeenCalled();
  });
});
