import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { BtnPageBackComponent } from './btn-page-back.component'
import { PipeOrderByModule } from '@sunbird-cb/utils-v2'
import { TranslateModule } from '@ngx-translate/core'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatIconModule } from '@angular/material/icon'

@NgModule({
  declarations: [BtnPageBackComponent],
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    PipeOrderByModule,
    TranslateModule,
  ],
  exports: [BtnPageBackComponent],
  entryComponents: [BtnPageBackComponent],
})
export class BtnPageBackModule { }
