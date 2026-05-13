import { TestBed } from '@angular/core/testing'

import { ContentProgressService } from './content-progress.service'

describe('ContentProgressService', () => {
  beforeEach(() => TestBed.configureTestingModule({}))

  it('should be created', () => {
    const service: ContentProgressService = TestBed.inject(ContentProgressService)
    expect(service).toBeTruthy()
  })
})
