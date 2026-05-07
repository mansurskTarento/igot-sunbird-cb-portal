import { TestBed } from '@angular/core/testing'

import { PostFetchResolverService } from './post-fetch-resolver.service'

describe('PostFetchResolverService', () => {
  beforeEach(() => TestBed.configureTestingModule({}))

  it('should be created', () => {
    const service: PostFetchResolverService = TestBed.inject(PostFetchResolverService)
    expect(service).toBeTruthy()
  })
})
