import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { CompetencyListV2Component } from './competency-list-v2.component'

describe('CompetencyListV2Component', () => {
  let component: CompetencyListV2Component
  let fixture: ComponentFixture<CompetencyListV2Component>
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CompetencyListV2Component],
    })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(CompetencyListV2Component)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
