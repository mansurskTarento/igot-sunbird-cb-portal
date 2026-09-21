import { MatDialogRef } from '@angular/material/dialog'

import { KarmaCoinsInfoDialogComponent } from './karma-coins-info-dialog.component'

/**
 * No TestBed: the component is plain constructor injection with no template behaviour to
 * exercise, so it is built directly and its one collaborator stubbed here in the spec.
 */
describe('KarmaCoinsInfoDialogComponent', () => {
  let component: KarmaCoinsInfoDialogComponent
  let dialogRefStub: { close: jest.Mock }

  beforeEach(() => {
    dialogRefStub = { close: jest.fn() }
    component = new KarmaCoinsInfoDialogComponent(
      dialogRefStub as unknown as MatDialogRef<KarmaCoinsInfoDialogComponent>,
    )
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should describe the four steps of the worked example in order', () => {
    expect(component.flowSteps.length).toBe(4)
    expect(component.flowSteps.map(s => s.value)).toEqual(['100', '+100', '−20', '80'])
    expect(component.flowSteps.map(s => s.caption)).toEqual([
      'Karma Points earned',
      'Karma Coins received',
      'Redeemed for a course',
      'Coins left 100 points stay',
    ])
  })

  it('should source every step badge from the karmawallet-v2 asset folder', () => {
    expect(component.flowSteps.map(s => s.icon)).toEqual([
      '/assets/icons/karmawallet-v2/badgekarmapoints.svg',
      '/assets/icons/karmawallet-v2/badgekarmacoin.svg',
      '/assets/icons/karmawallet-v2/badgeredeem.svg',
      '/assets/icons/karmawallet-v2/badgekarmawallet.svg',
    ])
  })

  it('should source the plain coin and the explainer bell from karmawallet-v2', () => {
    expect(component.icons.karmaCoin).toBe('/assets/icons/karmawallet-v2/karmacoin.svg')
    expect(component.icons.bell).toBe('/assets/icons/karmawallet-v2/bell.svg')
  })

  it('should report which control dismissed it, for telemetry', () => {
    component.close('i-understand')
    expect(dialogRefStub.close).toHaveBeenCalledWith('i-understand')

    component.close('close-icon')
    expect(dialogRefStub.close).toHaveBeenCalledWith('close-icon')
  })

  it('should report the walkthrough CTA distinctly, so the page can start the tour', () => {
    component.close('walkthrough')
    expect(dialogRefStub.close).toHaveBeenCalledWith('walkthrough')
  })

  it('should default to the close icon when no control is named', () => {
    component.close()
    expect(dialogRefStub.close).toHaveBeenCalledWith('close-icon')
  })
})
