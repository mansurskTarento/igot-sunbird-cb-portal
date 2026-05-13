import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ProfileV3Module } from '@ws/app'
@NgModule({
  imports: [
    CommonModule, ProfileV3Module],
  exports: [ProfileV3Module],
})
export class RouteProfileV3Module { }
