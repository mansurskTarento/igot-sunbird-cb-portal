import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { BtnContentMailMeComponent } from './btn-content-mail-me.component'
import { BtnContentMailMeDialogComponent } from './btn-content-mail-me-dialog/btn-content-mail-me-dialog.component'
import { MatButtonModule } from '@angular/material/button'
import { MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip'

@NgModule({
    declarations: [BtnContentMailMeComponent, BtnContentMailMeDialogComponent],
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatDialogModule,
    ],
    exports: [BtnContentMailMeComponent]
})
export class BtnContentMailMeModule { }
