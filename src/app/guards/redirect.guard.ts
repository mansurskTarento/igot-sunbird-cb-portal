
import { Injectable } from '@angular/core'
import { ActivatedRouteSnapshot, Router } from '@angular/router'
import { DomainConfService } from '@sunbird-cb/utils-v2'
import { environment } from '../../environments/environment'

@Injectable({
  providedIn: 'root',
})
export class RedirectGuard {

  constructor(private domainSvc: DomainConfService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const envKey = route.data['externalUrlEnvKey']
    const externalUrl = envKey ? (environment as { [key: string]: any })[envKey] : route.data['externalUrl']
    if (externalUrl) {
      window.location.href = this.domainSvc.isKbPortal() ? externalUrl : this.domainSvc.getNonLoggedInPageUrl()
      return false
    } {
      const path = this.domainSvc.isKbPortal() ? 'page/home' : this.domainSvc.getDomainRedirectPath()
      this.router.navigateByUrl(path)
      return false
    }
  }
}
