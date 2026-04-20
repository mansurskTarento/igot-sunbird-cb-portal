/// <reference types="jest" />
import { PeerValidationModule } from './peer-validation.module'

describe('PeerValidationModule', () => {
  it('should create an instance', () => {
    const module = new PeerValidationModule()
    expect(module).toBeTruthy()
  })
})
