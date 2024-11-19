import { Component, Input, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { VIEWER_ROUTE_FROM_MIME } from '@sunbird-cb/collection/src/public-api'
import { NsContent } from '@sunbird-cb/utils-v2'
import * as fileSaver from 'file-saver'

@Component({
  selector: 'ws-widget-app-toc-teachers-notes',
  templateUrl: './app-toc-teachers-notes.component.html',
  styleUrls: ['./app-toc-teachers-notes.component.scss'],
})

export class AppTocTeachersNotesComponent implements OnInit {

  @Input() content!: NsContent.IContent
  primaryCategory = NsContent.EPrimaryCategory


  constructor(public router: Router,
  ) {

  }

  ngOnInit() {}

  downloadPDF(contentData: any) {
    fileSaver.saveAs(contentData.artifactUrl, contentData.name)
  }

  previewContent(contentData: any) {
    this.router.navigate([`/app/amrit-gyan-kosh/player/${VIEWER_ROUTE_FROM_MIME(contentData.mimeType)}/${contentData.identifier}`], {
      queryParams : {
        primaryCategory: this.primaryCategory.RESOURCE,
        playerPreview: true,
        collectionId: this.content.identifier,
      },
    })

  }
  downloadAllContent() {

    this.content?.referenceNodes.forEach((ele: any) => {
      fileSaver.saveAs(ele.artifactUrl, ele.name)
    })
  }

}
