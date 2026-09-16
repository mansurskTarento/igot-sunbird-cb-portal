import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { MatMenuModule } from '@angular/material/menu'

import { BtnSettingsComponent } from './btn-settings.component'

describe('BtnSettingsComponent', () => {
  let component: BtnSettingsComponent
  let fixture: ComponentFixture<BtnSettingsComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [BtnSettingsComponent],
      // the template resolves #menu="matMenu", which NO_ERRORS_SCHEMA cannot stub
      imports: [MatMenuModule],
      // ConfigurationsService pulls in HttpClient; the template's child components
      // are not under test here
      providers: [provideHttpClient(), provideHttpClientTesting()],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(BtnSettingsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
