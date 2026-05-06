import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { KnowledgeResourceModule } from '@ws/app'

@NgModule({
  imports: [
    CommonModule, KnowledgeResourceModule],
  exports: [KnowledgeResourceModule],
})
export class RouteKnowledgeResourceModule { }
