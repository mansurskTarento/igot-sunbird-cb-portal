import { TestBed } from '@angular/core/testing'

import { ContentAssignService } from './content-assign.service'

describe('ContentAssignService', () => {
  beforeEach(() => TestBed.configureTestingModule({}))

  it('should be created', () => {
    const service: ContentAssignService = TestBed.inject(ContentAssignService)
    expect(service).toBeTruthy()
  })
})
