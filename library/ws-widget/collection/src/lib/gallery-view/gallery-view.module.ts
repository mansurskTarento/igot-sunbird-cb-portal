import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { GalleryViewComponent } from './gallery-view.component'
import { WidgetResolverModule } from '@sunbird-cb/resolver'
import { HorizontalScrollerModule } from '@sunbird-cb/utils-v2'
import { MatCardModule } from '@angular/material/card'
import { MatIconModule } from '@angular/material/icon'

@NgModule({
  declarations: [GalleryViewComponent],
  imports: [CommonModule, WidgetResolverModule, HorizontalScrollerModule, MatIconModule, MatCardModule],
  exports: [GalleryViewComponent],
  entryComponents: [GalleryViewComponent],
})
export class GalleryViewModule { }
