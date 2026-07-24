import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HeaderComponent } from './header/header.component'
import { AppNavBarComponent } from '../component/app-nav-bar/app-nav-bar.component'
import { RouterModule } from '@angular/router'
import { GridLayoutModule, BtnFeatureModule, ErrorResolverModule, TourModule, StickyHeaderModule } from '@sunbird-cb/collection'
import { WidgetResolverModule } from '@sunbird-cb/resolver'
import { SearchV3Module, SearchModule } from '@ws/app'
import { SharedModule } from '../shared/shared.module'
import { FontSettingComponent } from './../component/font-setting/font-setting.component'
import { TopRightNavBarComponent } from './../component/top-right-nav-bar/top-right-nav-bar.component'
import { FormsModule } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { SkeletonLoaderModule } from '@sunbird-cb/collection'
import { MatDialogModule } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatMenuModule } from '@angular/material/menu'
import { MatSelectModule } from '@angular/material/select'
import { MatSliderModule } from '@angular/material/slider'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatTooltipModule } from '@angular/material/tooltip'
import { LibNotificationsService, NotificationDropdownModule } from '@sunbird-cb/notification'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { MatButtonModule } from '@angular/material/button'
import { ConfirmDialogModule } from '@sunbird-cb/collection'
@NgModule({
  declarations: [HeaderComponent, AppNavBarComponent, FontSettingComponent, TopRightNavBarComponent],
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSliderModule,
    MatDialogModule,
    BtnFeatureModule,
    ErrorResolverModule,
    TourModule,
    WidgetResolverModule,
    StickyHeaderModule,
    SearchModule,
    SearchV3Module,
    RouterModule,
    GridLayoutModule,
    SharedModule,
    FormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatButtonModule,
    NotificationDropdownModule,
    TranslateModule,
    SkeletonLoaderModule,
    ConfirmDialogModule,
  ],
  exports: [
    HeaderComponent,
    AppNavBarComponent,
    FontSettingComponent,
    TopRightNavBarComponent,
    SharedModule,
  ],
  providers: [LibNotificationsService],
})
export class HeaderModule { }
