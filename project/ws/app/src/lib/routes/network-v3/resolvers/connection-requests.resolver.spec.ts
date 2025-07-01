import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { connectionRequestsResolver } from './connection-requests.resolver';

describe('connectionRequestsResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) => 
      TestBed.runInInjectionContext(() => connectionRequestsResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
