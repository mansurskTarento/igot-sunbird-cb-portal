import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { profileEntriesResolver } from './profile-entries.resolver';

describe('profileEntriesResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) => 
      TestBed.runInInjectionContext(() => profileEntriesResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
