import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { InvalidUserComponent } from '../component/invalid-user/invalid-user.component'
import { PipeSafeSanitizerModule } from '@sunbird-cb/utils-v2'
import { PageResolve } from '@sunbird-cb/utils-v2'

@NgModule({
  declarations: [InvalidUserComponent],
  imports: [
    CommonModule,
    PipeSafeSanitizerModule,
    RouterModule.forChild([
      {
        path: '',
        component: InvalidUserComponent,
        resolve: { pageData: PageResolve },
      },
    ]),
  ],
})
export class RouteInvalidUserModule {}
