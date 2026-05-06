import { Injectable } from '@angular/core'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { environment } from '../../../../../../../../../../src/environments/environment'
import { ApiService } from '../../../../../modules/shared/services/api.service'
import { AccessControlService } from '../../../../../modules/shared/services/access-control.service'
import { NSApiRequest } from '../../../../../interface/apiRequest'
import { NSApiResponse } from '../../../../../interface/apiResponse'
import { CONTENT_CREATE } from '../../../../../constants/apiEndpoints'

@Injectable()
export class CreateService {
  constructor(
    private apiService: ApiService,
    private configSvc: ConfigurationsService,
    private accessService: AccessControlService,
  ) { }

  create(meta: { mimeType: string; contentType: string; locale: string }): Observable<string> {
    const requestBody: NSApiRequest.ICreateMetaRequest = {
      content: {
        ...meta,
        name: 'Untitled Content',
        description: '',
        category: meta.contentType,
        createdBy: this.accessService.userId,
        authoringDisabled: false,
        isContentEditingDisabled: false,
        isMetaEditingDisabled: false,
        isExternal: meta.mimeType === 'application/html',
      },
    }
    if (this.accessService.rootOrg === 'client2') {
      if (meta.contentType === 'Knowledge Artifact') {
        try {
          const userPath = `client2/Australia/dealer_code-${this.configSvc.unMappedUser.json_unmapped_fields.dealer_group_code}`
          requestBody.content.accessPaths = userPath
        } catch {
          requestBody.content.accessPaths = 'client2'
        }
      } else {
        requestBody.content.accessPaths = 'client2'
      }
    }
    return this.apiService
      .post<NSApiRequest.ICreateMetaRequest>(
        `${CONTENT_CREATE}${this.accessService.orgRootOrgAsQuery}`,
        requestBody,
      )
      .pipe(
        map((data: NSApiResponse.IContentCreateResponse) => {
          return data.identifier
        }),
      )
  }

  createV2(
    meta: {
      mimeType: string
      contentType: string
      locale: string
      primaryCategory: string
    }): Observable<NSApiResponse.IContentCreateResponseV2> {
    let randomNumber = ''
    // tslint:disable-next-line: no-increment-decrement
    for (let i = 0; i < 16; i++) {
      randomNumber += Math.floor(Math.random() * 10)
    }
    const requestBody: NSApiRequest.ICreateMetaRequestV2 = {
      request: {
        content: {
          code: randomNumber,
          contentType: meta.contentType,
          createdBy: this.accessService.userId,
          createdFor: [environment.channelId],
          creator: (this.configSvc.userProfile) ? this.configSvc.userProfile.userName : '',
          description: '',
          framework: environment.framework,
          mimeType: meta.mimeType,
          name: 'Untitled Content',
          organisation: [environment.organisation],
          isExternal: meta.mimeType === 'application/html',
          primaryCategory: meta.primaryCategory,
        },
      },
    }
    return this.apiService
      .post<NSApiRequest.ICreateMetaRequestV2>(
        `/apis/authApi/content/v3/create`,
        requestBody,
      )
      .pipe(
        map((data: NSApiResponse.IContentCreateResponseV2) => {
          return data
        }),
      )
  }
}
