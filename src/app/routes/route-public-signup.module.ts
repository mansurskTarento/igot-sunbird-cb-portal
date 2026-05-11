import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { PublicSignupModule } from './public/public-signup/public-signup.module'
import { PublicSignupComponent } from './public/public-signup/public-signup.component'
import { AppPublicPositionResolverService } from './public/public-signup/position-resolver.service'
import { AppPublicGroupResolverService } from './public/public-signup/group-resolver.service'

@NgModule({
  imports: [
    PublicSignupModule,
    RouterModule.forChild([
      {
        path: '',
        component: PublicSignupComponent,
        resolve: {
          positions: AppPublicPositionResolverService,
          group: AppPublicGroupResolverService,
        },
      },
    ]),
  ],
})
export class RoutePublicSignupModule {}
