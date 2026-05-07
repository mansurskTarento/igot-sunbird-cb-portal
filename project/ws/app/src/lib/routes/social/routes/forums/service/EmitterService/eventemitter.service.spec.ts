import { TestBed } from '@angular/core/testing'
import { ForumHandlerService } from './forum-handler.service'

describe('ForumHandlerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}))

  it('should be created', () => {
    const service: ForumHandlerService = TestBed.inject(ForumHandlerService)
    expect(service).toBeTruthy()
  })
})
