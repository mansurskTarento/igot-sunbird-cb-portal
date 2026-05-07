import { TestBed } from '@angular/core/testing'

import { MdoChannelDataService } from './mdo-channel-data.service'

describe('MdoChannelDataService', () => {
  beforeEach(() => TestBed.configureTestingModule({}))

  it('should be created', () => {
    const service: MdoChannelDataService = TestBed.inject(MdoChannelDataService)
    expect(service).toBeTruthy()
  })
})
