import { Component, OnInit, Input } from '@angular/core'

@Component({
    selector: 'viewer-dnd-quiz',
    templateUrl: './dnd-quiz.component.html',
    styleUrls: ['./dnd-quiz.component.scss'],
    standalone: false
})
export class DndQuizComponent implements OnInit {
  @Input() forPreview = false

  constructor() {}

  ngOnInit() {}
}
