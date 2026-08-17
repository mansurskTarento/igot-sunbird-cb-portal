import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
// import { PageResolve } from '@sunbird-cb/utils-v2'
import { SeeAllHomeComponent } from './components/see-all-home/see-all-home.component'
import { SeeAllWithPillsComponent } from './components/see-all-with-pills/see-all-with-pills.component'
import { SeeAllDynamicComponent } from './components/see-all-dynamic/see-all-dynamic.component'
import { SeeAllExploreByThemeComponent } from './components/see-all-explore-by-theme/see-all-explore-by-theme.component'
import { FormDataResolverService } from '../services/form-data-resolver.service'

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: SeeAllHomeComponent,
    data: {
      pageType: 'feature',
      pageKey: 'seeAll',
      pageId: '',
    },
    // resolve: {
    //   searchPageData: PageResolve,
    // },
  },
  {
    path: 'new',
    pathMatch: 'full',
    component: SeeAllWithPillsComponent,
    data: {
      pageType: 'feature',
      pageKey: 'seeAll',
      pageId: '',
    },
    // resolve: {
    //   searchPageData: PageResolve,
    // },
  },
  {
    path: 'custom',
    pathMatch: 'full',
    component: SeeAllHomeComponent,
    data: {
      pageType: 'feature',
      pageKey: 'seeAll',
      pageId: '',
    },
    // resolve: {
    //   searchPageData: PageResolve,
    // },
  },
  {
    path: 'content',
    pathMatch: 'full',
    component: SeeAllDynamicComponent,
    data: {
      pageType: 'feature',
      pageKey: 'see-all',
      pageId: 'app/amrit-gyaan-kosh',
    },
    resolve: {
      pageData: FormDataResolverService,
    },
  },
  {
    path: 'explore-by-theme',
    pathMatch: 'full',
    component: SeeAllExploreByThemeComponent,
    data: {
      pageType: 'feature',
      pageKey: 'seeAll',
      pageId: 'explore-by-theme',
    },
  },
]
@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
  ],
  exports: [RouterModule],
  providers: [],
})
export class SeeAllRoutingModule { }
