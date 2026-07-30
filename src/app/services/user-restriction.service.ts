import { Injectable } from '@angular/core'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'

/**
 * A user whose profileDetails.profileStatus is NOT-MY-USER has been disowned by their
 * organisation and is losing access. Such an account is restricted to its own profile
 * page — where the transfer request lives — so every other route is blocked and the
 * navigation chrome (sidebar, bottom nav) is taken away.
 */
@Injectable({
  providedIn: 'root',
})
export class UserRestrictionService {
  // the profile page the restricted user is sent to; keep it inside ALLOWED_PATHS or
  // the redirect would loop
  readonly redirectUrl = '/app/person-profile/me'

  // paths a restricted user may still reach: their profile (transfer request), the
  // sign-in / terms flows needed to get in or out, help, and the error screens
  private readonly ALLOWED_PATHS = [
    '/app/person-profile',
    '/app/tnc',
    '/app/setup',
    '/login',
    '/public',
    '/helpcenter',
    '/igot/help-centre',
    '/error-',
  ]

  constructor(private configSvc: ConfigurationsService) { }

  get isNotMyUser(): boolean {
    const status = this.configSvc
      && this.configSvc.unMappedUser
      && this.configSvc.unMappedUser.profileDetails
      && this.configSvc.unMappedUser.profileDetails.profileStatus
    return (status || '').toLowerCase() === 'not-my-user'
  }

  isAllowedUrl(url: string): boolean {
    const path = (url || '').split('?')[0].split('#')[0]
    return this.ALLOWED_PATHS.some((allowed: string) => path.startsWith(allowed))
  }

  // true when this navigation must be blocked for the current user
  isBlockedUrl(url: string): boolean {
    return this.isNotMyUser && !this.isAllowedUrl(url)
  }
}
