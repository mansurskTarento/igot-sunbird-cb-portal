import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ContactHomeComponent } from './components/contact-home.component'
import { BtnPageBackModule } from '@sunbird-cb/collection'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatToolbarModule } from '@angular/material/toolbar'

@NgModule({
  declarations: [ContactHomeComponent],
  imports: [CommonModule, MatToolbarModule, MatCardModule, BtnPageBackModule, MatButtonModule],
  exports: [ContactHomeComponent],
})
export class ContactModule {}
