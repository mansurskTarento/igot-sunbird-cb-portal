import { NgModule } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { CommonModule } from '@angular/common'
import { BtnPlaylistComponent } from './btn-playlist.component'
import { BtnPlaylistDialogComponent } from './btn-playlist-dialog/btn-playlist-dialog.component'
import { BtnPlaylistSelectionComponent } from './btn-playlist-selection/btn-playlist-selection.component'
import { MatButtonModule } from '@angular/material/button'
import { MatDialogModule } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatListModule } from '@angular/material/list'
import { MatMenuModule } from '@angular/material/menu'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatTooltipModule } from '@angular/material/tooltip'

@NgModule({
    declarations: [BtnPlaylistComponent, BtnPlaylistDialogComponent, BtnPlaylistSelectionComponent],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        // Material Imports
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatMenuModule,
        MatFormFieldModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        MatListModule,
    ],
    exports: [BtnPlaylistComponent]
})
export class BtnPlaylistModule { }
