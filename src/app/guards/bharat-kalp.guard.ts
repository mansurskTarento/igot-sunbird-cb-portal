import { Injectable } from '@angular/core'
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import _ from 'lodash'

@Injectable({
  providedIn: 'root',
})
export class BharatKalpGuard {
  constructor(
    private router: Router,
    private configSvc: ConfigurationsService,
  ) { }

  canActivate(
    _next: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): boolean | UrlTree {
    const isMember = _.get(
      this.configSvc,
      'unMappedUser.profileDetails.additionalProperties.isBharatKalpMember'
    )
    if (isMember === true) {
      return true
    }
    return this.router.parseUrl('/page-not-found')
  }
}
