import { TestBed } from '@angular/core/testing'

import { BtnFeatureService } from './btn-feature.service'

describe('BtnFeatureService', () => {
  beforeEach(() => TestBed.configureTestingModule({}))

  it('should be created', () => {
    const service: BtnFeatureService = TestBed.inject(BtnFeatureService)
    expect(service).toBeTruthy()
  })
})
