import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { peopleSuggestionsResolver } from './people-suggestions.resolver';

describe('peopleSuggestionsResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) => 
      TestBed.runInInjectionContext(() => peopleSuggestionsResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
