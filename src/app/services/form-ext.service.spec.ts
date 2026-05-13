import { TestBed } from '@angular/core/testing'

import { FormExtService } from './form-ext.service'

describe('FormExtService', () => {
  beforeEach(() => TestBed.configureTestingModule({}))

  it('should be created', () => {
    const service: FormExtService = TestBed.inject(FormExtService)
    expect(service).toBeTruthy()
  })
})
