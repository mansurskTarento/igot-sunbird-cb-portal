import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { NotificationRoutingModule } from './notification-routing.module'
import { NotificationComponent } from './components/notification/notification.component'
import { BtnPageBackModule } from '@sunbird-cb/collection'
import { PipeLimitToModule } from '@sunbird-cb/utils-v2'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { MatListModule } from '@angular/material/list'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatToolbarModule } from '@angular/material/toolbar'

@NgModule({
  declarations: [NotificationComponent],
  imports: [
    CommonModule,
    NotificationRoutingModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatCardModule,
    MatDividerModule,

    BtnPageBackModule,
    PipeLimitToModule,
    MatProgressSpinnerModule,
  ],
})
export class NotificationModule { }
