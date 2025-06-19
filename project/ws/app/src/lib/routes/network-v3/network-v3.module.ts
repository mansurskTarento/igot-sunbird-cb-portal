import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NetworkV3RoutingModule } from './network-v3-routing.module';
import { NetworkProfileComponent } from './components/network-profile/network-profile.component';
import { NetworkNavigationComponent } from './components/network-navigation/network-navigation.component';
import { ConnectionsComponent } from './routes/connections/connections.component';
import { RecommendationsComponent } from './routes/recommendations/recommendations.component';
import { UpdatesComponent } from './routes/updates/updates.component';
import { NetworkComponent } from './routes/network/network.component';
import { NetworkHomeComponent } from './routes/network-home/network-home.component';
import { MentorsComponent } from './routes/mentors/mentors.component';
import { ProfileCardComponent } from './components/profile-card/profile-card.component';
import { ConnectionsCardComponent } from './components/connections-card/connections-card.component';
import { UpdatesCardComponent } from './components/updates-card/updates-card.component';
import { MatIconModule } from '@angular/material/icon';


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
    UpdatesCardComponent
  ],
  imports: [
    CommonModule,
    NetworkV3RoutingModule,
    MatIconModule
  ]
})
export class NetworkV3Module { }
