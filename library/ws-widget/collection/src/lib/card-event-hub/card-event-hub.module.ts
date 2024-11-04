import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { DefaultThumbnailModule } from '@sunbird-cb/utils-v2'
import { SkeletonLoaderModule } from '../_common/skeleton-loader/skeleton-loader.module'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { CardEventHubComponent } from './card-event-hub.component'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'

@NgModule({
  declarations: [CardEventHubComponent],
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    DefaultThumbnailModule,
    SkeletonLoaderModule,
    MatProgressSpinnerModule,
  ],
  entryComponents: [CardEventHubComponent],
  exports: [CardEventHubComponent],
})
export class CardEventHubModule { }
