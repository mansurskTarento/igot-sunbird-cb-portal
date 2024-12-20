import { NgModule } from '@angular/core'
import { ProfileAcademicsComponent } from './profile-academics.component'
import { BrowserModule } from '@angular/platform-browser'
import { PipeOrderByModule } from '@sunbird-cb/utils-v2'

import { TranslateModule } from '@ngx-translate/core'
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button'
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card'
import { MatLegacyChipsModule as MatChipsModule } from '@angular/material/legacy-chips'
import { MatDividerModule } from '@angular/material/divider'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatIconModule } from '@angular/material/icon'
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner'

@NgModule({
    declarations: [ProfileAcademicsComponent],
    imports: [BrowserModule, MatButtonModule, MatCardModule, MatChipsModule,
        MatDividerModule, MatExpansionModule, MatIconModule, MatProgressSpinnerModule, PipeOrderByModule,
        TranslateModule,
    ]
})
export class ProfileAcademicsModule {

}
