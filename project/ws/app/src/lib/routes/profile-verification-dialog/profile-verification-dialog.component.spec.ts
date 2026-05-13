import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ProfileVerificationDialogComponent } from './profile-verification-dialog.component'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { Router } from '@angular/router'

describe('ProfileVerificationDialogComponent', () => {
  let component: ProfileVerificationDialogComponent
  let fixture: ComponentFixture<ProfileVerificationDialogComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProfileVerificationDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: Router, useValue: {} }
      ]
    })
      .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileVerificationDialogComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
