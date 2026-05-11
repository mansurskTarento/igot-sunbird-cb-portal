import { Component, Input, OnInit } from '@angular/core'
import { NsContent } from '@sunbird-cb/collection'
import { ActivatedRoute } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'

@Component({
    selector: 'viewer-resource-collection-container',
    templateUrl: './resource-collection.component.html',
    styleUrls: ['./resource-collection.component.scss'],
    standalone: false
})
export class ResourceCollectionComponent implements OnInit {
  @Input() isFetchingDataComplete = false
  @Input() isErrorOccured = false
  @Input() forPreview = false
  @Input() resourceCollectionData: NsContent.IContent | null = null
  @Input() resourceCollectionManifest: any
  @Input() isPreviewMode = false
  isTypeOfCollection = false
  collectionId: string | null = null
  isRestricted = false
  constructor(private activatedRoute: ActivatedRoute, private configSvc: ConfigurationsService) { }
  ngOnInit() {
    if (this.configSvc.restrictedFeatures) {
      this.isRestricted =
        !this.configSvc.restrictedFeatures.has('disscussionForum')
    }
    this.isTypeOfCollection = this.activatedRoute.snapshot.queryParams.collectionType ? true : false
    if (this.isTypeOfCollection) {
      this.collectionId = this.activatedRoute.snapshot.queryParams.collectionId
    }
  }
}
