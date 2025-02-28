import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseContentCardComponent } from './course-content-card.component';

describe('CourseContentCardComponent', () => {
  let component: CourseContentCardComponent;
  let fixture: ComponentFixture<CourseContentCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CourseContentCardComponent]
    });
    fixture = TestBed.createComponent(CourseContentCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
