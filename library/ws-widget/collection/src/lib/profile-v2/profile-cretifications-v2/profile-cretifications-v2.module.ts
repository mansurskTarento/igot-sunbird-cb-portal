import { NgModule } from '@angular/core'
import { ProfileCretificationsV2Component } from './profile-cretifications-v2.component'
import { BrowserModule } from '@angular/platform-browser'
import { ProfileCertificateDialogModule } from '../profile-certificate-dialog/profile-certificate-dialog.module'
import { PipePublicURLModule, DefaultThumbnailModule, PipeCertificateImageURLModule } from '@sunbird-cb/utils-v2'
import { TranslateModule } from '@ngx-translate/core'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatChipsModule } from '@angular/material/chips'
import { MatDividerModule } from '@angular/material/divider'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'

@NgModule({
  declarations: [ProfileCretificationsV2Component],
  imports: [
    BrowserModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    DefaultThumbnailModule,
    MatDividerModule,
    MatExpansionModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ProfileCertificateDialogModule,
    PipePublicURLModule,
    PipeCertificateImageURLModule,
    TranslateModule,
  ],
  entryComponents: [ProfileCretificationsV2Component],
})
export class ProfileCretificationsV2Module {}
