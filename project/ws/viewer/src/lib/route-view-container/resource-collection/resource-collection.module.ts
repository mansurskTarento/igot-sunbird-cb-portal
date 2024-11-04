import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ResourceCollectionRoutingModule } from './resource-collection-routing.module'
import { ResourceCollectionComponent } from './resource-collection.component'

import { WebModuleModule as PluginWebModuleModule } from '../../plugins/web-module/web-module.module'
import { ResourceCollectionModule as PluginResourceCollectionModule } from '../../plugins/resource-collection/resource-collection.module'
import {
  BtnContentDownloadModule,
  BtnContentFeedbackModule,
  BtnContentLikeModule,
  BtnContentShareModule,
  BtnGoalsModule,
  BtnPlaylistModule,
  DisplayContentTypeModule,
  UserImageModule,
  UserContentRatingModule,
  BtnContentFeedbackV2Module,
  PlayerBriefModule,
} from '@sunbird-cb/collection'

import {
  PipeDurationTransformModule,
  PipeLimitToModule,
  PipePartialContentModule,
} from '@sunbird-cb/utils-v2'

import { WidgetResolverModule } from '@sunbird-cb/resolver'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatDialogModule } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatPaginatorModule } from '@angular/material/paginator'
import { MatTableModule } from '@angular/material/table'
import { MatTabsModule } from '@angular/material/tabs'

@NgModule({
  declarations: [ResourceCollectionComponent],
  imports: [
    CommonModule,
    ResourceCollectionRoutingModule,
    MatTableModule,
    MatButtonModule,
    MatDialogModule,
    MatCardModule,
    MatPaginatorModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    PluginResourceCollectionModule,
    PluginWebModuleModule,
    BtnContentDownloadModule,
    BtnContentFeedbackModule,
    BtnContentLikeModule,
    BtnContentShareModule,
    BtnGoalsModule,
    BtnPlaylistModule,
    DisplayContentTypeModule,
    UserImageModule,
    UserContentRatingModule,
    BtnContentFeedbackV2Module,
    PlayerBriefModule,
    PipeDurationTransformModule,
    PipeLimitToModule,
    PipePartialContentModule,
    WidgetResolverModule,
  ],
  exports: [
    ResourceCollectionComponent,
  ],
})
export class ResourceCollectionModule { }
