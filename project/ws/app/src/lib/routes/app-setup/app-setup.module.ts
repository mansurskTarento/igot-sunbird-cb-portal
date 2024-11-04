import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { AppSetupRoutingModule } from './app-setup-routing.module'
import { AppSetupHomeComponent } from './app-setup-home.component'

import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { SettingsModule } from '../profile/routes/settings/settings.module'
import { WidgetResolverModule } from '@sunbird-cb/resolver'
import {
  LocaleTranslatorModule,
  LanguageSelectorModule,
  AppTourDialogModule,
  BtnPageBackModule,
} from '@sunbird-cb/collection'
import { AboutVideoModule } from '../info/about-video/about-video.module'
import { HomeComponent } from './components/home/home.component'
import { LangSelectComponent } from './components/lang-select/lang-select.component'
import { TncComponent } from './components/tnc/tnc.component'
import { TncRendererComponent } from './components/tnc-renderer/tnc-renderer.component'
import { PipeSafeSanitizerModule } from '@sunbird-cb/utils-v2'
import { TncAppResolverService } from '../../../../../../../src/app/services/tnc-app-resolver.service'
import { SetupDoneComponent } from './components/setup-done/setup-done.component'
import { InterestModules } from './module/interest/interest.module'
import { Globals } from './globals'
import { InterestModule } from '../profile/routes/interest/interest.module'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatDialogModule } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatMenuModule } from '@angular/material/menu'
import { MatRadioModule } from '@angular/material/radio'
import { MatSelectModule } from '@angular/material/select'
import { MatStepperModule } from '@angular/material/stepper'
import { MatToolbarModule } from '@angular/material/toolbar'

@NgModule({
  declarations: [
    AppSetupHomeComponent,
    HomeComponent,
    LangSelectComponent,
    TncComponent,
    TncRendererComponent,
    SetupDoneComponent,
  ],
  imports: [
    CommonModule,
    AppSetupRoutingModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatRadioModule,
    MatSelectModule,
    MatExpansionModule,
    MatMenuModule,
    MatDividerModule,
    MatDialogModule,
    MatCheckboxModule,
    PipeSafeSanitizerModule,
    MatToolbarModule,
    BtnPageBackModule,

    SettingsModule,
    AboutVideoModule,
    WidgetResolverModule,
    LocaleTranslatorModule,
    InterestModules,
    LanguageSelectorModule,
    AppTourDialogModule,
    InterestModule,
  ],
  providers: [TncAppResolverService, Globals],
})
export class AppSetupModule { }
