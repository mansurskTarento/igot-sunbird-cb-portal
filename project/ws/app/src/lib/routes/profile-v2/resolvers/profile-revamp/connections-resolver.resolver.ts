import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { IResolveResponse } from '@sunbird-cb/utils-v2';
import { Observable, of } from 'rxjs';
import { NSProfileDataV2 } from '../../models/profile-v2.model';
import { ProfileV2RevampService } from '../../services/profile-v2-revamp.service';
import { catchError, map } from 'rxjs/operators';
import * as _ from 'lodash';

@Injectable()
export class connectionsResolverResolver {
  constructor(private profileSvc: ProfileV2RevampService) { }

  resolve(
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): Observable<IResolveResponse<NSProfileDataV2.IProfile>> {
    const formBody = {
      size: 3,
      offset: 0,
      search: [
        {
          field: 'employmentDetails.departmentName',
          values: [
            'Finance And Budget'
          ]
        }
      ]
    }

    return this.profileSvc.getRecommendedUsers(formBody).pipe(
      map(data => ({
        data: _.get(data, 'result.data[0].results'),
        error: null,
      })),
      catchError(error => of({ error, data: null })),
    )
  }
}
