
import { Component, OnInit, OnDestroy } from '@angular/core'
import { Router, Event, NavigationEnd, ActivatedRoute } from '@angular/router'
import { ValueService, ConfigurationsService } from '@sunbird-cb/utils-v2'
import { map } from 'rxjs/operators'
import { NsWidgetResolver } from '@sunbird-cb/resolver'

/* tslint:disable */
import _ from 'lodash'
/* tslint:enable */

/* The widget prepends its own "Home" link, so this is just the trailing crumb */
const DEFAULT_TITLES = [{ title: 'Profile', url: 'none', icon: 'person' }]

@Component({
    selector: 'app-profile-v2',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss'],
    /* tslint:disable */
    host: { class: 'margin-top-l' },
    standalone: false
})
export class ProfileComponent implements OnInit, OnDestroy {
  sideNavBarOpened = true
  panelOpenState = false
  titles: any[] = DEFAULT_TITLES
  unread = 0
  currentRoute = 'home'
  banner!: NsWidgetResolver.IWidgetData<any>
  private bannerSubscription: any
  public screenSizeIsLtMedium = false
  isLtMedium$ = this.valueSvc.isLtMedium$
  mode$ = this.isLtMedium$.pipe(map(isMedium => (isMedium ? 'over' : 'side')))
  userRouteName = ''
  private defaultSideNavBarOpenedSubscription: any
  constructor(private valueSvc: ValueService, private router: Router,
              private activeRoute: ActivatedRoute,
              private configSvc: ConfigurationsService) {
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        this.bindUrl(event.urlAfterRedirects.replace('/app/discuss/', ''))
        this.titles = this.titlesFor(event.urlAfterRedirects)

        if (event.urlAfterRedirects === '/app/person-profile/me') {
          if (this.configSvc.userProfile) {
            // this.userRouteName = `${this.configSvc.userProfile.firstName}`
            // tslint:disable-next-line:max-line-length
            if (this.configSvc.userProfile.lastName && this.configSvc.userProfile.lastName !== null && this.configSvc.userProfile.lastName !== undefined) {
              this.userRouteName = `${this.configSvc.userProfile.firstName} ${this.configSvc.userProfile.lastName}`
            } else {
              this.userRouteName = `${this.configSvc.userProfile.firstName}`
            }
            // this.titles = [{ title: 'Network', url: '/app/network-v2', icon: 'group' }]
            // if (this.userRouteName && this.userRouteName.trim()) {
            //   this.titles.push({
            //     icon: '',
            //     title: `${this.userRouteName}\'profile`,
            //     url: 'none',
            //   })
            // }
          }
        } else {
          if (this.activeRoute.firstChild) {
            this.activeRoute.firstChild.data.subscribe(response => {
              // tslint:disable-next-line:max-line-length
              if (response && response.profile && response.profile.data && response.profile.data[0]
                && response.profile.data[0].personalDetails && response.profile.data[0].personalDetails.surname &&
                response.profile.data[0].personalDetails.surname !== null &&
                response.profile.data[0].personalDetails.surname !== undefined) {
                this.userRouteName = response && response.profile && response.profile.data && response.profile.data[0]
                && response.profile.data[0].personalDetails &&
                `${(response.profile.data[0].personalDetails.firstname || '')} ${(response.profile.data[0].personalDetails.surname)}`
              } else {
                this.userRouteName = response && response.profile && response.profile.data && response.profile.data[0]
                && response.profile.data[0].personalDetails &&
                `${(response.profile.data[0].personalDetails.firstname || '')}`
              }
            })
            // this.titles = [{ title: 'Network', url: '/app/network-v2', icon: 'group' }]
            // if (this.userRouteName && this.userRouteName.trim()) {
            //   this.titles.push({
            //     icon: '',
            //     title: `${this.userRouteName}\'profile`,
            //     url: 'none',
            //   })
            // }
          }
        }
      }
    })
  }

  ngOnInit() {
    this.defaultSideNavBarOpenedSubscription = this.isLtMedium$.subscribe(isLtMedium => {
      this.sideNavBarOpened = !isLtMedium
      this.screenSizeIsLtMedium = isLtMedium
    })
  }

  /**
   * Feeds the existing back-nav widget rather than adding a second breadcrumb. The widget
   * always renders its own leading "Home" link, so a titles entry per crumb after that is all
   * it needs, and a url other than 'none' is what makes an entry clickable.
   *
   * The labels are deliberately left translatable: the widget renders the translated branch in
   * its link colour and the disableTranslate branch in grey, so opting out of translation also
   * opts out of looking like a link. Both labels have btnpageback keys in the i18n bundle.
   *
   * The query string is parsed rather than substring-matched, so an unrelated route that
   * happens to contain the same text cannot change the trail.
   */
  private titlesFor(url: string): any[] {
    const query = url.split('?')[1]
    const from = query ? new URLSearchParams(query).get('from') : null
    if (from === 'karma-wallet') {
      return [
        { title: 'Profile', url: '/app/person-profile/me', icon: 'person' },
        { title: 'Karma Wallet', url: '/app/person-profile/karma-wallet' },
        /* Current page: url 'none' renders it grey and unclickable, and that branch prints the
           label verbatim, so this one needs no btnpageback key. */
        { title: 'Karma Points', url: 'none' },
      ]
    }
    return DEFAULT_TITLES
  }

  bindUrl(path: string) {
    if (path) {
      this.currentRoute = path
    }
  }

  ngOnDestroy() {
    if (this.defaultSideNavBarOpenedSubscription) {
      this.defaultSideNavBarOpenedSubscription.unsubscribe()
    }
    if (this.bannerSubscription) {
      this.bannerSubscription.unsubscribe()
    }
  }

}
