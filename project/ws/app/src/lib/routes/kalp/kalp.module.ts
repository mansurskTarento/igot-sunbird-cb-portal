import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { TranslateModule, TranslateLoader } from '@ngx-translate/core'
import { TranslateHttpLoader } from '@ngx-translate/http-loader'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatIconModule } from '@angular/material/icon'
import { MatTabsModule } from '@angular/material/tabs'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { BharatKalpModule } from '@sunbird-cb/consumption'
import { KalpRoutingModule } from './kalp-routing.module'
import { BharatKalpPageComponent } from './bharat-kalp/bharat-kalp.component'
import { BharatKalpSeeAllComponent } from './bharat-kalp-see-all/bharat-kalp-see-all.component'

export function KalpHttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http)
}

@NgModule({
  declarations: [BharatKalpPageComponent, BharatKalpSeeAllComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    KalpRoutingModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTabsModule,
    MatSnackBarModule,
    BharatKalpModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: KalpHttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class KalpModule { }
