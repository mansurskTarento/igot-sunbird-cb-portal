import { TestBed } from '@angular/core/testing'

import { ExcelService } from './excel.service'

describe('ExcelService', () => {
  beforeEach(() => TestBed.configureTestingModule({}))

  it('should be created', () => {
    const service: ExcelService = TestBed.inject(ExcelService)
    expect(service).toBeTruthy()
  })
})
