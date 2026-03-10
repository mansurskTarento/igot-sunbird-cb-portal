import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { BadgesRoutingModule } from './badges-routing.module'
import { BadgeDetailsComponent } from './badge-details/badge-details.component'
import { BadgeModalComponent } from '@sunbird-cb/consumption'
import { BtnPageBackModule } from '../../../library/ws-widget/collection/src/public-api'
import { BadgeStatsComponent } from '@sunbird-cb/consumption'

@NgModule({
  declarations: [
    BadgeDetailsComponent,
    BadgeModalComponent,
    BadgeStatsComponent
  ],
  imports: [
    CommonModule,
    BadgesRoutingModule,
    BtnPageBackModule
  ],
  exports: [
    BadgeDetailsComponent
  ]
})
export class BadgesModule { }