import { NgModule } from '@angular/core'
import { ProfileHobbiesComponent } from './profile-hobbies.component'

import { BrowserModule } from '@angular/platform-browser'

import { TranslateModule } from '@ngx-translate/core'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatChipsModule } from '@angular/material/chips'
import { MatDividerModule } from '@angular/material/divider'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'

@NgModule({
    declarations: [ProfileHobbiesComponent],
    imports: [BrowserModule, MatButtonModule, MatCardModule, MatChipsModule,
        MatDividerModule, MatExpansionModule, MatIconModule, MatProgressSpinnerModule,
        TranslateModule,
    ]
})
export class ProfileHobbiesModule {

}
