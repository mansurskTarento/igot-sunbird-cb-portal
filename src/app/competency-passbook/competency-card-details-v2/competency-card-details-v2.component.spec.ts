import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { CompetencyCardDetailsV2Component } from './competency-card-details-v2.component'

describe('CompetencyCardDetailsV2Component', () => {
  let component: CompetencyCardDetailsV2Component
  let fixture: ComponentFixture<CompetencyCardDetailsV2Component>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CompetencyCardDetailsV2Component],
    })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(CompetencyCardDetailsV2Component)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
