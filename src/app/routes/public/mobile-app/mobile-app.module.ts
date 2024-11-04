import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { MobileAppHomeComponent } from './components/mobile-app-home.component'
import { BtnPageBackModule } from '@sunbird-cb/collection'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatIconModule } from '@angular/material/icon'
import { MatTabsModule } from '@angular/material/tabs'
import { MatToolbarModule } from '@angular/material/toolbar'

@NgModule({
  declarations: [MobileAppHomeComponent],
  imports: [
    CommonModule,
    MatToolbarModule,
    MatCardModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    BtnPageBackModule,
  ],
  exports: [MobileAppHomeComponent],
})
export class MobileAppModule {}
