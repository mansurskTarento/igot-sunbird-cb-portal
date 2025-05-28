import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
import { ProfileComponent } from './routes/profile/profile.component'
// import { InitResolver } from './resol./routes/profile-v2/discuss-all.component'
import { Profilev2Resolve } from './resolvers/profile-v2-resolve'
import { ProfileViewComponent } from './routes/profile-view/profile-view.component'
import { Profilev2BadgesResolve } from './resolvers/badges-resolve'
import { ProfileKarmapointsComponent } from './routes/profile-karmapoints/profile-karmapoints.component'
import { Profilev2CerficatesResolve } from './resolvers/profile-v2-certificates-resolver'
import { ProfileViewV2Component } from './routes/profile-view-v2/profile-view-v2.component'
import { profileResolver } from './resolvers/profile-revamp/profile.resolver'
import { profileEntriesResolver } from './resolvers/profile-revamp/profile-entries.resolver'
import { connectionsResolverResolver } from './resolvers/profile-revamp/connections-resolver.resolver'
import { CommunityResolverService } from './resolvers/profile-revamp/community-resolver.service'
// import { ConfigurationsService } from './resolvers/config-resolver.service'
// import { ProfileResolverService } from './resolvers/profile-resolver.service'

const routes: Routes = [
  {
    path: '',
    component: ProfileComponent,
    data: {
      pageId: '',
      module: 'Profile',
    },
    children: [
      // {
      //   path: 'me',
      //   component: ProfileViewComponent,
      //   data: {
      //     pageId: 'me',
      //     module: 'Profile',
      //   },
      //   resolve: {
      //     profile: Profilev2Resolve,
      //     badges: Profilev2BadgesResolve,
      //     certificates: Profilev2CerficatesResolve,
      //   },
      // },
      {
        path: 'me',
        component: ProfileViewV2Component,
        data: {
          pageId: 'me',
          module: 'Profile',
        },
        resolve: {
          profile: profileResolver,
          entries: profileEntriesResolver,
          recamendations: connectionsResolverResolver,
          recamendedCommunity: CommunityResolverService,
        },
      },
      {
        path: 'karma-points',
        component: ProfileKarmapointsComponent,
        data: {
          pageId: 'karma-points',
          module: 'Profile',
        },
        resolve: {
          profile: Profilev2Resolve,
          badges: Profilev2BadgesResolve,
          // profileData: ProfileResolverService,
        },
      },
      {
        path: ':userId',
        component: ProfileViewComponent,
        data: {
          pageId: ':userId',
          module: 'Network',
        },
        resolve: {
          profile: Profilev2Resolve,
          badges: Profilev2BadgesResolve,
          // profileData: ProfileResolverService,
        },
      },

    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [
    Profilev2Resolve,
    Profilev2BadgesResolve,
    Profilev2CerficatesResolve,
    profileResolver,
    profileEntriesResolver,
    connectionsResolverResolver,
    CommunityResolverService
    // ConfigurationsService,
    // ProfileResolverService,
  ],
})
export class ProfileV2RoutingModule { }
