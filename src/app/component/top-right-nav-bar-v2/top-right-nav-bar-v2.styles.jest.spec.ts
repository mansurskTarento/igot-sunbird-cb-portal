import { readFileSync } from 'fs'
import { join } from 'path'

// The notification dropdown lib hard-codes a light palette but leaves its header, tabs and
// timestamps uncoloured, so in dark mode they inherit the body's white text on a white panel.
describe('TopRightNavBarV2Component notification panel styles', () => {
  const html = readFileSync(join(__dirname, 'top-right-nav-bar-v2.component.html'), 'utf8')
  const scss = readFileSync(join(__dirname, 'top-right-nav-bar-v2.component.scss'), 'utf8')

  const blockFor = (selector: string) => {
    const start = scss.indexOf(`${selector} {`)
    return start === -1 ? '' : scss.slice(start, scss.indexOf('}', start) + 1)
  }

  it('wraps the notification dropdown in the notification-container', () => {
    expect(html).toMatch(
      /<mat-menu[^>]*class="my-notifications"[^>]*>\s*<div class="notification-container[^"]*">\s*@if \(showDropdown\(\)\) \{\s*<sb-uin-notification-dropdown/
    )
  })

  it('gives the notification text a fixed dark colour so it stays visible in dark mode', () => {
    expect(blockFor('\n.notification-container')).toMatch(/color: rgba\(0, 0, 0, 0\.8\);/)
  })

  it('keeps the notification menu panel white in dark mode', () => {
    expect(blockFor('::ng-deep .mat-mdc-menu-panel.my-notifications')).toMatch(/background-color: #fff !important;/)
  })

  it('does not rely on Tailwind arbitrary values for the text colour, which the prebuilt Tailwind 2 build lacks', () => {
    expect(html).not.toMatch(/notification-container[^"]*text-\[/)
  })
})
