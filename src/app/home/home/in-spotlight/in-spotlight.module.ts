import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { TranslateModule } from '@ngx-translate/core'
import { SpotlightCardsModule } from '@sunbird-cb/consumption'

import { InSpotlightComponent } from './in-spotlight.component'

@NgModule({
  declarations: [InSpotlightComponent],
  imports: [
    CommonModule,
    TranslateModule,
    SpotlightCardsModule,
  ],
  exports: [InSpotlightComponent],
})
export class InSpotlightModule { }
