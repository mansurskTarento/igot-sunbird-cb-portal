import { TestBed } from '@angular/core/testing'

import { AppGyaanKarmayogiService } from './app-gyaan-karmayogi.service'

describe('AppGyaanKarmayogiService', () => {
  beforeEach(() => TestBed.configureTestingModule({}))

  it('should be created', () => {
    const service: AppGyaanKarmayogiService = TestBed.inject(AppGyaanKarmayogiService)
    expect(service).toBeTruthy()
  })
})
