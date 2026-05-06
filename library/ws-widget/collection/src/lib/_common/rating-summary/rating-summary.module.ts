import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RatingSummaryComponent } from './rating-summary.component'
import { PipeCountTransformModule } from '@sunbird-cb/utils-v2'
import { HttpClient } from '@angular/common/http'
import { TranslateModule, TranslateLoader } from '@ngx-translate/core'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatTooltipModule } from '@angular/material/tooltip'
import { TranslateHttpLoader } from '@ngx-translate/http-loader'

export function RatingSummaryHttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http)
}

@NgModule({
  declarations: [RatingSummaryComponent],
  imports: [
    CommonModule,
    PipeCountTransformModule,
    MatProgressBarModule,
    MatIconModule,
    MatTooltipModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: RatingSummaryHttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  exports: [
    RatingSummaryComponent,
  ],
})
export class RatingSummaryModule { }
