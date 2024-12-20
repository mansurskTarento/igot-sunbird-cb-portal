import { Injectable } from '@angular/core'
import { ActivatedRouteSnapshot } from '@angular/router'

@Injectable({
    providedIn: 'root',
})
export class RedirectGuard  {

  constructor() {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
      window.location.href = route.data['externalUrl']
      return true
  }
}
