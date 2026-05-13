import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { GyaanKarmayogiModule } from '@ws/app'

@NgModule({
  imports: [
    CommonModule, GyaanKarmayogiModule],
  exports: [GyaanKarmayogiModule],
})
export class RouteGyaanKarmayogiModule { }
