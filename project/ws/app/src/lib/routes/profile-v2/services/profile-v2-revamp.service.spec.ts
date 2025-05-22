import { TestBed } from '@angular/core/testing';

import { ProfileV2RevampService } from './profile-v2-revamp.service';

describe('ProfileV2RevampService', () => {
  let service: ProfileV2RevampService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProfileV2RevampService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
