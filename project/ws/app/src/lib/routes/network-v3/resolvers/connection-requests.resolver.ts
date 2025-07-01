import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { IResolveResponse } from '@sunbird-cb/utils-v2';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { NetworkingService } from '../services/networking.service';

@Injectable()
export class connectionRequestsResolver {
  constructor(
    private networkingSvc: NetworkingService) { }

  resolve(
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): Observable<IResolveResponse<any>> {
    // const formBody = {
    // }

    return this.networkingSvc.getConnectionRequests().pipe(
      map(data => ({
        data: data,
        error: null,
      })),
      catchError(error => of({ error, data: null })),
    )
  }
}
