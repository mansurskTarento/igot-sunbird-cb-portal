import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { connectionsResolverResolver } from './connections-resolver.resolver';

describe('connectionsResolverResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) => 
      TestBed.runInInjectionContext(() => connectionsResolverResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
