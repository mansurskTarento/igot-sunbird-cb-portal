import { TestBed } from '@angular/core/testing'

import { MdoChannelFormService } from './mdo-channel-form.service'

describe('MdoChannelFormService', () => {
  beforeEach(() => TestBed.configureTestingModule({}))

  it('should be created', () => {
    const service: MdoChannelFormService = TestBed.inject(MdoChannelFormService)
    expect(service).toBeTruthy()
  })
})
