import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { CardKnowledgeComponent } from './card-knowledge.component'
import { RouterModule } from '@angular/router'
import { DefaultThumbnailModule, PipeDurationTransformModule, PipePartialContentModule, PipePublicURLModule } from '@sunbird-cb/utils-v2'
import { BtnContentShareModule } from '../btn-content-share/btn-content-share.module'
import { BtnFollowModule } from '../btn-follow/btn-follow.module'
import { BtnKbAnalyticsModule } from '../btn-kb-analytics/btn-kb-analytics.module'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatChipsModule } from '@angular/material/chips'
import { MatIconModule } from '@angular/material/icon'

@NgModule({
    declarations: [CardKnowledgeComponent],
    imports: [
        CommonModule,
        RouterModule,
        DefaultThumbnailModule,
        BtnFollowModule,
        BtnContentShareModule,
        // Material Imports
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatChipsModule,
        PipeDurationTransformModule,
        BtnKbAnalyticsModule,
        PipePartialContentModule,
        PipePublicURLModule,
    ],
    exports: [CardKnowledgeComponent]
})
export class CardKnowledgeModule { }
