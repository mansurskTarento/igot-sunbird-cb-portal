import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { BtnCatalogComponent } from './btn-catalog.component'
import { TreeCatalogModule } from '../tree-catalog/tree-catalog.module'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatMenuModule } from '@angular/material/menu'

@NgModule({
  declarations: [BtnCatalogComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    TreeCatalogModule,
  ],
  entryComponents: [BtnCatalogComponent],
})
export class BtnCatalogModule { }
