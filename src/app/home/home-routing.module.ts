import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
// import { HomeComponent } from './home/home.component'
// import { HomeResolverService } from './home/home-resolver.service'
import { HomeV2Component } from './home-v2/home-v2.component'
import { HomeV2ResolverService } from './home-v2/home-v2-resolver.service'
const routes: Routes = [
  {
    path: '',
    component: HomeV2Component,
    resolve: { home: HomeV2ResolverService },
    data: {
      pageId: '',
      module: '',
    },
  }
]
@NgModule({
  imports: [
    RouterModule.forChild(routes),
  ],
  exports: [RouterModule],
  providers: [],
})
export class HomeRoutingModule { }
