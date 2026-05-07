import { TestBed } from '@angular/core/testing'

import { ProviderFormResolverService } from './provider-form-resolver.service'

describe('ProviderFormResolverService', () => {
  beforeEach(() => TestBed.configureTestingModule({}))

  it('should be created', () => {
    const service: ProviderFormResolverService = TestBed.inject(ProviderFormResolverService)
    expect(service).toBeTruthy()
  })
})
