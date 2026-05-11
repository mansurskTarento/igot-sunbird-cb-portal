import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { PublicSignupModule } from './public/public-signup/public-signup.module'
import { PublicCrpComponent } from './public/public-crp/public-crp.component'
import { AppPublicOrganizationResolver } from './public/public-signup/organization.resolver'
import { AppPublicPositionResolverService } from './public/public-signup/position-resolver.service'
import { AppPublicGroupResolverService } from './public/public-signup/group-resolver.service'

@NgModule({
  imports: [
    PublicSignupModule,
    RouterModule.forChild([
      {
        path: '',
        component: PublicCrpComponent,
        resolve: {
          organization: AppPublicOrganizationResolver,
          positions: AppPublicPositionResolverService,
          group: AppPublicGroupResolverService,
        },
      },
    ]),
  ],
})
export class RoutePublicCrpModule {}
