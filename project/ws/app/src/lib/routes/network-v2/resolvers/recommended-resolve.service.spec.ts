import { TestBed } from '@angular/core/testing'

import { RecommendedResolveService } from './recommended-resolve.service'

describe('RecommendedResolveService', () => {
  beforeEach(() => TestBed.configureTestingModule({}))

  it('should be created', () => {
    const service: RecommendedResolveService = TestBed.inject(RecommendedResolveService)
    expect(service).toBeTruthy()
  })
})
