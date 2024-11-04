import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { LeftMenuWithoutLogoComponent } from './left-menu-without-logo.component'
import { WidgetResolverModule } from '@sunbird-cb/resolver'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatChipsModule } from '@angular/material/chips'
import { MatIconModule } from '@angular/material/icon'
import { MatListModule } from '@angular/material/list'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatTooltipModule } from '@angular/material/tooltip'

@NgModule({
  declarations: [LeftMenuWithoutLogoComponent],
  imports: [
    CommonModule,
    RouterModule,
    WidgetResolverModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatChipsModule,
    MatCardModule,
    MatListModule,
  ],
  entryComponents: [LeftMenuWithoutLogoComponent],
  exports: [
    LeftMenuWithoutLogoComponent,
  ],
})
export class LeftMenuWithoutLogoModule { }
