import { TestBed } from '@angular/core/testing';

import { FormsConfigResolverService } from './forms-config-resolver.service';

describe('FormsConfigResolverService', () => {
  let service: FormsConfigResolverService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormsConfigResolverService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
