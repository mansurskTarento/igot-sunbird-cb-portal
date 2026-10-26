import { readFileSync } from 'fs'
import { join } from 'path'

// A typography config on the igot themes re-emits every --mat-*-font token as Material's Roboto
// default under .theme-igot.day-mode/.night-mode, which outranks the app's Lato config on `html`.
describe('theme-igot typography', () => {
  const theme = readFileSync(join(__dirname, 'theme-igot.scss'), 'utf8')
  const typography = readFileSync(join(__dirname, '..', 'styles', 'mat-typography.scss'), 'utf8')

  const themeConfigFor = (fn: string) => {
    const start = theme.indexOf(`mat.${fn}((`)
    return start === -1 ? '' : theme.slice(start, theme.indexOf('));', start) + 3)
  }

  it.each(['m2-define-light-theme', 'm2-define-dark-theme'])('defines %s with colour and density only', fn => {
    const config = themeConfigFor(fn)
    expect(config).toMatch(/color: \$color-config/)
    expect(config).not.toMatch(/typography:/)
  })

  it('does not define a Roboto default typography config', () => {
    expect(theme).not.toMatch(/m2-define-typography-config\(/)
  })

  it('leaves the app font to the Lato typography config in mat-typography.scss', () => {
    expect(typography).toMatch(/\$typography: mat\.m2-define-typography-config\(\$font-family: 'Lato'/)
    expect(typography).toMatch(/@include mat\.all-component-typographies\(\$typography\);/)
  })
})
