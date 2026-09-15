import { BtnSettingsService } from './btn-settings.service'

/**
 * The theme bundle is declared in angular.json with `inject: true`, so index.html
 * already links it - hashed in deployed builds. applyTheme must therefore not
 * request `${themeFile}.css` / `.js` itself, which 404s in every environment.
 */
describe('BtnSettingsService theme injection', () => {
  const THEME = {
    themeClass: 'theme-igot',
    themeFile: 'theme-igot',
    color: { primary: '#1b4ca1' },
  }

  let service: BtnSettingsService
  let configurationsSvc: any

  const linkHrefs = () =>
    Array.from(document.head.querySelectorAll('link[href]')).map(l => l.getAttribute('href'))
  const injected = () =>
    Array.from(document.head.querySelectorAll('link[rel="preload stylesheet"], script[type="text/javascript"]'))

  const alreadyLinked = (href: string) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    document.head.appendChild(link)
  }

  beforeEach(() => {
    document.head.innerHTML = ''
    // updateAppColor writes straight to this meta tag
    const meta = document.createElement('meta')
    meta.id = 'id-app-theme-color'
    document.head.appendChild(meta)

    configurationsSvc = {
      instanceConfig: { themes: [THEME], defaultThemeClass: 'theme-igot' },
      userPreference: null,
      prefChangeNotifier: { next: jest.fn() },
      activeThemeObject: null,
      isDarkMode: false,
    }
    service = new BtnSettingsService('en', configurationsSvc, {} as any)
  })

  afterEach(() => { document.head.innerHTML = '' })

  describe('skips injection when the build already loaded the bundle', () => {
    it('matches the unhashed name served by a local build', () => {
      alreadyLinked('theme-igot.css')
      service.useLinkForThemeInjection = false
      service.changeTheme('theme-igot')
      expect(injected()).toHaveLength(0)
    })

    it('matches the content-hashed name emitted by a deployed build', () => {
      alreadyLinked('theme-igot-NGRCT65G.css')
      service.useLinkForThemeInjection = true
      service.changeTheme('theme-igot')
      expect(injected()).toHaveLength(0)
    })

    it.each([
      ['an absolute path', '/fusion/browser/theme-igot-NGRCT65G.css'],
      ['a full URL', 'https://portal.igotkarmayogi.gov.in/theme-igot-NGRCT65G.css'],
      ['a cache-busting query', 'theme-igot.css?v=2'],
    ])('matches %s', (_label, href) => {
      alreadyLinked(href)
      service.useLinkForThemeInjection = true
      service.changeTheme('theme-igot')
      expect(injected()).toHaveLength(0)
    })
  })

  describe('still injects when the bundle is genuinely absent', () => {
    it('adds a stylesheet link for a production build', () => {
      service.useLinkForThemeInjection = true
      service.changeTheme('theme-igot')
      expect(linkHrefs()).toContain('theme-igot.css')
    })

    it('adds a script tag for a non-production build', () => {
      service.useLinkForThemeInjection = false
      service.changeTheme('theme-igot')
      expect(document.head.querySelectorAll('script').length).toBe(1)
    })

    it('does not confuse a different theme whose name shares the prefix', () => {
      alreadyLinked('theme-igot-new.css')
      service.useLinkForThemeInjection = true
      service.changeTheme('theme-igot')
      expect(linkHrefs()).toContain('theme-igot.css')
    })

    it('injects only once however often the theme is reapplied', () => {
      service.useLinkForThemeInjection = true
      service.changeTheme('theme-igot')
      service.changeTheme('theme-igot')
      service.changeTheme('theme-igot')
      expect(injected()).toHaveLength(1)
    })
  })

  it('applies the theme class and colour either way', () => {
    alreadyLinked('theme-igot-NGRCT65G.css')
    service.changeTheme('theme-igot')
    expect(document.documentElement.classList.contains('theme-igot')).toBe(true)
    expect((document.getElementById('id-app-theme-color') as HTMLMetaElement).content).toBe('#1b4ca1')
    expect(configurationsSvc.activeThemeObject).toBe(THEME)
  })
})
