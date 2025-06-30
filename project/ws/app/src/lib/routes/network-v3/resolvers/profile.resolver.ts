import { Injectable } from '@angular/core';
import { ConfigurationsService } from '@sunbird-cb/utils-v2';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import * as _ from 'lodash';
import { NetworkingService } from '../services/networking.service';

@Injectable()
export class profileResolver
   {
  constructor(
    private networkSvc: NetworkingService,
    private configSvc: ConfigurationsService) { }

  resolve(
    // _route: ActivatedRouteSnapshot,
    // _state: RouterStateSnapshot,
  ): Observable<any> {
    let userId = _.get(this.configSvc, 'userProfile.userId')
    if(_.get(this.configSvc, 'userProfileV2.profileBannerUrl') || _.get(this.configSvc, 'userProfileV2.profileBannerUrl') === '') {
      return of({
        data: this.configSvc.userProfileV2, 
        error: null
      })
    }
    return this.networkSvc.fetchProfile(userId).pipe(
      map(data =>  ({
         data: _.get(data, 'result.response'), 
         error: null
        })),
      catchError(error => of({ error, data: null })),
    )
  }
}
