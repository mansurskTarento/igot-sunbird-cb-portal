import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { TreeCatalogComponent } from './tree-catalog.component'
import { TreeModule } from '../tree/tree.module'
import { TreeCatalogMenuComponent } from './tree-catalog-menu/tree-catalog-menu.component'
import { TreeCatalogRoutePipe } from './tree-catalog-route.pipe'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatMenuModule } from '@angular/material/menu'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'

@NgModule({
    declarations: [TreeCatalogComponent, TreeCatalogMenuComponent, TreeCatalogRoutePipe],
    imports: [
        CommonModule,
        RouterModule,
        TreeModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatProgressSpinnerModule,
    ],
    exports: [TreeCatalogComponent, TreeCatalogMenuComponent]
})
export class TreeCatalogModule { }
