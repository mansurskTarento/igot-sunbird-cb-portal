import { TestBed, inject } from '@angular/core/testing'
import { ConfigService } from '@sunbird/shared'
import { LearnerService } from './../learner/learner.service'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { mockResponseData } from './certificate.service.spec.data'
import { CertificateService } from './certificate.service'
import { of as observableOf, Observable } from 'rxjs'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('CertificateService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [],
    providers: [ConfigService, LearnerService, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
}))

  it('should be created', () => {
    const service: CertificateService = TestBed.inject(CertificateService)
    expect(service).toBeTruthy()
  })

  it('should call validateCertificate API', inject([],
                                                   () => {
      const certificateService = TestBed.inject(CertificateService)
      const learnerService = TestBed.inject(LearnerService)
      const params = { request: { certId: '123456', accessCode: 'QWERTY', verifySignature: 'true' } }
      spyOn(learnerService, 'post').and.returnValue(observableOf(mockResponseData.validateCertificateCodeData))
      certificateService.validateCertificate(params)
      const options = { url: 'certreg/v1/certs/validate', data: params }
      expect(learnerService.post).toHaveBeenCalledWith(options)
    }))
})
