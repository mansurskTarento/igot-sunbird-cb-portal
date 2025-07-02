import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { IResolveResponse } from '@sunbird-cb/utils-v2';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { NetworkingService } from '../services/networking.service';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
@Injectable()
export class mentorSuggestionsResolver {
  constructor(
    private networkingSvc: NetworkingService) { }

  resolve(
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): Observable<IResolveResponse<any>> {
   const pageSize = _route.queryParams['pageSize'] || 10;
    const offset = _route.queryParams['offset'] || 0;
    const formBody = {
      size: pageSize,
      offset: offset,
    }

    return this.networkingSvc.getRecommendedMentors(formBody).pipe(
      map(res => ({
        data: _.get(res, 'result.data.results'),
        error: null,
      })),
      catchError(error => of({ error, data: null })),
    )
  }
}
