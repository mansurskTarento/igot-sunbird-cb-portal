import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { BtnPageBackNavComponent } from './btn-page-back-nav.component'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'

@NgModule({
    declarations: [BtnPageBackNavComponent],
    imports: [
        CommonModule,
        RouterModule,
        MatButtonModule,
        MatIconModule,
    ],
    exports: [BtnPageBackNavComponent]
})
export class BtnPageBackNavModule { }
