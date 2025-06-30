import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { IResolveResponse } from '@sunbird-cb/utils-v2';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import * as _ from 'lodash';
import { NetworkingService } from '../services/networking.service';

@Injectable()
export class CommunityResolverService {
  constructor(
    private networkingSvc: NetworkingService) { }

  resolve(
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): Observable<IResolveResponse<any>> {
    const formBody = {
      filterCriteriaMap: {
        status: "active"
      },
      requestedFields: [],
      pageNumber: 0,
      pageSize: 3,
      facets: [
        "topicName"
      ]
    }
    return this.networkingSvc.getCommunities(formBody).pipe(
      map(data => ({
        data: _.get(data, 'result.search_results.data'),
        error: null,
      })),
      catchError(error => of({ error, data: null })),
    )
  }
}

