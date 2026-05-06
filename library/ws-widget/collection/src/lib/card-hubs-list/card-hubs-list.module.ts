import { NgModule } from '@angular/core'
import { CardHubsListComponent } from './card-hubs-list.component'
import { BrowserModule } from '@angular/platform-browser'
import { AvatarPhotoModule } from '../_common/avatar-photo/avatar-photo.module'
import { HorizontalScrollerModule, PipeNameTransformModule, PipeOrderByModule } from '@sunbird-cb/utils-v2'
import { RouterModule } from '@angular/router'
import { HttpClient } from '@angular/common/http'
import { TranslateModule, TranslateLoader } from '@ngx-translate/core'
import { ClickOutsideDirective } from './clickoutside.directive'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatChipsModule } from '@angular/material/chips'
import { MatDividerModule } from '@angular/material/divider'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { TranslateHttpLoader } from '@ngx-translate/http-loader'

export function CardHubstHttpLoaderFactory(http: HttpClient) {
    return new TranslateHttpLoader(http)
}

@NgModule({
    declarations: [CardHubsListComponent,
        ClickOutsideDirective],
    imports: [BrowserModule, MatButtonModule, MatCardModule, MatChipsModule, MatDividerModule,
        MatExpansionModule, MatIconModule, MatProgressSpinnerModule, AvatarPhotoModule,
        HorizontalScrollerModule, PipeNameTransformModule, PipeOrderByModule, RouterModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: CardHubstHttpLoaderFactory,
                deps: [HttpClient],
            },
        })]
})
export class CardHubsListModule {

}
