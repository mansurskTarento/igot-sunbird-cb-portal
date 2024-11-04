import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { TopicCardComponent } from './components/topic-card/topic-card.component'
import { ProfileHomeComponent } from './routes/profile-home/profile-home.component'

import { MatListModule } from '@angular/material/list'
import { CurrentCompetenciesComponent } from './routes/current-competencies/current-competencies.component'
import { MatSidenavModule } from '@angular/material/sidenav'
import { RouterModule } from '@angular/router'
import { ProfileV3RoutingModule } from './profile-v3-routing.module'
import { CurrentCompetencyCardComponent } from './components/current-competency-card/current-competency-card.component'
import { SetupLeftMenuComponent } from './components/left-menu/left-menu.component'
import { DesiredCompetenciesComponent } from './routes/desired-competencies/desired-competencies.component'
import { TopicComponent } from './routes/topics/topic.component'
import { BrowseByCompetencyModule } from '../browse-by-competency/browse-by-competency.module'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { PipeFilterV2Module, PipeListFilterModule } from '@sunbird-cb/utils-v2'
import { TreeCatalogModule } from '@sunbird-cb/collection/src/public-api'
import { TopicService } from './services/topics.service'
// import { PlayerVideoComponent } from '@sunbird-cb/collection/src/lib/player-video/player-video.component'
import { PlatformWalkthroughComponent } from './routes/platform-walkthrough/platform-walkthrough.component'
import { AddTopicDialogComponent } from './components/add-topic/add-topic.component'
import { RolesAndActivitiesComponent } from './routes/roles-and-activities/roles-and-activities.component'
import { RolesAndActivityService } from './services/rolesandActivities.service'
import { LevelCardComponent } from './components/level-card/level-card.component'
import { LevelInfoComponent } from './components/level-info/level-info.component'
import { CompTooltipDirective } from './directives/tooltip.directive'
import { WelcomeOnboardComponent } from './routes/welcome-onboard/welcome-onboard.component'
import { DialogBoxComponent } from './components/dialog-box/dialog-box.component'
import { DesiredcomptencyCardComponent } from './components/desiredcomptency-card/desiredcomptency-card.component'
import { CompLocalService } from './services/comp.service'
import { TranslateModule } from '@ngx-translate/core'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatChipsModule } from '@angular/material/chips'
import { MatDialogModule } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatSnackBarModule } from '@angular/material/snack-bar'

@NgModule({
  declarations: [
    DesiredCompetenciesComponent,
    TopicCardComponent,
    ProfileHomeComponent,
    CurrentCompetenciesComponent,
    CurrentCompetencyCardComponent,
    DesiredcomptencyCardComponent,
    SetupLeftMenuComponent,
    TopicComponent,
    PlatformWalkthroughComponent,
    // VideoWrapperComponent,
    AddTopicDialogComponent,
    RolesAndActivitiesComponent,
    LevelCardComponent,
    LevelInfoComponent,
    CompTooltipDirective,
    WelcomeOnboardComponent,
    DialogBoxComponent,
    DesiredcomptencyCardComponent,
  ],
  imports: [
    CommonModule,
    MatCardModule,
    MatListModule,
    MatSidenavModule,
    MatIconModule,
    RouterModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    ProfileV3RoutingModule,
    FormsModule,
    MatCheckboxModule,
    PipeFilterV2Module,
    MatInputModule,
    TreeCatalogModule,
    MatSnackBarModule,
    MatDialogModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    BrowseByCompetencyModule,
    MatChipsModule,
    PipeListFilterModule,
    TranslateModule,
  ],
  providers: [
    TopicService,
    RolesAndActivityService,
    CompLocalService,
  ],
  entryComponents: [
    AddTopicDialogComponent,
    DialogBoxComponent,
  ],
})
export class ProfileV3Module { }
