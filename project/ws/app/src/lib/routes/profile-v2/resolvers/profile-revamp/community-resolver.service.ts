import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { IResolveResponse } from '@sunbird-cb/utils-v2';
import { Observable, of } from 'rxjs';
import { NSProfileDataV2 } from '../../models/profile-v2.model';
import { ProfileV2RevampService } from '../../services/profile-v2-revamp.service';
import { catchError, map } from 'rxjs/operators';
import * as _ from 'lodash';

@Injectable()
export class CommunityResolverService {
  constructor(private profileSvc: ProfileV2RevampService) { }

  resolve(
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): Observable<IResolveResponse<NSProfileDataV2.IProfile>> {
    const formBody = {
      filterCriteriaMap: {
        status: "active"
      },
      requestedFields: [],
      pageNumber: 0,
      pageSize: 0,
      facets: [
        "topicName"
      ]
    }

    return this.profileSvc.getCommunities(formBody).pipe(
      map(data => ({
        data: _.get(data, 'result.search_results.data'),
        error: null,
      })),
      catchError(error => of({ error, data: null })),
    )
  }
}

