import { NgModule } from '@angular/core'
import { CardCarrierHomeComponent } from './card-carrier-home.component'
import { CardCarrierComponent } from '../card-carrier/card-carrier.component'
import { BrowserModule } from '@angular/platform-browser'
import { PipeRelativeTimeModule } from '@sunbird-cb/utils-v2'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatChipsModule } from '@angular/material/chips'
import { MatDividerModule } from '@angular/material/divider'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
@NgModule({
  declarations: [CardCarrierHomeComponent, CardCarrierComponent],
  imports: [
    BrowserModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatExpansionModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PipeRelativeTimeModule,
  ],
  entryComponents: [CardCarrierHomeComponent],
})
export class CardCarrierHomeModule {

}
