import { Injectable } from '@angular/core'
import {
  ActivatedRouteSnapshot, Router, RouterStateSnapshot,
  // RouterStateSnapshot,
  UrlTree
} from '@angular/router'
import { ConfigurationsService, AuthKeycloakService } from '@sunbird-cb/utils-v2'
import { NSProfileDataV3 } from '@ws/app'
import { UserRestrictionService } from '../services/user-restriction.service'
// tslint:disable-next-line
import _ from 'lodash'

@Injectable({
  providedIn: 'root',
})
export class GeneralGuard {
  constructor(
    private router: Router,
    private configSvc: ConfigurationsService,
    private authSvc: AuthKeycloakService,
    private restrictionSvc: UserRestrictionService,
  ) { }

  async canActivate(
    next: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): Promise<boolean | UrlTree> {
    // a NOT-MY-USER account only gets its own profile page: block every other route
    // before the lazy chunk and resolvers run
    if (this.restrictionSvc.isBlockedUrl(_state.url)) {
      return this.router.parseUrl(this.restrictionSvc.redirectUrl)
    }
    const requiredFeatures = (next.data && next.data.requiredFeatures) || []
    const requiredRoles = (next.data && next.data.requiredRoles) || []
    let pageKey = next.data && next.data.pageKey
    // the generic /page/:id route declares the literal pageKey 'id'; resolve it to the
    // actual page name so globalConfig.routes entries like "learn": false can disable it
    if (pageKey === 'id' && next.params && next.params.id) {
      pageKey = next.params.id
    }
    // routes without an explicit pageKey fall back to the last segment of
    // their pageId (e.g. 'app/toc' -> 'toc', 'app/my-learning' -> 'my-learning')
    // so globalConfig.routes can control every guarded route
    if (!pageKey && next.data && next.data.pageId) {
      pageKey = String(next.data.pageId).split('/').pop()
    }

    // Check if this route is disabled in globalConfig.routes. An entry is either a
    // boolean or an object like { "enabled": false, "allowedSubRoutes": ["player"] },
    // which disables the feature while keeping the listed sub-paths reachable
    if (pageKey) {
      const routes = this.configSvc.globalConfig?.routes
      const routeConfig = routes && routes[pageKey]
      if (routeConfig === false) {
        return this.router.parseUrl('/error-feature-unavailable')
      }
      if (routeConfig && typeof routeConfig === 'object' && routeConfig.enabled === false) {
        const base = next.data && next.data.pageId ? `/${next.data.pageId}/` : '/'
        const urlPath = _state.url.split('?')[0]
        const isAllowedSubRoute = (routeConfig.allowedSubRoutes || [])
          .some((subRoute: string) => urlPath.startsWith(`${base}${subRoute}`))
        if (!isAllowedSubRoute) {
          return this.router.parseUrl('/error-feature-unavailable')
        }
      }
    }

    return await this.shouldAllow<boolean | UrlTree>(_state, requiredFeatures, requiredRoles)
  }

  hasRole(role: string[]): boolean {
    let returnValue = false
    role.forEach(v => {
      if ((this.configSvc.userRoles || new Set()).has((v || '').toLocaleLowerCase())) {
        returnValue = true
      }
    })
    return returnValue
  }
  private async shouldAllow<T>(
    state: RouterStateSnapshot,
    requiredFeatures: string[],
    requiredRoles: string[],
  ): Promise<T | UrlTree | boolean> {
    /**
     * Test IF User is authenticated===> in now from backend
     */
    if (
      this.configSvc.userProfile === null
      && !(window.location.href.includes('/public/') || window.location.href.includes('&preview=true')
        || window.location.href.includes('/certs'))
      // !this.configSvc.isAuthenticated
    ) {
      let refAppend = ''
      // let redirectUrl
      if (state.url) {
        refAppend = `?redirect_uri=${encodeURIComponent(state.url)}`
        // return this.router.parseUrl(`/login${refAppend}`)
      }

      // if (refAppend) {
      //   redirectUrl = document.baseURI + refAppend
      // } else {
      //   redirectUrl = document.baseURI
      // }
      try { // NOSONAR
        Promise.resolve(this.authSvc.loginV2('S', refAppend))
        // return true
      } catch (e) {
        return false
      }
    }

    // if Invalid Role: now checking in init.service
    //  if (
    //   state.url &&
    //   // !state.url.includes('/app/setup/') &&
    //   !(state.url.includes('/app/tnc') ||
    //     state.url.includes('/app/setup/'))
    // ) {
    //   if (!this.hasRole(environment.portalRoles)) {
    //     this.authSvc.logout()
    //     return false
    //   }
    // }
    // If invalid user
    if (
      this.configSvc.userProfile === null &&
      this.configSvc.instanceConfig &&
      window.location.pathname.includes('/page/home')
      // !Boolean(this.configSvc.instanceConfig.disablePidCheck)
    ) {
      return this.router.parseUrl('/static-home')
    }
    /**
     * Test IF User Tnc Is Accepted
     */
    if (!this.configSvc.hasAcceptedTnc) {
      // if (
      //   state.url &&
      //   !state.url.includes('/app/setup/') &&
      //   !state.url.includes('/app/tnc') &&
      //   !state.url.includes('/page/home')
      // ) {
      //   this.configSvc.userUrl = state.url
      // }
      // if (
      //   this.configSvc.restrictedFeatures &&
      //   !this.configSvc.restrictedFeatures.has('firstTimeSetupV2')
      // ) {
      //   return this.router.parseUrl(`/app/setup/home/lang`)
      // }
      // return this.router.parseUrl(`/app/tnc`)
    }
    // Check if the user has roles & activities and topic in the profile
    if (!this.checkWelcome()) {
      return this.router.parseUrl('/app/setup')
    }

    if (!this.configSvc.isActive) {
      this.router.navigateByUrl('/error-access-forbidden')
      this.authSvc.force_logout()
      return false
    }

    /**
       * Test IF User updated the profile details
       */
    if (!this.configSvc.profileDetailsStatus) {
      // return this.router.parseUrl('/app/user-profile/details')
      // return this.router.navigate(['/app/user-profile/details', { isForcedUpdate: true }])
    }

    /**
     * Test IF User has requried role to access the page
     */
    if (requiredRoles && requiredRoles.length && this.configSvc.userRoles) {
      const requiredRolePreset = requiredRoles.some(item =>
        (this.configSvc.userRoles || new Set()).has(item),
      )

      if (!requiredRolePreset) {
        return this.router.parseUrl('/page/home')
      }
    }

    // check if feature is restricted
    if (requiredFeatures && requiredFeatures.length && this.configSvc.restrictedFeatures) {
      const requiredFeaturesMissing = requiredFeatures.some(item =>
        (this.configSvc.restrictedFeatures || new Set()).has(item),
      )

      if (requiredFeaturesMissing) {
        return this.router.parseUrl('/page/home')
      }
    }

    return true
  }

  checkWelcome() {
    // tslint:disable-next-line
    const tabs = _.orderBy(_.filter(_.get(this.configSvc, 'welcomeTabs.tabs'), { enabled: true }), 'step') as NSProfileDataV3.IProfileTab[]
    _.each(tabs, (t, idx) => { t.step = idx + 1 })
    if ((tabs || []).length === 0) {
      return true
    }
    // !(this.configSvc.userProfileV2 &&
    // this.configSvc.userProfileV2.userRoles && this.configSvc.userProfileV2.userRoles.length) ||
    // !((this.configSvc.userProfileV2 &&
    // this.configSvc.userProfileV2.desiredTopics && this.configSvc.userProfileV2.desiredTopics.length) ||
    // (this.configSvc.userProfileV2 &&
    // this.configSvc.userProfileV2.systemTopics && this.configSvc.userProfileV2.systemTopics.length))
    let allSet = true
    _.each(tabs, t => {
      if (allSet && (t.check && this.configSvc.userProfileV2)) {
        if (!_.get(this.configSvc.userProfileV2, t.key) || !_.get(this.configSvc.userProfileV2, t.key).length) {
          allSet = false
        }
      }
    })
    return allSet
  }
}
