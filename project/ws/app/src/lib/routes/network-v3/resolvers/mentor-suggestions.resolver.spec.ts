import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { mentorSuggestionsResolver } from './mentor-suggestions.resolver';

describe('mentorSuggestionsResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) => 
      TestBed.runInInjectionContext(() => mentorSuggestionsResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
