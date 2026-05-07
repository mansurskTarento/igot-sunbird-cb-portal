import { TestBed } from '@angular/core/testing'

import { GamificationService } from './gamification.service'

describe('GamificationService', () => {
  beforeEach(() => TestBed.configureTestingModule({}))

  it('should be created', () => {
    const service: GamificationService = TestBed.inject(GamificationService)
    expect(service).toBeTruthy()
  })
})
