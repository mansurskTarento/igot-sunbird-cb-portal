import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { BtnProfileComponent } from './btn-profile.component'
import { WidgetResolverModule } from '@sunbird-cb/resolver'
import { RouterModule } from '@angular/router'
import { LogoutModule } from '@sunbird-cb/utils-v2'
import { AvatarPhotoModule } from '../_common/avatar-photo/avatar-photo.module'
import { WidgetUrlResolverDirective } from './widget-url-resolver.directive'
import { TranslateModule } from '@ngx-translate/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatMenuModule } from '@angular/material/menu'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatTooltipModule } from '@angular/material/tooltip'
// import { TreeCatalogModule } from '../tree-catalog/tree-catalog.module'

@NgModule({
    declarations: [BtnProfileComponent, WidgetUrlResolverDirective],
    imports: [
        AvatarPhotoModule,
        CommonModule,
        LogoutModule,
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        MatMenuModule,
        MatTooltipModule,
        MatSlideToggleModule,
        RouterModule,
        WidgetResolverModule,
        TranslateModule,
    ],
    exports: [BtnProfileComponent]
})
export class BtnProfileModule { }
