import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { MatIconModule } from '@angular/material/icon'
import { TranslateModule } from '@ngx-translate/core'
import { SidebarInfoCardsSectionComponent } from '@sunbird-cb/consumption'
import { ExploreMenuComponent } from '../component/explore-menu/explore-menu.component'

@NgModule({
  declarations: [ExploreMenuComponent],
  imports: [
    CommonModule,
    MatIconModule,
    TranslateModule,
    // standalone section shared with the desktop sidebar
    SidebarInfoCardsSectionComponent,
    RouterModule.forChild([{ path: '', component: ExploreMenuComponent }]),
  ],
})
export class RouteExploreMenuModule { }
