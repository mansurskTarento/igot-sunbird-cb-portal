import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core'
import { ConfigurationsService, DomainConfService, MultilingualTranslationsService } from '@sunbird-cb/utils-v2'
import { Router } from '@angular/router'
/* tslint:disable */
import _ from 'lodash'
/* tslint:enable */
@Component({
  selector: 'ws-footer-section',
  templateUrl: './footer-section.component.html',
  styleUrls: ['./footer-section.component.scss'],
  standalone: false
})
export class FooterSectionComponent implements OnInit, OnChanges {
  @Input() environment: any
  @Input() hubsList: any
  @Input() headerFooterConfigData: any
  isKbPortal: boolean = true
  showHostLogo = true
  showSocialLinks = true
  showDownloadApp = true
  sectionLinksConfig: any = {}
  constructor(
    private configSvc: ConfigurationsService,
    private router: Router,
    private langtranslations: MultilingualTranslationsService,
    private domainConfSvc: DomainConfService
  ) {
    this.isKbPortal = this.domainConfSvc.isKbPortal()
  }
  footerSectionConfig = [
    {
      id: 1,
      order: 1,
      sectionHeading: 'Hubs',
      active: true,
      slug: 'hub',
      configKey: 'hubs',
    },
    {
      id: 2,
      order: 2,
      sectionHeading: 'Related Links',
      active: true,
      slug: 'link',
      configKey: 'relatedLinks',
    },
    {
      id: 3,
      order: 3,
      sectionHeading: 'Support',
      active: true,
      slug: 'support',
      configKey: 'support',
    },
    {
      id: 4,
      order: 4,
      sectionHeading: 'About us',
      active: true,
      slug: 'about',
      configKey: 'aboutUs',
    },
  ]

  ngOnInit() {
    this.showHostLogo = this.domainConfSvc.isConfigEnabled('components.footer', 'showHostLogo')
    this.showSocialLinks = this.domainConfSvc.isConfigEnabled('components.footer', 'socialLinks')
    this.showDownloadApp = this.domainConfSvc.isConfigEnabled('components.footer', 'downloadApp')
    this.updateFooterConfig()
    this.applyGlobalSectionsConfig()
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['headerFooterConfigData'] && changes['headerFooterConfigData'].currentValue) {
      this.updateFooterConfig()
      this.applyGlobalSectionsConfig()
    }
  }

  private updateFooterConfig() {
    // Only update if headerFooterConfigData is available and has footerSectionConfig
    if (this.headerFooterConfigData && this.headerFooterConfigData.footerSectionConfig) {
      this.footerSectionConfig = this.headerFooterConfigData.footerSectionConfig
      if (this.footerSectionConfig) {
        this.footerSectionConfig = (this.footerSectionConfig).sort((a, b) => a.order - b.order)
      }
    }

    // Only filter portals if environment is defined
    if (this.environment && this.environment.portals) {
      this.environment.portals = this.environment.portals.filter(
        (obj: any) => ((obj.name !== 'Frac Dictionary') &&
          (obj.isPublic || this.isAllowed(obj.id))))
      if (!this.environment.portals.length) {
        if (this.footerSectionConfig) {
          this.footerSectionConfig = this.footerSectionConfig.filter((obj: any) => obj.sectionHeading !== 'Related Links')
        }
      }
    }
  }

  private slugToConfigKeyMap: { [slug: string]: string } = {
    hub: 'hubs',
    link: 'relatedLinks',
    support: 'support',
    about: 'aboutUs',
  }

  private applyGlobalSectionsConfig() {
    const globalConfig = this.domainConfSvc.getGlobalConfig()
    const sectionsConfig = globalConfig?.components?.footer?.sections
    if (!sectionsConfig) { return }

    this.footerSectionConfig.forEach(section => {
      const configKey = section.configKey || this.slugToConfigKeyMap[section.slug]
      if (!configKey) { return }
      const sectionVal = sectionsConfig[configKey]
      if (sectionVal === false) {
        section.active = false
      } else if (typeof sectionVal === 'object' && sectionVal !== null) {
        if (sectionVal.enabled === false) {
          section.active = false
        }
      }
    })

    // Store links config for each section for use in template
    this.sectionLinksConfig = sectionsConfig
  }

  isLinkEnabled(sectionKey: string, linkKey: string): boolean {
    const sectionVal = this.sectionLinksConfig?.[sectionKey]
    if (!sectionVal || typeof sectionVal !== 'object') { return true }
    if (!sectionVal.links) { return true }
    return sectionVal.links[linkKey] !== false
  }

  getHubConfigKey(hubname: string): string {
    if (!hubname) { return '' }
    return hubname
      .split(' ')
      .map((word, index) => index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
  }

  navigate() {
    const config = {
      menuOptions: [
        {
          route: 'all-discussions',
          label: 'All discussions',
          enable: true,
        },
        {
          route: 'categories',
          label: 'Categories',
          enable: true,
        },
        {
          route: 'tags',
          label: 'Tags',
          enable: true,
        },
        {
          route: 'my-discussion',
          label: 'Your discussion',
          enable: true,
        },
      ],
      userName: (this.configSvc.nodebbUserProfile && this.configSvc.nodebbUserProfile.username) || '',
      context: {
        id: 1,
      },
      categories: { result: [] },
      routerSlug: '/app',
      headerOptions: false,
      bannerOption: true,
    }
    localStorage.setItem('home', JSON.stringify(config))
    this.router.navigate(['/app/discussion-forum'], { queryParams: { page: 'home' }, queryParamsHandling: 'merge' })
  }

  isAllowed(portalName: string) {
    const roles = _.get(_.first(_.filter(this.environment.portals, { id: portalName })), 'roles') || []
    if (!(roles && roles.length)) {
      return true
    }
    const value = this.hasRole(roles)
    return value
  }

  hasRole(role: string[]): boolean {
    let returnValue = false
    role.forEach(v => {
      const rolesList = (this.configSvc.userRoles || new Set())
      if (rolesList.has(v.toLowerCase()) || rolesList.has(v.toUpperCase())) {
        returnValue = true
      }
    })
    return returnValue
  }

  onClick(event: any) {
    // console.log(event.target.parentElement);
    event.target.parentElement.classList.toggle('open')
  }

  translateLabels(label: string, type: any) {
    return this.langtranslations.translateLabelWithoutspace(label, type, '')
  }

  translateLabelsWithSpace(label: string, type: any) {
    return this.langtranslations.translateLabel(label, type, '')
  }
}
