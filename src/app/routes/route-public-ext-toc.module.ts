import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { PublicExtTocModule } from './public/public-ext-toc/public-ext-toc.module'
import { PublicExtTocComponent } from './public/public-ext-toc/public-ext-toc.component'
import { AppTocExtPublicResolverService } from '@sunbird-cb/toc'

@NgModule({
  imports: [
    PublicExtTocModule,
    RouterModule.forChild([
      {
        path: '',
        component: PublicExtTocComponent,
        data: {
          pageType: 'feature',
          pageKey: 'toc',
          pageId: 'public/toc/:id',
          module: 'Learn',
        },
        resolve: {
          extContent: AppTocExtPublicResolverService,
        },
      },
    ]),
  ],
  providers: [AppTocExtPublicResolverService],
})
export class RoutePublicExtTocModule {}
