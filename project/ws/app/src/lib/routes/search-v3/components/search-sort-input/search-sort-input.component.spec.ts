import { SearchSortInputComponent } from './search-sort-input.component';
import { SEARCH_SORT_DROPDOWN } from '@ws/author/src/lib/constants/constant';

jest.mock('@ws/author/src/lib/constants/constant', () => ({
  SEARCH_SORT_DROPDOWN: [
    { name: 'Most Relevant', value: 'most_relevant' },
    { name: 'Latest First', value: 'latest_first' },
    { name: 'Oldest First', value: 'oldest_first' }
  ]
}));

describe('SearchSortInputComponent', () => {
  let component: SearchSortInputComponent;

  beforeEach(() => {
    component = new SearchSortInputComponent();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default selectedOption as most_relevant', () => {
    expect(component.selectedOption).toBe('most_relevant');
  });

  it('should have options equal to SEARCH_SORT_DROPDOWN', () => {
    expect(component.options).toBe(SEARCH_SORT_DROPDOWN);
  });

  it('should update selectedOption and emit event when onChange is called', () => {
    // Arrange
    jest.spyOn(component.searchSorter, 'emit');
    const mockEvent = {
      target: {
        value: 'latest_first'
      }
    } as unknown as Event;

    // Act
    component.onChange(mockEvent);

    // Assert
    expect(component.selectedOption).toBe('latest_first');
    expect(component.searchSorter.emit).toHaveBeenCalledWith('latest_first');
  });

  it('should not update selectedOption if target is null', () => {
    // Arrange
    jest.spyOn(component.searchSorter, 'emit');
    const mockEvent = {} as unknown as Event;
    
    // Act & Assert
    expect(() => component.onChange(mockEvent)).toThrow();
    expect(component.searchSorter.emit).not.toHaveBeenCalled();
  });

  it('should emit the current selectedOption value', () => {
    // Arrange
    jest.spyOn(component.searchSorter, 'emit');
    const mockEvent = {
      target: {
        value: 'oldest_first'
      }
    } as unknown as Event;

    // Act
    component.onChange(mockEvent);

    // Assert
    expect(component.searchSorter.emit).toHaveBeenCalledWith('oldest_first');
    expect(component.selectedOption).toBe('oldest_first');
  });

  it('should handle multiple onChange calls correctly', () => {
    // Arrange
    jest.spyOn(component.searchSorter, 'emit');
    
    const firstEvent = {
      target: { value: 'latest_first' }
    } as unknown as Event;
    
    const secondEvent = {
      target: { value: 'oldest_first' }
    } as unknown as Event;

    // Act
    component.onChange(firstEvent);
    component.onChange(secondEvent);

    // Assert
    expect(component.selectedOption).toBe('oldest_first');
    expect(component.searchSorter.emit).toHaveBeenCalledTimes(2);
    expect(component.searchSorter.emit).toHaveBeenNthCalledWith(1, 'latest_first');
    expect(component.searchSorter.emit).toHaveBeenNthCalledWith(2, 'oldest_first');
  });
});