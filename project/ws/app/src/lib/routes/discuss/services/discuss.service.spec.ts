import { TestBed } from '@angular/core/testing'

import { DiscussService } from './discuss.service'

describe('DiscussServiceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}))

  it('should be created', () => {
    const service: DiscussService = TestBed.inject(DiscussService)
    expect(service).toBeTruthy()
  })
})
