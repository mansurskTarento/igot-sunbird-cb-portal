import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { KalpModule } from '@ws/app'

@NgModule({
  imports: [CommonModule, KalpModule],
  exports: [KalpModule],
})
export class RouteKalpModule { }
