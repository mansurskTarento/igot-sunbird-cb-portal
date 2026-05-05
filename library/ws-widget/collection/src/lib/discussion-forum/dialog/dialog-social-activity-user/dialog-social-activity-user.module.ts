import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { DialogSocialActivityUserComponent } from './dialog-social-activity-user.component'
import { UserImageModule } from '../../../_common/user-image/user-image.module'
import { MatDialogModule } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatTabsModule } from '@angular/material/tabs'

@NgModule({
    declarations: [DialogSocialActivityUserComponent],
    imports: [
        CommonModule,
        MatTabsModule,
        MatDividerModule,
        MatIconModule,
        MatDialogModule,
        MatProgressSpinnerModule,
        UserImageModule,
    ]
})
export class DialogSocialActivityUserModule { }
