import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { SearchV3Module } from '@ws/app'

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    SearchV3Module,
  ],
  exports: [
    SearchV3Module,
  ],
})
export class RouteSearchV3AppModule { }
