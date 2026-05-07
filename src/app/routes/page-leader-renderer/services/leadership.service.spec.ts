import { TestBed } from '@angular/core/testing'

import { LeadershipService } from './leadership.service'

describe('LeadershipService', () => {
  beforeEach(() => TestBed.configureTestingModule({}))

  it('should be created', () => {
    const service: LeadershipService = TestBed.inject(LeadershipService)
    expect(service).toBeTruthy()
  })
})
