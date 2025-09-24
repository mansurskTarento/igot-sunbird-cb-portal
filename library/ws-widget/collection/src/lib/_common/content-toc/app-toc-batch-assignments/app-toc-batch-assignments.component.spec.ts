import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { AppTocBatchAssignmentsComponent } from './app-toc-batch-assignments.component'


describe('AppTocTeachersNotesComponent', () => {
  let component: AppTocBatchAssignmentsComponent
  let fixture: ComponentFixture<AppTocBatchAssignmentsComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AppTocBatchAssignmentsComponent],
    })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AppTocBatchAssignmentsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
