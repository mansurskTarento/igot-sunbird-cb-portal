import { TestBed } from '@angular/core/testing'
import { QuizResolverService } from './resolver.service'

describe('QuizResolverService', () => {
  beforeEach(() => TestBed.configureTestingModule({}))

  it('should be created', () => {
    const service: QuizResolverService = TestBed.inject(QuizResolverService)
    expect(service).toBeTruthy()
  })
})
