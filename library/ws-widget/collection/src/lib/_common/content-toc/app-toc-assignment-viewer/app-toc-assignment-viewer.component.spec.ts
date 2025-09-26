import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { AssignmentViewerComponent } from './app-toc-assignment-viewer.component'


describe('AssignmentViewerComponent', () => {
  let component: AssignmentViewerComponent
  let fixture: ComponentFixture<AssignmentViewerComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AssignmentViewerComponent],
    })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AssignmentViewerComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
