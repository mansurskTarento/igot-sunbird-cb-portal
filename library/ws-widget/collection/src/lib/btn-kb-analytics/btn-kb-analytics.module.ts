import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { BtnKbAnalyticsComponent } from './btn-kb-analytics.component'
import { RouterModule } from '@angular/router'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'

@NgModule({
    declarations: [BtnKbAnalyticsComponent],
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        RouterModule,
    ],
    exports: [BtnKbAnalyticsComponent]
})
export class BtnKbAnalyticsModule { }
