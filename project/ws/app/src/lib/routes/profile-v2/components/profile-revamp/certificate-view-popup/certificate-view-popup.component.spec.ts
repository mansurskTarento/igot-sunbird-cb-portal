import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificateViewPopupComponent } from './certificate-view-popup.component';

describe('CertificateViewPopupComponent', () => {
  let component: CertificateViewPopupComponent;
  let fixture: ComponentFixture<CertificateViewPopupComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CertificateViewPopupComponent]
    });
    fixture = TestBed.createComponent(CertificateViewPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
