import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { SocialSearchComponent } from './social-search.component'
import { FormsModule } from '@angular/forms'

import { RouterModule } from '@angular/router'
import { SocialSearchRoutingModule } from './social-search-routing.module'

import { BtnPageBackModule, BtnSocialVoteModule, BtnSocialLikeModule } from '@sunbird-cb/collection'
import { ForumHandlerService } from '../forums/service/EmitterService/forum-handler.service'
import { SearchFilterDisplayComponent } from './widgets/search-filter-display/search-filter-display.component'
import { MatButtonModule } from '@angular/material/button'
import { MatButtonToggleModule } from '@angular/material/button-toggle'
import { MatCardModule } from '@angular/material/card'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatRippleModule } from '@angular/material/core'
import { MatDividerModule } from '@angular/material/divider'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatListModule } from '@angular/material/list'
import { MatMenuModule } from '@angular/material/menu'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatRadioModule } from '@angular/material/radio'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatTabsModule } from '@angular/material/tabs'
import { MatToolbarModule } from '@angular/material/toolbar'

@NgModule({
  declarations: [SocialSearchComponent, SearchFilterDisplayComponent],
  imports: [
    FormsModule,
    CommonModule,
    MatIconModule,
    MatRadioModule,
    MatCardModule,
    BtnSocialVoteModule,
    BtnSocialLikeModule,
    SocialSearchRoutingModule,
    MatProgressSpinnerModule,
    BtnPageBackModule,
    MatSidenavModule,
    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatRippleModule,
    MatMenuModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatListModule,
    RouterModule,
    MatTabsModule,
    MatButtonToggleModule,
    MatDividerModule,

  ],
  providers: [ForumHandlerService],
  exports: [SocialSearchComponent],
})
export class SocialSearchModule {
  constructor() {
    // console.log('Social Search Module Called')
  }

}
