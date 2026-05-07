import { TestBed } from '@angular/core/testing'

import { SocialTimelineResolverService } from './social-timeline-resolver.service'

describe('SocialTimelineResolverService', () => {
  beforeEach(() => TestBed.configureTestingModule({}))

  it('should be created', () => {
    const service: SocialTimelineResolverService = TestBed.inject(SocialTimelineResolverService)
    expect(service).toBeTruthy()
  })
})
