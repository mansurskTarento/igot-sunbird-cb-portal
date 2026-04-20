/// <reference types="jest" />
import { PeerValidationRoutingModule } from './peer-validation-routing.module'

describe('PeerValidationRoutingModule', () => {
  it('should create an instance', () => {
    const module = new PeerValidationRoutingModule()
    expect(module).toBeTruthy()
  })
})
