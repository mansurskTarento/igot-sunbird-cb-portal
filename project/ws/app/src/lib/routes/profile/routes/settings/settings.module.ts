import { LeftMenuComponent } from '../settings/components/left-menu/left-menu.component'
import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { SettingsComponent } from './settings.component'
import { NotificationSettingsComponent } from './components/notification-settings/notification-settings.component'
import { SettingsService } from './settings.service'
import { RouterModule } from '@angular/router'
import { PrivacySettingsComponent } from './components/privacy-settings/privacy-settings.component'
import { AccountPasswordSettingsComponent } from './components/account-password-settings/account-password-settings.component'
// import { ProfileSettingsComponent } from '../../../person-profile/module/profile-settings/profile-settings.component'
import { TranslateLoader, TranslateModule } from '@ngx-translate/core'
// import { HttpLoaderFactory } from 'src/app/app.module'
import { HttpClient } from '@angular/common/http'
import { TranslateHttpLoader } from '@ngx-translate/http-loader'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatChipsModule } from '@angular/material/chips'
import { MatOptionModule, MatRippleModule } from '@angular/material/core'
import { MatDividerModule } from '@angular/material/divider'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatListModule } from '@angular/material/list'
import { MatMenuModule } from '@angular/material/menu'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatRadioModule } from '@angular/material/radio'
import { MatSelectModule } from '@angular/material/select'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { MatTabsModule } from '@angular/material/tabs'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatTooltipModule } from '@angular/material/tooltip'

// tslint:disable-next-line:function-name
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http)
}
@NgModule({
  declarations: [SettingsComponent, NotificationSettingsComponent, LeftMenuComponent,
    PrivacySettingsComponent,
    AccountPasswordSettingsComponent,
    // ProfileSettingsComponent
  ],
  imports: [
    CommonModule,
    MatListModule,
    MatToolbarModule,
    MatIconModule,
    MatTabsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatRadioModule,
    MatMenuModule,
    MatButtonModule,
    MatSnackBarModule,
    MatDividerModule,
    MatOptionModule,
    FormsModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatRippleModule,
    MatTooltipModule,
    RouterModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  exports: [SettingsComponent, LeftMenuComponent],
  providers: [SettingsService],
})
export class SettingsModule { }
