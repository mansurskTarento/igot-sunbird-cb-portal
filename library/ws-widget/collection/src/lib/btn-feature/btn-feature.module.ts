import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { BtnFeatureComponent } from './btn-feature.component'
import { RouterModule } from '@angular/router'
import { WidgetUrlResolverDirective } from './widget-url-resolver.directive'
import { MatBadgeModule } from '@angular/material/badge'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatRippleModule } from '@angular/material/core'
import { MatIconModule } from '@angular/material/icon'
import { MatMenuModule } from '@angular/material/menu'
import { MatTooltipModule } from '@angular/material/tooltip'

@NgModule({
  declarations: [BtnFeatureComponent, WidgetUrlResolverDirective],
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatCardModule,
    MatMenuModule,
    MatRippleModule,
    MatBadgeModule,
  ],
  exports: [BtnFeatureComponent],
  entryComponents: [BtnFeatureComponent],
})
export class BtnFeatureModule {}
