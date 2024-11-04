import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { KarmaProgramsMicrositeV1Component } from './karma-programs-microsite-v1/karma-programs-microsite-v1.component'
import { KarmaProgramsRoutingModule } from './karma-programs-routing.module'
import { CardsModule, CommonMethodsService, SlidersLibModule } from '@sunbird-cb/consumption'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'

import { KarmaProgramsService } from './service/karma-programs.service'
import { ImageResponsiveModule, PipeFilterV2Module, PipeOrderByModule } from '@sunbird-cb/utils-v2'
import { BtnPageBackModule } from '@sunbird-cb/collection/src/public-api'
import { TranslateLoader, TranslateModule } from '@ngx-translate/core'
import { HttpClient } from '@angular/common/http'
import { HttpLoaderFactory } from 'src/app/app.module'
import { KarmaProgramDataService } from './service/karma-program-data.service'
import { KarmaProgramsComponent } from './karma-programs/karma-programs.component'
import { KarmaProgramsMicrositeV2Component } from './karma-programs-microsite-v2/karma-programs-microsite-v2.component'
import { MatButtonModule } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatMenuModule } from '@angular/material/menu'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatSelectModule } from '@angular/material/select'
import { MatSidenavModule } from '@angular/material/sidenav'

@NgModule({
  declarations: [
    KarmaProgramsComponent,
    KarmaProgramsMicrositeV1Component,
    KarmaProgramsMicrositeV2Component],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    KarmaProgramsRoutingModule,
    SlidersLibModule,
    CardsModule,
    MatFormFieldModule,
    MatInputModule,
    PipeOrderByModule,
    PipeFilterV2Module,
    BtnPageBackModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatSelectModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    ImageResponsiveModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  providers: [KarmaProgramsService, KarmaProgramDataService, CommonMethodsService],
})
export class KarmaProgramsModule { }
