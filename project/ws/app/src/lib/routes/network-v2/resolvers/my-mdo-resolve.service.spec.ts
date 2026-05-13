import { TestBed } from '@angular/core/testing'

import { MyMdoResolveService } from './my-mdo-resolve.service'

describe('MyMdoResolveService', () => {
  beforeEach(() => TestBed.configureTestingModule({}))

  it('should be created', () => {
    const service: MyMdoResolveService = TestBed.inject(MyMdoResolveService)
    expect(service).toBeTruthy()
  })
})
