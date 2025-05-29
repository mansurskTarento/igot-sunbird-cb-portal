import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoverPhotoEditPopupComponent } from './cover-photo-edit-popup.component';

describe('CoverPhotoEditPopupComponent', () => {
  let component: CoverPhotoEditPopupComponent;
  let fixture: ComponentFixture<CoverPhotoEditPopupComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CoverPhotoEditPopupComponent]
    });
    fixture = TestBed.createComponent(CoverPhotoEditPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
