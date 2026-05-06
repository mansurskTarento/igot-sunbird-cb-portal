import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { CardRatingCommentComponent } from './card-rating-comment.component'
import { PipeCountTransformModule, PipeRelativeTimeModule } from '@sunbird-cb/utils-v2'
import { AvatarPhotoModule } from '../_common/avatar-photo/avatar-photo.module'
import { HttpClient } from '@angular/common/http'
import { TranslateModule, TranslateLoader } from '@ngx-translate/core'
import { MatCardModule } from '@angular/material/card'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatTooltipModule } from '@angular/material/tooltip'
import { TranslateHttpLoader } from '@ngx-translate/http-loader'

export function CardRatingHttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http)
}

@NgModule({
  declarations: [CardRatingCommentComponent],
  imports: [
    CommonModule,
    PipeCountTransformModule,
    MatProgressBarModule,
    MatIconModule,
    MatTooltipModule,
    AvatarPhotoModule,
    PipeRelativeTimeModule,
    MatCardModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: CardRatingHttpLoaderFactory,
        deps: [HttpClient],
      },
    }),

  ],
  exports: [
    CardRatingCommentComponent,
  ],
})
export class CardRatingCommentModule { }
