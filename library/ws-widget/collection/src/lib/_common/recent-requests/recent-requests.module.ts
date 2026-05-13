import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { MatIconModule } from '@angular/material/icon'
import { AvatarPhotoModule } from '../avatar-photo/avatar-photo.module'

import { SkeletonLoaderModule } from '../skeleton-loader/skeleton-loader.module'

import { RecentRequestsComponent } from './recent-requests.component'
import { HttpClient } from '@angular/common/http'
import { TranslateModule, TranslateLoader } from '@ngx-translate/core'
import { TranslateHttpLoader } from '@ngx-translate/http-loader'
export function RecentRequestHttpLoaderFactory(http: HttpClient) {
    return new TranslateHttpLoader(http)
}


@NgModule({
    declarations: [RecentRequestsComponent],
    imports: [
        CommonModule,
        RouterModule,
        SkeletonLoaderModule,
        MatIconModule,
        AvatarPhotoModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: RecentRequestHttpLoaderFactory,
                deps: [HttpClient],
            },
        }),
    ],
    exports: [
        RecentRequestsComponent,
    ]
})
export class RecentRequestsModule { }
