import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { JanKarmayogiModule } from '@ws/app'

@NgModule({
  imports: [
    CommonModule, JanKarmayogiModule],
  exports: [JanKarmayogiModule],
})
export class RouteJanKarmayogiModule { }
