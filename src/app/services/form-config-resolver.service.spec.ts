import { TestBed } from '@angular/core/testing';

import { FormConfigResolverService } from './form-config-resolver.service';

describe('FormConfigResolverService', () => {
  let service: FormConfigResolverService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormConfigResolverService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
