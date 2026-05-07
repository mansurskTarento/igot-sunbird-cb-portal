import { TestBed } from '@angular/core/testing'

import { TreeCatalogService } from './tree-catalog.service'

describe('TreeCatalogService', () => {
  beforeEach(() => TestBed.configureTestingModule({}))

  it('should be created', () => {
    const service: TreeCatalogService = TestBed.inject(TreeCatalogService)
    expect(service).toBeTruthy()
  })
})
