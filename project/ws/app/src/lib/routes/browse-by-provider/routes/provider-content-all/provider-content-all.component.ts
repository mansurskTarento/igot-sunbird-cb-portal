import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { CommonMethodsService } from '@sunbird-cb/consumption'
import { NsContentStripWithTabs } from '@sunbird-cb/consumption/lib/_common/content-strip-with-tabs-lib/content-strip-with-tabs-lib.model'

import { BrowseProviderService } from '../../services/browse-provider.service'
import { UtilityService } from '@sunbird-cb/utils-v2'

@Component({
  selector: 'ws-app-provider-content-all',
  templateUrl: './provider-content-all.component.html',
  styleUrls: ['./provider-content-all.component.scss'],
})
export class ProviderContentAllComponent implements OnInit {

  providerName = ''
  providerId = ''
  seeAllPageConfig: any = {}
  keyData: any
  contentDataList: any = []
  isMobile = false
  requestData: any
  constructor(public commonSvc: CommonMethodsService,
              public activatedRoute: ActivatedRoute,
              public contentSvc: BrowseProviderService,
              public utilitySvc: UtilityService
  ) {

   }

  ngOnInit( ) {
    this.activatedRoute.params.subscribe(params => {
      this.providerName = params['provider']
      this.providerId = params['orgId']
      if (this.activatedRoute.snapshot.queryParams && this.activatedRoute.snapshot.queryParams.stripData) {
        const data  = JSON.parse(this.activatedRoute.snapshot.queryParams.stripData)
        this.isMobile = this.utilitySvc.isMobile || false
        if (this.isMobile) {
          data['stripConfig']['cardSubType'] = 'card-wide-lib'
          data['loaderConfig']['cardSubType'] = 'card-wide-lib-skeleton'
        } else {
          data['stripConfig']['cardSubType'] = 'card-wide-v2'
          data['loaderConfig']['cardSubType'] = 'card-wide-v2-skeleton'
        }
        this.seeAllPageConfig = data
        this.contentDataList = this.commonSvc.transformSkeletonToWidgets(data)
      }
    })
    this.callApi()
  }

  callApi(query?: any) {
    if (this.seeAllPageConfig.request && this.seeAllPageConfig.request.topContent) {
      this.fetchAllTopContent(this.seeAllPageConfig, query)
    } else if (this.seeAllPageConfig.request && this.seeAllPageConfig.request.featureContent) {
      this.fetchAllFeaturedContent(this.seeAllPageConfig, query)
    }
  }

  async fetchAllTopContent(strip: NsContentStripWithTabs.IContentStripUnit, querydata?: any) {
    if (strip.request && strip.request.topContent && Object.keys(strip.request.topContent).length) {

      if (strip.request &&
        strip.request.topContent &&
        strip.request.topContent.request &&
        strip.request.topContent.request.filters) {
        strip.request.topContent.request.query = querydata || ''
        strip.request.topContent.request.filters = this.postMethodFilters(strip.request.topContent.request.filters)
      }
      try {
        const response = await this.postRequestMethod(strip.request.topContent, strip.request.apiUrl)
        // console.log('calling  after - response, ', response)
        if (response && response.results) {
          // console.log('calling  after-- ')
          if (response.results.result.content && response.results.result.content.length) {
            this.contentDataList = this.commonSvc.transformContentsToWidgets(response.results.result.content, strip)
          } else {
            this.contentDataList = []
          }

        } else {
          this.contentDataList = []
        }
      } catch (error) {
        // Handle errors
        // console.error('Error:', error);
      }
    }
  }

  async fetchAllFeaturedContent(strip: NsContentStripWithTabs.IContentStripUnit, querydata?: any) {
    if (strip.request && strip.request.featureContent && Object.keys(strip.request.featureContent).length) {
      if (strip.request &&
        strip.request.featureContent &&
        strip.request.featureContent.request &&
        strip.request.featureContent.request.filters) {
        strip.request.featureContent.request.query = querydata || ''
        strip.request.featureContent.request.filters = this.postMethodFilters(strip.request.featureContent.request.filters)
      }
      try {
        const response = await this.postRequestMethod(strip.request.featureContent, strip.request.apiUrl)
        // console.log('calling  after - response, ', response)
        if (response && response.results) {
          // console.log('calling  after-- ')
          if (response.results.result.content && response.results.result.content.length) {
            this.contentDataList = this.commonSvc.transformContentsToWidgets(response.results.result.content, strip)

          } else {
            this.contentDataList = []
          }

        } else {
          this.contentDataList = []
        }
      } catch (error) {
        this.contentDataList = []
        // Handle errors
        // console.error('Error:', error);
      }
    }
  }

  async postRequestMethod(
    request: NsContentStripWithTabs.IContentStripUnit['request'],
    apiUrl: string,
  ): Promise<any> {
    this.requestData = request
    return new Promise<any>((resolve, reject) => {
      if (request && request) {
        this.contentSvc.postApiMethod(apiUrl, request).subscribe(results => {
        resolve({ results })
        },                                                       (error: any) => {
        reject(error)
        },
        )
      }
    })
  }

  postMethodFilters(filters: any) {
    if (filters.organisation &&
      filters.organisation.indexOf('<orgID>') >= 0
    ) {
      filters.organisation = this.providerId
    }
    return filters
  }

  handleSearchQuery(e: any) {
    if (e.target.value || e.target.value === '') {
      this.callApi(e.target.value)
    }
  }

}