import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { BadgesRoutingModule } from './badges-routing.module'
import { BadgeDetailsComponent } from './badge-details/badge-details.component'
import { BadgeModalComponent } from '@sunbird-cb/consumption'
import { BtnPageBackModule } from '../../../library/ws-widget/collection/src/public-api'
import { BadgeStatsComponent } from '@sunbird-cb/consumption'
import { PipePublicURLModule } from '@sunbird-cb/utils-v2'
import { MatIconModule } from '@angular/material/icon'
import { MatMenuModule } from '@angular/material/menu'
import { MatButtonModule } from '@angular/material/button'
import { MatTooltipModule } from '@angular/material/tooltip'

@NgModule({
  declarations: [
    BadgeDetailsComponent,
    BadgeModalComponent,
    BadgeStatsComponent
  ],
  imports: [
    CommonModule,
    BadgesRoutingModule,
    BtnPageBackModule,
    PipePublicURLModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule
  ],
  exports: [
    BadgeDetailsComponent
  ]
})
export class BadgesModule { }