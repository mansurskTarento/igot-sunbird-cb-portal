import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { PageResolve } from '@sunbird-cb/utils-v2'
import { AppTocCiosHomeComponent } from '@sunbird-cb/toc'
import { AppTocCiosResolverService } from '@sunbird-cb/toc'
import { AppTocCiosUserEnrollResolverService } from '@sunbird-cb/toc'
import { AppTocContentReadResolverService } from '@sunbird-cb/toc'
import { FormDataResolverService } from './../../routes/services/form-data-resolver.service'

import { TocHomeComponent } from './toc-home/toc-home.component'

const routes: Routes = [
  {
    path: ':id',
    component: TocHomeComponent,
    data: {
      pageType: 'feature',
      pageKey: 'toc',
      pageId: ':do_ID',
      module: 'Learn',
    },
    resolve: {
      pageData: PageResolve,
      content: AppTocContentReadResolverService,
    },
    runGuardsAndResolvers: 'paramsChange',
    children: [
      {
        path: 'overview',
        component: TocHomeComponent,
        data: {
          pageId: 'overview',
          module: 'Learn',
        },
      },
    ],
  },
  {
    path: 'ext/:id',
    component: AppTocCiosHomeComponent,
    data: {
      pageType: 'feature',
      pageKey: 'tocExt',
      pageId: 'ext/:do_ID',
      module: 'Learn',
    },
    resolve: {
      pageData: FormDataResolverService,
      extContent: AppTocCiosResolverService,
      userEnrollContent: AppTocCiosUserEnrollResolverService,
    },
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AppTocRoutingModule { }
