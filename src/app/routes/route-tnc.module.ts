import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { TncComponent } from './tnc/tnc.component'
import { TncRendererComponent } from '../component/tnc-renderer/tnc-renderer.component'
import { MatButtonModule } from '@angular/material/button'
import { MatDialogModule } from '@angular/material/dialog'
import { MatMenuModule } from '@angular/material/menu'
import { MatIconModule } from '@angular/material/icon'
import { MatExpansionModule } from '@angular/material/expansion'
import { PipeSafeSanitizerModule } from '@sunbird-cb/utils-v2'

@NgModule({
  declarations: [TncComponent, TncRendererComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatMenuModule,
    MatIconModule,
    MatExpansionModule,
    PipeSafeSanitizerModule,
    RouterModule.forChild([{ path: '', component: TncComponent }]),
  ],
})
export class RouteTncModule { }
