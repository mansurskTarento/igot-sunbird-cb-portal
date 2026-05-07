import { TestBed } from '@angular/core/testing'

import { CollectionStoreService } from './store.service'

describe('CollectionStoreService', () => {
  beforeEach(() => TestBed.configureTestingModule({}))

  it('should be created', () => {
    const service: CollectionStoreService = TestBed.inject(CollectionStoreService)
    expect(service).toBeTruthy()
  })
})
