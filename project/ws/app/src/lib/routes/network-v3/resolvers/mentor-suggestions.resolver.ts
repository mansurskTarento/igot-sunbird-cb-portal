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
    const formBody = {
      size: 12,
      offset: 0,
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
