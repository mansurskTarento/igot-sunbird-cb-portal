import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { NetworkV3RoutingModule } from './network-v3-routing.module'
import { NetworkProfileComponent } from './components/network-profile/network-profile.component'
import { NetworkNavigationComponent } from './components/network-navigation/network-navigation.component'
import { ConnectionsComponent } from './routes/connections/connections.component'
import { RecommendationsComponent } from './routes/recommendations/recommendations.component'
import { UpdatesComponent } from './routes/updates/updates.component'
import { NetworkComponent } from './routes/network/network.component'
import { NetworkHomeComponent } from './routes/network-home/network-home.component'
import { MentorsComponent } from './routes/mentors/mentors.component'
import { ProfileCardComponent } from './components/profile-card/profile-card.component'
import { ConnectionsCardComponent } from './components/connections-card/connections-card.component'
import { UpdatesCardComponent } from './components/updates-card/updates-card.component'
import { MatIconModule } from '@angular/material/icon'
import { MatMenuModule } from '@angular/material/menu'
import { MatTabsModule } from '@angular/material/tabs'
import { AvatarPhotoModule } from '@sunbird-cb/collection'
import { ConnectionPeopleCardComponent } from './components/connection-people-card/connection-people-card.component'
import { TranslateLoader, TranslateModule } from '@ngx-translate/core'
import { AllRecommendationsComponent } from './components/all-recommendations/all-recommendations.component'
import { CommunitySuggestionsModule, HorizontalScrollerV2Module, ConnectionNameModule, DialogComponentsModule, AvatarPhotoLibModule } from '@sunbird-cb/consumption'
import { PaginationModule } from '@sunbird-cb/collection'
import { MatButtonModule } from '@angular/material/button'
import { SkeletonLoaderModule } from '@sunbird-cb/collection'
import { MatDialogModule } from '@angular/material/dialog'

import { HttpClient } from '@angular/common/http'
import { TranslateHttpLoader } from '@ngx-translate/http-loader'
export function NetworkV3HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http)
}

@NgModule({
  declarations: [
    NetworkComponent,
    NetworkProfileComponent,
    NetworkNavigationComponent,
    NetworkHomeComponent,
    ConnectionsComponent,
    RecommendationsComponent,
    UpdatesComponent,
    MentorsComponent,
    ProfileCardComponent,
    ConnectionsCardComponent,
    UpdatesCardComponent,
    ConnectionPeopleCardComponent,
    AllRecommendationsComponent,
  ],
  imports: [
    CommonModule,
    NetworkV3RoutingModule,
    MatIconModule,
    MatMenuModule,
    AvatarPhotoModule,
    ConnectionNameModule,
    PaginationModule,
    HorizontalScrollerV2Module,
    MatTabsModule,
    MatButtonModule,
    CommunitySuggestionsModule,
    SkeletonLoaderModule,
    MatDialogModule,
    DialogComponentsModule,
    AvatarPhotoLibModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: NetworkV3HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ]
})
export class NetworkV3Module { }
