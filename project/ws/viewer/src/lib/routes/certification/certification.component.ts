import { Component, OnInit, OnDestroy } from '@angular/core'
import { Subscription } from 'rxjs'
import {
  NsContent,
} from '@sunbird-cb/collection'
// import { NsWidgetResolver } from '@sunbird-cb/resolver'
import { ActivatedRoute } from '@angular/router'
import { WidgetContentService } from '@sunbird-cb/toc'

@Component({
    selector: 'viewer-certification',
    templateUrl: './certification.component.html',
    styleUrls: ['./certification.component.scss'],
    standalone: false
})
export class CertificationComponent implements OnInit, OnDestroy {
  private routeDataSubscription: Subscription | null = null
  isFetchingDataComplete = false
  certificationData: NsContent.IContent | null = null
  forPreview = window.location.href.includes('/author/')

  constructor(private activatedRoute: ActivatedRoute, private contentSvc: WidgetContentService) { }

  ngOnInit() {
    this.routeDataSubscription = this.activatedRoute.data.subscribe(
      async data => {
        this.certificationData = data.content.data
        if (
          this.certificationData &&
          this.certificationData.artifactUrl.indexOf('content-store') >= 0
        ) {
          await this.setS3Cookie(this.certificationData.identifier)
        }
        this.isFetchingDataComplete = true
      },
      () => { },
    )
  }

  ngOnDestroy() {
    if (this.routeDataSubscription) {
      this.routeDataSubscription.unsubscribe()
    }
  }

  private async setS3Cookie(contentId: string) {
    await this.contentSvc
      .setS3Cookie(contentId)
      .toPromise()
      .catch(() => {
        // throw new DataResponseError('COOKIE_SET_FAILURE')
      })
    return
  }
}
