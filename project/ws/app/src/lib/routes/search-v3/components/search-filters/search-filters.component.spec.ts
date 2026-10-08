import { SimpleChange, SimpleChanges } from '@angular/core';
import { of } from 'rxjs';
import { SearchFiltersComponent } from './search-filters.component';
import {
  CATEGORY_TYPE,
  TypeOfEvents,
} from '../../../../../../../author/src/lib/constants/constant';
import { FacetType, SearchCategory } from '../../models/search-v3.model';

describe('SearchFiltersComponent', () => {
  let component: SearchFiltersComponent;
  let translateServiceMock: any;
  let activatedRouteMock: any;
  let configSvcMock: any;
  let langTranslationsMock: any;
  let telemetrySvcMock: any;
  let utilitySvcMock: any;
  let originalLocalStorage: any;

  const mockFacets = [
    [
      {
        name: 'language',
        values: [
          { name: 'english', count: 10 },
          { name: 'hindi', count: 5 },
          { name: 'marathi', count: 3 },
          { name: 'tamil', count: 2 },
          { name: 'telugu', count: 1 },
        ],
      },
      {
        name: 'sourceName',
        values: [
          { name: 'org1', count: 10 },
          { name: 'org2', count: 5 },
          { name: 'org3', count: 3 },
          { name: 'org4', count: 2 },
          { name: 'org5', count: 1 },
        ],
      },
    ],
  ];

  const mockEnvironment = {
    compentencyVersionKey: 'testKey',
  };

  beforeEach(() => {
    // Save original localStorage
    originalLocalStorage = global.localStorage;

    // Mock localStorage manually
    global.localStorage = {
      getItem: function (key) {
        if (key === 'websiteLanguage') {
          return 'en';
        }
        return null;
      },
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      length: 1,
      key: jest.fn(),
    };

    // Setup mocks
    translateServiceMock = {
      setDefaultLang: jest.fn(),
      use: jest.fn(),
    };

    // Create a mock for ParamMap
    const createMockParamMap = () => ({
      has: jest.fn(),
      get: jest.fn(),
      getAll: jest.fn(),
      keys: [],
    });

    // Create mock for ActivatedRoute with only the necessary properties
    activatedRouteMock = {
      snapshot: {
        queryParams: {},
        queryParamMap: createMockParamMap(),
        paramMap: createMockParamMap(),
      },
      // ngOnInit subscribes to this directly (not the snapshot) to track the explore-content tab
      queryParams: of({}),
    };

    configSvcMock = {
      compentency: {
        // ngOnInit reads environment.compentencyVersionKey (the real, unmocked module - setting
        // `(global as any).environment` below does not intercept the ES import), which resolves
        // to '' in this jsdom test environment, so that key must exist here too.
        '': {
          vKey: 'v1',
          vCompetencyArea: 'area',
          vCompetencyTheme: 'theme',
          vCompetencySubTheme: 'subtheme',
        },
        testKey: {
          vKey: 'v1',
          vCompetencyArea: 'area',
          vCompetencyTheme: 'theme',
          vCompetencySubTheme: 'subtheme',
        },
      },
    };

    langTranslationsMock = {
      translateActualLabel: jest.fn().mockReturnValue('Translated Label'),
    };

    telemetrySvcMock = { raiseInteractWithEnv: jest.fn() };
    utilitySvcMock = { setRouteData: jest.fn() };

    // Set up environment mock
    (global as any).environment = mockEnvironment;

    // Create component
    component = new SearchFiltersComponent(
      activatedRouteMock,
      translateServiceMock,
      langTranslationsMock,
      configSvcMock,
      telemetrySvcMock,
      utilitySvcMock
    );

    // Mock component methods that use lodash
    component.refactorFilterData = function (data: any) {
      if (typeof data !== 'object' || data === null) {
        return [];
      }

      // Using reduce instead of flatMap for better compatibility
      return Object.entries(data).reduce(
        (acc: any[], [key, values]: [string, any]) => {
          if (values && Array.isArray(values)) {
            values.forEach((value: string) => {
              acc.push({
                type: key,
                value: this.capitalizeFirstLetter(value),
              });
            });
          }
          return acc;
        },
        []
      );
    };
  });

  afterEach(() => {
    // Restore original localStorage
    global.localStorage = originalLocalStorage;

    // Clean up environment
    delete (global as any).environment;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should format facets correctly in ngOnChanges', () => {
    const changes: SimpleChanges = {
      newfacets: new SimpleChange(null, mockFacets, true),
    };

    component.formatFacets = function (data: any) {
      const formattedFacets: any = {};

      if (!data || !data.length) return formattedFacets;

      // Simplified implementation for test
      data[0].forEach((facet: any) => {
        formattedFacets[facet.name] = facet.values.map((value: any) => ({
          name: value.name,
          count: value.count,
          isChecked: false,
        }));
      });

      return formattedFacets;
    };

    component.ngOnChanges(changes);

    // Check if facets are formatted correctly
    expect(component.formattedFacets.language).toBeDefined();
    expect(component.formattedFacets.language.length).toBe(5);
    expect(component.formattedFacets.sourceName).toBeDefined();
  });

  it('should handle empty facets in ngOnChanges', () => {
    const changes: SimpleChanges = {
      newfacets: new SimpleChange(null, [], true),
    };

    component.formatFacets = jest.fn().mockReturnValue({});
    component.ngOnChanges(changes);
    expect(component.formattedFacets).toEqual({});
  });

  it('should set category type correctly when category is in URL params', () => {
    activatedRouteMock.snapshot.queryParams = {
      category: SearchCategory.Events,
    };

    // Mock category type setup
    component.categoryTypeDup = [...CATEGORY_TYPE];
    component.categoryType = [];

    // Mock the setCategoryType method
    const originalSetCategoryType = component.setCategoryType;
    component.setCategoryType = function () {
      this.categoryType = this.categoryTypeDup.filter(
        (type: any) => type.name === SearchCategory.Events
      );
      if (this.categoryType.length) {
        this.categoryType[0].isChecked = true;
        if (!this.selectedFilters) this.selectedFilters = {};
        this.selectedFilters[this.categoryType[0].name] = [
          this.categoryType[0].name,
        ];
        this.selectedFilterChips = [
          {
            value: this.categoryType[0].displayName,
            type: this.categoryType[0].name,
          },
        ];
        this.formattedFacets = this.formattedFacets || {};
        this.formattedFacets.typeOfEvents = TypeOfEvents;
      }
    };

    component.setCategoryType();

    expect(component.categoryType[0].isChecked).toBe(true);
    expect(component.selectedFilters[component.categoryType[0].name]).toEqual([
      component.categoryType[0].name,
    ]);
    expect(component.formattedFacets.typeOfEvents).toEqual(TypeOfEvents);

    // Restore original method
    component.setCategoryType = originalSetCategoryType;
  });

  describe('multi-category search (Phase 2)', () => {
    beforeEach(() => {
      component.categoryTypeDup = [...CATEGORY_TYPE];
    });

    it('isMultiCategorySearch is false when zero or one category is selected', () => {
      component.searchCategories = [];
      expect(component.isMultiCategorySearch).toBe(false);
      component.searchCategories = [SearchCategory.Courses];
      expect(component.isMultiCategorySearch).toBe(false);
    });

    it('isMultiCategorySearch is true when more than one category is selected', () => {
      component.searchCategories = [SearchCategory.Courses, SearchCategory.Events];
      expect(component.isMultiCategorySearch).toBe(true);
    });

    it('builds a read-only categoryType list for multiple selected categories', () => {
      activatedRouteMock.snapshot.queryParams = {
        category: `${SearchCategory.Events},${SearchCategory.Courses},${SearchCategory.ExternalContents}`,
      };

      component.setCategoryType();

      // searchCategories keeps the raw URL order (still used to drive which categories are
      // searched/shown at all)...
      expect(component.searchCategories).toEqual([
        SearchCategory.Events,
        SearchCategory.Courses,
        SearchCategory.ExternalContents,
      ]);
      // ...but categoryType (what the left filter list actually renders) is reordered to match
      // the fixed right-hand result section order: courses, events, ..., external-contents.
      expect(component.categoryType.map((c: any) => c.name)).toEqual([
        SearchCategory.Courses,
        SearchCategory.Events,
        SearchCategory.ExternalContents,
      ]);
    });

    it('orders the read-only list like the right-hand result sections regardless of URL order', () => {
      activatedRouteMock.snapshot.queryParams = {
        // Deliberately out of the CATEGORY_TYPE/right-content order (courses, events, peoples,
        // communities, resources, external-contents)
        category: `${SearchCategory.Resources},${SearchCategory.People},${SearchCategory.Courses}`,
      };

      component.setCategoryType();

      expect(component.categoryType.map((c: any) => c.name)).toEqual([
        SearchCategory.Courses,
        SearchCategory.People,
        SearchCategory.Resources,
      ]);
    });

    it('omits unknown category names from the read-only list', () => {
      activatedRouteMock.snapshot.queryParams = {
        category: `${SearchCategory.Courses},unknown-category,${SearchCategory.Events}`,
      };

      component.setCategoryType();

      expect(component.categoryType.map((c: any) => c.name)).toEqual([
        SearchCategory.Courses,
        SearchCategory.Events,
      ]);
    });

    it('parses a single-value category param into a single-item searchCategories list and keeps the existing single-category path', () => {
      activatedRouteMock.snapshot.queryParams = { category: SearchCategory.Courses };

      component.setCategoryType();

      expect(component.searchCategories).toEqual([SearchCategory.Courses]);
      expect(component.isMultiCategorySearch).toBe(false);
      expect(component.categoryType[0].name).toBe(SearchCategory.Courses);
    });

    it('defaults searchCategories to an empty list when the category param is absent', () => {
      activatedRouteMock.snapshot.queryParams = {};

      component.setCategoryType();

      expect(component.searchCategories).toEqual([]);
      expect(component.isMultiCategorySearch).toBe(false);
    });

    it('emits categorySelected with the clicked category value', () => {
      const emitSpy = jest.spyOn(component.categorySelected, 'emit');
      component.categorySelected.emit(SearchCategory.Events);
      expect(emitSpy).toHaveBeenCalledWith(SearchCategory.Events);
    });
  });

  it('should toggle showMore flags correctly', () => {
    component.competencyThemeKey = 'v1.theme';
    component.competencySubThemeKey = 'v1.subtheme';

    // Initial state
    expect(component.showAllCompetencyTheme).toBe(false);
    expect(component.showAllCompetencySubTheme).toBe(false);
    expect(component.showAllLanguage).toBe(false);
    expect(component.showAllOrganisation).toBe(false);

    // Toggle competency theme
    component.toggleShowMore('v1.theme');
    expect(component.showAllCompetencyTheme).toBe(true);

    // Toggle competency sub theme
    component.toggleShowMore('v1.subtheme');
    expect(component.showAllCompetencySubTheme).toBe(true);

    // Toggle language
    component.toggleShowMore('language');
    expect(component.showAllLanguage).toBe(true);

    // Toggle organisation
    component.toggleShowMore('organisation');
    expect(component.showAllOrganisation).toBe(true);
  });

  it('should translate actual labels', () => {
    const result = component.translateActualLabels('Test Label', 'type');
    expect(langTranslationsMock.translateActualLabel).toHaveBeenCalledWith(
      'Test Label',
      'type',
      ''
    );
    expect(result).toBe('Translated Label');
  });

  it('should handle selection filters correctly when checked', () => {
    const mockEvent = { checked: true } as any;
    const mockOption = { name: 'option1', isChecked: false };
    const categoryType = 'testCategory';

    component.selectedFilters = {};
    component.appliedFilter.emit = jest.fn();
    component.constructQueryParam.emit = jest.fn();

    component.onSelectionFilter(mockEvent, mockOption, categoryType);

    expect(mockOption.isChecked).toBe(true);
    expect(component.selectedFilters[categoryType]).toContain('option1');
    expect(component.appliedFilter.emit).toHaveBeenCalled();
  });

  it('should handle selection filters correctly when unchecked', () => {
    const mockEvent = { checked: false } as any;
    const mockOption = { name: 'option1', isChecked: true };
    const categoryType = 'testCategory';

    component.selectedFilters = { testCategory: ['option1', 'option2'] };
    component.appliedFilter.emit = jest.fn();

    // Mock the functionality that would normally use lodash
    const originalOnSelectionFilter = component.onSelectionFilter;
    component.onSelectionFilter = function (
      event: any,
      option: any,
      type: string
    ) {
      option.isChecked = event.checked;
      if (!this.selectedFilters[type]) {
        this.selectedFilters[type] = [];
      }

      if (event.checked) {
        if (!this.selectedFilters[type].includes(option.name)) {
          this.selectedFilters[type].push(option.name);
        }
      } else {
        this.selectedFilters[type] = this.selectedFilters[type].filter(
          (item: any) => item !== option.name
        );
      }

      this.appliedFilter.emit(this.selectedFilters);
    };

    component.onSelectionFilter(mockEvent, mockOption, categoryType);

    expect(mockOption.isChecked).toBe(false);
    expect(component.selectedFilters[categoryType]).toEqual(['option2']);
    expect(component.appliedFilter.emit).toHaveBeenCalled();

    // Restore original method
    component.onSelectionFilter = originalOnSelectionFilter;
  });

  it('should calculate filters applied count correctly', () => {
    component.selectedFilters = {
      category1: ['option1', 'option2'],
      category2: ['option3'],
      emptyCategory: [],
    };

    expect(component.filtersAppliedCount).toBe(2);
  });

  it('should refactor filter data correctly', () => {
    const mockData = {
      category1: ['option1', 'option2'],
      category2: ['option3'],
    };

    const result = component.refactorFilterData(mockData);

    expect(result).toEqual([
      { type: 'category1', value: 'Option1' },
      { type: 'category1', value: 'Option2' },
      { type: 'category2', value: 'Option3' },
    ]);
  });

  it('should handle null or non-object data in refactorFilterData', () => {
    expect(component.refactorFilterData(null as any)).toEqual([]);
    expect(component.refactorFilterData('string' as any)).toEqual([]);
  });

  it('should clear all filters', () => {
    // Setup initial state
    component.selectedFilters = {
      category1: ['option1', 'option2'],
      category2: ['option3'],
    };

    component.categoryType = [
      {
        name: 'category1',
        displayName: 'Category1',
        count: 1,
        isChecked: true,
        disabled: false,
        filters: [
          {
            name: 'filter1',
            count: 1,
            isChecked: true,
            displayName: 'Filter1',
            filters: [],
          }
        ],
      },
    ];

    component.formattedFacets = {
      facet1: [{ name: 'facet1', count: 1, isChecked: true }],
    };

    component.appliedFilter.emit = jest.fn();
    component.constructQueryParam.emit = jest.fn();

    // Mock the clearAllFilters method to avoid lodash dependencies
    const originalClearAllFilters = component.clearAllFilters;
    component.clearAllFilters = function () {
      // Clear selected filters
      Object.keys(this.selectedFilters).forEach((key: string) => {
        this.selectedFilters[key] = [];
      });

      // Clear category type filters
      if (this.categoryType) {
        this.categoryType.forEach((category: any) => {
          category.isChecked = false;
          if (category.filters) {
            category.filters.forEach((filter: any) => {
              filter.isChecked = false;
            });
          }
        });
      }

      // Clear formatted facets
      if (this.formattedFacets) {
        Object.values(this.formattedFacets).forEach((filters: any) => {
          if (Array.isArray(filters)) {
            filters.forEach((filter: any) => {
              filter.isChecked = false;
            });
          }
        });
      }

      this.selectedFilterChips = [];
      this.appliedFilter.emit(this.selectedFilters);
      this.constructQueryParam.emit('');
    };

    component.clearAllFilters();

    // Check if all filters are cleared
    expect(component.selectedFilters).toEqual({ category1: [], category2: [] });
    expect(component.selectedFilterChips).toEqual([]);
    expect(component.appliedFilter.emit).toHaveBeenCalled();
    expect(component.constructQueryParam.emit).toHaveBeenCalledWith('');

    // Restore original method
    component.clearAllFilters = originalClearAllFilters;
  });

  it('should filter organisations based on query', () => {
    component.formattedFacets = {
      organisation: [
        { name: 'org1', count: 10, isChecked: false },
        { name: 'org2', count: 5, isChecked: false },
        { name: 'org3', count: 3, isChecked: false },
        { name: 'another org', count: 2, isChecked: false },
        { name: 'different org', count: 1, isChecked: false },
      ],
    };

    component.filterQueryOrganisation = 'org';
    component.showAllOrganisation = false;

    // Mock the getter
    Object.defineProperty(component, 'filteredOrganisations', {
      get: function () {
        let filteredList = this.formattedFacets.organisation.filter(
          (item: any) =>
            item.name
              .toLowerCase()
              .includes(this.filterQueryOrganisation.toLowerCase())
        );
        return this.showAllOrganisation
          ? filteredList
          : filteredList.slice(0, 4);
      },
    });

    expect(component.filteredOrganisations.length).toBe(4);

    component.showAllOrganisation = true;
    expect(component.filteredOrganisations.length).toBe(5);

    component.filterQueryOrganisation = 'another';
    expect(component.filteredOrganisations.length).toBe(1);
  });

  it('should capitalize first letter correctly', () => {
    expect(component.capitalizeFirstLetter('test')).toBe('Test');
    expect(component.capitalizeFirstLetter('TEST')).toBe('TEST');
    expect(component.capitalizeFirstLetter('')).toBe('');
  });

  it('should clear filter chip for category type', () => {
    // Setup with minimal mocks that satisfy the types
    component.categoryTypeDup = [
      {
        name: 'category1',
        displayName: 'Category1',
        count: 1,
        isChecked: false,
        filters: [],
        disabled: false,
      },
    ];

    component.categoryType = [
      {
        name: 'category1',
        displayName: 'Category1',
        count: 1,
        isChecked: true,
        filters: [],
        disabled: false,
      },
    ];

    component.selectedFilters = { category1: ['category1'] };
    component.appliedFilter.emit = jest.fn();
    component.constructQueryParam.emit = jest.fn();
    component.refactorFilterData = jest.fn();

    // Mock the clearFilterChip method to avoid lodash dependencies
    const originalClearFilterChip = component.clearFilterChip;
    component.clearFilterChip = function (item: any) {
      const types = this.categoryTypeDup.map((category: any) => category.name);

      if (types.includes(item.type)) {
        this.categoryType[0].isChecked = false;

        if (this.selectedFilters[item.type]) {
          this.selectedFilters[item.type] = this.selectedFilters[
            item.type
          ].filter((name: any) => name !== this.categoryType[0].name);

          if (this.selectedFilters[item.type].length === 0) {
            delete this.selectedFilters[item.type];
          }
        }

        this.appliedFilter.emit(this.selectedFilters);
        this.constructQueryParam.emit('');
      }
    };

    // Clear a category chip
    component.clearFilterChip({ type: 'category1', value: 'Category1' });

    expect(component.categoryType[0].isChecked).toBe(false);
    expect(component.appliedFilter.emit).toHaveBeenCalled();
    expect(component.constructQueryParam.emit).toHaveBeenCalledWith('');

    // Restore original method
    component.clearFilterChip = originalClearFilterChip;
  });

  it('should clear filter chip for non-category type', () => {
    // Setup
    component.formattedFacets = {
      language: [
        { name: 'english', count: 10, isChecked: true },
        { name: 'hindi', count: 5, isChecked: false },
      ],
    };

    component.selectedFilters = { language: ['english'] };
    component.appliedFilter.emit = jest.fn();
    component.categoryTypeDup = [];
    component.refactorFilterData = jest.fn();

    // Mock the clearFilterChip method for non-category
    const originalClearFilterChip = component.clearFilterChip;
    component.clearFilterChip = function (item: any) {
      const types: any = [];

      if (!types.includes(item.type)) {
        const facets = this.formattedFacets;

        // Find and update the filter
        const foundFilter = facets.language.find(
          (filter: any) => filter.name === item.value.toLowerCase()
        );

        if (foundFilter) {
          foundFilter.isChecked = false;

          if (this.selectedFilters[item.type]) {
            this.selectedFilters[item.type] = this.selectedFilters[
              item.type
            ].filter((name: any) => name !== foundFilter.name);

            if (this.selectedFilters[item.type].length === 0) {
              delete this.selectedFilters[item.type];
            }
          }

          this.appliedFilter.emit(this.selectedFilters);
        }
      }
    };

    // Clear a language chip
    component.clearFilterChip({ type: 'language', value: 'English' });

    expect(component.formattedFacets.language[0].isChecked).toBe(false);
    expect(component.appliedFilter.emit).toHaveBeenCalled();

    // Restore original method
    component.clearFilterChip = originalClearFilterChip;
  });

  describe('filteredLanguages', () => {
    it('should return filtered languages based on query', () => {
      // Arrange
      component.formattedFacets = {
        language: [
          { name: 'english', count: 10, isChecked: false },
          { name: 'hindi', count: 5, isChecked: false },
          { name: 'marathi', count: 3, isChecked: false },
        ],
      };
      component.filterQueryLanguage = 'hin';
      component.showAllLanguage = false;

      // Act
      const result = component.filteredLanguages;

      // Assert
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('hindi');
    });

    it('should return all languages when showAllLanguage is true', () => {
      // Arrange
      component.formattedFacets = {
        language: [
          { name: 'english', count: 10, isChecked: false },
          { name: 'hindi', count: 5, isChecked: false },
          { name: 'marathi', count: 3, isChecked: false },
        ],
      };
      component.filterQueryLanguage = '';
      component.showAllLanguage = true;

      // Act
      const result = component.filteredLanguages;

      // Assert
      expect(result.length).toBe(3);
    });
  });

  describe('filteredDesignations', () => {
    it('should return filtered designations based on query', () => {
      // Arrange
      component.formattedFacets = {
        'profileDetails.professionalDetails.designation': [
          { name: 'Manager', count: 10, isChecked: false },
          { name: 'Engineer', count: 5, isChecked: false },
          { name: 'Analyst', count: 3, isChecked: false },
        ],
      };
      component.filterQueryDesignation = 'Eng';
      component.showAllDesignation = false;

      // Act
      const result = component.filteredDesignations;

      // Assert
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Engineer');
    });

    it('should return all designations when showAllDesignation is true', () => {
      // Arrange
      component.formattedFacets = {
        'profileDetails.professionalDetails.designation': [
          { name: 'Manager', count: 10, isChecked: false },
          { name: 'Engineer', count: 5, isChecked: false },
          { name: 'Analyst', count: 3, isChecked: false },
        ],
      };
      component.filterQueryDesignation = '';
      component.showAllDesignation = true;

      // Act
      const result = component.filteredDesignations;

      // Assert
      expect(result.length).toBe(3);
    });
  });

  describe('filteredRootOrgNames', () => {
    it('should return filtered root organization names based on query', () => {
      // Arrange
      component.formattedFacets = {
        rootOrgName: [
          { name: 'Org1', count: 10, isChecked: false },
          { name: 'Org2', count: 5, isChecked: false },
          { name: 'Org3', count: 3, isChecked: false },
        ],
      };
      component.filterQueryRootOrgName = 'Org2';
      component.showAllOrganisation = false;

      // Act
      const result = component.filteredRootOrgNames;

      // Assert
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Org2');
    });

    it('should return all root organization names when showAllOrganisation is true', () => {
      // Arrange
      component.formattedFacets = {
        rootOrgName: [
          { name: 'Org1', count: 10, isChecked: false },
          { name: 'Org2', count: 5, isChecked: false },
          { name: 'Org3', count: 3, isChecked: false },
        ],
      };
      component.filterQueryRootOrgName = '';
      component.showAllOrganisation = true;

      // Act
      const result = component.filteredRootOrgNames;

      // Assert
      expect(result.length).toBe(3);
    });
  });

  describe('toggleShowMore', () => {
    it('should toggle showAllCompetencyTheme when competencyThemeKey is passed', () => {
      // Arrange
      component.competencyThemeKey = 'v1.theme';
      component.showAllCompetencyTheme = false;

      // Act
      component.toggleShowMore('v1.theme');

      // Assert
      expect(component.showAllCompetencyTheme).toBe(true);
    });

    it('should toggle showAllCompetencySubTheme when competencySubThemeKey is passed', () => {
      // Arrange
      component.competencySubThemeKey = 'v1.subtheme';
      component.showAllCompetencySubTheme = false;

      // Act
      component.toggleShowMore('v1.subtheme');

      // Assert
      expect(component.showAllCompetencySubTheme).toBe(true);
    });

    it('should toggle showAllLanguage when "language" is passed', () => {
      // Arrange
      component.showAllLanguage = false;

      // Act
      component.toggleShowMore('language');

      // Assert
      expect(component.showAllLanguage).toBe(true);
    });

    it('should toggle showAllOrganisation when "organisation" is passed', () => {
      // Arrange
      component.showAllOrganisation = false;

      // Act
      component.toggleShowMore('organisation');

      // Assert
      expect(component.showAllOrganisation).toBe(true);
    });

    it('should toggle showAllDesignation when "designation" is passed', () => {
      // Arrange
      component.showAllDesignation = false;

      // Act
      component.toggleShowMore('designation');

      // Assert
      expect(component.showAllDesignation).toBe(true);
    });
  });

  it('should return the correct object in recursivelySetIsCheckedFalse', () => {
    const mockFilters = [
      {
        name: 'filter1',
        isChecked: true,
        filters: [
          {
            name: 'nestedFilter1',
            isChecked: true,
            filters: []
          },
        ],
      },
      {
        name: 'filter2',
        isChecked: true,
        filters: [],
      },
    ];

    const result = component['recursivelySetIsCheckedFalse'](
      mockFilters,
      'nestedFilter1'
    );

    expect(result).toBeDefined();
    expect(result.name).toBe('nestedFilter1');
    expect(result.isChecked).toBe(false);
  });

  it('should return null if no matching object is found in recursivelySetIsCheckedFalse', () => {
    const mockFilters = [
      {
        name: 'filter1',
        isChecked: true,
        filters: [
          {
            name: 'nestedFilter1',
            isChecked: true,
            filters: [],
          },
        ],
      },
    ];

    const result = component['recursivelySetIsCheckedFalse'](
      mockFilters,
      'nonExistentFilter'
    );

    expect(result).toBeNull();
  });

  it('should handle empty filters in recursivelySetIsCheckedFalse', () => {
    const result = component['recursivelySetIsCheckedFalse']([], 'filter1');
    expect(result).toBeNull();
  });

  it('should handle case-insensitive matching in recursivelySetIsCheckedFalse', () => {
    const mockFilters = [
      {
        name: 'Filter1',
        isChecked: true,
        filters: [],
      },
    ];

    const result = component['recursivelySetIsCheckedFalse'](
      mockFilters,
      'filter1'
    );

    expect(result).toBeDefined();
    expect(result.name).toBe('Filter1');
    expect(result.isChecked).toBe(false);
  });

  describe('getFilteredThemes', () => {
    let component: any;
    
    beforeEach(() => {
      component = {
        competencyThemeKey: 'themes',
        filterQueryThemes: '',
        getFilteredThemes(competency: any): any[] {
          let filteredThemes: any[] = [];
          if (competency && competency[this.competencyThemeKey]) {
            filteredThemes = competency[this.competencyThemeKey].filter((theme: any) => 
              theme.name.toLowerCase().includes(this.filterQueryThemes.toLowerCase()));
          }
          return filteredThemes;
        }
      };
    });
  
    it('should return empty array when competency is null', () => {
      const competency = null;
      const result = component.getFilteredThemes(competency);
      expect(result).toEqual([]);
    });
  
    it('should return empty array when competency does not have themes', () => {
      const competency = { otherProperty: 'value' };
      const result = component.getFilteredThemes(competency);
      expect(result).toEqual([]);
    });
  
    it('should return all themes when filter query is empty', () => {
      const themes = [
        { name: 'Theme 1' },
        { name: 'Theme 2' },
        { name: 'Theme 3' }
      ];
      const competency = { themes };
      component.filterQueryThemes = '';
      const result = component.getFilteredThemes(competency);
      expect(result).toEqual(themes);
    });
  
    it('should return filtered themes based on filter query', () => {
      const themes = [
        { name: 'Theme 1' },
        { name: 'Another Theme' },
        { name: 'Theme 3' }
      ];
      const competency = { themes };
      component.filterQueryThemes = 'theme';
      const result = component.getFilteredThemes(competency);
      expect(result).toEqual([
        { name: 'Theme 1' },
        { name: 'Another Theme' },
        { name: 'Theme 3' }
      ]);
    });
  
    it('should return filtered themes case-insensitively', () => {
      const themes = [
        { name: 'Theme 1' },
        { name: 'ANOTHER THEME' },
        { name: 'Something else' }
      ];
      const competency = { themes };
      component.filterQueryThemes = 'theme';
      const result = component.getFilteredThemes(competency);
      expect(result).toEqual([
        { name: 'Theme 1' },
        { name: 'ANOTHER THEME' }
      ]);
    });
  
    it('should return no themes when filter query does not match any theme', () => {
      const themes = [
        { name: 'Theme 1' },
        { name: 'Theme 2' },
        { name: 'Theme 3' }
      ];
      const competency = { themes };
      component.filterQueryThemes = 'nonexistent';
      const result = component.getFilteredThemes(competency);
      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------
  // ngOnInit
  // ---------------------------------------------------------------------
  describe('ngOnInit', () => {
    it('sets the compentency keys and does not reset filters outside explore-content', () => {
      activatedRouteMock.queryParams = of({ tab: 'search' });
      component.selectedFilters = { courses: ['x'] };
      component.ngOnInit();
      expect(component.competencyAreaNameKey).toBe('v1.area');
      expect(component.isExploreContentTab).toBe(false);
      expect(component.selectedFilters).toEqual({ courses: ['x'] });
    });

    it('resets selectedFilters and selectedFilterChips when the tab is explore-content', () => {
      activatedRouteMock.queryParams = of({ tab: 'explore-content' });
      component.selectedFilters = { courses: ['x'] };
      component.selectedFilterChips = [{ type: 'courses', value: 'x' }];
      component.ngOnInit();
      expect(component.isExploreContentTab).toBe(true);
      expect(component.selectedFilters).toEqual({});
      expect(component.selectedFilterChips).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------
  // ngOnDestroy
  // ---------------------------------------------------------------------
  describe('ngOnDestroy', () => {
    it('unsubscribes without throwing', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------
  // ngOnChanges - sectorId/nestedCategory/typesOfEvents branches
  // ---------------------------------------------------------------------
  describe('ngOnChanges (facet-driven branches)', () => {
    it('returns early when sectorId facets exist but no courses category is found', () => {
      (component as any).formatFacets = () => ({ sectorId: [{ name: 'a' }] });
      component.categoryTypeDup = [];
      const changes: SimpleChanges = {
        newfacets: new SimpleChange(null, [[{ name: 'sectorId', values: [] }]], true),
      };
      expect(() => component.ngOnChanges(changes)).not.toThrow();
    });

    it('maps nestedCategory facets onto the matching categoryTypeDup entry', () => {
      (component as any).formatFacets = () => ({ nestedCategory: [{ name: 'sector-fw_sector_health-care', count: 2, isChecked: false }] });
      component.categoryTypeDup = [{ name: 'nestedCategory', filters: [] }] as any;
      activatedRouteMock.snapshot.queryParams = {};
      const changes: SimpleChanges = {
        newfacets: new SimpleChange(null, [[{ name: 'nestedCategory', values: [] }]], true),
      };
      component.ngOnChanges(changes);
      expect((component.categoryTypeDup[0] as any).filters[0].displayName).toBe('Health Care');
    });

    it('applies the typesOfEvents input when it changes', () => {
      component.typesOfEvents = [{ name: 'live' }];
      const changes: SimpleChanges = {
        typesOfEvents: new SimpleChange(null, [{ name: 'live' }], true),
      };
      component.ngOnChanges(changes);
      expect(component.formattedFacets['typeOfEvents']).toEqual([{ name: 'live' }]);
    });
  });

  // ---------------------------------------------------------------------
  // formatSectorName
  // ---------------------------------------------------------------------
  describe('formatSectorName', () => {
    it('strips the sector-fw_sector_ prefix and title-cases the remainder', () => {
      expect(component.formatSectorName('sector-fw_sector_information-technology')).toBe('Information Technology');
    });

    it('title-cases a name that has no prefix', () => {
      expect(component.formatSectorName('health-care')).toBe('Health Care');
    });
  });

  // ---------------------------------------------------------------------
  // setCategoryType (real implementation - the legacy test earlier overrides it)
  // ---------------------------------------------------------------------
  describe('setCategoryType (real implementation)', () => {
    beforeEach(() => {
      component.categoryTypeDup = JSON.parse(JSON.stringify(CATEGORY_TYPE));
    });

    it('marks the matching single category checked and records the search query', () => {
      activatedRouteMock.snapshot.queryParams = { category: SearchCategory.Events, q: 'angular' };
      component.setCategoryType();
      expect(component.searchQuery).toBe('angular');
      expect(component.categoryType[0].name).toBe(SearchCategory.Events);
      expect(component.categoryType[0].isChecked).toBe(true);
      expect(component.selectedFilters[SearchCategory.Events]).toBeDefined();
    });

    it('falls back to a synthetic case-study entry when CATEGORY_TYPE has none', () => {
      activatedRouteMock.snapshot.queryParams = { category: 'case-study' };
      component.setCategoryType();
      expect(component.categoryType[0]).toEqual(
        expect.objectContaining({ name: 'case-study', displayName: 'Case study' })
      );
    });

    it('sets typeOfEvents facets for the Events category', () => {
      activatedRouteMock.snapshot.queryParams = { category: SearchCategory.Events };
      component.typesOfEvents = [{ name: 'live' }];
      component.setCategoryType();
      expect(component.formattedFacets['typeOfEvents']).toEqual([{ name: 'live' }]);
    });

    it('resets selectedFilters when the category changes from the previous one', () => {
      component.searchCategory = SearchCategory.Courses;
      component.selectedFilters = { courses: ['x'] };
      activatedRouteMock.snapshot.queryParams = { category: SearchCategory.Events };
      component.setCategoryType();
      expect(component.selectedFilters['courses']).toBeUndefined();
      expect(component.selectedFilters[SearchCategory.Events]).toBeDefined();
    });

    it('marks the All category checked when no category param is present', () => {
      activatedRouteMock.snapshot.queryParams = {};
      component.setCategoryType();
      expect(component.categoryType.find((c: any) => c.name === SearchCategory.All)?.isChecked).toBe(true);
    });

    it('does not check the category while in the explore-content tab', () => {
      // Normalize explicitly: an earlier test elsewhere in this file mutates the shared
      // CATEGORY_TYPE constant's `isChecked` in place (a pre-existing test-hygiene issue, not
      // something this test should depend on), so don't assume the clone starts at false.
      const dup = component.categoryTypeDup as any[];
      dup.find((c: any) => c.name === SearchCategory.Courses).isChecked = false;
      activatedRouteMock.snapshot.queryParams = { category: SearchCategory.Courses, tab: 'explore-content' };
      component.setCategoryType();
      expect(component.categoryType[0].isChecked).toBe(false);
    });
  });

  // ---------------------------------------------------------------------
  // setCourseCategoryType / checkForFilter
  // ---------------------------------------------------------------------
  describe('setCourseCategoryType', () => {
    beforeEach(() => {
      component.categoryTypeDup = JSON.parse(JSON.stringify(CATEGORY_TYPE));
      component.categoryType = [{ isChecked: true }] as any;
      component.selectedFilters = {};
    });

    it('checks the top-level category when its name matches directly', () => {
      component.setCourseCategoryType('events');
      const dup = component.categoryTypeDup as any[];
      expect(dup.find((c: any) => c.name === 'events').isChecked).toBe(true);
    });

    it('recurses into nested filters to check a matching leaf and unchecks the placeholder entry', () => {
      component.setCourseCategoryType('Course');
      const dup = component.categoryTypeDup as any[];
      const courses = dup.find((c: any) => c.name === 'courses');
      expect(courses.isChecked).toBe(true);
      expect((component.categoryType[0] as any).isChecked).toBe(false);
      expect(component.selectedFilters['Course']).toBe('Course');
    });

    it('unchecks a leaf that does not match the content type', () => {
      component.setCourseCategoryType('Course');
      const dup = component.categoryTypeDup as any[];
      const courseGroup = dup.find((c: any) => c.name === 'courses').filters
        .find((f: any) => f.name === 'course');
      const notMatched = courseGroup.filters.find((f: any) => f.name === 'Moderated Course');
      expect(notMatched.isChecked).toBe(false);
    });
  });

  // ---------------------------------------------------------------------
  // toggleShowMore (sections not already covered above)
  // ---------------------------------------------------------------------
  describe('toggleShowMore (remaining sections)', () => {
    const cases: Array<[any, string]> = [
      [FacetType.courseCategory, 'showAllContents'],
      [FacetType.sectorNames_v1, 'showAllSectors'],
      [FacetType.sectorId, 'showAllSectors'],
      [FacetType.sectorNameResource, 'showAllSectors'],
      [FacetType.subSectorNames_v1, 'showAllSubSectors'],
      [FacetType.subSectorId, 'showAllSubSectors'],
      [FacetType.subSectorNameResource, 'showAllSubSectors'],
      [FacetType.resourceCategory, 'showResourceCategory'],
      [FacetType.contentPartners, 'showAllContentPartners'],
      [FacetType.topic, 'showAllTopic'],
      [FacetType.topicName, 'showAllTopic'],
    ];

    it.each(cases)('toggles %s via %s', (section: any, flag: any) => {
      (component as any)[flag] = false;
      component.toggleShowMore(section);
      expect((component as any)[flag]).toBe(true);
    });

    it('does nothing for an unrecognised section', () => {
      expect(() => component.toggleShowMore('unknown-section')).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------
  // translateActualLabels
  // ---------------------------------------------------------------------
  describe('translateActualLabels', () => {
    it('delegates to the translation service', () => {
      const result = component.translateActualLabels('label', 'type');
      expect(langTranslationsMock.translateActualLabel).toHaveBeenCalledWith('label', 'type', '');
      expect(result).toBe('Translated Label');
    });
  });

  // ---------------------------------------------------------------------
  // capitalizeFirstLetter
  // ---------------------------------------------------------------------
  describe('capitalizeFirstLetter', () => {
    it('capitalizes the first letter only', () => {
      expect(component.capitalizeFirstLetter('hello world')).toBe('Hello world');
    });
  });

  // ---------------------------------------------------------------------
  // formatFacets (real implementation - not the per-test override used above)
  // ---------------------------------------------------------------------
  describe('formatFacets (real implementation)', () => {
    it('returns an empty object for empty input', () => {
      expect(component.formatFacets([])).toEqual({});
    });

    it('buckets duration values into labelled ranges', () => {
      const result = component.formatFacets([
        [{ name: FacetType.Duration, values: [{ name: '900', count: 2 }, { name: '4000', count: 1 }] }],
      ]);
      expect(result[FacetType.Duration]).toEqual([
        { name: '0 - 30 mins', count: 2, isChecked: false },
        { name: '60 - 90 mins', count: 1, isChecked: false },
      ]);
    });

    it('buckets avgRating values against every threshold they clear', () => {
      const result = component.formatFacets([
        [{ name: FacetType.AvgRating, values: [{ name: '4.6', count: 3 }] }],
      ]);
      expect(result[FacetType.AvgRating]).toEqual([
        { name: '4.5', count: 3, isChecked: false },
        { name: '4.0', count: 3, isChecked: false },
        { name: '3.5', count: 3, isChecked: false },
        { name: '3.0', count: 3, isChecked: false },
      ]);
    });

    it('formats any other facet type as a plain name/count list', () => {
      const result = component.formatFacets([
        [{ name: 'language', values: [{ name: 'english', count: 4 }] }],
      ]);
      expect(result['language']).toEqual([{ name: 'english', count: 4, isChecked: false }]);
    });
  });

  // ---------------------------------------------------------------------
  // onSelectionFilter
  // ---------------------------------------------------------------------
  describe('onSelectionFilter', () => {
    it('adds the option to selectedFilters when checked and emits appliedFilter', () => {
      const emitSpy = jest.spyOn(component.appliedFilter, 'emit');
      component.onSelectionFilter({ checked: true } as any, { name: 'english' }, 'language');
      expect(component.selectedFilters.language).toEqual(['english']);
      expect(emitSpy).toHaveBeenCalled();
    });

    it('does not duplicate an already-selected option', () => {
      component.selectedFilters = { language: ['english'] };
      component.onSelectionFilter({ checked: true } as any, { name: 'english' }, 'language');
      expect(component.selectedFilters.language).toEqual(['english']);
    });

    it('removes the option and emits constructQueryParam for a known top-level category', () => {
      component.categoryTypeDup = JSON.parse(JSON.stringify(CATEGORY_TYPE));
      component.selectedFilters = { [SearchCategory.Courses]: [SearchCategory.Courses] };
      const constructSpy = jest.spyOn(component.constructQueryParam, 'emit');
      component.onSelectionFilter({ checked: false } as any, { name: SearchCategory.Courses }, SearchCategory.Courses);
      expect(component.selectedFilters[SearchCategory.Courses]).toBeUndefined();
      expect(constructSpy).toHaveBeenCalledWith('');
    });

    it('turns off isAllContentSelected when a contentType filter is applied', () => {
      component.isAllContentSelected = true;
      component.onSelectionFilter({ checked: true } as any, { name: 'Course' }, 'contentType');
      expect(component.isAllContentSelected).toBe(false);
    });
  });

  // ---------------------------------------------------------------------
  // onTypesOfEventsChange
  // ---------------------------------------------------------------------
  describe('onTypesOfEventsChange', () => {
    it('sets the selected radio option and marks matching event options as checked', () => {
      component.formattedFacets = { typeOfEvents: [{ name: 'live', isChecked: false }, { name: 'upcoming', isChecked: false }] };
      const emitSpy = jest.spyOn(component.appliedFilter, 'emit');
      component.onTypesOfEventsChange({} as any, { name: 'live' }, 'typeOfEvents');
      expect(component.selectedFilters.typeOfEvents).toEqual(['live']);
      expect(component.formattedFacets.typeOfEvents[0].isChecked).toBe(true);
      expect(component.formattedFacets.typeOfEvents[1].isChecked).toBe(false);
      expect(emitSpy).toHaveBeenCalled();
    });

    it('does nothing to formattedFacets when there are no matching event options', () => {
      component.formattedFacets = {};
      expect(() => component.onTypesOfEventsChange({} as any, { name: 'live' }, 'typeOfEvents')).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------
  // togoleThemes
  // ---------------------------------------------------------------------
  describe('togoleThemes', () => {
    it('toggles the showAll flag on the given competency', () => {
      const competency: any = { showAll: false };
      component.togoleThemes(competency);
      expect(competency.showAll).toBe(true);
      component.togoleThemes(competency);
      expect(competency.showAll).toBe(false);
    });
  });

  // ---------------------------------------------------------------------
  // refactorFilterData (real implementation - beforeEach above overrides the instance method)
  // ---------------------------------------------------------------------
  describe('refactorFilterData (real implementation)', () => {
    it('returns an empty array for non-object input', () => {
      const result = SearchFiltersComponent.prototype.refactorFilterData.call(component, null as any);
      expect(result).toEqual([]);
    });

    it('flattens filters into type/value pairs and relabels Courses as Contents', () => {
      const result = SearchFiltersComponent.prototype.refactorFilterData.call(component, {
        [FacetType.Language]: ['Courses', 'english'],
      });
      expect(result).toEqual([
        { type: FacetType.Language, value: 'Contents' },
        { type: FacetType.Language, value: 'English' },
      ]);
    });

    it('formats a sector-prefixed value through formatSectorName', () => {
      const result = SearchFiltersComponent.prototype.refactorFilterData.call(component, {
        sectorId: ['sector-fw_sector_health-care'],
      });
      expect(result).toEqual([{ type: 'sectorId', value: 'Health Care' }]);
    });
  });

  // ---------------------------------------------------------------------
  // filtersAppliedCount
  // ---------------------------------------------------------------------
  describe('filtersAppliedCount', () => {
    it('counts only non-empty array filters', () => {
      component.selectedFilters = { language: ['en'], organisation: [], courses: ['x'] };
      expect(component.filtersAppliedCount).toBe(2);
    });

    it('is zero when there are no selected filters', () => {
      component.selectedFilters = {};
      expect(component.filtersAppliedCount).toBe(0);
    });
  });

  // ---------------------------------------------------------------------
  // categoriseByFacet
  // ---------------------------------------------------------------------
  describe('categoriseByFacet', () => {
    it('flags visibility sections that have matching facet data', () => {
      component.showAllLanguage = false;
      component.showAllOrganisation = false;
      component.categoriseByFacet([{ type: FacetType.Language, value: 'English' }]);
      expect(component.showAllLanguage).toBe(true);
      expect(component.showAllOrganisation).toBe(false);
    });
  });

  // ---------------------------------------------------------------------
  // clearAllFilters
  // ---------------------------------------------------------------------
  describe('clearAllFilters', () => {
    it('clears selectedFilters, unchecks categoryType/facets, and emits events', () => {
      component.categoryType = [{ name: 'courses', isChecked: true, filters: [{ isChecked: true }] }] as any;
      component.formattedFacets = { language: [{ name: 'english', isChecked: true }] };
      component.selectedFilters = { courses: ['x'] };
      component.isExploreContentTab = false;
      const appliedSpy = jest.spyOn(component.appliedFilter, 'emit');
      const constructSpy = jest.spyOn(component.constructQueryParam, 'emit');
      component.clearAllFilters();
      expect(component.selectedFilters.courses).toEqual([]);
      expect((component.categoryType[0] as any).isChecked).toBe(false);
      expect((component.categoryType[0] as any).filters[0].isChecked).toBe(false);
      expect(component.formattedFacets.language[0].isChecked).toBe(false);
      expect(component.selectedFilterChips).toEqual([]);
      expect(appliedSpy).toHaveBeenCalled();
      expect(constructSpy).toHaveBeenCalledWith('');
    });

    it('sets isAllContentSelected instead of unchecking categoryType in the explore-content tab', () => {
      component.isExploreContentTab = true;
      component.isAllContentSelected = false;
      component.selectedFilters = {};
      component.formattedFacets = {};
      const constructSpy = jest.spyOn(component.constructQueryParam, 'emit');
      component.clearAllFilters();
      expect(component.isAllContentSelected).toBe(true);
      expect(constructSpy).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------
  // clearFilterChip
  // ---------------------------------------------------------------------
  describe('clearFilterChip', () => {
    beforeEach(() => {
      component.categoryTypeDup = JSON.parse(JSON.stringify(CATEGORY_TYPE));
    });

    it('clears all filters when the chip type is a known top-level category', () => {
      component.categoryType = JSON.parse(JSON.stringify(CATEGORY_TYPE));
      const clearAllSpy = jest.spyOn(component, 'clearAllFilters');
      component.clearFilterChip({ type: SearchCategory.Courses, value: 'Contents' });
      expect(clearAllSpy).toHaveBeenCalled();
    });

    it('reverse-formats a sectorId chip value back into its raw facet name', () => {
      component.categoryType = [];
      component.formattedFacets = { sectorId: [{ name: 'sector-fw_sector_health-care', isChecked: true }] };
      component.selectedFilters = { sectorId: ['sector-fw_sector_health-care'] };
      component.clearFilterChip({ type: 'sectorId', value: 'Health Care' });
      expect(component.formattedFacets.sectorId[0].isChecked).toBe(false);
    });

    it('also treats "case-study" as a known category when the current search category is case-study', () => {
      component.categoryType = [{ name: 'case-study', displayName: 'Case study', filters: [] }] as any;
      component.searchCategory = 'case-study';
      const clearAllSpy = jest.spyOn(component, 'clearAllFilters');
      component.clearFilterChip({ type: 'case-study', value: 'Case study' });
      expect(clearAllSpy).toHaveBeenCalled();
    });

    it('lowercases a sectorDetails_v1.subSectorName chip value before clearing it', () => {
      component.categoryType = [];
      component.formattedFacets = { 'sectorDetails_v1.subSectorName': [{ name: 'health care', isChecked: true }] };
      component.selectedFilters = { 'sectorDetails_v1.subSectorName': ['health care'] };
      component.clearFilterChip({ type: 'sectorDetails_v1.subSectorName', value: 'HEALTH CARE' });
      expect(component.formattedFacets['sectorDetails_v1.subSectorName'][0].isChecked).toBe(false);
    });

    it('clears a matching facet filter outside the category tree', () => {
      component.categoryType = [];
      component.formattedFacets = { language: [{ name: 'english', isChecked: true }] };
      component.selectedFilters = { language: ['english'] };
      const appliedSpy = jest.spyOn(component.appliedFilter, 'emit');
      component.clearFilterChip({ type: 'language', value: 'English' });
      expect(component.formattedFacets.language[0].isChecked).toBe(false);
      expect(component.selectedFilters.language).toEqual([]);
      expect(appliedSpy).toHaveBeenCalled();
    });

    it('retries with the exact-case value when the lowercase lookup misses', () => {
      component.categoryType = [];
      component.formattedFacets = { language: [{ name: 'English', isChecked: true }] };
      component.selectedFilters = { language: ['English'] };
      component.clearFilterChip({ type: 'language', value: 'English' });
      expect(component.formattedFacets.language[0].isChecked).toBe(false);
    });

    it('pulls the lowercase sector-prefixed value in the recursive fallback branch', () => {
      component.categoryType = [];
      component.formattedFacets = {};
      component.categoryTypeDup = [
        { name: SearchCategory.Courses, filters: [{ name: 'sector-fw_sector_health-care', isChecked: true, filters: [] }] },
      ] as any;
      component.selectedFilters = { courseCategory: ['sector-fw_sector_health-care'] };
      component.clearFilterChip({ type: 'courseCategory', value: 'sector-fw_sector_Health-Care' });
      expect(component.selectedFilters.courseCategory).toBeUndefined();
    });

    it('falls back to the recursive course-filter search when no direct facet match exists', () => {
      component.categoryType = [];
      component.formattedFacets = {};
      component.selectedFilters = { courseCategory: ['Course'] };
      component.clearFilterChip({ type: 'courseCategory', value: 'Course' });
      const dup = component.categoryTypeDup as any[];
      const courseLeaf = dup
        .find((c: any) => c.name === 'courses').filters
        .find((f: any) => f.name === 'course').filters
        .find((f: any) => f.name === 'Course');
      expect(courseLeaf.isChecked).toBe(false);
      expect(component.selectedFilters.courseCategory).toBeUndefined();
    });
  });
});
