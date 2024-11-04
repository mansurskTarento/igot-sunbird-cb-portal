import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { DragDropModule } from '@angular/cdk/drag-drop'
import { ScrollingModule } from '@angular/cdk/scrolling'

import { PipeDurationTransformModule } from '@sunbird-cb/utils-v2'

import { ClassDiagramComponent } from './class-diagram.component'
import { ClassDiagramResultComponent } from './components/class-diagram-result/class-diagram-result.component'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatSelectModule } from '@angular/material/select'
import { MatTableModule } from '@angular/material/table'

@NgModule({
  declarations: [ClassDiagramComponent, ClassDiagramResultComponent],
  imports: [
    CommonModule,
    FormsModule,
    ScrollingModule,
    DragDropModule,
    PipeDurationTransformModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatButtonModule,
    MatDialogModule,
    MatSelectModule,
    MatTableModule,
  ],
  exports: [
    ClassDiagramComponent,
  ],
})
export class ClassDiagramModule { }
