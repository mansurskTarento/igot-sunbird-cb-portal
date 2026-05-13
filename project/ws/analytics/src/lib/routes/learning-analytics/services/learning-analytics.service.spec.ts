import { TestBed } from '@angular/core/testing'

import { LearningAnalyticsService } from './learning-analytics.service'

describe('LearningAnalyticsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}))

  it('should be created', () => {
    const service: LearningAnalyticsService = TestBed.inject(LearningAnalyticsService)
    expect(service).toBeTruthy()
  })
})
