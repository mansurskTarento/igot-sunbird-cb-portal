import { TestBed } from '@angular/core/testing';

import { CommunityResolverService } from './community-resolver.service';

describe('CommunityResolverService', () => {
  let service: CommunityResolverService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommunityResolverService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
