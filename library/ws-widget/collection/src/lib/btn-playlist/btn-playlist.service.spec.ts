import { TestBed } from '@angular/core/testing'

import { BtnPlaylistService } from './btn-playlist.service'

describe('BtnPlaylistService', () => {
  beforeEach(() => TestBed.configureTestingModule({}))

  it('should be created', () => {
    const service: BtnPlaylistService = TestBed.inject(BtnPlaylistService)
    expect(service).toBeTruthy()
  })
})
