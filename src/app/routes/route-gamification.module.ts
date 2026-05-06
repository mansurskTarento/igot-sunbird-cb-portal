import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { GamificationModule } from '@ws/app'

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    GamificationModule
    ,
  ],
  exports: [
    GamificationModule,
  ],
})
export class RouteGamificationModule { }
