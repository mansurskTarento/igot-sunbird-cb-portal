import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'

import { MatTabsModule } from '@angular/material/tabs'
import { RouterModule } from '@angular/router'
import { BtnPageBackModule, BtnSocialLikeModule, BtnSocialVoteModule } from '@sunbird-cb/collection'
import { BtnAdminModule } from '../widgets/buttons/btn-admin/btn-admin.module'
import { BtnModeratorModule } from '../widgets/buttons/btn-moderator/btn-moderator.module'
import { DialogBoxAdminAcceptComponent } from '../widgets/Dialog-Box/dialog-box-admin-accept/dialog-box-admin-accept.component'
import { DialogBoxAdminAcceptModule } from '../widgets/Dialog-Box/dialog-box-admin-accept/dialog-box-admin-accept.module'
import { DialogBoxModeratorModule } from '../widgets/Dialog-Box/dialog-box-moderator/dialog-box-moderator.module'
import { AdminTimelineComponent } from './components/admin-timeline.component'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatChipsModule } from '@angular/material/chips'
import { MatDialogModule } from '@angular/material/dialog'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatListModule } from '@angular/material/list'
import { MatMenuModule } from '@angular/material/menu'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatToolbarModule } from '@angular/material/toolbar'

@NgModule({
    declarations: [AdminTimelineComponent],
    imports: [
        CommonModule,
        MatToolbarModule,
        MatIconModule,
        MatMenuModule,
        BtnSocialLikeModule,
        BtnAdminModule,
        RouterModule,
        MatCardModule,
        MatProgressSpinnerModule,
        MatButtonModule,
        MatTabsModule,
        BtnPageBackModule,
        BtnPageBackModule,
        BtnSocialVoteModule,
        BtnSocialLikeModule,
        DialogBoxModeratorModule,
        DialogBoxAdminAcceptModule,
        MatButtonModule,
        MatDialogModule,
        MatExpansionModule,
        MatChipsModule,
        MatFormFieldModule,
        BtnModeratorModule,
        MatListModule,
        MatDialogModule,
    ],
    exports: [AdminTimelineComponent]
})
export class AdminTimelineModule { }
