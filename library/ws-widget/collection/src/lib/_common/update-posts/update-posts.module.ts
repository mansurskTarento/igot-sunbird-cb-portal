import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { MatIconModule } from '@angular/material/icon'
import { SkeletonLoaderModule } from './../skeleton-loader/skeleton-loader.module'

import { UpdatePostsComponent } from './update-posts.component'
import { TranslateLoader, TranslateModule } from '@ngx-translate/core'
import { HttpClient } from '@angular/common/http'
import { TranslateHttpLoader } from '@ngx-translate/http-loader'

export function UpdatePostsHttpLoaderFactory(http: HttpClient) {
    return new TranslateHttpLoader(http)
}

@NgModule({
    declarations: [UpdatePostsComponent],
    imports: [
        CommonModule,
        SkeletonLoaderModule,
        MatIconModule,
        RouterModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: UpdatePostsHttpLoaderFactory,
                deps: [HttpClient],
            },
        }),
    ],
    exports: [
        UpdatePostsComponent,
    ]
})

export class UpdatePostsModule { }
